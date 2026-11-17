#!/usr/bin/env bash
# Bringt die Mail-Vorlagen aus mail/vorlagen auf den Server (läuft auf dem Mac).
#
#   deploy/mail-vorlagen-einspielen.sh               nur zeigen, was sich ändern würde
#   deploy/mail-vorlagen-einspielen.sh --ausfuehren  einspielen und Anmeldedienst neu starten
#
# Voraussetzungen, die das Skript selbst prüft:
#   1. Die Vorlagen im Repo sind aktuell gebaut und bestehen mail/pruefen.go.
#   2. Bilder und Schrift liegen schon auf culinse.com/mail (also nach dem Push).
#   3. In /opt/supabase/docker-compose.culinse.yml steht beim Dienst auth
#      einmalig "env_file: ./mailer-culinse.env" (siehe mail/LIESMICH.md).
#
# Beim Einspielen: alte Fassung sichern, Dateien kopieren, die Einstellungen
# von docker compose auflösen lassen und mit dem Repo vergleichen. Erst wenn das
# stimmt, startet der Anmeldedienst neu (wenige Sekunden ohne Anmeldung). Stimmt
# es nicht, kommt die alte Fassung zurück und nichts startet neu.
set -euo pipefail
SERVER="${SERVER:-culinse}"
ZIEL=/opt/supabase
MODUS="${1:---probe}"
cd "$(dirname "$0")/.."

MAILS="confirmation recovery magic_link email_change invite reauthentication"

echo "1. Vorlagen im Repo prüfen"
node mail/bauen.mjs >/dev/null
git diff --quiet -- mail/vorlagen mail/text || { echo "   mail/vorlagen ist nicht aktuell gebaut oder nicht committet (git status)."; exit 1; }
go run mail/pruefen.go | tail -1

