#!/usr/bin/env bash
# Spielt den Export in die leere Datenbank des eigenen Servers ein, wie in der
# Supabase-Doku beschrieben: in einem Stück, Auslöser währenddessen aus.
#
#   ZIEL='postgres://postgres.[TENANT]:[PASSWORT]@127.0.0.1:5432/postgres' \
#     deploy/supabase-import.sh /root/umzug/export-probe            # sauberer Lauf
#   … deploy/supabase-import.sh /root/umzug/export-probe --fehlersuche
#
# --fehlersuche läuft ohne "alles oder nichts" und zeigt alle Fehler auf einmal.
# Danach die Datenbank leeren, die Dateien korrigieren (Korrekturen unten als
# sed-Zeilen festhalten) und den sauberen Lauf wiederholen.
set -euo pipefail

: "${ZIEL:?ZIEL (Verbindungsadresse der neuen Datenbank) fehlt}"
ORDNER="${1:?Ordner mit roles.sql, schema.sql, data.sql fehlt}"
MODUS="${2:-}"
cd "$ORDNER"

# Bekannte Korrekturen. Laut Supabase-Doku kennt Postgres 15 diese Zeile nicht;
# auf Postgres 17 schadet das Auskommentieren nicht.
sed -i.orig 's/^SET transaction_timeout/-- &/' data.sql
# Weitere Korrekturen aus dem Probelauf hier ergänzen, damit der endgültige Lauf
# ohne Handarbeit durchgeht:
# sed -i '…' schema.sql

if [ "$MODUS" = "--fehlersuche" ]; then
  psql --file roles.sql --file schema.sql \
       --command 'SET session_replication_role = replica' \
       --file data.sql --dbname "$ZIEL" 2>&1 | tee import-fehlersuche.log
  echo "Fehler im Lauf: $(grep -c '^psql:.*ERROR' import-fehlersuche.log || true)"
  exit 0
fi

psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql --dbname "$ZIEL"

# Eigene Anpassungen in auth und storage (Auslöser an auth.users, Regeln am
# Bildspeicher). Getrennt, weil der normale Export diese Bereiche auslässt.
psql --single-transaction --variable ON_ERROR_STOP=1 --file anpassungen.sql --dbname "$ZIEL"

psql "$ZIEL" -At -f "$(dirname "$(readlink -f "$0")")/pruefen.sql" > bericht-ziel.txt
if diff bericht-quelle.txt bericht-ziel.txt > bericht-unterschiede.txt; then
  echo "Vergleichsbericht: gleich."
else
  echo "Vergleichsbericht: Unterschiede, siehe $ORDNER/bericht-unterschiede.txt"
fi
