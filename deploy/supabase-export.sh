#!/usr/bin/env bash
# Zieht die Datenbank aus dem Supabase-Projekt in drei Dateien (Rollen, Aufbau,
# Daten), wie in der Supabase-Doku "Restore a Platform Project to Self-Hosted".
# Liest nur. Braucht die Supabase-Kommandozeile und Docker, läuft deshalb auf dem
# Server und nicht auf dem Mac.
#
#   QUELLE='postgresql://postgres:[PASSWORT]@db.[PROJEKT].supabase.co:5432/postgres' \
#     deploy/supabase-export.sh /root/umzug/export-probe
#
# Die Dateien enthalten alle Konten. Der Zielordner ist nur für den Besitzer
# lesbar und gehört weder ins Repo noch in eine Cloud-Ablage.
set -euo pipefail

: "${QUELLE:?QUELLE (Verbindungsadresse der Supabase-Datenbank) fehlt}"
ZIEL_ORDNER="${1:?Zielordner fehlt}"

umask 077
mkdir -p "$ZIEL_ORDNER"
cd "$ZIEL_ORDNER"

SUPABASE="${SUPABASE_CLI:-npx --yes supabase}"
# Schalter --remote wie in der Supabase-Doku vom 16.11.2026; ältere Fassungen der
# Kommandozeile nannten ihn --db-url.

echo "1/4 Rollen …"
$SUPABASE db dump --remote="$QUELLE" -f roles.sql --role-only
echo "2/4 Aufbau …"
$SUPABASE db dump --remote="$QUELLE" -f schema.sql
echo "3/4 Daten …"
$SUPABASE db dump --remote="$QUELLE" -f data.sql --use-copy --data-only
echo "4/4 Vergleichsbericht und Erweiterungen …"
psql "$QUELLE" -At -c "select extname || ' ' || extversion from pg_extension order by 1" > erweiterungen.txt
HIER="$(dirname "$(readlink -f "$0")")"
psql "$QUELLE" -At -f "$HIER/pruefen.sql" > bericht-quelle.txt
psql "$QUELLE" -At -f "$HIER/auth-storage-anpassungen.sql" > anpassungen.sql

ls -lh roles.sql schema.sql data.sql anpassungen.sql erweiterungen.txt bericht-quelle.txt
echo "Fertig. anpassungen.sql enthaelt den Ausloeser an auth.users und die Regeln am"
echo "Bildspeicher; der normale Export laesst die Bereiche auth und storage aus."