echo "2. Bilder und Schrift auf culinse.com"
for f in $(grep -ohE 'https://culinse\.com/mail/[a-z-]+\.(jpg|woff2)' mail/vorlagen/*.html | sort -u); do
  CODE="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$f")"
  [ "$CODE" = 200 ] || { echo "   fehlt: $f (HTTP $CODE). Erst pushen und die Auslieferung abwarten."; exit 1; }
done
curl -sI -m 20 https://culinse.com/mail/fraunces-latin.woff2 | grep -qi '^access-control-allow-origin: \*' \
  || { echo "   Der Schrift fehlt die Freigabe Access-Control-Allow-Origin (next.config.ts)."; exit 1; }
echo "   alles erreichbar"

echo "3. Server"
ssh "$SERVER" "grep -q 'mailer-culinse.env' $ZIEL/docker-compose.culinse.yml" \
  || { echo "   In docker-compose.culinse.yml fehlt env_file: ./mailer-culinse.env (einmaliger Schritt, mail/LIESMICH.md)."; exit 1; }
GEAENDERT=0
for m in $MAILS; do
  if ssh "$SERVER" "cat $ZIEL/mail-vorlagen/$m.html 2>/dev/null" | cmp -s - "mail/vorlagen/$m.html"; then echo "   gleich:  $m.html"; else echo "   neu:     $m.html"; GEAENDERT=1; fi
done
if ssh "$SERVER" "cat $ZIEL/mailer-culinse.env 2>/dev/null" | cmp -s - mail/vorlagen/mailer.env; then echo "   gleich:  mailer-culinse.env"; ENV_NEU=0; else echo "   neu:     mailer-culinse.env (Betreffzeilen, Adressen der Vorlagen)"; ENV_NEU=1; GEAENDERT=1; fi

if [ "$GEAENDERT" = 0 ]; then echo "Nichts zu tun."; exit 0; fi
if [ "$MODUS" != "--ausfuehren" ]; then echo "Probe: nichts geändert. Einspielen mit --ausfuehren."; exit 0; fi

echo "4. Einspielen"
SICHERUNG="/root/umzug/mail-vorlagen-$(date +%Y-%m-%d-%H%M%S)"
ssh "$SERVER" "mkdir -p $SICHERUNG && cp -a $ZIEL/mail-vorlagen $SICHERUNG/ && cp -a $ZIEL/docker-compose.culinse.yml $SICHERUNG/ && { cp -a $ZIEL/mailer-culinse.env $SICHERUNG/ 2>/dev/null || true; }"
echo "   alte Fassung: $SERVER:$SICHERUNG"
zurueck() {
  echo "   Abbruch: alte Fassung wird zurückgespielt, der Anmeldedienst läuft unverändert weiter."
  ssh "$SERVER" "cp -a $SICHERUNG/mail-vorlagen/. $ZIEL/mail-vorlagen/ && { cp -a $SICHERUNG/mailer-culinse.env $ZIEL/ 2>/dev/null || rm -f $ZIEL/mailer-culinse.env; }"
  exit 1
}
for m in $MAILS; do scp -q "mail/vorlagen/$m.html" "$SERVER:$ZIEL/mail-vorlagen/$m.html"; done
scp -q mail/vorlagen/mailer.env "$SERVER:$ZIEL/mailer-culinse.env"

# Was docker compose aus der Datei macht, muss Zeichen für Zeichen dem Repo entsprechen.
AUFGELOEST="$(mktemp)"
ssh "$SERVER" "cd $ZIEL && docker compose config --format json auth" > "$AUFGELOEST" || zurueck
AUFGELOEST="$AUFGELOEST" node -e '
  const fs = require("fs");
  const env = JSON.parse(fs.readFileSync(process.env.AUFGELOEST, "utf8")).services.auth.environment;
  let falsch = 0;
  for (const zeile of fs.readFileSync("mail/vorlagen/mailer.env", "utf8").split("\n")) {
    const m = zeile.match(/^([A-Z_]+)=(.*)$/);
    if (!m) continue;
    const soll = m[2].replace(/^"|"$/g, "");
    if (env[m[1]] !== soll) { falsch++; console.log("   weicht ab: " + m[1]); }
  }
  process.exit(falsch ? 1 : 0);
' || zurueck
rm -f "$AUFGELOEST"
echo "   Einstellungen stimmen mit dem Repo überein"

if [ "$ENV_NEU" = 1 ]; then
  ssh "$SERVER" "cd $ZIEL && docker compose up -d auth" 2>&1 | sed 's/^/   /'
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    STATUS="$(ssh "$SERVER" "docker inspect supabase-auth --format '{{.State.Health.Status}}'" 2>/dev/null || true)"
    [ "$STATUS" = healthy ] && break
    sleep 5
  done
  [ "$STATUS" = healthy ] || { echo "   Der Anmeldedienst meldet sich nicht gesund (Stand: $STATUS). Nachsehen: ssh $SERVER docker logs --tail 50 supabase-auth"; exit 1; }
  echo "   Anmeldedienst läuft wieder"
else
  echo "   Nur Vorlagen geändert: Der Anmeldedienst lädt sie binnen 10 Minuten selbst neu."
fi
# Der Dienst muss jede Vorlage unter der eingetragenen Adresse erreichen.
for m in $MAILS; do
  ssh "$SERVER" "docker exec supabase-auth wget -qO- http://mailvorlagen/$m.html" | cmp -s - "mail/vorlagen/$m.html" \
    || { echo "   Der Anmeldedienst erreicht $m.html nicht oder bekommt eine andere Fassung."; exit 1; }
done
echo "   Der Anmeldedienst erreicht alle Vorlagen"
echo "Fertig. Jetzt eine Probe-Mail auslösen (Passwort vergessen auf culinse.com) und im Postfach ansehen."
echo "Fehler beim Laden einer Vorlage stünden hier: ssh $SERVER \"docker logs --since 15m supabase-auth 2>&1 | grep templatemailer\""
