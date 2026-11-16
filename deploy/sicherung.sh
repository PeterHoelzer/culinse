#!/usr/bin/env bash
# Nächtliche Sicherung des eigenen Servers an einen zweiten Ort (Cloudflare R2).
#
# Sichert: 1) die ganze Datenbank als verschlüsselte Datei, 2) den Bildspeicher.
# Einstellungen stehen in /etc/culinse-sicherung.env (nur für root lesbar):
#   DB_CONTAINER=supabase-db            Name des Postgres-Containers
#   DB_NUTZER=supabase_admin
#   BILDER_ORDNER=/opt/supabase/docker/volumes/storage
#   RCLONE_ZIEL=r2:culinse-sicherung     rclone-Ziel (Abschnitt [r2] in rclone.conf)
#   PASSWORT_DATEI=/root/.sicherung-passwort
#   AUFBEWAHREN_TAGE=30
#   MELDE_URL=                           optional: Adresse, die nach Erfolg aufgerufen wird
#
# Einrichten als tägliche Aufgabe:
#   echo '15 3 * * * root /opt/culinse/deploy/sicherung.sh >> /var/log/culinse-sicherung.log 2>&1' > /etc/cron.d/culinse-sicherung
#
# Wiederherstellen (Probe mindestens vierteljährlich):
#   rclone copy "$RCLONE_ZIEL/datenbank/<datei>.sql.gz.gpg" .
#   gpg --batch --passphrase-file /root/.sicherung-passwort -d <datei>.sql.gz.gpg | gunzip > alles.sql
set -euo pipefail
. /etc/culinse-sicherung.env

: "${DB_CONTAINER:?}" "${DB_NUTZER:?}" "${BILDER_ORDNER:?}" "${RCLONE_ZIEL:?}" "${PASSWORT_DATEI:?}"
TAGE="${AUFBEWAHREN_TAGE:-30}"
ORDNER=/root/sicherung
STEMPEL="$(date +%Y-%m-%d_%H%M)"
DATEI="$ORDNER/culinse-db-$STEMPEL.sql.gz.gpg"
umask 077

echo "[$(date -Is)] Sicherung beginnt"

# 1) Datenbank: alles in einer Datei, gepackt und verschlüsselt (enthält die Konten)
docker exec "$DB_CONTAINER" pg_dumpall -h localhost -U "$DB_NUTZER" \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSWORT_DATEI" -o "$DATEI"

GROESSE=$(stat -c %s "$DATEI")
# Eine auffällig kleine Datei heißt: der Abzug ist gescheitert.
if [ "$GROESSE" -lt 1000000 ]; then
  echo "FEHLER: Datenbank-Sicherung nur $GROESSE Bytes"
  exit 1
fi
rclone copy "$DATEI" "$RCLONE_ZIEL/datenbank/"

# 2) Bilder: nur Neues und Geändertes; am Ziel wird nichts gelöscht
rclone copy "$BILDER_ORDNER" "$RCLONE_ZIEL/bilder/" --transfers 8

# 3) Aufräumen: lokal 7 Tage, am zweiten Ort $TAGE Tage
find "$ORDNER" -name 'culinse-db-*.sql.gz.gpg' -mtime +7 -delete
rclone delete "$RCLONE_ZIEL/datenbank/" --min-age "${TAGE}d"

echo "[$(date -Is)] Sicherung fertig: $(basename "$DATEI"), $((GROESSE / 1024 / 1024)) MB"
[ -n "${MELDE_URL:-}" ] && curl -fsS -m 10 "$MELDE_URL" > /dev/null || true
