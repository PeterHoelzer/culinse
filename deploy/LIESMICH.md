# Umzug auf einen eigenen Server

Werkzeuge für den Umzug der Website von Vercel und der Daten von Supabase auf
einen eigenen Server. Der Ablauf mit Reihenfolge, Zuständigkeiten und allen
Einstellungen steht im Vault: `01 Projekte/Hetzner-Umzug — Drehbuch.md`.

Stand 16.11.2026. Der Probelauf auf dem Server ist gelaufen; was dabei geprüft
wurde, steht in der Tabelle.

| Datei | Zweck | Geprüft |
|---|---|---|
| `server-grundschutz.sh` | frischen Ubuntu-Server absichern, psql 17 und Node.js einrichten | gelaufen auf dem netcup-Server |
| `umgebung.beispiel` | Namen aller Umgebungsvariablen der Website | aus dem Code ausgelesen |
| `geheimnis-setzen.sh` | einen geheimen Wert unsichtbar abfragen und in eine Umgebungsdatei eintragen | nur Syntax |
| `supabase-export.sh` | Datenbank aus dem Supabase-Projekt ziehen (liest nur), über die angemeldete Supabase-Kommandozeile | Befehle im Probelauf gelaufen |
| `auth-storage-anpassungen.sql` | Auslöser an `auth.users` und Regeln am Bildspeicher als SQL ausgeben | gelaufen: 1 Auslöser, 3 Regeln |
| `supabase-import.sh` | Export in die neue Datenbank einspielen, danach Vergleichsbericht | Befehle im Probelauf gelaufen, sauber in 12 s |
| `ziel-zuruecksetzen.sh` | neue Datenbank auf den leeren Ausgangszustand zurücksetzen | einmal gelaufen |
| `pruefen.sql` | Vergleichsbericht: Zeilenzahlen, Prüfsummen, Regeln, Funktionen, Auslöser | gelaufen auf Quelle und Ziel |
| `bilder-kopieren.mjs` | Bildspeicher kopieren, wiederholbar, mit Vergleich | Lesen und Vergleichen am echten Speicher (13.766 Dateien, 3,07 GB) |
| `bildadressen-umschreiben.sql` | alte Supabase-Adresse in allen Tabellen ersetzen, mit Probelauf | nicht gelaufen |
| `sicherung.sh` | nächtliche Sicherung von Datenbank und Bildern nach Cloudflare R2 | nur Syntax |

## Reihenfolge beim Datenumzug

Voraussetzung: Auf dem Server ist die Supabase-Kommandozeile angemeldet
(`npx supabase login --no-browser`). Ein Datenbank-Passwort der Quelle braucht
es dann nicht.

1. `supabase-export.sh <ordner>` zieht Rollen, Aufbau, Daten, die Anpassungen in
   `auth` und `storage` sowie den Vergleichsbericht der Quelle.
2. `. /root/umzug/ziel.env`, dann `supabase-import.sh <ordner>`: spielt in einem
   Stück ein, zieht die Anpassungen nach und vergleicht beide Berichte. Die
   Rolle `postgres` genügt. Mit `--fehlersuche` läuft es ohne „alles oder
   nichts“; danach `ziel-zuruecksetzen.sh`.
3. `bilder-kopieren.mjs --alles` überträgt die Dateien; `--vergleich` prüft
   danach. Zusätzlich drei Bilder im Browser über die neue Adresse öffnen.
4. `bildadressen-umschreiben.sql` erst als Probelauf, dann mit `-v ausfuehren=1`.

## Ergebnis des Probelaufs vom 16.11.2026

- Export: `data.sql` 315 MB in 27 Sekunden. Er enthält auch die Daten der
  Bereiche `auth` (Konten) und `storage` (Dateiliste des Bildspeichers).
- Einzige nötige Korrektur: Die `COPY`-Blöcke für `storage.buckets_vectors` und
  `storage.vector_indexes` werden entfernt (in der Quelle leer, am Ziel für die
  Rolle `postgres` gesperrt). Steht als `sed`-Zeile in `supabase-import.sh`.
- Vergleichsbericht: 200 Zeilen gleich (71.281 Rezepte und 9 Konten mit
  gleicher Prüfsumme, Spalten, Zeilenschutz, 31 Regeln, 4 Funktionen,
  4 Auslöser). Einziger Unterschied: Das Ziel hat zusätzlich die Erweiterung
  `pg_net`.
- Weil der Export die Dateiliste mitbringt, führt das Ziel nach dem Einspielen
  alle Dateien auf, obwohl noch keine auf der Platte liegt. Deshalb der erste
  Kopierlauf immer mit `--alles`.

## Sicherheit

Die Export-Dateien enthalten alle Konten mit E-Mail-Adresse und verschlüsseltem
Passwort. Sie liegen nur auf dem Server unter `/root/umzug` (nur für root
lesbar) und gehören weder ins Repo noch in iCloud oder den Vault.
