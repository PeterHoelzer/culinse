#!/usr/bin/env bash
# „Mit Apple anmelden“ am eigenen Anmeldedienst: einrichten, Stand zeigen,
# erneuern, abschalten. Anleitung: deploy/APPLE-ANMELDUNG.md.
#
# Aufruf am Mac, im Ordner des Projekts. Das Skript kopiert sich selbst auf den
# Server und läuft dort weiter; Geheimnisse erscheinen nie am Bildschirm.
#
#   deploy/apple-anmeldung.sh stand
#       Liest nur. Zeigt, ob Apple eingeschaltet ist, bis wann der Schlüssel
#       gilt und welche Rücksprung-Adressen der Anmeldedienst erlaubt.
#
#   deploy/apple-anmeldung.sh einrichten ~/Downloads/AuthKey_ABC123DEFG.p8 TEAM_ID [SERVICES_ID]
#       Einmalig. Die .p8-Datei von Apple wandert durch die verschlüsselte
#       Leitung auf den Server. Dort entsteht daraus das „Client Secret“, Apple
#       prüft es, erst dann wird es eingetragen und nur der Anmeldedienst neu
#       gestartet (wenige Sekunden ohne Anmeldung). SERVICES_ID ist ohne Angabe
#       com.culinse.web. Die Key-ID steht im Dateinamen.
#       Nur für den Notfall: ein fünftes Wort „ohne-probe“ (nach der
#       SERVICES_ID) überspringt Apples Vorprüfung, falls Apple sie eines Tages
#       anders beantwortet, obwohl alle Angaben stimmen.
#
#   deploy/apple-anmeldung.sh erneuern
#       Neues Client Secret aus der hinterlegten .p8-Datei. Apple lässt höchstens
#       sechs Monate zu. Der Server macht das von selbst (täglicher Wächter, ab
#       45 Tagen Restlaufzeit); der Befehl ist für den Fall, dass eine Warn-Mail
#       kommt.
#
#   deploy/apple-anmeldung.sh abschalten
#       Schaltet Apple am Anmeldedienst aus. Der Knopf auf der Website
#       verschwindet von selbst (lib/authProviders.ts).
#
# Wo die Werte liegen: in /opt/supabase/.env (nur für root lesbar) als APPLE_…,
# zusammen mit der .p8-Datei (APPLE_P8_B64). Die Datei gehört schon zur
# nächtlichen Sicherung (sicherung.sh) und zu schluessel-sichern.sh. Die
# Zuordnung zu den Einstellungen des Anmeldedienstes (GOTRUE_EXTERNAL_APPLE_…)
# steht in /opt/supabase/docker-compose.culinse.yml, gleich hinter Google.
#
# Vor jeder Änderung: Sicherung beider Dateien nach /root/umzug/apple-anmeldung-…
# Geht etwas schief, kommt die alte Fassung zurück.
set -euo pipefail
umask 077

SERVER="${SERVER:-culinse}"
SUPA="${SUPABASE_DIR:-/opt/supabase}"
ENVD="$SUPA/.env"
YML="$SUPA/docker-compose.culinse.yml"
SERVICES_ID_VORGABE="com.culinse.web"
APPLE_TOKEN_URL="${APPLE_TOKEN_URL:-https://appleid.apple.com/auth/token}"
# Apple erlaubt höchstens 15.777.000 Sekunden (sechs Monate). 180 Tage lassen Luft.
GUELTIG_SEKUNDEN=$((180 * 86400))
ERNEUERN_AB_TAGEN=45
WARNEN_AB_TAGEN=30
SYSTEMD="${SYSTEMD_DIR:-/etc/systemd/system}"
MODUS="${1:-}"

