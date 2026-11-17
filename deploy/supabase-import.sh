#!/usr/bin/env bash
# Spielt den Export in die leere Datenbank des eigenen Servers ein, wie in der
# Supabase-Doku beschrieben: in einem Stück, Auslöser währenddessen aus.
#
#   set -a; . /root/umzug/ziel.env; set +a   # setzt ZIEL (Rolle postgres über den Pooler)
#   deploy/supabase-import.sh /root/umzug/export-probe              # sauberer Lauf
#   deploy/supabase-import.sh /root/umzug/export-probe --fehlersuche
#
# Rolle: "postgres" über den Pooler genügt. Sie darf in auth und storage
# schreiben und session_replication_role setzen; ein Superuser ist nicht nötig.
# Einzige Ausnahme: storage.buckets_vectors und storage.vector_indexes (siehe
# Korrekturen unten).
#
# --fehlersuche läuft ohne "alles oder nichts" und zeigt alle Fehler auf einmal.
# Danach die Datenbank mit ziel-zuruecksetzen.sh leeren und den sauberen Lauf
# starten. Die Datenbank muss leer sein (frisch gestartetes Supabase-Paket).
set -euo pipefail

: "${ZIEL:?ZIEL (Verbindungsadresse der neuen Datenbank) fehlt, siehe /root/umzug/ziel.env}"
ORDNER="${1:?Ordner mit roles.sql, schema.sql, data.sql fehlt}"
MODUS="${2:-}"
HIER="$(dirname "$(readlink -f "$0")")"
cd "$ORDNER"

# --- Korrekturen aus dem Probelauf (wiederholbar, ändern keine Nutzdaten) ---
# Die Rolle postgres darf zwei neue Supabase-Tabellen nicht beschreiben
# ("permission denied for table buckets_vectors / vector_indexes"). Beide sind
# in der Quelle leer; die Supabase-Doku empfiehlt ebenfalls, sie auszulassen.
# Gelöscht werden die beiden COPY-Blöcke bis zum abschließenden \.
sed -i '/^COPY "storage"\."buckets_vectors"/,/^\\\.$/d;
        /^COPY "storage"\."vector_indexes"/,/^\\\.$/d' data.sql
# Supabase Cloud ist dem eigenen Anmeldedienst im Aufbau von auth und storage
# manchmal voraus (17.11.2026: zwei neue Spalten in auth, die es am Vortag noch
# nicht gab). Spalten, die das Ziel nicht kennt, werden aus den COPY-Blöcken
# dieser beiden Bereiche entfernt; das Skript meldet, was dabei entfällt.
ZIEL="$ZIEL" python3 "$HIER/spalten-abgleichen.py" data.sql
# Nicht nötig auf Postgres 17 (nur Postgres 15 kennt "transaction_timeout" nicht):
# sed -i 's/^SET transaction_timeout/-- &/' data.sql

if [ "$MODUS" = "--fehlersuche" ]; then
  psql --file roles.sql --file schema.sql \
       --command 'SET session_replication_role = replica' \
       --file data.sql --dbname "$ZIEL" 2>&1 | tee import-fehlersuche.log
  echo "Fehler im Lauf: $(grep -c 'ERROR' import-fehlersuche.log || true)"
  exit 0
fi

psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql --dbname "$ZIEL"

# Eigene Anpassungen in auth und storage (Auslöser an auth.users, Regeln am
# Bildspeicher). Getrennt, weil der normale Export diese Bereiche auslässt.
psql --single-transaction --variable ON_ERROR_STOP=1 --file anpassungen.sql --dbname "$ZIEL"

# PostgREST soll das neue Schema kennenlernen.
psql "$ZIEL" -Atc "NOTIFY pgrst, 'reload schema'"
if [ -f /opt/supabase/run.sh ]; then
  (cd /opt/supabase && sh run.sh restart rest)
fi

psql "$ZIEL" -At -f "$HIER/pruefen.sql" > bericht-ziel.txt
if diff bericht-quelle.txt bericht-ziel.txt > bericht-unterschiede.txt; then
  echo "Vergleichsbericht: gleich."
else
  echo "Vergleichsbericht: Unterschiede, siehe $ORDNER/bericht-unterschiede.txt"
  echo "Erwartet: nur zusätzliche Erweiterungen am Ziel (z. B. pg_net)."
  cat bericht-unterschiede.txt
fi
