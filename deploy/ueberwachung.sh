#!/usr/bin/env bash
# Überwacht den eigenen Server von innen und schickt eine Mail, wenn etwas
# ausfällt oder wieder läuft. Läuft alle 5 Minuten als systemd-Timer.
#
# Geprüft wird: Website mit Datenbank, Anmeldedienst, Bildspeicher, Zustand der
# Container, freier Plattenplatz, Alter der letzten Sicherung, Laufzeit des
# Zertifikats.
#
# Was diese Überwachung NICHT merkt: wenn der ganze Server oder seine
# Internetverbindung weg ist. Dafür braucht es zusätzlich einen Dienst von
# außen (siehe Drehbuch, Abschnitt D).
#
# Einstellungen in /etc/culinse-ueberwachung.env (nur für root lesbar):
#   MELDE_AN=name@example.com          Empfänger der Warnungen
#   MELDE_VON="Culinse Server <noreply@culinse.com>"
#   WEBSITE=https://neu.culinse.com    nach dem Umschalten: https://culinse.com
#   DATEN=https://daten.culinse.com
#   PLATTE_WARNUNG_PROZENT=85
#   SICHERUNG_MAX_STUNDEN=30
#   ERINNERN_STUNDEN=6                 solange ein Fehler anhält, so oft erinnern
#
# Der Versand läuft über Resend mit dem Schlüssel, der schon für die
# Anmelde-Mails hinterlegt ist (SMTP_PASS in /opt/supabase/.env).
#
#   deploy/ueberwachung.sh             prüfen, bei Zustandswechsel melden
#   deploy/ueberwachung.sh --zeigen    prüfen und Ergebnis nur ausgeben
#   deploy/ueberwachung.sh --probemail eine Probe-Mail schicken
set -uo pipefail
# Für Proben lassen sich Einstellungsdatei und Zustandsordner umlenken.
. "${UEBERWACHUNG_ENV:-/etc/culinse-ueberwachung.env}"
: "${MELDE_AN:?}" "${WEBSITE:?}" "${DATEN:?}"
MELDE_VON="${MELDE_VON:-Culinse Server <noreply@culinse.com>}"
PLATTE_MAX="${PLATTE_WARNUNG_PROZENT:-85}"
SICHERUNG_MAX="${SICHERUNG_MAX_STUNDEN:-30}"
ERINNERN="${ERINNERN_STUNDEN:-6}"
ZUSTAND="${UEBERWACHUNG_ZUSTAND:-/var/lib/culinse-ueberwachung}"
mkdir -p "$ZUSTAND"; chmod 700 "$ZUSTAND"
MODUS="${1:-}"

FEHLER=()
melde() { FEHLER+=("$1"); }

http() { curl -s -m 20 -o /dev/null -w '%{http_code}' "$@" 2>/dev/null || echo 000; }

# 1) Website samt Datenbank (die Prüfadresse fragt die Datenbank ab)
C="$(http "$WEBSITE/api/health?tief=1")"
[ "$C" = 200 ] || melde "Website: $WEBSITE/api/health?tief=1 antwortet mit $C"

# 2) Anmeldedienst und Bildspeicher über die öffentliche Adresse
ANON="$(grep -m1 '^ANON_KEY=' /opt/supabase/.env | cut -d= -f2-)"
C="$(http "$DATEN/auth/v1/health" -H "apikey: $ANON")"
[ "$C" = 200 ] || melde "Anmeldedienst: $DATEN/auth/v1/health antwortet mit $C"
C="$(http "$DATEN/storage/v1/status" -H "apikey: $ANON")"
[ "$C" = 200 ] || melde "Bildspeicher: $DATEN/storage/v1/status antwortet mit $C"
unset ANON

# 3) Container: alle von Supabase, der Eingang und die Website müssen laufen
while read -r NAME STATUS; do
  case "$STATUS" in
    Up*unhealthy*) melde "Container $NAME meldet sich als nicht gesund ($STATUS)" ;;
    Up*) ;;
    *) melde "Container $NAME läuft nicht ($STATUS)" ;;
  esac
done < <(docker ps -a --format '{{.Names}} {{.Status}}' </dev/null | grep -E '^(supabase-(db|auth|rest|storage|envoy|pooler|meta|imgproxy|studio|mailvorlagen)|coolify|coolify-proxy|coolify-db) ')
docker ps --format '{{.Names}}' </dev/null | grep -q '^3qpy481kz7j6s8bbdsxj8lul' || melde "Der Container der Website läuft nicht"

# 4) Plattenplatz
BELEGT="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
[ "${BELEGT:-0}" -lt "$PLATTE_MAX" ] || melde "Platte zu ${BELEGT} % voll (Grenze ${PLATTE_MAX} %)"

# 5) Sicherung: letzter Lauf erfolgreich und nicht zu alt
LETZTER=/var/backups/culinse/letzter-lauf.txt
if [ -f "$LETZTER" ]; then
  ALTER_H=$(( ( $(date +%s) - $(stat -c %Y "$LETZTER") ) / 3600 ))
  grep -q -w ok "$LETZTER" || melde "Die letzte Sicherung ist fehlgeschlagen ($(head -c 120 "$LETZTER" | tr '\n' ' '))"
  [ "$ALTER_H" -lt "$SICHERUNG_MAX" ] || melde "Die letzte Sicherung ist $ALTER_H Stunden alt (Grenze $SICHERUNG_MAX)"
