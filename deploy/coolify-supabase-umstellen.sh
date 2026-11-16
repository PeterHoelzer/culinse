#!/usr/bin/env bash
# Stellt die Website in Coolify auf eine andere Supabase-Instanz um und liefert
# sie neu aus. Läuft auf dem Server; die Schlüssel werden dort gelesen und
# direkt an Coolify übergeben, ohne dass sie angezeigt werden.
#
#   deploy/coolify-supabase-umstellen.sh ziel      eigener Server (daten.culinse.com)
#   deploy/coolify-supabase-umstellen.sh quelle    zurück auf das Supabase-Projekt
#   … --ohne-auslieferung                          nur umstellen, nicht neu bauen
#
# Voraussetzung: ein Coolify-Token mit Schreibrecht in /root/umzug/coolify.env
# (Zeile COOLIFY_TOKEN=…), eingetragen mit
#   ssh -t culinse /opt/culinse/deploy/geheimnis-setzen.sh COOLIFY_TOKEN /root/umzug/coolify.env
#
# Beim ersten Lauf werden die bisherigen Werte der Website (Supabase-Projekt)
# nach /root/umzug/quelle-supabase.env gesichert; "quelle" stellt sie wieder her.
# Die Adresse der Datenbank wird beim Bauen fest in die Website eingebaut,
# deshalb gilt eine Umstellung erst nach der Auslieferung.
set -euo pipefail
umask 077

RICHTUNG="${1:-}"
AUSLIEFERN=1
[ "${2:-}" = "--ohne-auslieferung" ] && AUSLIEFERN=0
APP_UUID="${COOLIFY_APP_UUID:-3qpy481kz7j6s8bbdsxj8lul}"
API="${COOLIFY_API:-http://127.0.0.1:8000/api/v1}"
TOKEN_DATEI=/root/umzug/coolify.env
SICHERUNG=/root/umzug/quelle-supabase.env
NAMEN="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY"

wert() { grep -E "^$2=" "$1" | head -1 | cut -d= -f2-; }

TOKEN="$(wert "$TOKEN_DATEI" COOLIFY_TOKEN 2>/dev/null || true)"
[ -n "$TOKEN" ] || { echo "COOLIFY_TOKEN fehlt in $TOKEN_DATEI." >&2; exit 1; }

# Bisherige Werte einmalig sichern (aus dem laufenden Container der Website).
if [ ! -s "$SICHERUNG" ]; then
  APP="$(docker ps --format '{{.Names}}' | grep "^$APP_UUID" | head -1)"
  [ -n "$APP" ] || { echo "Kein laufender Container der Website gefunden." >&2; exit 1; }
  for n in $NAMEN; do printf '%s=%s\n' "$n" "$(docker exec "$APP" printenv "$n")"; done > "$SICHERUNG"
  echo "Bisherige Werte gesichert: $SICHERUNG"
fi

case "$RICHTUNG" in
  ziel)
    URL="https://daten.culinse.com"
    ANON="$(wert /opt/supabase/.env ANON_KEY)"
    SERVICE="$(wert /opt/supabase/.env SERVICE_ROLE_KEY)"
    ;;
  quelle)
    URL="$(wert "$SICHERUNG" NEXT_PUBLIC_SUPABASE_URL)"
    ANON="$(wert "$SICHERUNG" NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    SERVICE="$(wert "$SICHERUNG" SUPABASE_SERVICE_ROLE_KEY)"
    ;;
  *)
    echo "Aufruf: $0 ziel|quelle [--ohne-auslieferung]" >&2
    exit 1
    ;;
esac
[ -n "$URL" ] && [ -n "$ANON" ] && [ -n "$SERVICE" ] || { echo "Ein Wert ist leer, nichts geändert." >&2; exit 1; }

# Die Werte gehen als JSON über die Standardeingabe an curl, nicht über die
# Befehlszeile; ausgegeben wird nur der Statuscode.
CODE="$(jq -n --arg u "$URL" --arg a "$ANON" --arg s "$SERVICE" \
  '{data: [{key: "NEXT_PUBLIC_SUPABASE_URL", value: $u},
           {key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: $a},
           {key: "SUPABASE_SERVICE_ROLE_KEY", value: $s}]}' \
  | curl -s -o /dev/null -w '%{http_code}' -X PATCH "$API/applications/$APP_UUID/envs/bulk" \
      -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data-binary @-)"
echo "Variablen umgestellt auf $URL: HTTP $CODE"
case "$CODE" in 200|201) ;; *) echo "Umstellen fehlgeschlagen." >&2; exit 1 ;; esac

if [ "$AUSLIEFERN" = 1 ]; then
  # Coolify 4.7 verlangt hier POST (GET antwortet mit 405).
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/deploy?uuid=$APP_UUID" -H "Authorization: Bearer $TOKEN")"
  echo "Auslieferung angestoßen: HTTP $CODE"
  case "$CODE" in 200|201) ;; *) echo "Auslieferung nicht angestoßen." >&2; exit 1 ;; esac
fi
