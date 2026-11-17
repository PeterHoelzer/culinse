#!/usr/bin/env bash
# Nächtliche Sicherung des eigenen Servers: zuerst auf die Platte des Servers,
# zusätzlich (sobald eingerichtet) an einen zweiten Ort (Cloudflare R2).
#
# Sichert: 1) die ganze Datenbank als verschlüsselte Datei, 2) den Bildspeicher
# als tägliche, platzsparende Stände (rsync --link-dest, Hardlinks auf den Vortag),
# 3) die Server-Einstellungen (.env-Dateien, Proxy-Regeln) verschlüsselt in einem tar.
#
# Ablage lokal: /var/backups/culinse/ (nur root, Modus 700)
#   datenbank/culinse-db-<Zeit>.sql.gz.gpg
#   bilder/<Datum>/                    jeder Stand sieht aus wie ein Vollstand
#   konfiguration/culinse-konfig-<Zeit>.tar.gpg
#   letzter-lauf.txt                   für die Überwachung: Zeit, ok|fehler, Größe der Datenbank-Datei
#
# Einstellungen stehen in /etc/culinse-sicherung.env (nur für root lesbar):
#   DB_CONTAINER=supabase-db            Name des Postgres-Containers
#   DB_NUTZER=supabase_admin
#   BILDER_ORDNER=/opt/supabase/volumes/storage
#   PASSWORT_DATEI=/root/.sicherung-passwort
#   RCLONE_ZIEL=                        leer = nur lokal; sonst z. B. r2:culinse-sicherung
#   AUFBEWAHREN_LOKAL_TAGE=7            wie viele tägliche Stände lokal bleiben
#   AUFBEWAHREN_TAGE=30                 Aufbewahrung am zweiten Ort (nur mit RCLONE_ZIEL)
#   MELDE_URL=                          optional: Adresse, die nach Erfolg aufgerufen wird
#
# Einrichten als tägliche Aufgabe: systemd-Timer culinse-sicherung.timer (03:15 Uhr),
# Protokoll in /var/log/culinse-sicherung.log.
#
# Wiederherstellen (Probe mindestens vierteljährlich, geht automatisch mit sicherung-pruefen.sh):
#   gpg --batch --passphrase-file /root/.sicherung-passwort -d <datei>.sql.gz.gpg | gunzip > alles.sql
set -euo pipefail
. /etc/culinse-sicherung.env

: "${DB_CONTAINER:?}" "${DB_NUTZER:?}" "${BILDER_ORDNER:?}" "${PASSWORT_DATEI:?}"
RCLONE_ZIEL="${RCLONE_ZIEL:-}"
LOKAL_STAENDE="${AUFBEWAHREN_LOKAL_TAGE:-7}"
TAGE="${AUFBEWAHREN_TAGE:-30}"
ORDNER=/var/backups/culinse
STATUS="$ORDNER/letzter-lauf.txt"
STEMPEL="$(date +%Y-%m-%d_%H%M)"
HEUTE="$(date +%Y-%m-%d)"
DB_DATEI="$ORDNER/datenbank/culinse-db-$STEMPEL.sql.gz.gpg"
KONFIG_DATEI="$ORDNER/konfiguration/culinse-konfig-$STEMPEL.tar.gpg"
KONFIG_PFADE=(opt/supabase/.env opt/supabase/docker-compose.culinse.yml data/coolify/source/.env data/coolify/proxy/dynamic)
START=$SECONDS
DB_GROESSE=0
umask 077

mkdir -p "$ORDNER/datenbank" "$ORDNER/bilder" "$ORDNER/konfiguration"
chmod 700 "$ORDNER"

# Statusdatei bei jedem Ende schreiben, auch bei Fehlern (die liest die Überwachung)
beim_ende() {
  local rc=$?
  local urteil=ok
  [ "$rc" -eq 0 ] || urteil=fehler
  printf '%s %s %s\n' "$(date -Is)" "$urteil" "$DB_GROESSE" > "$STATUS.neu" && mv -f "$STATUS.neu" "$STATUS"
  [ "$rc" -eq 0 ] || echo "[$(date -Is)] FEHLER: Sicherung abgebrochen (Rückgabewert $rc)"
}
trap beim_ende EXIT

# Alle Stände außer den neuesten $2 in Ordner $1 löschen (Namen sortieren nach Zeit)
nur_neueste_behalten() {
  local ordner="$1" anzahl="$2" eintrag
  # Schutz: nur unterhalb des Sicherungsordners löschen, nie mit leerem Pfad.
  case "$ordner" in /var/backups/culinse/?*) ;; *) echo "FEHLER: Löschen außerhalb von /var/backups/culinse verweigert: '$ordner'"; return 1 ;; esac
  [[ "$anzahl" =~ ^[1-9][0-9]*$ ]] || { echo "FEHLER: ungültige Anzahl '$anzahl'"; return 1; }
  while IFS= read -r eintrag; do
    [ -n "$eintrag" ] && rm -rf -- "$ordner/$eintrag"
  done < <(ls -1 "$ordner" | sort | head -n "-$anzahl")
}

echo "[$(date -Is)] Sicherung beginnt"
[ -s "$PASSWORT_DATEI" ] || { echo "FEHLER: Passwort-Datei $PASSWORT_DATEI fehlt oder ist leer"; exit 1; }
if [ -z "$RCLONE_ZIEL" ]; then
  echo "[$(date -Is)] HINWEIS: kein Ziel außerhalb des Servers eingerichtet (RCLONE_ZIEL leer), es wird nur lokal gesichert"
fi

