#!/usr/bin/env bash
# Sichert den leeren Ausgangszustand der neuen Datenbank und setzt die
# Datenbank später darauf zurück. Gedacht für Probeläufe des Umzugs: so lässt
# sich der Import beliebig oft ab "leer" wiederholen.
#
#   deploy/ziel-zuruecksetzen.sh sichern                    # einmal, solange die Datenbank leer ist
#   JA_LOESCHEN=1 deploy/ziel-zuruecksetzen.sh zuruecksetzen  # löscht ALLE Daten der neuen Datenbank
#
# Gesichert wird nur der Datenordner der Datenbank. Der benannte Docker-Speicher
# supabase_db-config (Postgres-Einstellungen, keine Daten) und der Ordner
# volumes/storage (Bilder) bleiben beim Zurücksetzen unberührt.
set -euo pipefail

STACK="${SUPABASE_ORDNER:-/opt/supabase}"
DATEN="$STACK/volumes/db/data"
SICHERUNG="${SICHERUNG_DATEI:-/root/umzug/db-leer.tgz}"
AKTION="${1:-}"

warte_auf_gesund() {
  # Alle Supabase-Container müssen nach dem Start "healthy" melden.
  for _ in $(seq 1 60); do
    # Dienste ohne eigene Gesundheitsprüfung (supabase-mailvorlagen) melden nie
    # "healthy"; sie zählen, sobald sie laufen.
    if ! docker ps --format '{{.Names}} {{.Status}}' | grep '^supabase-' | grep -v '^supabase-mailvorlagen ' | grep -qv '(healthy)'; then
      return 0
    fi
    sleep 2
  done
  echo "Nicht alle Dienste sind gesund geworden:" >&2
  docker ps --format '{{.Names}} {{.Status}}' | grep '^supabase-' >&2
  return 1
}

case "$AKTION" in
  sichern)
    if [ -e "$SICHERUNG" ]; then
      echo "$SICHERUNG gibt es schon; nicht überschrieben." >&2
      exit 1
    fi
    umask 077
    cd "$STACK"
    sh run.sh stop
    # Rechte und Eigentümer der Postgres-Dateien müssen erhalten bleiben.
    tar --numeric-owner -cpzf "$SICHERUNG" -C "$STACK/volumes/db" data
    sh run.sh start
    warte_auf_gesund
    ls -lh "$SICHERUNG"
    ;;
  zuruecksetzen)
    if [ "${JA_LOESCHEN:-}" != "1" ]; then
      echo "Das löscht alle Daten der neuen Datenbank. Mit JA_LOESCHEN=1 bestätigen." >&2
      exit 1
    fi
    [ -f "$SICHERUNG" ] || { echo "Sicherung $SICHERUNG fehlt." >&2; exit 1; }
    # Sicherheitsnetz: nur den erwarteten Datenordner löschen.
    [ "$DATEN" = "/opt/supabase/volumes/db/data" ] || { echo "Unerwarteter Pfad $DATEN" >&2; exit 1; }
    cd "$STACK"
    sh run.sh stop
    rm -rf "$DATEN"
    tar --numeric-owner -xpzf "$SICHERUNG" -C "$STACK/volumes/db"
    sh run.sh start
    warte_auf_gesund
    echo "Datenbank steht wieder auf dem leeren Ausgangszustand."
    ;;
  *)
    echo "Aufruf: $0 sichern | zuruecksetzen   (zuruecksetzen mit JA_LOESCHEN=1)" >&2
    exit 1
    ;;
esac