hilfe() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }
abbruch() { echo "Abbruch: $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Teil 1: am Mac. Kopiert das Skript auf den Server und ruft es dort auf.
# ---------------------------------------------------------------------------
if [ ! -f "$ENVD" ]; then
  case "$MODUS" in
    stand|erneuern|abschalten|einrichten) ;;
    *) hilfe; exit 1 ;;
  esac
  HIER="$(cd "$(dirname "$0")" && pwd)"
  ZIEL=/opt/culinse/deploy

  if [ "$MODUS" = einrichten ]; then
    DATEI="${2:-}"; TEAM_ID="${3:-}"; SERVICES_ID="${4:-$SERVICES_ID_VORGABE}"; OHNE="${5:-}"
    [ -z "$OHNE" ] || [ "$OHNE" = ohne-probe ] || abbruch "Das fünfte Wort kann nur „ohne-probe“ sein."
    [ -n "$DATEI" ] && [ -n "$TEAM_ID" ] || abbruch "So geht es: deploy/apple-anmeldung.sh einrichten ~/Downloads/AuthKey_ABC123DEFG.p8 TEAM_ID"
    [ -f "$DATEI" ] || abbruch "Die Datei $DATEI gibt es nicht."
    KEY_ID="$(basename "$DATEI" | sed -n 's/^AuthKey_\([A-Z0-9]\{10\}\)\.p8$/\1/p')"
    [ -n "$KEY_ID" ] || abbruch "Der Dateiname muss so aussehen, wie Apple ihn vergibt: AuthKey_ABC123DEFG.p8 (zehn Zeichen Key-ID). Bitte nicht umbenennen."
    [[ "$TEAM_ID" =~ ^[A-Z0-9]{10}$ ]] || abbruch "Die Team-ID hat zehn Zeichen aus Großbuchstaben und Ziffern (Apple-Entwicklerportal, Mitgliedschaft)."
    [[ "$SERVICES_ID" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]] || abbruch "Die Services-ID sieht nicht nach einer Kennung wie com.culinse.web aus."
    head -1 "$DATEI" | grep -q -- '-----BEGIN PRIVATE KEY-----' || abbruch "$DATEI sieht nicht nach einer .p8-Datei von Apple aus."
  fi

  echo "1. Skript auf den Server bringen ($SERVER:$ZIEL)"
  bash -n "$HIER/apple-anmeldung.sh"
  ssh "$SERVER" "mkdir -p $ZIEL"
  scp -q "$HIER/apple-anmeldung.sh" "$SERVER:$ZIEL/apple-anmeldung.sh"
  ssh "$SERVER" "chmod 700 $ZIEL/apple-anmeldung.sh"

  if [ "$MODUS" = einrichten ]; then
    # Die Überwachung bekommt die Prüfung des Ablaufdatums. Nur ersetzen, wenn
    # auf dem Server nichts steht, was im Projekt fehlt.
    DORT="$(mktemp)"
    ssh "$SERVER" "cat $ZIEL/ueberwachung.sh" > "$DORT" 2>/dev/null || abbruch "ueberwachung.sh ließ sich auf dem Server nicht lesen."
    if cmp -s "$DORT" "$HIER/ueberwachung.sh"; then
      echo "   Überwachung ist schon auf dem Stand des Projekts"
    elif [ "$(diff "$DORT" "$HIER/ueberwachung.sh" | grep -c '^<' || true)" = 0 ]; then
      bash -n "$HIER/ueberwachung.sh"
      ssh "$SERVER" "cp -a $ZIEL/ueberwachung.sh /root/umzug/ueberwachung.sh.vor-apple-\$(date +%Y-%m-%d-%H%M%S)"
      scp -q "$HIER/ueberwachung.sh" "$SERVER:$ZIEL/ueberwachung.sh"
      echo "   Überwachung ergänzt (alte Fassung liegt in /root/umzug)"
    else
      echo "   HINWEIS: ueberwachung.sh auf dem Server enthält Zeilen, die im Projekt fehlen. Nicht ersetzt."
      echo "   Der tägliche Wächter warnt trotzdem; die zweite Warnung über die Überwachung fehlt bis dahin."
    fi
    rm -f "$DORT"
    echo "2. Einrichten auf dem Server"
    ssh "$SERVER" "$ZIEL/apple-anmeldung.sh einrichten $TEAM_ID $KEY_ID $SERVICES_ID $OHNE" < "$DATEI"
    echo
    echo "Die .p8-Datei liegt jetzt auf dem Server (in /opt/supabase/.env, nur für root lesbar)."
    echo "Apple gibt sie kein zweites Mal heraus. Deshalb jetzt noch:"
    echo "   deploy/schluessel-sichern.sh      legt eine Kopie in den Schlüsselbund des Mac"
    echo "Danach kann $DATEI in den Papierkorb."
  else
    echo "2. Auf dem Server: $MODUS"
    ssh "$SERVER" "$ZIEL/apple-anmeldung.sh $MODUS"
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Teil 2: auf dem Server.
# ---------------------------------------------------------------------------
[ -f "$YML" ] || abbruch "$YML fehlt."
for W in node jq curl docker; do command -v "$W" >/dev/null || abbruch "Auf dem Server fehlt das Programm $W."; done

