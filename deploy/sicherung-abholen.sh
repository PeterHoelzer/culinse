#!/bin/bash
# Holt die nächtliche Sicherung des Servers auf eine Platte am Mac.
# Läuft auf dem Mac (nicht auf dem Server), mehrmals täglich über launchd;
# der Server bekommt dabei keinen Zugang zum Mac.
#
# Auf dem Mac eingerichtet (16.11.2026): Kopie des Skripts und eine kleine App
# darum in ~/Library/Application Support/Culinse-Sicherung/ (die App braucht es,
# damit macOS den Zugriff auf das externe Laufwerk erlauben kann), Zeitplan in
# ~/Library/LaunchAgents/xyz.hoelzer.culinse-sicherung-abholen.plist.
# Nach einer Änderung hier die Kopie dort ersetzen; die App bleibt.
#
#   sicherung-abholen.sh            abholen, wenn es etwas Neues gibt
#   sicherung-abholen.sh --stand    zeigen, was auf der Platte liegt
#
# Ablage (Standard): /Volumes/Dateien/Culinse-Sicherung
#   datenbank/      verschlüsselte Datenbank-Abzüge (*.sql.gz.gpg), die neuesten 60
#   konfiguration/  verschlüsselte Einstellungen des Servers, die neuesten 60
#   bilder/         alle Bilder und Videos; hier wird nie etwas gelöscht
#   letzte-abholung.txt, abholen.log
#
# Die Datenbank-Dateien bleiben verschlüsselt. Öffnen:
#   security find-generic-password -s "Culinse Server Datei: /root/.sicherung-passwort" -w | base64 -d > /tmp/pw
#   gpg --batch --passphrase-file /tmp/pw -d culinse-db-….sql.gz.gpg | gunzip > alles.sql ; rm /tmp/pw
#
# Meldet sich mit einer Mitteilung auf dem Mac, wenn die letzte gelungene
# Abholung älter als 3 Tage ist.
set -uo pipefail
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"
SERVER="${SERVER:-culinse}"
QUELLE="/var/backups/culinse"
ZIEL="${ZIEL:-/Volumes/Dateien/Culinse-Sicherung}"
PLATTE="$(dirname "$ZIEL")"
BEHALTEN=60
WARNEN_NACH_TAGEN=3
SSH="ssh -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=30"

mitteilung() { osascript -e "display notification \"$1\" with title \"Culinse-Sicherung\"" >/dev/null 2>&1 || true; }

if [ "${1:-}" = "--stand" ]; then
  [ -d "$ZIEL" ] || { echo "Ordner fehlt: $ZIEL"; exit 1; }
  echo "Letzte Abholung: $(cat "$ZIEL/letzte-abholung.txt" 2>/dev/null || echo 'noch keine')"
  echo "Datenbank-Stände: $(ls "$ZIEL/datenbank" 2>/dev/null | wc -l | tr -d ' '), neuester: $(ls "$ZIEL/datenbank" 2>/dev/null | sort | tail -1)"
  echo "Bilder: $(find "$ZIEL/bilder" -type f 2>/dev/null | wc -l | tr -d ' ') Dateien, $(du -sh "$ZIEL/bilder" 2>/dev/null | cut -f1)"
  exit 0
fi

zu_alt_melden() {
  local letzte="$ZIEL/letzte-abholung.txt" alter=999
  [ -f "$letzte" ] && alter=$(( ( $(date +%s) - $(stat -f %m "$letzte") ) / 86400 ))
  [ "$alter" -lt "$WARNEN_NACH_TAGEN" ] || mitteilung "Seit $alter Tagen keine Sicherung vom Server abgeholt: $1"
}

# Platte da? Ohne diese Prüfung würde bei abgezogener Platte ein Ordner auf der
# internen Platte unter /Volumes entstehen.
if ! mount | grep -q " on $PLATTE "; then
  echo "[$(date '+%F %T')] Platte $PLATTE ist nicht angeschlossen"
  ZIEL_DA=0; [ -d "$ZIEL" ] && ZIEL_DA=1
  [ "$ZIEL_DA" = 1 ] && zu_alt_melden "Platte nicht angeschlossen" || mitteilung "Platte $(basename "$PLATTE") ist nicht angeschlossen"
  exit 1
fi
mkdir -p "$ZIEL/datenbank" "$ZIEL/konfiguration" "$ZIEL/bilder" && chmod 700 "$ZIEL"
exec >> "$ZIEL/abholen.log" 2>&1
# Nie zwei Abholungen gleichzeitig (eine erste Abholung kann lange dauern).
SPERRE="$ZIEL/.abholung-laeuft"
if ! mkdir "$SPERRE" 2>/dev/null; then
  ALT=$(( ( $(date +%s) - $(stat -f %m "$SPERRE") ) / 3600 ))
  if [ "$ALT" -lt 12 ]; then echo "[$(date '+%F %T')] Es läuft schon eine Abholung"; exit 0; fi
  echo "[$(date '+%F %T')] Alte Sperre ($ALT Stunden) entfernt"; rmdir "$SPERRE" 2>/dev/null; mkdir "$SPERRE" || exit 1
