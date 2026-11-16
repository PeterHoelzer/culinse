#!/usr/bin/env bash
# Trägt einen geheimen Wert in eine Umgebungsdatei auf dem Server ein, ohne dass
# er auf dem Bildschirm, in der Befehlszeile oder im Verlauf erscheint.
#
#   ssh -t culinse /opt/culinse/deploy/geheimnis-setzen.sh SMTP_PASS
#   ssh -t culinse /opt/culinse/deploy/geheimnis-setzen.sh GOOGLE_SECRET /opt/supabase/.env
#
# Das Skript fragt nach dem Wert (Eingabe bleibt unsichtbar), ersetzt die Zeile
# NAME=… oder hängt sie an. Die Datei bleibt nur für root lesbar.
#
# Ohne Abtippen, direkt aus der Zwischenablage des Mac (Wert im Browser
# kopieren, dann):
#
#   pbpaste | ssh culinse /opt/culinse/deploy/geheimnis-setzen.sh SMTP_PASS
#
# Bekannte Namen werden auf ihre Form geprüft, damit kein falscher Inhalt der
# Zwischenablage in der Datei landet.
set -euo pipefail
NAME="${1:?Name der Variable fehlt}"
DATEI="${2:-/opt/supabase/.env}"
[[ "$NAME" =~ ^[A-Z][A-Z0-9_]*$ ]] || { echo "Ungültiger Name: $NAME"; exit 1; }
[ -f "$DATEI" ] || { echo "Datei fehlt: $DATEI"; exit 1; }

if [ -t 0 ]; then
  printf 'Wert für %s einfügen und Eingabetaste drücken (Eingabe bleibt unsichtbar): ' "$NAME"
  IFS= read -rs WERT
  echo
else
  WERT="$(cat)"
fi
# Leerraum und Zeilenenden am Rand entfernen (kommt beim Kopieren oft mit).
WERT="${WERT#"${WERT%%[![:space:]]*}"}"
WERT="${WERT%"${WERT##*[![:space:]]}"}"
[ -n "$WERT" ] || { echo "Leere Eingabe, nichts geändert."; exit 1; }
case "$WERT" in *[[:space:]]*) echo "Der Wert enthält Leerzeichen oder mehrere Zeilen, nichts geändert. Steht das Richtige in der Zwischenablage?"; exit 1 ;; esac
FORM=""
case "$NAME" in
  SMTP_PASS)        [[ "$WERT" =~ ^re_[A-Za-z0-9_]{20,}$ ]] || FORM="ein Resend-Schlüssel beginnt mit re_" ;;
  GOOGLE_SECRET)    [[ "$WERT" =~ ^[A-Za-z0-9_-]{20,}$ && ! "$WERT" =~ ^re_ ]] || FORM="ein Google-Clientschlüssel beginnt meist mit GOCSPX- und hat keine Punkte" ;;
  GOOGLE_CLIENT_ID) [[ "$WERT" =~ ^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$ ]] || FORM="eine Google-Client-ID endet auf .apps.googleusercontent.com" ;;
esac
[ -z "$FORM" ] || { echo "Das sieht nicht nach $NAME aus ($FORM; Länge ${#WERT}), nichts geändert."; exit 1; }

umask 077
TMP="$(mktemp "${DATEI}.XXXXXX")"
grep -v "^${NAME}=" "$DATEI" > "$TMP" || true
printf '%s=%s\n' "$NAME" "$WERT" >> "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$DATEI"
unset WERT
echo "$NAME ist in $DATEI gesetzt ($(grep -c "^${NAME}=" "$DATEI") Zeile, Länge $(grep "^${NAME}=" "$DATEI" | cut -d= -f2- | tr -d "\n" | wc -c | tr -d " ")). Damit er gilt, muss der zugehörige Dienst neu gestartet werden."