# 1) Datenbank: alles in einer Datei, gepackt und verschlüsselt (enthält die Konten)
docker exec "$DB_CONTAINER" pg_dumpall -h localhost -U "$DB_NUTZER" </dev/null \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSWORT_DATEI" -o "$DB_DATEI.teil"
mv -f "$DB_DATEI.teil" "$DB_DATEI"

DB_GROESSE=$(stat -c %s "$DB_DATEI")
# Eine auffällig kleine Datei heißt: der Abzug ist gescheitert.
if [ "$DB_GROESSE" -lt 1000000 ]; then
  echo "FEHLER: Datenbank-Sicherung nur $DB_GROESSE Bytes"
  exit 1
fi
echo "[$(date -Is)] Datenbank gesichert: $(basename "$DB_DATEI"), $((DB_GROESSE / 1024 / 1024)) MB"

# 2) Einstellungen des Servers (klein, aber ohne sie ist die Wiederherstellung mühsam)
# Dazu gehört die Datenbank von Coolify: Nur dort stehen die Variablen der
# Website (etwa die Stripe-Schlüssel) und alle Einstellungen der Anwendung. Die
# Werte sind darin mit dem APP_KEY aus data/coolify/source/.env verschlüsselt,
# der ebenfalls in diesem Paket liegt. Der Abzug liegt nur während des Packens
# unverschlüsselt im Sicherungsordner.
COOLIFY_ABZUG="$ORDNER/coolify-datenbank.sql.gz"
trap 'rm -f "$COOLIFY_ABZUG"; beim_ende' EXIT
ZUSATZ=()
if docker ps --format '{{.Names}}' </dev/null | grep -qx coolify-db; then
  docker exec coolify-db pg_dump -U coolify -d coolify </dev/null | gzip -9 > "$COOLIFY_ABZUG"
  COOLIFY_GROESSE=$(stat -c %s "$COOLIFY_ABZUG")
  [ "$COOLIFY_GROESSE" -gt 20000 ] || { echo "FEHLER: Abzug der Coolify-Datenbank nur $COOLIFY_GROESSE Bytes"; exit 1; }
  ZUSATZ=(-C "$ORDNER" "$(basename "$COOLIFY_ABZUG")")
  echo "[$(date -Is)] Coolify-Datenbank abgezogen: $COOLIFY_GROESSE Bytes"
else
  echo "[$(date -Is)] HINWEIS: Container coolify-db läuft nicht, Coolify-Datenbank nicht gesichert"
fi
tar -C / -cf - "${KONFIG_PFADE[@]}" "${ZUSATZ[@]}" \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSWORT_DATEI" -o "$KONFIG_DATEI.teil"
mv -f "$KONFIG_DATEI.teil" "$KONFIG_DATEI"
rm -f "$COOLIFY_ABZUG"
KONFIG_GROESSE=$(stat -c %s "$KONFIG_DATEI")
[ "$KONFIG_GROESSE" -gt 0 ] || { echo "FEHLER: Einstellungs-Sicherung ist leer"; exit 1; }
echo "[$(date -Is)] Einstellungen gesichert: $(basename "$KONFIG_DATEI"), $KONFIG_GROESSE Bytes"

# 3) Bilder: täglicher Stand, unveränderte Dateien sind Hardlinks auf den letzten Stand
VORHER="$(ls -1 "$ORDNER/bilder" | sort | grep -v "^$HEUTE\$" | tail -n 1 || true)"
LINK=()
[ -z "$VORHER" ] || LINK=(--link-dest="$ORDNER/bilder/$VORHER")
rsync -a "${LINK[@]}" "$BILDER_ORDNER"/ "$ORDNER/bilder/$HEUTE/"
BILDER_ANZAHL=$(find "$ORDNER/bilder/$HEUTE" -type f | wc -l)
BILDER_GROESSE=$(du -sh "$ORDNER/bilder/$HEUTE" | cut -f1)
echo "[$(date -Is)] Bilder gesichert: Stand $HEUTE, $BILDER_ANZAHL Dateien, $BILDER_GROESSE (Vorgänger: ${VORHER:-keiner})"

# 4) Zweiter Ort (nur wenn eingerichtet)
if [ -n "$RCLONE_ZIEL" ]; then
  rclone copy "$DB_DATEI" "$RCLONE_ZIEL/datenbank/"
  rclone copy "$KONFIG_DATEI" "$RCLONE_ZIEL/konfiguration/"
  # nur Neues und Geändertes; am Ziel wird nichts gelöscht
  rclone copy "$BILDER_ORDNER" "$RCLONE_ZIEL/bilder/" --transfers 8
  rclone delete "$RCLONE_ZIEL/datenbank/" --min-age "${TAGE}d"
  rclone delete "$RCLONE_ZIEL/konfiguration/" --min-age "${TAGE}d"
  echo "[$(date -Is)] Zweiter Ort aktualisiert: $RCLONE_ZIEL"
fi

# 5) Aufräumen: lokal nur die neuesten $LOKAL_STAENDE Stände
nur_neueste_behalten "$ORDNER/datenbank" "$LOKAL_STAENDE"
nur_neueste_behalten "$ORDNER/konfiguration" "$LOKAL_STAENDE"
nur_neueste_behalten "$ORDNER/bilder" "$LOKAL_STAENDE"

DAUER=$((SECONDS - START))
echo "[$(date -Is)] Sicherung fertig: Datenbank $((DB_GROESSE / 1024 / 1024)) MB, Einstellungen $KONFIG_GROESSE Bytes, Bilder $BILDER_ANZAHL Dateien ($BILDER_GROESSE), Dauer ${DAUER} s"
if [ -n "${MELDE_URL:-}" ]; then curl -fsS -m 10 "$MELDE_URL" > /dev/null || true; fi
