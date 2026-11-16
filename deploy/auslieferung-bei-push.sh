#!/usr/bin/env bash
# Liefert die Website aus, sobald auf GitHub ein neuer Stand von `main` liegt.
# Läuft alle 2 Minuten als systemd-Timer auf dem Server und fragt GitHub selbst
# ab. Vorteil gegenüber einem Webhook: Coolify muss dafür nicht aus dem Internet
# erreichbar sein, und bei GitHub ist nichts einzurichten.
#
# Ablauf: neuesten Commit von `main` lesen; ist er neu, über die Coolify-API
# einen Bau anstoßen und auf das Ergebnis warten. Coolify tauscht die laufende
# Fassung erst nach einem gelungenen Bau; bei einem Fehler läuft die alte weiter.
# Das Ergebnis steht in /var/lib/culinse-auslieferung/letzte.txt und wird von
# ueberwachung.sh gelesen (Mail bei fehlgeschlagenem Bau).
#
#   deploy/auslieferung-bei-push.sh            prüfen und bei Bedarf ausliefern
#   deploy/auslieferung-bei-push.sh --stand    letzten Stand zeigen
set -uo pipefail
REPO="${REPO:-https://github.com/PeterHoelzer/culinse}"
ZWEIG="${ZWEIG:-main}"
API=http://127.0.0.1:8000/api/v1
APP_UUID=3qpy481kz7j6s8bbdsxj8lul
ORDNER=/var/lib/culinse-auslieferung
mkdir -p "$ORDNER"

if [ "${1:-}" = "--stand" ]; then cat "$ORDNER/letzte.txt" 2>/dev/null || echo "noch keine Auslieferung über dieses Skript"; exit 0; fi

# Nie zwei Läufe gleichzeitig (ein Bau dauert länger als der Takt).
exec 9>"$ORDNER/sperre"; flock -n 9 || exit 0

NEU="$(git ls-remote "$REPO" "refs/heads/$ZWEIG" 2>/dev/null | cut -f1)"
[[ "$NEU" =~ ^[0-9a-f]{40}$ ]] || { echo "[$(date -Is)] GitHub nicht erreichbar oder Zweig fehlt"; exit 0; }
ALT="$(cat "$ORDNER/commit" 2>/dev/null || true)"
[ "$NEU" != "$ALT" ] || exit 0

TOKEN="$(grep -m1 '^COOLIFY_TOKEN=' /root/umzug/coolify.env | cut -d= -f2-)"
[ -n "$TOKEN" ] || { echo "[$(date -Is)] COOLIFY_TOKEN fehlt"; exit 1; }
echo "[$(date -Is)] Neuer Stand ${NEU:0:8} (bisher ${ALT:0:8}), Bau wird angestoßen"
D="$(curl -s -m 20 -X POST "$API/deploy?uuid=$APP_UUID" -H "Authorization: Bearer $TOKEN" | jq -r '.deployments[0].deployment_uuid // empty')"
[ -n "$D" ] || { echo "[$(date -Is)] Bau ließ sich nicht anstoßen"; printf '%s fehler %s nicht-angestossen\n' "$(date -Is)" "${NEU:0:8}" > "$ORDNER/letzte.txt"; exit 1; }

S=unbekannt
for _ in $(seq 1 90); do
  S="$(curl -s -m 10 "$API/deployments/$D" -H "Authorization: Bearer $TOKEN" | jq -r '.status // "unbekannt"')"
  case "$S" in finished|failed|cancelled-by-user) break ;; esac
  sleep 10
done
unset TOKEN

if [ "$S" = finished ]; then
  echo "$NEU" > "$ORDNER/commit"
  printf '%s ok %s %s\n' "$(date -Is)" "${NEU:0:8}" "$D" > "$ORDNER/letzte.txt"
  echo "[$(date -Is)] Ausgeliefert: ${NEU:0:8}"
else
  # Den Commit trotzdem merken: derselbe kaputte Stand soll nicht alle 2 Minuten
  # neu gebaut werden. Der nächste Push löst wieder einen Bau aus.
  echo "$NEU" > "$ORDNER/commit"
  printf '%s fehler %s %s (%s)\n' "$(date -Is)" "${NEU:0:8}" "$D" "$S" > "$ORDNER/letzte.txt"
  echo "[$(date -Is)] Bau fehlgeschlagen ($S): ${NEU:0:8}; die bisherige Fassung läuft weiter"
  exit 1
fi
