#!/usr/bin/env bash
# Sichert die geheimen Werte des Servers im Schlüsselbund des Mac (Anmeldung).
# Läuft auf dem Mac, nicht auf dem Server. Zeigt keine Werte an, nur Namen und
# Längen. Wiederholbar: vorhandene Einträge werden überschrieben.
#
#   deploy/schluessel-sichern.sh            sichern
#   deploy/schluessel-sichern.sh --liste    zeigen, was im Schlüsselbund liegt
#
# Einträge (Schlüsselbundverwaltung, Suche nach "Culinse Server"):
#   "Culinse Server: NAME"         einzelner Wert, direkt lesbar
#   "Culinse Server Datei: PFAD"   ganze Datei, base64-kodiert
#
# Einen Wert wieder holen:
#   security find-generic-password -s "Culinse Server: SMTP_PASS" -w
# Eine ganze Datei wieder holen:
#   security find-generic-password -s "Culinse Server Datei: /opt/supabase/.env" -w | base64 -d
set -euo pipefail
SERVER="${SERVER:-culinse}"
KONTO="culinse-server"

# Einzelwerte, die es nur einmal gibt oder die man einzeln braucht.
EINZELN=(SMTP_PASS GOOGLE_CLIENT_ID GOOGLE_SECRET ANON_KEY SERVICE_ROLE_KEY JWT_SECRET POSTGRES_PASSWORD DASHBOARD_PASSWORD)
# Ganze Dateien: damit lässt sich der Server vollständig wiederherstellen.
DATEIEN=(/opt/supabase/.env /data/coolify/source/.env /root/umzug/coolify.env /root/umzug/quelle-supabase.env /root/umzug/ziel.env)

if [ "${1:-}" = "--liste" ]; then
  for N in "${EINZELN[@]}"; do
    if W="$(security find-generic-password -a "$KONTO" -s "Culinse Server: $N" -w 2>/dev/null)"; then echo "vorhanden: $N (Länge ${#W})"; else echo "fehlt:     $N"; fi
  done
  for D in "${DATEIEN[@]}"; do
    if W="$(security find-generic-password -a "$KONTO" -s "Culinse Server Datei: $D" -w 2>/dev/null)"; then echo "vorhanden: Datei $D ($(printf '%s' "$W" | base64 -d | wc -l | tr -d ' ') Zeilen)"; else echo "fehlt:     Datei $D"; fi
  done
  exit 0
fi

ablegen() { # Dienstname, Wert, Anzeige
  security add-generic-password -U -a "$KONTO" -s "$1" -j "Culinse eigener Server, gesichert $(date +%d.%m.%Y)" -w "$2"
  echo "gesichert: $3"
}

FEHLT=0
for N in "${EINZELN[@]}"; do
  W="$(ssh -o BatchMode=yes "$SERVER" "grep -m1 '^$N=' /opt/supabase/.env | cut -d= -f2-")"
  if [ -z "$W" ]; then echo "leer, übersprungen: $N"; FEHLT=1; continue; fi
  ablegen "Culinse Server: $N" "$W" "$N (Länge ${#W})"
done
for D in "${DATEIEN[@]}"; do
  W="$(ssh -o BatchMode=yes "$SERVER" "[ -f '$D' ] && base64 -w0 '$D'" || true)"
  if [ -z "$W" ]; then echo "nicht vorhanden, übersprungen: $D"; FEHLT=1; continue; fi
  ablegen "Culinse Server Datei: $D" "$W" "Datei $D ($(printf '%s' "$W" | base64 -d | wc -l | tr -d ' ') Zeilen)"
done
unset W
echo
echo "Fertig. Zu finden in der Schlüsselbundverwaltung unter \"Culinse Server\"."
[ "$FEHLT" = 0 ] || echo "Hinweis: Mindestens ein Eintrag fehlte auf dem Server (siehe oben)."