else
  melde "Es gibt noch keine Sicherung ($LETZTER fehlt)"
fi

# 5b) Letzte Auslieferung: ein fehlgeschlagener Bau soll auffallen (die alte Fassung läuft dann weiter)
AUSL=/var/lib/culinse-auslieferung/letzte.txt
if [ -f "$AUSL" ] && grep -q -w fehler "$AUSL"; then melde "Der letzte Bau der Website ist fehlgeschlagen ($(head -c 120 "$AUSL" | tr '\n' ' '))"; fi

# 5c) Cloudflare-Speicher: Nach einer Auslieferung muss er leer sein, sonst
# zeigt Cloudflare Seiten, deren Skripte es nicht mehr gibt.
CFL=/var/lib/culinse-auslieferung/cloudflare.txt
if [ -f "$CFL" ] && grep -q -w fehler "$CFL"; then melde "Der Cloudflare-Speicher ließ sich nach der Auslieferung nicht leeren ($(head -c 160 "$CFL" | tr '\n' ' '))"; fi

# 6) Zertifikate: weniger als 14 Tage Restlaufzeit heißt, die Verlängerung klemmt
for H in "${WEBSITE#https://}" "${DATEN#https://}"; do
  ENDE="$(echo | timeout 15 openssl s_client -servername "$H" -connect "$H:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"
  if [ -n "$ENDE" ]; then
    TAGE=$(( ( $(date -d "$ENDE" +%s) - $(date +%s) ) / 86400 ))
    [ "$TAGE" -ge 14 ] || melde "Zertifikat für $H läuft in $TAGE Tagen ab"
  else
    melde "Zertifikat für $H lässt sich nicht lesen"
  fi
done

# ----- Ergebnis -----
JETZT="$(date '+%d.%m.%Y %H:%M')"
if [ "${#FEHLER[@]}" -eq 0 ]; then TEXT="Alles in Ordnung."; else TEXT="$(printf -- '- %s\n' "${FEHLER[@]}")"; fi

mail_senden() { # Betreff, Text
  local KEY; KEY="$(grep -m1 '^SMTP_PASS=' /opt/supabase/.env | cut -d= -f2-)"
  jq -n --arg from "$MELDE_VON" --arg to "$MELDE_AN" --arg s "$1" --arg t "$2" '{from:$from,to:[$to],subject:$s,text:$t}' \
    | curl -s -m 20 -o /dev/null -w '%{http_code}' -X POST https://api.resend.com/emails \
        -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' --data-binary @-
}

if [ "$MODUS" = "--zeigen" ]; then echo "[$JETZT] $TEXT"; exit 0; fi
if [ "$MODUS" = "--probemail" ]; then
  echo "Probe-Mail: HTTP $(mail_senden "Culinse-Server: Probe der Überwachung" "Das ist eine Probe vom $JETZT. Aktueller Stand:"$'\n\n'"$TEXT")"; exit 0
fi

VORHER="$(cat "$ZUSTAND/zustand" 2>/dev/null || echo ok)"
LETZTE_MAIL="$(cat "$ZUSTAND/letzte-mail" 2>/dev/null || echo 0)"
SEIT=$(( ( $(date +%s) - LETZTE_MAIL ) / 3600 ))

if [ "${#FEHLER[@]}" -gt 0 ]; then
  # Erst beim zweiten Fehlschlag in Folge melden: ein Neubau oder ein kurzer
  # Neustart soll keine Mail auslösen.
  ANZAHL=$(( $(cat "$ZUSTAND/fehlschlaege" 2>/dev/null || echo 0) + 1 )); echo "$ANZAHL" > "$ZUSTAND/fehlschlaege"
  echo "[$JETZT] Fehler ($ANZAHL. Lauf in Folge): ${FEHLER[*]}"
  if [ "$ANZAHL" -ge 2 ] && { [ "$VORHER" = ok ] || [ "$SEIT" -ge "$ERINNERN" ]; }; then
    echo "  Mail: HTTP $(mail_senden "Culinse-Server: Störung" "Stand $JETZT:"$'\n\n'"$TEXT"$'\n\n'"Nachsehen: ssh culinse '/opt/culinse/deploy/ueberwachung.sh --zeigen'")"
    date +%s > "$ZUSTAND/letzte-mail"; echo fehler > "$ZUSTAND/zustand"
  fi
  exit 1
fi

echo 0 > "$ZUSTAND/fehlschlaege"
if [ "$VORHER" != ok ]; then
  echo "[$JETZT] wieder in Ordnung; Mail: HTTP $(mail_senden "Culinse-Server: läuft wieder" "Stand $JETZT: Alle Prüfungen sind wieder in Ordnung.")"
  echo ok > "$ZUSTAND/zustand"
fi
exit 0
