#!/usr/bin/env bash
# Zieht die Datenbank aus dem Supabase-Projekt in drei Dateien (Rollen, Aufbau,
# Daten), wie in der Supabase-Doku "Restore a Platform Project to Self-Hosted".
# Liest nur: erlaubt sind allein "db dump" und "db query --read-only" gegen die
# Cloud. Braucht die angemeldete Supabase-Kommandozeile (3.x) und Docker, läuft
# deshalb auf dem Server und nicht auf dem Mac.
#
#   deploy/supabase-export.sh /root/umzug/export-probe
#   QUELLE_REF=andereref deploy/supabase-export.sh /root/umzug/export-probe
#
# Die Dateien enthalten alle Konten. Der Zielordner ist nur für den Besitzer
# lesbar und gehört weder ins Repo noch in eine Cloud-Ablage.
set -euo pipefail

REF="${QUELLE_REF:-ztfhnzslyztxfmvkyrrn}"
ZIEL_ORDNER="${1:?Zielordner fehlt}"
HIER="$(dirname "$(readlink -f "$0")")"
SUPABASE="${SUPABASE_CLI:-npx --yes supabase@latest}"

umask 077
mkdir -p "$ZIEL_ORDNER"
chmod 700 "$ZIEL_ORDNER"
cd "$ZIEL_ORDNER"

# Die Schalter --db-url und --linked sind in der Fassung 3.x veraltet;
# --remote=<ref> nutzt die Anmeldung der Kommandozeile.
abfrage() {
  $SUPABASE db query --remote="$REF" --read-only --output-format json -f "$1"
}

echo "1/5 Rollen …"
$SUPABASE db dump --remote="$REF" -f roles.sql --role-only
echo "2/5 Aufbau …"
$SUPABASE db dump --remote="$REF" -f schema.sql
echo "3/5 Daten (enthält auth und storage.objects) …"
$SUPABASE db dump --remote="$REF" -f data.sql --use-copy --data-only
echo "4/5 Anpassungen an auth und storage …"
abfrage "$HIER/auth-storage-anpassungen.sql" | jq -r '.[0].befehle' > anpassungen.sql
echo "5/5 Vergleichsbericht der Quelle (direkt nach dem Export) …"
abfrage "$HIER/pruefen.sql" | jq -r '.[0].bericht' > bericht-quelle.txt

chmod 600 ./*.sql ./*.txt
ls -lh roles.sql schema.sql data.sql anpassungen.sql bericht-quelle.txt
echo "Fertig. anpassungen.sql enthaelt den Ausloeser an auth.users und die Regeln am"
echo "Bildspeicher; der normale Export laesst diese Teile von auth und storage aus."
echo "Hinweis: Der Ordner supabase/.temp im Zielordner legt die Kommandozeile an."
