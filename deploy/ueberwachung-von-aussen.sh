#!/bin/bash
# Prüft von außen, ob culinse.com erreichbar ist. Läuft auf dem Mac (nicht auf
# dem Server), alle 5 Minuten über launchd. Ergänzt deploy/ueberwachung.sh: Die
# läuft auf dem Server und kann nicht melden, wenn der ganze Server, seine
# Leitung oder Cloudflare ausfällt.
#
# Auf dem Mac eingerichtet (17.11.2026): Kopie des Skripts in
# ~/Library/Application Support/Culinse-Ueberwachung/, Zeitplan in
# ~/Library/LaunchAgents/xyz.hoelzer.culinse-ueberwachung-aussen.plist.
# Nach einer Änderung hier die Kopie dort ersetzen.
#
#   ueberwachung-von-aussen.sh            prüfen, bei Störung melden
#   ueberwachung-von-aussen.sh --zeigen   prüfen und Ergebnis nur anzeigen
#   ueberwachung-von-aussen.sh --probemail  eine Test-Mail schicken
#
# Meldung: Mitteilung auf dem Mac und Mail über Resend. Der Resend-Schlüssel
# kommt zur Laufzeit aus dem Schlüsselbund ("Culinse Server: SMTP_PASS") und
# wird nirgends abgelegt oder angezeigt. Empfänger steht in einstellung.env
# (MELDE_AN=…), nicht im Repo.
#
# Gemeldet wird erst beim zweiten Fehlschlag in Folge (rund 10 Minuten), danach
# alle 6 Stunden zur Erinnerung und einmal, wenn alles wieder läuft. Hat der Mac
# selbst kein Netz, wird nichts gemeldet.
set -uo pipefail
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"
ORDNER="${UEBERWACHUNG_ORDNER:-$HOME/Library/Application Support/Culinse-Ueberwachung}"
mkdir -p "$ORDNER"
[ -f "$ORDNER/einstellung.env" ] && . "$ORDNER/einstellung.env"
WEBSITE="${WEBSITE:-https://culinse.com}"
DATEN="${DATEN:-https://daten.culinse.com}"
MELDE_AN="${MELDE_AN:-}"
ABSENDER="${ABSENDER:-Culinse Überwachung <noreply@culinse.com>}"
ERINNERN_NACH=$((6 * 3600))
MODUS="${1:-}"

mitteilung() { osascript -e "display notification \"$1\" with title \"Culinse-Überwachung\"" >/dev/null 2>&1 || true; }

mail() { # $1 Betreff, $2 Text
  [ -n "$MELDE_AN" ] || { echo "kein Empfänger (MELDE_AN in einstellung.env)"; return 1; }
  local inhalt
  inhalt="$(/usr/bin/python3 -c 'import json,sys; print(json.dumps({"from":sys.argv[1],"to":[sys.argv[2]],"subject":sys.argv[3],"text":sys.argv[4]}))' "$ABSENDER" "$MELDE_AN" "$1" "$2")"
  # Der Schlüssel geht über eine Leitung direkt an curl und erscheint in keiner Prozessliste.
  security find-generic-password -a culinse-server -s "Culinse Server: SMTP_PASS" -w 2>/dev/null \
    | sed 's/^/header = "Authorization: Bearer /; s/$/"/' \
    | curl -s -m 30 -o /dev/null -w '%{http_code}' -K - -X POST https://api.resend.com/emails \
        -H 'Content-Type: application/json' -d "$inhalt"
}

if [ "$MODUS" = "--probemail" ]; then
  echo "Antwort von Resend: $(mail "Culinse: Probe der Überwachung von außen" "Diese Mail kommt vom Mac. Sie zeigt, dass die Überwachung von außen melden kann.")"
  exit 0
fi

FEHLER=""
merke() { FEHLER="${FEHLER}${FEHLER:+; }$1"; }
abruf() { local c; c="$(curl -s -m 25 -o "$ORDNER/antwort.tmp" -D "$ORDNER/kopf.tmp" -w '%{http_code}' "$@" 2>/dev/null)" || true; echo "${c:-000}"; }

