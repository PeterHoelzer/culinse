#!/bin/bash
# Probe am Mac: Lässt sich die abgeholte Datenbank-Sicherung ohne den Server
# öffnen? Entschlüsselt die neueste Datei mit dem Passwort aus dem Schlüsselbund
# und zählt, was drin ist. Es entsteht keine Klartext-Datei; alles läuft durch
# eine Leitung.
#
# Braucht: gpg (brew install gnupg) und den Schlüsselbund-Eintrag
# "Culinse Server Datei: /root/.sicherung-passwort" (von schluessel-sichern.sh).
#
#   deploy/sicherung-am-mac-pruefen.sh [Datei]
#
# Wirklich wiederherstellen (wenn der Server weg ist): dieselbe Leitung, aber
# statt zu zählen in eine Datei schreiben und auf einem neuen Server mit
# supabase-db einspielen, siehe sicherung-pruefen.sh.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
ORDNER="${ZIEL:-/Volumes/Dateien/Culinse-Sicherung}/datenbank"
DATEI="${1:-$ORDNER/$(ls -1 "$ORDNER" | sort | tail -1)}"
[ -f "$DATEI" ] || { echo "Keine Sicherungsdatei gefunden: $DATEI"; exit 1; }
command -v gpg >/dev/null || { echo "gpg fehlt (brew install gnupg)"; exit 1; }
security find-generic-password -a culinse-server -s "Culinse Server Datei: /root/.sicherung-passwort" >/dev/null 2>&1 \
  || { echo "Passwort fehlt im Schlüsselbund (deploy/schluessel-sichern.sh laufen lassen)"; exit 1; }

echo "Datei: $(basename "$DATEI") ($(stat -f %z "$DATEI") Bytes)"
START=$(date +%s)
# Das Passwort geht über einen eigenen Kanal (3) direkt an gpg und erscheint nirgends.
ERGEBNIS="$(gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 -d "$DATEI" \
    3< <(security find-generic-password -a culinse-server -s "Culinse Server Datei: /root/.sicherung-passwort" -w | base64 -d) \
  | gunzip \
  | awk '
      /^COPY / { tabelle=$2; inkopie=1; next }
      inkopie && /^\\\.$/ { inkopie=0; next }
      inkopie { zeilen[tabelle]++; next }
      /^CREATE TABLE / { tabellen++ }
      /^CREATE ROLE / { rollen++ }
      { bytes += length($0) + 1 }
      END {
        printf "tabellen=%d rollen=%d\n", tabellen, rollen
        printf "public.user_recipes=%d\nauth.users=%d\nstorage.objects=%d\npublic.saved_recipes=%d\n", zeilen["public.user_recipes"], zeilen["auth.users"], zeilen["storage.objects"], zeilen["public.saved_recipes"]
      }')"
RC=("${PIPESTATUS[@]}")
[ -n "$ERGEBNIS" ] || { echo "ERGEBNIS: Öffnen fehlgeschlagen (falsches Passwort oder beschädigte Datei)"; exit 1; }
echo "$ERGEBNIS" | sed 's/^/  /'
echo "Dauer: $(( $(date +%s) - START )) s"
REZEPTE="$(echo "$ERGEBNIS" | sed -n 's/^public.user_recipes=//p')"
if [ "${REZEPTE:-0}" -gt 1000 ]; then echo "ERGEBNIS: Die Sicherung lässt sich am Mac öffnen und enthält die Daten."; else echo "ERGEBNIS: geöffnet, aber die Rezepte fehlen"; exit 1; fi
