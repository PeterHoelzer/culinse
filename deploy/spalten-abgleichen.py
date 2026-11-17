#!/usr/bin/env python3
"""Gleicht die Spalten des Daten-Exports mit dem Aufbau der Ziel-Datenbank ab.

Hintergrund: Die Bereiche `auth` und `storage` legt am Ziel der eigene Supabase
an, nicht der Export. Supabase Cloud spielt dort laufend neue Fassungen ein und
hat deshalb gelegentlich Spalten, die der eigene Anmeldedienst (noch) nicht
kennt. Am 17.11.2026 waren das `auth.one_time_tokens.link_token_hash` und
`auth.saml_providers.dedicated_scope`; am Tag davor gab es sie noch nicht.
`COPY` bricht an so einer Spalte ab.

Das Skript entfernt aus den COPY-Blöcken von `auth` und `storage` genau die
Spalten, die es am Ziel nicht gibt, und meldet, wie viele Werte dabei nicht
leer waren. Die Bereiche des eigenen Aufbaus (`public`) fasst es nicht an.

    ZIEL=… deploy/spalten-abgleichen.py data.sql     # schreibt data.sql neu,
                                                     # Original als data.sql.vor-abgleich
"""
import os
import re
import subprocess
import sys

BEREICHE = ("auth", "storage")
KOPF = re.compile(r'^COPY "([a-z_0-9]+)"\."([a-z_0-9]+)" \((.*)\) FROM stdin;$')


def spalten_am_ziel(ziel: str) -> dict[tuple[str, str], set[str]]:
    sql = (
        "select table_schema, table_name, column_name from information_schema.columns "
        "where table_schema in ('auth','storage')"
    )
    out = subprocess.run(
        ["psql", ziel, "-AtF", "\t", "-c", sql], capture_output=True, text=True, check=True
    ).stdout
    ergebnis: dict[tuple[str, str], set[str]] = {}
    for zeile in out.splitlines():
        schema, tabelle, spalte = zeile.split("\t")
        ergebnis.setdefault((schema, tabelle), set()).add(spalte)
    return ergebnis


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    datei = sys.argv[1]
    ziel = os.environ.get("ZIEL")
    if not ziel:
        print("ZIEL fehlt (siehe /root/umzug/ziel.env)")
        return 2
    vorhanden = spalten_am_ziel(ziel)
    neu = datei + ".abgeglichen"
    behalten: list[int] | None = None  # Spaltennummern, die im laufenden Block bleiben
    weg_namen: list[str] = []
    block = ""
    nicht_leer = 0
    geaendert = 0
    with open(datei, encoding="utf-8", newline="\n") as quelle, open(
        neu, "w", encoding="utf-8", newline="\n"
    ) as ausgabe:
        for zeile in quelle:
            if behalten is not None:
                if zeile == "\\.\n":
                    if nicht_leer:
                        print(f"  {block}: {nicht_leer} nicht leere Werte in {weg_namen} entfallen")
                    behalten = None
                    ausgabe.write(zeile)
                    continue
                felder = zeile.rstrip("\n").split("\t")
                nicht_leer += sum(
                    1 for i, wert in enumerate(felder) if i not in behalten and wert != "\\N"
                )
                ausgabe.write("\t".join(felder[i] for i in behalten) + "\n")
                continue
            treffer = KOPF.match(zeile.rstrip("\n"))
            if treffer and treffer.group(1) in BEREICHE:
                schema, tabelle = treffer.group(1), treffer.group(2)
                spalten = [s.strip().strip('"') for s in treffer.group(3).split(",")]
                am_ziel = vorhanden.get((schema, tabelle))
                if am_ziel is None:
                    print(f"ACHTUNG: Tabelle {schema}.{tabelle} gibt es am Ziel nicht; Block bleibt unverändert")
                if am_ziel is not None:
                    fehlend = [s for s in spalten if s not in am_ziel]
                    if fehlend:
                        behalten = [i for i, s in enumerate(spalten) if s in am_ziel]
                        weg_namen, block, nicht_leer = fehlend, f"{schema}.{tabelle}", 0
                        geaendert += 1
                        print(f"{schema}.{tabelle}: Spalten {fehlend} gibt es am Ziel nicht, entfernt")
                        liste = ", ".join(f'"{spalten[i]}"' for i in behalten)
                        ausgabe.write(f'COPY "{schema}"."{tabelle}" ({liste}) FROM stdin;\n')
                        continue
            ausgabe.write(zeile)
    if geaendert:
        os.replace(datei, datei + ".vor-abgleich")
        os.replace(neu, datei)
        print(f"{geaendert} Block/Blöcke angepasst; Original: {datei}.vor-abgleich")
    else:
        os.remove(neu)
        print("Spalten passen, nichts geändert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
