# Umzug auf einen eigenen Server

Werkzeuge für den Umzug der Website von Vercel und der Daten von Supabase auf
einen eigenen Server. Der Ablauf mit Reihenfolge, Zuständigkeiten und allen
Einstellungen steht im Vault: `01 Projekte/Hetzner-Umzug — Drehbuch.md`.

Stand 16.11.2026. Geprüft ist nur, was unten als geprüft markiert ist; alles
andere läuft zum ersten Mal im Probelauf auf dem Server.

| Datei | Zweck | Geprüft |
|---|---|---|
| `server-grundschutz.sh` | frischen Ubuntu-Server absichern, psql 17 und Node.js einrichten | nur Syntax |
| `umgebung.beispiel` | Namen aller Umgebungsvariablen der Website | aus dem Code ausgelesen |
| `supabase-export.sh` | Datenbank aus dem Supabase-Projekt ziehen (liest nur) | nur Syntax |
| `auth-storage-anpassungen.sql` | Auslöser an `auth.users` und Regeln am Bildspeicher als SQL ausgeben | nicht gelaufen |
| `supabase-import.sh` | Export in die neue Datenbank einspielen, danach Vergleichsbericht | nur Syntax |
| `pruefen.sql` | Vergleichsbericht: Zeilenzahlen, Prüfsummen, Regeln, Funktionen, Auslöser | nicht gelaufen |
| `bilder-kopieren.mjs` | Bildspeicher kopieren, wiederholbar, mit Vergleich | Lesen und Vergleichen am echten Speicher (13.766 Dateien, 3,07 GB); Hochladen nicht |
| `bildadressen-umschreiben.sql` | alte Supabase-Adresse in allen Tabellen ersetzen, mit Probelauf | nicht gelaufen |
| `sicherung.sh` | nächtliche Sicherung von Datenbank und Bildern nach Cloudflare R2 | nur Syntax |

## Reihenfolge beim Datenumzug

1. `supabase-export.sh` zieht Rollen, Aufbau, Daten, die Anpassungen in `auth`
   und `storage` sowie den Vergleichsbericht der Quelle.
2. `supabase-import.sh … --fehlersuche` zeigt alle Fehler eines Laufs. Datenbank
   leeren, Korrekturen als `sed`-Zeilen im Skript festhalten.
3. `supabase-import.sh …` spielt sauber ein und vergleicht beide Berichte.
4. `bilder-kopieren.mjs --alles` überträgt die Dateien (beim ersten Lauf nach
   dem Einspielen immer mit `--alles`, siehe Kopf des Skripts); `--vergleich`
   prüft danach. Zusätzlich drei Bilder im Browser über die neue Adresse öffnen.
5. `bildadressen-umschreiben.sql` erst als Probelauf, dann mit `-v ausfuehren=1`.

## Erwartete Unterschiede im Vergleichsbericht

- `storage.objects` und `storage.buckets`: Ob der Daten-Export die Dateiliste
  des Bildspeichers mitbringt, zeigt erst der Probelauf. Bringt er sie mit, sind
  die Zahlen gleich, obwohl noch keine Datei auf der Platte liegt; deshalb der
  erste Kopierlauf mit `--alles`.
- `auth.users` und `auth.identities`: müssen gleich sein (laut Supabase-Doku
  wandern die Konten mit dem Export). Fehlen sie am Ziel, die Daten des Bereichs
  `auth` getrennt ziehen.
- Erweiterungen: Der eigene Server kann zusätzliche mitbringen. Fehlen darf keine.

## Sicherheit

Die Export-Dateien enthalten alle Konten mit E-Mail-Adresse und verschlüsseltem
Passwort. Sie liegen nur auf dem Server unter `/root/umzug` (nur für root
lesbar) und gehören weder ins Repo noch in iCloud oder den Vault.