# 1) Website mit Datenbank (über Cloudflare)
C="$(abruf "$WEBSITE/api/health?tief=1")"; [ "$C" = 200 ] || merke "Prüfadresse der Website antwortet mit $C"
# 2) Eine echte Seite. Über welchen Weg sie kam, wird nur angezeigt, nicht
#    gemeldet: Nach einer DNS-Umstellung geht ein Netz noch bis zu zwei Tage
#    direkt zum Server statt über Cloudflare, und das ist keine Störung.
C="$(abruf "$WEBSITE/de")"
if [ "$C" != 200 ]; then merke "Startseite antwortet mit $C"
elif ! grep -q -i "culinse" "$ORDNER/antwort.tmp"; then merke "Startseite ohne erwarteten Inhalt"; fi
WEG="direkt vom Server"; grep -q -i '^server: cloudflare' "$ORDNER/kopf.tmp" 2>/dev/null && WEG="über Cloudflare"
# 3) Daten-Adresse (Bilder, Anmeldung), direkt am Server
C="$(abruf "$DATEN/storage/v1/status")"; [ "$C" = 200 ] || merke "Bildspeicher antwortet mit $C"
C="$(abruf "$DATEN/auth/v1/health")"; case "$C" in 200|401) ;; *) merke "Anmeldedienst antwortet mit $C" ;; esac
rm -f "$ORDNER/antwort.tmp" "$ORDNER/kopf.tmp"

# Hat der Mac selbst kein Netz? Dann ist ein Fehlschlag keine Aussage über den Server.
if [ -n "$FEHLER" ]; then
  N="$(curl -s -m 15 -o /dev/null -w '%{http_code}' https://www.apple.com/library/test/success.html 2>/dev/null)" || true
  if [ "$N" != 200 ]; then
    echo "[$(date '+%F %T')] Mac ohne Netz, keine Aussage ($FEHLER)" >> "$ORDNER/verlauf.log"
    [ "$MODUS" = "--zeigen" ] && echo "Mac ohne Netz: $FEHLER"
    exit 0
  fi
fi

JETZT="$(date +%s)"
if [ "$MODUS" = "--zeigen" ]; then
  [ -z "$FEHLER" ] && echo "[$(date '+%d.%m.%Y %H:%M')] Von außen alles erreichbar (Website $WEG)." || echo "[$(date '+%d.%m.%Y %H:%M')] Störung: $FEHLER"
  exit 0
fi

ZAEHLER="$(cat "$ORDNER/fehlschlaege" 2>/dev/null || echo 0)"
GEMELDET="$(cat "$ORDNER/gemeldet-um" 2>/dev/null || echo 0)"
if [ -z "$FEHLER" ]; then
  if [ "$GEMELDET" != 0 ]; then
    mitteilung "culinse.com ist wieder erreichbar."
    mail "Culinse: wieder erreichbar" "Von außen ist wieder alles erreichbar ($(date '+%d.%m.%Y %H:%M')). Geprüft vom Mac." >/dev/null
    echo "[$(date '+%F %T')] wieder erreichbar" >> "$ORDNER/verlauf.log"
  fi
  echo 0 > "$ORDNER/fehlschlaege"; echo 0 > "$ORDNER/gemeldet-um"
  date '+%F %T ok' > "$ORDNER/letzte-pruefung.txt"
  exit 0
fi

ZAEHLER=$((ZAEHLER + 1)); echo "$ZAEHLER" > "$ORDNER/fehlschlaege"
echo "[$(date '+%F %T')] Fehlschlag $ZAEHLER: $FEHLER" >> "$ORDNER/verlauf.log"
date "+%F %T fehler $FEHLER" > "$ORDNER/letzte-pruefung.txt"
if [ "$ZAEHLER" -ge 2 ] && { [ "$GEMELDET" = 0 ] || [ $((JETZT - GEMELDET)) -ge "$ERINNERN_NACH" ]; }; then
  mitteilung "culinse.com ist von außen gestört: $FEHLER"
  mail "Culinse: von außen nicht erreichbar" "Der Mac erreicht culinse.com seit $ZAEHLER Prüfungen nicht richtig ($(date '+%d.%m.%Y %H:%M')).

$FEHLER

Erste Schritte: ssh culinse, dann /opt/culinse/deploy/ueberwachung.sh --zeigen. Läuft der Server, aber die Seite nicht: bei Cloudflare nachsehen. Rückweg steht im Drehbuch (Vault, 01 Projekte)." >/dev/null
  echo "$JETZT" > "$ORDNER/gemeldet-um"
fi
exit 1