fi
trap 'rmdir "$SPERRE" 2>/dev/null' EXIT
echo "[$(date '+%F %T')] Abholung beginnt"

fehler() { echo "[$(date '+%F %T')] FEHLER: $1"; zu_alt_melden "$1"; exit 1; }

# Stand des Servers lesen: Zeitstempel, ok/fehler, Größe der Datenbank-Datei
STAND="$($SSH "$SERVER" "cat $QUELLE/letzter-lauf.txt" 2>/dev/null)" || fehler "Server nicht erreichbar"
case "$STAND" in *" ok "*) ;; *) fehler "Die Sicherung auf dem Server ist nicht in Ordnung: $STAND" ;; esac
if [ "$(head -1 "$ZIEL/letzte-abholung.txt" 2>/dev/null | sed 's/^Server-Stand: //')" = "$STAND" ]; then
  echo "[$(date '+%F %T')] Nichts Neues (Server-Stand $STAND)"; exit 0
fi

# 1) Datenbank und Einstellungen: kleine verschlüsselte Dateien, alle vorhandenen Stände
rsync -a --timeout=120 -e "$SSH" "$SERVER:$QUELLE/datenbank/" "$ZIEL/datenbank/" || fehler "Datenbank-Dateien ließen sich nicht abholen"
rsync -a --timeout=120 -e "$SSH" "$SERVER:$QUELLE/konfiguration/" "$ZIEL/konfiguration/" || fehler "Einstellungen ließen sich nicht abholen"

# 2) Bilder: der neueste Stand des Servers; schon vorhandene Dateien werden übersprungen
NEUESTER="$($SSH "$SERVER" "ls -1 $QUELLE/bilder | sort | tail -1")" || fehler "Bilder-Stand nicht lesbar"
[ -n "$NEUESTER" ] || fehler "Auf dem Server gibt es keinen Bilder-Stand"
rsync -a --timeout=300 -e "$SSH" "$SERVER:$QUELLE/bilder/$NEUESTER/" "$ZIEL/bilder/" || fehler "Bilder ließen sich nicht abholen"

# 3) Prüfen: neueste Datenbank-Datei muss dieselbe Prüfsumme haben wie auf dem Server
DATEI="$(ls -1 "$ZIEL/datenbank" | sort | tail -1)"
HIER="$(shasum -a 256 "$ZIEL/datenbank/$DATEI" | cut -d' ' -f1)"
DORT="$($SSH "$SERVER" "sha256sum $QUELLE/datenbank/$DATEI | cut -d' ' -f1")"
[ -n "$HIER" ] && [ "$HIER" = "$DORT" ] || fehler "Prüfsumme von $DATEI stimmt nicht"
DORT_ANZAHL="$($SSH "$SERVER" "find $QUELLE/bilder/$NEUESTER -type f | wc -l" | tr -d ' ')"
HIER_ANZAHL="$(find "$ZIEL/bilder" -type f | wc -l | tr -d ' ')"
[ "$HIER_ANZAHL" -ge "$DORT_ANZAHL" ] || fehler "Bilder unvollständig: hier $HIER_ANZAHL, auf dem Server $DORT_ANZAHL"

# 4) Alte Datenbank- und Einstellungs-Stände ausdünnen (nur in diesen zwei Ordnern)
for O in datenbank konfiguration; do
  ls -1 "$ZIEL/$O" | sort | awk -v n="$BEHALTEN" '{a[NR]=$0} END {for (i=1; i<=NR-n; i++) print a[i]}' | while IFS= read -r ALT; do
    case "$ALT" in culinse-db-*.sql.gz.gpg|culinse-konfig-*.tar.gpg) rm -f -- "$ZIEL/$O/$ALT" ;; esac
  done
done

printf 'Server-Stand: %s\nAbgeholt: %s\nDatenbank: %s (%s Bytes, Prüfsumme gleich)\nBilder: %s Dateien (Server-Stand %s: %s)\n' \
  "$STAND" "$(date '+%F %T')" "$DATEI" "$(stat -f %z "$ZIEL/datenbank/$DATEI")" "$HIER_ANZAHL" "$NEUESTER" "$DORT_ANZAHL" > "$ZIEL/letzte-abholung.txt"
echo "[$(date '+%F %T')] Abholung fertig: $DATEI, $HIER_ANZAHL Bilder"
