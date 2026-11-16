#!/usr/bin/env bash
# Trägt einen geheimen Wert in eine Umgebungsdatei auf dem Server ein, ohne dass
# er auf dem Bildschirm, in der Befehlszeile oder im Verlauf erscheint.
#
#   ssh -t culinse /opt/culinse/deploy/geheimnis-setzen.sh SMTP_PASS
#   ssh -t culinse /opt/culinse/deploy/geheimnis-setzen.sh GOOGLE_SECRET /opt/supabase/.env
#
# Das Skript fragt nach dem Wert (Eingabe bleibt unsichtbar), ersetzt die Zeile
# NAME=… oder hängt sie an. Die Datei bleibt nur für root lesbar.
set -euo pipefail
NAME="${1:?Name der Variable fehlt}"
DATEI="${2:-/opt/supabase/.env}"
[[ "$NAME" =~ ^[A-Z][A-Z0-9_]*$ ]] || { echo "Ungültiger Name: $NAME"; exit 1; }
[ -f "$DATEI" ] || { echo "Datei fehlt: $DATEI"; exit 1; }

printf 'Wert für %s einfügen und Eingabetaste drücken (Eingabe bleibt unsichtbar): ' "$NAME"
IFS= read -rs WERT
echo
[ -n "$WERT" ] || { echo "Leere Eingabe, nichts geändert."; exit 1; }

umask 077
TMP="$(mktemp "${DATEI}.XXXXXX")"
grep -v "^${NAME}=" "$DATEI" > "$TMP" || true
printf '%s=%s\n' "$NAME" "$WERT" >> "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$DATEI"
unset WERT
echo "$NAME ist in $DATEI gesetzt ($(grep -c "^${NAME}=" "$DATEI") Zeile). Damit er gilt, muss der zugehörige Dienst neu gestartet werden."
