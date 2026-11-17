#!/usr/bin/env bash
# Leert den Zwischenspeicher von Cloudflare für culinse.com.
#
# Cloudflare speichert die fertigen Seiten in seinem Netz (Cache-Regel "Fertige
# Seiten speichern"). Nach jeder Auslieferung muss dieser Speicher leer sein:
# die gespeicherten Seiten verweisen auf Skripte und Stile der alten Fassung,
# die es nach dem Neubau nicht mehr gibt. auslieferung-bei-push.sh und
# coolify-supabase-umstellen.sh rufen dieses Skript deshalb selbst auf.
#
#   deploy/cloudflare-leeren.sh                     alles leeren
#   deploy/cloudflare-leeren.sh /de /de/about       einzelne Adressen (auch mit https://culinse.com davor)
#   deploy/cloudflare-leeren.sh --unter /de/recipe/user_…
#                                                   alles, was mit diesem Pfad beginnt, samt ?_rsc=…
#   deploy/cloudflare-leeren.sh --wenn-neu          alles leeren, wenn seit dem letzten Leeren eine
#                                                   neue Fassung der Website läuft (für den Zeitgeber)
#   deploy/cloudflare-leeren.sh --probe [ … ]       Trockenlauf: prüft Schlüssel und Zone und zeigt,
#                                                   was gesendet würde; geleert wird nichts
#   deploy/cloudflare-leeren.sh --stand             wann und was zuletzt geleert wurde
#   deploy/cloudflare-leeren.sh --schluessel-an-website
#                                                   Schlüssel und Zonen-Kennung als Laufzeit-Variablen
#                                                   in Coolify eintragen (gilt ab der nächsten Auslieferung)
#
# Der Schlüssel steht in /root/umzug/cloudflare.env (Zeile CLOUDFLARE_TOKEN=…),
# eingetragen mit
#   pbpaste | ssh culinse /opt/culinse/deploy/geheimnis-setzen.sh CLOUDFLARE_TOKEN /root/umzug/cloudflare.env
# Er braucht nur das Recht "Zone → Cache Purge" für culinse.com und wird nie
# angezeigt. Die Zonen-Kennung (kein Geheimnis) fragt das Skript bei Cloudflare
# ab und merkt sie sich in derselben Datei (CLOUDFLARE_ZONE_ID=…). Darf der
# Schlüssel die Zone nicht nachschlagen, die Zeile von Hand eintragen: Die
# Kennung steht im Cloudflare-Dashboard auf der Übersicht der Domain unter "API".
#
# Rückgabe: 0 geleert (oder nichts zu tun), 1 Fehler, 3 kein Schlüssel hinterlegt.
set -uo pipefail
umask 077

DOMAIN="${CLOUDFLARE_DOMAIN:-culinse.com}"
DATEI="${CLOUDFLARE_ENV:-/root/umzug/cloudflare.env}"
CF="https://api.cloudflare.com/client/v4"
APP_UUID="${COOLIFY_APP_UUID:-3qpy481kz7j6s8bbdsxj8lul}"
ORDNER=/var/lib/culinse-auslieferung
STAND="$ORDNER/cloudflare.txt"        # letztes Ergebnis, wird von ueberwachung.sh gelesen
MERKER="$ORDNER/cloudflare-container" # Container, für den zuletzt alles geleert wurde
JE_ANFRAGE=100                        # Cloudflare nimmt höchstens 100 Einträge je Anfrage
mkdir -p "$ORDNER"

wert() { grep -m1 "^$1=" "$DATEI" 2>/dev/null | cut -d= -f2-; }
container() { docker ps --format '{{.Names}}' </dev/null 2>/dev/null | grep "^$APP_UUID" || true; }

MODUS=alles
PROBE=0
case "${1:-}" in
  --stand) cat "$STAND" 2>/dev/null || echo "noch nie geleert"; exit 0 ;;
  --probe) PROBE=1; shift ;;
esac
case "${1:-}" in
  --unter) MODUS=unter; shift; [ $# -gt 0 ] || { echo "Aufruf: $0 --unter PFAD…" >&2; exit 1; } ;;
  --wenn-neu) MODUS=wenn-neu; shift ;;
  --schluessel-an-website) MODUS=an-website; shift ;;
  -*) echo "Unbekannte Angabe: $1" >&2; exit 1 ;;
  ?*) MODUS=adressen ;;
esac