ARBEIT="$(mktemp -d)"
trap 'rm -rf "$ARBEIT"' EXIT

env_lesen() { grep -m1 "^$1=" "$ENVD" | cut -d= -f2- || true; }
env_setzen() { # NAME=WERT …: ersetzt oder ergänzt die Zeilen in der Umgebungsdatei
  local tmp muster="" kv
  for kv in "$@"; do muster="$muster|${kv%%=*}"; done
  tmp="$(mktemp "$ENVD.XXXXXX")"
  grep -v -E "^(${muster#|})=" "$ENVD" > "$tmp" || true
  printf '%s\n' "$@" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$ENVD"
}
pruefsumme() { if command -v sha256sum >/dev/null; then sha256sum; else shasum -a 256; fi | cut -d' ' -f1; }
datum() { date -d "@$1" '+%d.%m.%Y' 2>/dev/null || date -r "$1" '+%d.%m.%Y'; }
resttage() { echo $(( ($1 - $(date +%s)) / 86400 )); }

AUTH_URL="$(env_lesen API_EXTERNAL_URL)"       # https://daten.culinse.com/auth/v1
PROBE="$(env_lesen APPLE_PROBE)"               # „aus“, wenn mit ohne-probe eingerichtet
RUECKSPRUNG="$AUTH_URL/callback"

# Client Secret: ein signiertes Kärtchen (JWT, ES256) mit Team-ID, Key-ID,
# Services-ID und Ablaufdatum. Aufbau nach Apples Anleitung „Creating a client
# secret“. Die Unterschrift muss im Format r||s vorliegen (ieee-p1363), nicht in
# der Verpackung, die openssl liefert.
secret_erzeugen() { # Schlüsseldatei, Team-ID, Key-ID, Services-ID, Beginn, Ablauf
  node -e '
    const crypto = require("crypto"), fs = require("fs");
    const [datei, iss, kid, sub, iat, exp] = process.argv.slice(1);
    const key = crypto.createPrivateKey(fs.readFileSync(datei));
    if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails.namedCurve !== "prime256v1") {
      console.error("Das ist kein Schlüssel der Art, die Apple ausgibt (EC P-256)."); process.exit(1);
    }
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const daten = b64({ alg: "ES256", kid }) + "." +
      b64({ iss, iat: Number(iat), exp: Number(exp), aud: "https://appleid.apple.com", sub });
    const sig = crypto.sign("sha256", Buffer.from(daten), { key, dsaEncoding: "ieee-p1363" });
    process.stdout.write(daten + "." + sig.toString("base64url"));
  ' "$@"
}

# Fragt Apple, ob es das Client Secret annimmt, ohne dass sich jemand anmeldet:
# ein Tausch mit einem erfundenen Code. Antwort „invalid_grant“ heißt: Secret in
# Ordnung, nur der Code ist falsch (so soll es sein). „invalid_client“ heißt:
# Apple lehnt Team-ID, Key-ID, Services-ID oder die Unterschrift ab
# (Apple-Technote TN3107).
apple_probe() { # Services-ID, Datei mit dem Secret
  local antwort fehler
  antwort="$(curl -s -m 30 "$APPLE_TOKEN_URL" \
    --data-urlencode "client_id=$1" --data-urlencode "client_secret@$2" \
    --data-urlencode "code=culinse-probe" --data-urlencode "grant_type=authorization_code" \
    --data-urlencode "redirect_uri=$RUECKSPRUNG" || true)"
  fehler="$(printf '%s' "$antwort" | jq -r '.error // empty' 2>/dev/null || true)"
  case "$fehler" in
    invalid_grant) echo "   Apple nimmt das Client Secret an" ;;
    invalid_client)
      echo "   Apple lehnt das Client Secret ab (invalid_client). Nichts geändert. Häufige Ursachen:"
      echo "   - Team-ID oder Services-ID vertippt (Groß- und Kleinschreibung zählt)"
      echo "   - der Schlüssel ist bei Apple nicht für „Sign in with Apple“ eingeschaltet"
      echo "   - der Schlüssel hängt an einer anderen App-ID als die Services-ID"
      echo "   - die Services-ID ist bei Apple noch nicht gespeichert"
      return 1 ;;
    *) echo "   Unerwartete Antwort von Apple (Fehler: ${fehler:-keiner}, Länge ${#antwort}). Nichts geändert."; return 1 ;;
  esac
}

