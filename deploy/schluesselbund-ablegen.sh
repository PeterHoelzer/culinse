#!/usr/bin/env bash
# Legt einen geheimen Text aus der Zwischenablage im Schlüsselbund des Mac ab,
# ohne ihn anzuzeigen. Gedacht für Dinge, die es nur einmal gibt und die nicht
# auf dem Server liegen, etwa Wiederherstellungs-Codes für den Zwei-Faktor-Schutz.
# Mehrzeilige Texte sind erlaubt (abgelegt wird base64, wie bei schluessel-sichern.sh).
#
#   pbpaste | deploy/schluesselbund-ablegen.sh NAME     ablegen (Name frei wählbar)
#   deploy/schluesselbund-ablegen.sh --holen NAME       zurück in die Zwischenablage
#   deploy/schluesselbund-ablegen.sh --liste            Namen der abgelegten Einträge
#
# Eintrag: "Culinse Geheim: NAME" (Konto culinse-server), zu finden in der
# Schlüsselbundverwaltung. Angezeigt werden nur Name, Zeilenzahl und Länge.
set -euo pipefail
KONTO="culinse-server"
VORSATZ="Culinse Geheim: "

case "${1:-}" in
  --liste)
    security dump-keychain 2>/dev/null | grep -o "\"svce\"<blob>=\"${VORSATZ}[^\"]*\"" | sed "s/.*=\"${VORSATZ}//; s/\"$//" | sort -u
    exit 0 ;;
  --holen)
    NAME="${2:?Name fehlt}"
    security find-generic-password -a "$KONTO" -s "${VORSATZ}${NAME}" -w | base64 -d | pbcopy
    echo "\"$NAME\" liegt in der Zwischenablage."
    exit 0 ;;
  ""|-*)
    echo "Aufruf: pbpaste | $0 NAME   |   $0 --holen NAME   |   $0 --liste" >&2; exit 2 ;;
esac

NAME="$1"
[[ "$NAME" =~ ^[A-Za-z0-9._-]{3,60}$ ]] || { echo "Name bitte nur aus Buchstaben, Ziffern, Punkt, Strich (3 bis 60 Zeichen)."; exit 2; }
[ -t 0 ] && { echo "Kein Text übergeben. So aufrufen: pbpaste | $0 $NAME"; exit 2; }
TEXT="$(cat)"
[ -n "${TEXT//[[:space:]]/}" ] || { echo "Die Zwischenablage ist leer, nichts abgelegt."; exit 1; }
ZEILEN="$(printf '%s\n' "$TEXT" | grep -c . || true)"
security add-generic-password -U -a "$KONTO" -s "${VORSATZ}${NAME}" -j "abgelegt $(date +%d.%m.%Y)" -w "$(printf '%s' "$TEXT" | base64)"
# Gegenprobe: lässt sich derselbe Text wieder lesen?
ZURUECK="$(security find-generic-password -a "$KONTO" -s "${VORSATZ}${NAME}" -w | base64 -d)"
[ "$ZURUECK" = "$TEXT" ] || { echo "Gegenprobe fehlgeschlagen: Der Eintrag stimmt nicht mit der Zwischenablage überein."; exit 1; }
echo "Abgelegt: \"${VORSATZ}${NAME}\" ($ZEILEN Zeilen, ${#TEXT} Zeichen). Gegenprobe bestanden."
unset TEXT ZURUECK