# Für den Zeitgeber: nur leeren, wenn genau ein Container der Website läuft
# (zwei heißt: eine Auslieferung ist gerade im Gang) und es ein anderer ist als
# beim letzten Leeren. So wird auch nach einer Auslieferung geleert, die in der
# Coolify-Oberfläche angestoßen wurde, und ein gescheitertes Leeren wiederholt.
if [ "$MODUS" = wenn-neu ]; then
  [ -n "$(wert CLOUDFLARE_TOKEN)" ] || exit 0   # nicht eingerichtet: still bleiben
  LAEUFT="$(container)"
  [ "$(printf '%s\n' "$LAEUFT" | grep -c .)" = 1 ] || exit 0
  [ "$LAEUFT" != "$(cat "$MERKER" 2>/dev/null)" ] || exit 0
  echo "[$(date -Is)] Neue Fassung $LAEUFT läuft, Cloudflare-Speicher wird geleert"
  MODUS=alles
fi

TOKEN="$(wert CLOUDFLARE_TOKEN)"
if [ -z "$TOKEN" ]; then
  echo "CLOUDFLARE_TOKEN fehlt in $DATEI; es wurde nichts geleert." >&2
  exit 3
fi

# Der Schlüssel geht über eine Konfiguration an curl, nicht über die
# Befehlszeile (dort könnte ihn jeder Prozess auf dem Server lesen).
cf() { # Methode, Pfad, [JSON]
  local M="$1" P="$2" J="${3:-}"
  if [ -n "$J" ]; then
    curl -s -m 30 --config <(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN") \
      -X "$M" "$CF$P" -H 'Content-Type: application/json' --data-binary "$J"
  else
    curl -s -m 30 --config <(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN") -X "$M" "$CF$P"
  fi
}
fehlertext() { jq -r '[.errors[]? | "\(.code) \(.message)"] | join("; ")' 2>/dev/null; }

ZONE="$(wert CLOUDFLARE_ZONE_ID)"
if [ -z "$ZONE" ]; then
  ANTWORT="$(cf GET "/zones?name=$DOMAIN")"
  ZONE="$(printf '%s' "$ANTWORT" | jq -r '.result[0].id // empty' 2>/dev/null)"
  if [[ "$ZONE" =~ ^[0-9a-f]{32}$ ]]; then
    printf 'CLOUDFLARE_ZONE_ID=%s\n' "$ZONE" >> "$DATEI"
  else
    echo "Die Zonen-Kennung von $DOMAIN ließ sich nicht abfragen ($(printf '%s' "$ANTWORT" | fehlertext))." >&2
    echo "Der Schlüssel darf die Zone vermutlich nicht nachschlagen. Abhilfe: die Zeile" >&2
    echo "CLOUDFLARE_ZONE_ID=… in $DATEI eintragen (Dashboard → culinse.com → Übersicht → API → Zone ID)." >&2
    exit 1
  fi
fi
[[ "$ZONE" =~ ^[0-9a-f]{32}$ ]] || { echo "CLOUDFLARE_ZONE_ID in $DATEI hat nicht die Form einer Zonen-Kennung (32 Zeichen, 0-9 und a-f)." >&2; exit 1; }

# ----- Schlüssel an die Website geben -----
# Die Website leert nach einer Rezept-Änderung die Adressen dieses Rezepts
# selbst (lib/cloudflareCache.ts). Dafür braucht sie Schlüssel und Kennung zur
# Laufzeit; in den Bau gehören sie nicht.
if [ "$MODUS" = an-website ]; then
  API="${COOLIFY_API:-http://127.0.0.1:8000/api/v1}"
  CT="$(grep -m1 '^COOLIFY_TOKEN=' /root/umzug/coolify.env 2>/dev/null | cut -d= -f2-)"
  [ -n "$CT" ] || { echo "COOLIFY_TOKEN fehlt in /root/umzug/coolify.env." >&2; exit 1; }
  if [ "$PROBE" = 1 ]; then
    echo "Probe: würde CLOUDFLARE_PURGE_TOKEN (Länge ${#TOKEN}) und CLOUDFLARE_ZONE_ID in Coolify eintragen, nur zur Laufzeit."
    exit 0
  fi
  CODE="$(T="$TOKEN" Z="$ZONE" jq -n \
      '{data: [{key: "CLOUDFLARE_PURGE_TOKEN", value: env.T, is_buildtime: false, is_runtime: true, is_literal: true},
               {key: "CLOUDFLARE_ZONE_ID", value: env.Z, is_buildtime: false, is_runtime: true, is_literal: true}]}' \
    | curl -s -o /dev/null -w '%{http_code}' -m 20 --config <(printf 'header = "Authorization: Bearer %s"\n' "$CT") \
        -X PATCH "$API/applications/$APP_UUID/envs/bulk" -H 'Content-Type: application/json' --data-binary @-)"
  unset CT TOKEN
  echo "Schlüssel und Zonen-Kennung in Coolify eingetragen: HTTP $CODE (gilt ab der nächsten Auslieferung)"
  case "$CODE" in 200|201) exit 0 ;; *) exit 1 ;; esac