aufgeloest() { (cd "$SUPA" && docker compose config --format json auth) | jq -S '.services.auth.environment'; }
ohne_apple() { jq -S 'with_entries(select(.key | startswith("GOTRUE_EXTERNAL_APPLE_") | not))'; }

# Trägt die vier Zeilen für Apple gleich hinter der Rücksprung-Zeile von Google
# ein, in derselben Schreibweise und mit demselben Wert für die Rücksprung-Adresse.
zuordnung_eintragen() {
  grep -q 'GOTRUE_EXTERNAL_APPLE_ENABLED' "$YML" && return 0
  [ "$(grep -c '^[[:space:]]*-\{0,1\}[[:space:]]*GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI' "$YML" || true)" = 1 ] || return 1
  awk '
    { print }
    /^[ \t]*(- *)?GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI/ {
      einzug = $0; sub(/[^ \t].*$/, "", einzug)
      rest = $0; sub(/^[ \t]*/, "", rest)
      print einzug "# Mit Apple anmelden (deploy/apple-anmeldung.sh). Die Werte stehen in .env."
      if (rest ~ /^- /) {
        wert = rest; sub(/^- *GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=/, "", wert)
        print einzug "- GOTRUE_EXTERNAL_APPLE_ENABLED=${APPLE_ENABLED:-false}"
        print einzug "- GOTRUE_EXTERNAL_APPLE_CLIENT_ID=${APPLE_CLIENT_ID:-}"
        print einzug "- GOTRUE_EXTERNAL_APPLE_SECRET=${APPLE_SECRET:-}"
        print einzug "- GOTRUE_EXTERNAL_APPLE_REDIRECT_URI=" wert
      } else {
        wert = rest; sub(/^GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI:[ \t]*/, "", wert)
        print einzug "GOTRUE_EXTERNAL_APPLE_ENABLED: \"${APPLE_ENABLED:-false}\""
        print einzug "GOTRUE_EXTERNAL_APPLE_CLIENT_ID: \"${APPLE_CLIENT_ID:-}\""
        print einzug "GOTRUE_EXTERNAL_APPLE_SECRET: \"${APPLE_SECRET:-}\""
        print einzug "GOTRUE_EXTERNAL_APPLE_REDIRECT_URI: " wert
      }
    }' "$YML" > "$ARBEIT/yml" || return 1
  [ "$(grep -c 'GOTRUE_EXTERNAL_APPLE_' "$ARBEIT/yml" || true)" = 4 ] || return 1
  cat "$ARBEIT/yml" > "$YML"
}

SICHERUNG=""
NEU_GESTARTET=0
sichern() {
  SICHERUNG="/root/umzug/apple-anmeldung-$(date +%Y-%m-%d-%H%M%S)"
  [ -d /root/umzug ] || SICHERUNG="$SUPA/apple-anmeldung-sicherung-$(date +%Y-%m-%d-%H%M%S)"
  mkdir -p "$SICHERUNG"; chmod 700 "$SICHERUNG"
  cp -p "$ENVD" "$SICHERUNG/env"; cp -p "$YML" "$SICHERUNG/docker-compose.culinse.yml"
  echo "   alte Fassung: $SICHERUNG"
}
zurueck() {
  echo "   Die alte Fassung kommt zurück."
  cp -p "$SICHERUNG/env" "$ENVD"; cp -p "$SICHERUNG/docker-compose.culinse.yml" "$YML"
  if [ "$NEU_GESTARTET" = 1 ]; then
    (cd "$SUPA" && docker compose up -d auth) 2>&1 | sed 's/^/   /'
    echo "   Der Anmeldedienst läuft wieder mit den alten Einstellungen."
  else
    echo "   Der Anmeldedienst lief die ganze Zeit unverändert weiter."
  fi
  exit 1
}

