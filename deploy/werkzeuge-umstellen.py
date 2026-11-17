#!/usr/bin/env python3
"""Stellt die lokalen Einstellungsdateien (.env.local) auf die Datenbank des
eigenen Servers um.

Rezept-Agent, Übersetzungs-Pipeline (~/.culinse-i18n) und die Skripte unter
scripts/ lesen ihre Zugangsdaten alle aus <Projekt>/.env.local. Solange dort das
alte Supabase-Projekt steht, schreiben sie in die alte Datenbank.

Läuft auf dem Mac. Die Schlüssel kommen aus dem Schlüsselbund (Einträge
"Culinse Server: ANON_KEY" und "… SERVICE_ROLE_KEY", angelegt von
schluessel-sichern.sh) und gehen direkt in die Datei; angezeigt werden nur Namen
und Längen.

    deploy/werkzeuge-umstellen.py --zeigen  DATEI…     nur ansehen, nichts ändern
    deploy/werkzeuge-umstellen.py           DATEI…     umstellen
    deploy/werkzeuge-umstellen.py --zurueck DATEI…     Sicherungskopie zurückholen

Vor der Änderung entsteht neben jeder Datei eine Kopie mit der Endung
.vor-umzug (nur für den Besitzer lesbar, von git ausgenommen).
"""
import hashlib
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request

NEU_URL = "https://daten.culinse.com"
ALT_KENNUNG = "ztfhnzslyztxfmvkyrrn"
KONTO = "culinse-server"
# Variable in .env.local  →  Name im Schlüsselbund (None = feste Adresse)
ZUORDNUNG = {
    "NEXT_PUBLIC_SUPABASE_URL": None,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY": "SERVICE_ROLE_KEY",
}


def aus_schluesselbund(name: str) -> str:
    wert = subprocess.run(
        ["security", "find-generic-password", "-a", KONTO, "-s", f"Culinse Server: {name}", "-w"],
        capture_output=True,
        text=True,
    )
    if wert.returncode != 0 or not wert.stdout.strip():
        sys.exit(f"Schlüsselbund-Eintrag fehlt: Culinse Server: {name} (deploy/schluessel-sichern.sh)")
    return wert.stdout.strip()


def zerlegen(zeile: str):
    """Liefert (Name, Wert ohne Anführungszeichen, Anführungszeichen) oder None."""
    roh = zeile.rstrip("\n")
    if not roh or roh.lstrip().startswith("#") or "=" not in roh:
        return None
    name, wert = roh.split("=", 1)
    name = name.strip()
    wert = wert.strip()
    zeichen = wert[0] if len(wert) >= 2 and wert[0] == wert[-1] and wert[0] in "\"'" else ""
    return name, (wert[1:-1] if zeichen else wert), zeichen


def stand(datei: str) -> dict[str, str]:
    werte = {}
    with open(datei, encoding="utf-8") as f:
        for zeile in f:
            teile = zerlegen(zeile)
            if teile and teile[0] in ZUORDNUNG:
                werte[teile[0]] = teile[1]
    return werte


def beschreiben(datei: str) -> str:
    werte = stand(datei)
    url = werte.get("NEXT_PUBLIC_SUPABASE_URL", "")
    ziel = "eigener Server" if url == NEU_URL else "altes Supabase-Projekt" if ALT_KENNUNG in url else "unbekannt"
    laengen = ", ".join(f"{n} Länge {len(w)}" for n, w in werte.items() if ZUORDNUNG[n])
    return f"{ziel}; {laengen}"


def pruefen(url: str, schluessel: str) -> str:
    """Fragt mit dem Schlüssel eine Zeile ab; liefert nur den Statuscode."""
    anfrage = urllib.request.Request(
        f"{url}/rest/v1/user_recipes?select=id&limit=1",
        headers={"apikey": schluessel, "Authorization": f"Bearer {schluessel}"},
    )
    try:
        with urllib.request.urlopen(anfrage, timeout=20) as antwort:
            return str(antwort.status)
    except urllib.error.HTTPError as fehler:
        return str(fehler.code)
    except Exception as fehler:  # Netzfehler: Art nennen, keine Werte
        return type(fehler).__name__


def umstellen(datei: str, neu: dict[str, str]) -> None:
    kopie = datei + ".vor-umzug"
    if not os.path.exists(kopie):
        shutil.copy2(datei, kopie)
        os.chmod(kopie, 0o600)
    with open(datei, encoding="utf-8") as f:
        zeilen = f.readlines()
    gesehen = set()
    for i, zeile in enumerate(zeilen):
        teile = zerlegen(zeile)
        if teile and teile[0] in neu:
            name, _, zeichen = teile
            zeilen[i] = f"{name}={zeichen}{neu[name]}{zeichen}\n"
            gesehen.add(name)
    fehlend = [n for n in neu if n not in gesehen]
    if fehlend:
        print(f"  ACHTUNG: {fehlend} stand nicht in der Datei und wurde nicht ergänzt")
    rechte = os.stat(datei).st_mode & 0o777
    with open(datei, "w", encoding="utf-8") as f:
        f.writelines(zeilen)
    os.chmod(datei, rechte)


def main() -> int:
    argumente = sys.argv[1:]
    modus = "umstellen"
    if argumente and argumente[0] in ("--zeigen", "--zurueck"):
        modus = argumente.pop(0)[2:]
    if not argumente:
        print(__doc__)
        return 2
    neu = {}
    if modus == "umstellen":
        neu = {n: (NEU_URL if q is None else aus_schluesselbund(q)) for n, q in ZUORDNUNG.items()}
        abdruck = hashlib.sha256(neu["SUPABASE_SERVICE_ROLE_KEY"].encode()).hexdigest()[:12]
        print(f"Schlüssel aus dem Schlüsselbund gelesen (Prüfabdruck Dienst-Schlüssel: {abdruck})")
    for datei in argumente:
        if not os.path.isfile(datei):
            print(f"{datei}: fehlt, übersprungen")
            continue
        print(datei)
        print(f"  vorher:  {beschreiben(datei)}")
        if modus == "zurueck":
            kopie = datei + ".vor-umzug"
            if not os.path.exists(kopie):
                print("  keine Sicherungskopie")
                continue
            shutil.copy2(kopie, datei)
        elif modus == "umstellen":
            umstellen(datei, neu)
        if modus != "zeigen":
            print(f"  nachher: {beschreiben(datei)}")
        werte = stand(datei)
        url = werte.get("NEXT_PUBLIC_SUPABASE_URL", "")
        for name in ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"):
            if url and werte.get(name):
                print(f"  Abfrage mit {name}: HTTP {pruefen(url, werte[name])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