fi

# ----- Was geleert wird -----
# Adressen einzeln (genau diese Adresse, ohne Varianten mit Parametern), unter
# einem Pfad (alles, was so beginnt) oder alles.
EINTRAEGE=()
case "$MODUS" in
  adressen)
    for A in "$@"; do
      case "$A" in
        https://"$DOMAIN"/*|https://"$DOMAIN") EINTRAEGE+=("$A") ;;
        /*) EINTRAEGE+=("https://$DOMAIN$A") ;;
        *) echo "Keine Adresse von $DOMAIN: $A" >&2; exit 1 ;;
      esac
    done ;;
  unter)
    for A in "$@"; do
      A="${A#https://}"; A="${A#"$DOMAIN"}"
      case "$A" in
        /?*) EINTRAEGE+=("$DOMAIN$A") ;;
        *) echo "Kein Pfad von $DOMAIN: $A (für alles das Skript ohne Angabe aufrufen)" >&2; exit 1 ;;
      esac
    done ;;
esac

if [ "$PROBE" = 1 ]; then
  PRUEF="$(cf GET /user/tokens/verify)"
  echo "Schlüssel: Länge ${#TOKEN}, Cloudflare meldet: $(printf '%s' "$PRUEF" | jq -r '.result.status // "ungültig"' 2>/dev/null) $(printf '%s' "$PRUEF" | fehlertext)"
  echo "Zone $DOMAIN: Kennung vorhanden (${#ZONE} Zeichen)"
  case "$MODUS" in
    alles) echo "Probe: würde alles leeren." ;;
    *) echo "Probe: würde ${#EINTRAEGE[@]} Einträge leeren ($MODUS):"; printf '  %s\n' "${EINTRAEGE[@]}" ;;
  esac
  unset TOKEN
  exit 0
fi

sende() { # JSON → 0, wenn Cloudflare "success" meldet
  local ANTWORT
  ANTWORT="$(cf POST "/zones/$ZONE/purge_cache" "$1")"
  [ "$(printf '%s' "$ANTWORT" | jq -r '.success // false' 2>/dev/null)" = true ] && return 0
  GRUND="$(printf '%s' "$ANTWORT" | fehlertext)"; GRUND="${GRUND:-keine Antwort von Cloudflare}"
  return 1
}

GRUND=""
OK=1
case "$MODUS" in
  alles)
    LAEUFT="$(container | tail -1)"
    sende '{"purge_everything":true}' || OK=0
    WAS="alles" ;;
  *)
    FELD=files; [ "$MODUS" = unter ] && FELD=prefixes
    for ((i = 0; i < ${#EINTRAEGE[@]}; i += JE_ANFRAGE)); do
      sende "$(jq -cn --arg f "$FELD" '{($f): $ARGS.positional}' --args "${EINTRAEGE[@]:i:JE_ANFRAGE}")" || { OK=0; break; }
    done
    WAS="${#EINTRAEGE[@]} Einträge ($MODUS)" ;;
esac
unset TOKEN

if [ "$OK" = 1 ]; then
  # Der Merker gilt nur fürs vollständige Leeren; einzelne Adressen ändern nichts
  # daran, ob nach einer Auslieferung noch geleert werden muss.
  if [ "$MODUS" = alles ]; then
    printf '%s\n' "${LAEUFT:-}" > "$MERKER"
    printf '%s ok alles %s\n' "$(date -Is)" "${LAEUFT:-}" > "$STAND"
  fi
  echo "[$(date -Is)] Cloudflare-Speicher geleert: $WAS"
  exit 0
fi
[ "$MODUS" = alles ] && printf '%s fehler %s\n' "$(date -Is)" "$GRUND" > "$STAND"
echo "[$(date -Is)] Cloudflare-Speicher NICHT geleert ($WAS): $GRUND" >&2
exit 1