neustart_und_pruefen() { # erwarteter Zustand: true oder false
  local soll="$1" status="" i ziel anon gemeldet
  (cd "$SUPA" && docker compose up -d auth) 2>&1 | sed 's/^/   /'
  NEU_GESTARTET=1
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18; do
    status="$(docker inspect supabase-auth --format '{{.State.Health.Status}}' 2>/dev/null || true)"
    [ "$status" = healthy ] && break
    sleep 5
  done
  [ "$status" = healthy ] || { echo "   Der Anmeldedienst meldet sich nicht gesund (Stand: ${status:-unbekannt})."; zurueck; }
  echo "   Anmeldedienst läuft wieder"
  anon="$(env_lesen ANON_KEY)"
  gemeldet="$(curl -s -m 20 "$AUTH_URL/settings" -H "apikey: $anon" | jq -r '.external.apple' 2>/dev/null || true)"
  [ "$gemeldet" = "$soll" ] || { echo "   Der Anmeldedienst meldet Apple als „${gemeldet:-keine Antwort}“, erwartet war „$soll“."; zurueck; }
  echo "   Der Anmeldedienst meldet: Apple $([ "$soll" = true ] && echo eingeschaltet || echo ausgeschaltet)"
  if [ "$soll" = true ]; then
    ziel="$(curl -s -m 20 -o /dev/null -w '%{redirect_url}' "$AUTH_URL/authorize?provider=apple" || true)"
    case "$ziel" in
      https://appleid.apple.com/auth/authorize\?*"client_id=$(env_lesen APPLE_CLIENT_ID)"*) echo "   Die Weiterleitung führt zu Apple, mit der richtigen Services-ID" ;;
      *) echo "   Die Weiterleitung zu Apple stimmt nicht (Ziel beginnt mit: $(printf '%s' "$ziel" | cut -c1-60))."; zurueck ;;
    esac
  fi
}

einstellungen_pruefen() { # Prüfsumme der übrigen Einstellungen vorher, erwartetes Secret (Datei) oder leer
  local jetzt; jetzt="$(aufgeloest)" || { echo "   docker compose kann die Einstellungen nicht lesen."; zurueck; }
  [ "$(printf '%s' "$jetzt" | ohne_apple | pruefsumme)" = "$1" ] || { echo "   Andere Einstellungen des Anmeldedienstes hätten sich mit geändert."; zurueck; }
  [ "$(printf '%s' "$jetzt" | jq -r '.GOTRUE_EXTERNAL_APPLE_REDIRECT_URI')" = "$RUECKSPRUNG" ] || { echo "   Die Rücksprung-Adresse für Apple ist nicht $RUECKSPRUNG."; zurueck; }
  [ "$(printf '%s' "$jetzt" | jq -r '.GOTRUE_EXTERNAL_APPLE_CLIENT_ID')" = "$(env_lesen APPLE_CLIENT_ID)" ] || { echo "   Die Services-ID ist beim Anmeldedienst nicht angekommen."; zurueck; }
  [ "$(printf '%s' "$jetzt" | jq -r '.GOTRUE_EXTERNAL_APPLE_ENABLED')" = "$(env_lesen APPLE_ENABLED)" ] || { echo "   Der Schalter für Apple ist beim Anmeldedienst nicht angekommen."; zurueck; }
  if [ -n "${2:-}" ]; then
    [ "$(printf '%s' "$jetzt" | jq -j '.GOTRUE_EXTERNAL_APPLE_SECRET' | pruefsumme)" = "$(pruefsumme < "$2")" ] || { echo "   Das Client Secret ist beim Anmeldedienst nicht unverändert angekommen."; zurueck; }
  fi
  echo "   Einstellungen stimmen; alles andere am Anmeldedienst ist unverändert"
}

