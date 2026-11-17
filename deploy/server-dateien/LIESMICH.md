# Dateien, die nur auf dem Server liegen

Kopien zur Nachvollziehbarkeit. Maßgeblich ist die Fassung auf dem Server; sie
steckt auch in der nächtlichen Sicherung (Einstellungs-Paket).

| Datei hier | Ort auf dem Server | Zweck |
|---|---|---|
| `traefik-supabase.yaml` | `/data/coolify/proxy/dynamic/supabase.yaml` | Eingang für `daten.culinse.com`: Anmeldung, Datenbank-Schnittstelle, Bilder. Öffentliche Dateien ohne `X-Robots-Tag`, eigene robots.txt |
| `traefik-www-dauerhaft.yaml` | `/data/coolify/proxy/dynamic/www-dauerhaft.yaml` | `www.culinse.com` dauerhaft (301) auf `culinse.com` |
| `daten-robots.txt` | `/opt/supabase/mail-vorlagen/robots.txt` | robots.txt der Daten-Adresse, ausgeliefert vom kleinen Dienst `supabase-mailvorlagen` |

Hintergrund robots.txt und `X-Robots-Tag` (17.11.2026): Die Rezeptseiten nennen
in den strukturierten Daten und in `og:image` Bilder unter `daten.culinse.com`.
Die Adresse antwortete auf `/robots.txt` mit 503; Google behandelt einen
Serverfehler bei robots.txt wie eine Sperre für die ganze Adresse. Außerdem hängt
der Supabase-Speicherdienst an jede Datei `X-Robots-Tag: none`, was Google die
Aufnahme der Bilder verbietet. Beides ist am Eingang behoben.
