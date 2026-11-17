#!/usr/bin/env bash
# Setzt für das Verwalterkonto von Coolify ein neues, zufälliges Anmeldepasswort,
# legt es im Schlüsselbund des Mac ab und kopiert es in die Zwischenablage.
# Läuft auf dem Mac. Das Passwort wird nirgends angezeigt und muss nie getippt
# werden; am Server kommt nur sein Hash an.
#
#   deploy/coolify-passwort-neu.sh            neues Passwort setzen
#   deploy/coolify-passwort-neu.sh --probe    nur prüfen, ob der Weg funktioniert
#   deploy/coolify-passwort-neu.sh --holen    gespeichertes Passwort in die Zwischenablage
#
# Schlüsselbund-Eintrag: "Culinse Server: COOLIFY_ANMELDUNG" (Konto culinse-server).
# Danach in Coolify mit der Mail-Adresse und Einfügen (Cmd+V) anmelden. Andere
# offene Coolify-Sitzungen werden durch den Wechsel abgemeldet.
set -euo pipefail
SERVER="${SERVER:-culinse}"
KONTO="culinse-server"
EINTRAG="Culinse Server: COOLIFY_ANMELDUNG"
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=20 "$SERVER")
MODUS="${1:-}"

if [ "$MODUS" = "--holen" ]; then
  security find-generic-password -a "$KONTO" -s "$EINTRAG" -w | tr -d '\n' | pbcopy
  echo "Das gespeicherte Coolify-Passwort liegt in der Zwischenablage."
  exit 0
fi

# 28 Zeichen aus Buchstaben und Ziffern, dazu zwei feste Sonderzeichen, damit
# auch strenge Passwortregeln erfüllt sind.
PW="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-28)-a9!"
[ "${#PW}" -eq 32 ] || { echo "Das Passwort ließ sich nicht erzeugen."; exit 1; }

# Hash im Coolify-Container bilden (gleiche Bibliothek, die Coolify beim Anmelden prüft).
HASH="$(printf '%s' "$PW" | "${SSH[@]}" 'docker exec -i coolify php -r '"'"'echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT, ["cost" => 12]);'"'"'')"
[[ "$HASH" =~ ^\$2y\$12\$[./A-Za-z0-9]{53}$ ]] || { echo "Der Hash ließ sich nicht bilden."; exit 1; }

# Gegenprobe: Passt das Passwort zum Hash?
PASST="$(printf '%s\n%s' "$HASH" "$PW" | "${SSH[@]}" 'docker exec -i coolify php -r '"'"'$z = explode("\n", stream_get_contents(STDIN), 2); echo password_verify($z[1], $z[0]) ? "ja" : "nein";'"'"'')"
[ "$PASST" = "ja" ] || { echo "Die Gegenprobe ist fehlgeschlagen, nichts geändert."; exit 1; }

if [ "$MODUS" = "--probe" ]; then
  echo "Probe bestanden: Hash gebildet und gegengeprüft (Länge des Passworts ${#PW}). Nichts geändert."
  exit 0
fi

# Erst sichern, dann setzen: So geht das Passwort nicht verloren, falls der zweite Schritt scheitert.
security add-generic-password -U -a "$KONTO" -s "$EINTRAG" -j "Coolify-Anmeldung (Verwalterkonto), gesetzt $(date +%d.%m.%Y)" -w "$PW"
GEAENDERT="$(printf "update users set password = '%s', updated_at = now() where id = 0 returning id;\n" "$HASH" \
  | "${SSH[@]}" 'docker exec -i coolify-db psql -U coolify -d coolify -v ON_ERROR_STOP=1 -At -f -' | head -1)"
[ "$GEAENDERT" = "0" ] || { echo "Das Passwort ließ sich in Coolify nicht setzen. Im Schlüsselbund steht schon das neue; bitte noch einmal starten."; exit 1; }
printf '%s' "$PW" | pbcopy
unset PW HASH
echo "Neues Coolify-Passwort gesetzt, im Schlüsselbund gesichert (\"$EINTRAG\") und in die Zwischenablage kopiert."
echo "In Coolify jetzt mit Cmd+V einfügen. Später wieder holen: deploy/coolify-passwort-neu.sh --holen"