mail_senden() { # Betreff, Text. Gleicher Weg wie ueberwachung.sh (Resend).
  local key an von
  local einstellungen="${UEBERWACHUNG_ENV:-/etc/culinse-ueberwachung.env}"
  [ -f "$einstellungen" ] || { echo "   keine Mail: $einstellungen fehlt"; return 0; }
  an="$(grep -m1 '^MELDE_AN=' "$einstellungen" | cut -d= -f2- | tr -d '"')"
  von="Culinse Server <noreply@culinse.com>"
  key="$(env_lesen SMTP_PASS)"
  jq -n --arg from "$von" --arg to "$an" --arg s "$1" --arg t "$2" '{from:$from,to:[$to],subject:$s,text:$t}' \
    | curl -s -m 20 -o /dev/null -w '   Mail: HTTP %{http_code}\n' -X POST https://api.resend.com/emails \
        -H "Authorization: Bearer $key" -H 'Content-Type: application/json' --data-binary @-
}

waechter_einrichten() {
  [ -d "$SYSTEMD" ] || { echo "   kein systemd gefunden, Wächter nicht eingerichtet"; return 0; }
  cat > "$SYSTEMD/culinse-apple.service" <<EOF
[Unit]
Description=Culinse: Client Secret der Apple-Anmeldung rechtzeitig erneuern

[Service]
Type=oneshot
ExecStart=$(readlink -f "$0" 2>/dev/null || echo "$0") waechter
EOF
  cat > "$SYSTEMD/culinse-apple.timer" <<'EOF'
[Unit]
Description=Culinse: Apple-Anmeldung täglich prüfen

[Timer]
OnCalendar=*-*-* 04:40:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
  chmod 644 "$SYSTEMD/culinse-apple.service" "$SYSTEMD/culinse-apple.timer"
  systemctl daemon-reload
  systemctl enable --now culinse-apple.timer >/dev/null 2>&1 \
    || { echo "   HINWEIS: Der Zeitplan culinse-apple.timer ließ sich nicht einschalten. Dann erinnert nur die Überwachung."; return 0; }
  echo "   Wächter eingerichtet: täglich 04:40 Uhr, erneuert ab $ERNEUERN_AB_TAGEN Tagen Restlaufzeit von selbst"
}

secret_tauschen() { # Schlüsseldatei, Team-ID, Key-ID, Services-ID, weitere NAME=WERT für .env
  local datei="$1" team="$2" kid="$3" sub="$4"; shift 4
  local jetzt ablauf vorher
  jetzt="$(date +%s)"; ablauf=$((jetzt + GUELTIG_SEKUNDEN))
  echo "a) Client Secret erzeugen (gültig bis $(datum "$ablauf"))"
  secret_erzeugen "$datei" "$team" "$kid" "$sub" "$jetzt" "$ablauf" > "$ARBEIT/secret" || abbruch "Das Client Secret ließ sich nicht erzeugen. Nichts geändert."
  [ "$(tr -cd '.' < "$ARBEIT/secret" | wc -c | tr -d ' ')" = 2 ] || abbruch "Das erzeugte Client Secret hat nicht die erwartete Form. Nichts geändert."
  echo "b) Apple fragen, ob es gilt"
  if [ "$PROBE" = aus ]; then
    echo "   übersprungen (ohne-probe). Ob Apple das Client Secret annimmt, zeigt erst eine echte Anmeldung."
  else
    apple_probe "$sub" "$ARBEIT/secret" || exit 1
  fi
  echo "c) Eintragen"
  vorher="$(aufgeloest | ohne_apple | pruefsumme)"
  sichern
  env_setzen "APPLE_ENABLED=true" "APPLE_CLIENT_ID=$sub" "APPLE_SECRET=$(cat "$ARBEIT/secret")" "APPLE_SECRET_ABLAUF=$ablauf" "$@"
  if ! zuordnung_eintragen; then
    echo "   In $YML fehlt die Zeile GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI (oder sie steht mehrfach da)."
    echo "   Dann bitte beim Dienst auth unter environment von Hand eintragen und noch einmal starten:"
    echo '     GOTRUE_EXTERNAL_APPLE_ENABLED: "${APPLE_ENABLED:-false}"'
    echo '     GOTRUE_EXTERNAL_APPLE_CLIENT_ID: "${APPLE_CLIENT_ID:-}"'
    echo '     GOTRUE_EXTERNAL_APPLE_SECRET: "${APPLE_SECRET:-}"'
    echo '     GOTRUE_EXTERNAL_APPLE_REDIRECT_URI: ${API_EXTERNAL_URL}/callback'
    zurueck
  fi
  einstellungen_pruefen "$vorher" "$ARBEIT/secret"
  echo "d) Anmeldedienst neu starten (wenige Sekunden ohne Anmeldung)"
  neustart_und_pruefen true
}

erneuern() {
  local p8; p8="$(env_lesen APPLE_P8_B64)"
  [ -n "$p8" ] || abbruch "Apple ist nicht eingerichtet (keine .p8-Datei hinterlegt). Erst: deploy/apple-anmeldung.sh einrichten …"
  printf '%s' "$p8" | base64 -d > "$ARBEIT/schluessel.p8"
  secret_tauschen "$ARBEIT/schluessel.p8" "$(env_lesen APPLE_TEAM_ID)" "$(env_lesen APPLE_KEY_ID)" "$(env_lesen APPLE_CLIENT_ID)"
}

case "$MODUS" in
  einrichten)
    TEAM_ID="${2:-}"; KEY_ID="${3:-}"; SERVICES_ID="${4:-$SERVICES_ID_VORGABE}"
    PROBE=an; [ "${5:-}" != ohne-probe ] || PROBE=aus
    [[ "$TEAM_ID" =~ ^[A-Z0-9]{10}$ ]] || abbruch "Team-ID fehlt oder hat nicht zehn Zeichen."
    [[ "$KEY_ID" =~ ^[A-Z0-9]{10}$ ]] || abbruch "Key-ID fehlt oder hat nicht zehn Zeichen."
    [[ "$SERVICES_ID" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ ]] || abbruch "Die Services-ID sieht nicht nach einer Kennung wie com.culinse.web aus."
    [[ "$AUTH_URL" =~ ^https://[^/]+/auth/v1$ ]] || abbruch "API_EXTERNAL_URL in $ENVD hat nicht die Form https://…/auth/v1."
    [ ! -t 0 ] || abbruch "Die .p8-Datei muss über die Leitung kommen. Am Mac starten: deploy/apple-anmeldung.sh einrichten DATEI TEAM_ID"
    cat > "$ARBEIT/schluessel.p8"
    grep -q -- '-----BEGIN PRIVATE KEY-----' "$ARBEIT/schluessel.p8" || abbruch "Was ankam, ist keine .p8-Datei. Nichts geändert."
    echo "Services-ID: $SERVICES_ID · Team-ID: $TEAM_ID · Key-ID: $KEY_ID"
    echo "Rücksprung-Adresse (muss bei Apple genau so eingetragen sein): $RUECKSPRUNG"
    secret_tauschen "$ARBEIT/schluessel.p8" "$TEAM_ID" "$KEY_ID" "$SERVICES_ID" \
      "APPLE_TEAM_ID=$TEAM_ID" "APPLE_KEY_ID=$KEY_ID" "APPLE_PROBE=$PROBE" "APPLE_P8_B64=$(base64 < "$ARBEIT/schluessel.p8" | tr -d '\n')"
    echo "e) Erneuerung dem Server überlassen"
    waechter_einrichten
    echo
    echo "Fertig. „Mit Apple anmelden“ ist am Anmeldedienst eingeschaltet, gültig bis $(datum "$(env_lesen APPLE_SECRET_ABLAUF)")."
    echo "Der Knopf erscheint auf culinse.com/de/login, sobald der Stand mit dem Knopf ausgeliefert ist."
    ;;

  erneuern)
    erneuern
    echo
    echo "Fertig. Das neue Client Secret gilt bis $(datum "$(env_lesen APPLE_SECRET_ABLAUF)")."
    ;;

  waechter)
    # Täglich vom Zeitplan gestartet. Still, solange nichts zu tun ist.
    [ "$(env_lesen APPLE_ENABLED)" = true ] || exit 0
    ABLAUF="$(env_lesen APPLE_SECRET_ABLAUF)"
    [[ "$ABLAUF" =~ ^[0-9]+$ ]] || ABLAUF=0
    REST="$(resttage "$ABLAUF")"
    [ "$REST" -le "$ERNEUERN_AB_TAGEN" ] || exit 0
    echo "[$(date '+%d.%m.%Y %H:%M')] Client Secret läuft in $REST Tagen ab, wird erneuert"
    # Als eigener Lauf, damit dort jeder Fehler sofort abbricht.
    if bash "$0" erneuern > "$ARBEIT/lauf.txt" 2>&1; then
      cat "$ARBEIT/lauf.txt"
      echo "Erneuert, gültig bis $(datum "$(env_lesen APPLE_SECRET_ABLAUF)")."
      exit 0
    fi
    cat "$ARBEIT/lauf.txt"
    if [ "$REST" -le "$WARNEN_AB_TAGEN" ]; then
      mail_senden "Culinse-Server: Apple-Anmeldung braucht ein neues Client Secret" \
"Das Client Secret für „Mit Apple anmelden“ läuft in $REST Tagen ab (am $(datum "$ABLAUF")). Die automatische Erneuerung ist gescheitert. Danach können sich Besucher nicht mehr mit Apple anmelden; alles andere läuft weiter.

Am Mac im Projektordner: deploy/apple-anmeldung.sh erneuern

Ausgabe des gescheiterten Versuchs:
$(cat "$ARBEIT/lauf.txt")"
    fi
    exit 1
    ;;

  abschalten)
    [ -n "$(env_lesen APPLE_ENABLED)" ] || abbruch "Apple ist nicht eingerichtet, es gibt nichts abzuschalten."
    VORHER="$(aufgeloest | ohne_apple | pruefsumme)"
    sichern
    env_setzen "APPLE_ENABLED=false"
    einstellungen_pruefen "$VORHER"
    neustart_und_pruefen false
    echo "Apple ist abgeschaltet, der Knopf auf der Website verschwindet von selbst. Wieder einschalten: deploy/apple-anmeldung.sh erneuern"
    ;;

  stand)
    echo "Anmeldedienst:            $AUTH_URL"
    echo "Rücksprung von Apple:     $RUECKSPRUNG"
    echo "Adresse der Website:      $(env_lesen SITE_URL)"
    echo "Weitere erlaubte Ziele:   $(env_lesen ADDITIONAL_REDIRECT_URLS)"
    echo "Google eingeschaltet:     $(env_lesen GOOGLE_ENABLED)"
    echo "Apple eingeschaltet:      $(env_lesen APPLE_ENABLED | grep . || echo "nein (noch nicht eingerichtet)")"
    if [ -n "$(env_lesen APPLE_ENABLED)" ]; then
      ABLAUF="$(env_lesen APPLE_SECRET_ABLAUF)"
      echo "Services-ID:              $(env_lesen APPLE_CLIENT_ID)"
      echo "Team-ID / Key-ID:         $(env_lesen APPLE_TEAM_ID) / $(env_lesen APPLE_KEY_ID)"
      echo "Client Secret:            $([ -n "$(env_lesen APPLE_SECRET)" ] && echo "vorhanden (Länge $(env_lesen APPLE_SECRET | tr -d '\n' | wc -c | tr -d ' '))" || echo fehlt)"
      echo ".p8-Datei hinterlegt:     $([ -n "$(env_lesen APPLE_P8_B64)" ] && echo ja || echo nein)"
      if [[ "$ABLAUF" =~ ^[0-9]+$ ]]; then echo "Gültig bis:               $(datum "$ABLAUF") (noch $(resttage "$ABLAUF") Tage)"; fi
      echo "Zuordnung in der Compose-Datei: $(grep -c 'GOTRUE_EXTERNAL_APPLE_' "$YML" || true) Zeilen"
      echo "Täglicher Wächter:        $(systemctl is-active culinse-apple.timer 2>/dev/null || echo "nicht eingerichtet")"
    fi
    ANON="$(env_lesen ANON_KEY)"
    echo "Der Dienst meldet selbst: Apple $(curl -s -m 20 "$AUTH_URL/settings" -H "apikey: $ANON" | jq -r '.external.apple' 2>/dev/null || echo "keine Antwort"), Google $(curl -s -m 20 "$AUTH_URL/settings" -H "apikey: $ANON" | jq -r '.external.google' 2>/dev/null || echo "keine Antwort")"
    ;;

  *) hilfe; exit 1 ;;
esac
