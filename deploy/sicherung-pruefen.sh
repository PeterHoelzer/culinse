#!/usr/bin/env bash
# Rückspiel-Probe: spielt die neueste lokale Datenbank-Sicherung in einen
# wegwerfbaren Container (gleiches Image wie supabase-db, kein Port, kein Volume)
# und vergleicht die Zeilenzahlen mit dem laufenden System. Das laufende System
# wird nur gelesen. Am Ende sind Container und Klartext-Dateien restlos weg.
#
# Aufruf: /opt/culinse/deploy/sicherung-pruefen.sh   (als root, ca. 1-2 Minuten)
# Rückgabewert 0 = alle Tabellen stimmen überein, sonst 1.
set -euo pipefail
. /etc/culinse-sicherung.env
: "${DB_CONTAINER:?}" "${DB_NUTZER:?}" "${PASSWORT_DATEI:?}"

SICHERUNGEN=/var/backups/culinse/datenbank
PROBE=culinse-rueckspielprobe
TABELLEN=(public.user_recipes auth.users storage.objects)
umask 077
ARBEIT="$(mktemp -d /root/rueckspiel.XXXXXX)"

aufraeumen() {
  docker rm -f "$PROBE" >/dev/null 2>&1 || true
  if [ -d "$ARBEIT" ]; then
    find "$ARBEIT" -type f -exec shred -u {} + 2>/dev/null || true
    rm -rf "$ARBEIT"
  fi
}
trap aufraeumen EXIT

DATEI="$(ls -1 "$SICHERUNGEN"/culinse-db-*.sql.gz.gpg | sort | tail -n 1)"
echo "Prüfe: $(basename "$DATEI") ($(stat -c %s "$DATEI") Bytes)"

# 1) Entschlüsseln und entpacken
gpg --batch --passphrase-file "$PASSWORT_DATEI" -d "$DATEI" | gunzip > "$ARBEIT/alles.sql"
echo "Klartext-Abzug: $(stat -c %s "$ARBEIT/alles.sql") Bytes, $(wc -l < "$ARBEIT/alles.sql") Zeilen"

# 2) Wegwerf-Container mit demselben Image starten
IMAGE="$(docker inspect -f '{{.Config.Image}}' "$DB_CONTAINER")"
docker rm -f "$PROBE" >/dev/null 2>&1 || true
docker run -d --name "$PROBE" -e POSTGRES_PASSWORD=probe "$IMAGE" >/dev/null
echo "Probe-Container gestartet ($IMAGE), warte auf Postgres ..."
bereit=0
for _ in $(seq 1 90); do
  if docker exec "$PROBE" pg_isready -h localhost -U "$DB_NUTZER" </dev/null >/dev/null 2>&1 \
     && docker exec "$PROBE" psql -h localhost -U "$DB_NUTZER" -d postgres -Atc "select 1" </dev/null >/dev/null 2>&1; then
    bereit=1; break
  fi
  sleep 2
done
[ "$bereit" -eq 1 ] || { echo "FEHLER: Probe-Container wurde nicht bereit"; exit 1; }

# 2b) Das Supabase-Image legt beim ersten Start schon eigene Schemas an (auth, storage ...)
#     in einem älteren Stand. Ohne Leeren scheitert das Einspielen von auth.users an
#     "Tabelle existiert schon / Spalte fehlt". Nur im Wegwerf-Container wird deshalb vorab geleert;
#     Rollen bleiben (die Meldung "role already exists" ist harmlos).
# Schutz: Das Leeren darf nie den echten Datenbank-Container treffen.
[ "$PROBE" = culinse-rueckspielprobe ] && [ "$PROBE" != "${DB_CONTAINER:-supabase-db}" ] || { echo "FEHLER: Probe-Container hat einen unerwarteten Namen"; exit 1; }
docker exec -i "$PROBE" psql -h localhost -U "$DB_NUTZER" -d postgres -q -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT evtname FROM pg_event_trigger LOOP
    EXECUTE format('DROP EVENT TRIGGER %I', r.evtname);
  END LOOP;
  FOR r IN SELECT nspname FROM pg_namespace
           WHERE nspname NOT IN ('pg_catalog','information_schema') AND nspname NOT LIKE 'pg\_%' LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);
  END LOOP;
  CREATE SCHEMA public;
END $$;
SQL

# 3) Einspielen; Fehlermeldungen zählen und nach Art gruppieren, nicht verstecken
docker exec -i "$PROBE" psql -h localhost -U "$DB_NUTZER" -d postgres -v ON_ERROR_STOP=0 -q \
  < "$ARBEIT/alles.sql" > "$ARBEIT/ausgabe.txt" 2> "$ARBEIT/fehler.txt" || true
FEHLER_ANZAHL=$(grep -c 'ERROR:' "$ARBEIT/fehler.txt" || true)
echo "Einspielen fertig: $FEHLER_ANZAHL Fehlermeldungen. Häufigste Arten:"
grep 'ERROR:' "$ARBEIT/fehler.txt" | sed -E 's/^.*ERROR:[[:space:]]*//; s/"[^"]*"/"…"/g' \
  | sort | uniq -c | sort -rn | head -n 10 || true

# 4) Zeilenzahlen vergleichen
echo
printf '%-22s %12s %12s  %s\n' Tabelle Quelle Probe Urteil
ALLES_GLEICH=1
for T in "${TABELLEN[@]}"; do
  Q=$(docker exec "$DB_CONTAINER" psql -h localhost -U "$DB_NUTZER" -d postgres -Atc "select count(*) from $T" </dev/null)
  P=$(docker exec "$PROBE" psql -h localhost -U "$DB_NUTZER" -d postgres -Atc "select count(*) from $T" </dev/null 2>&1 || true)
  URTEIL=gleich
  if [ "$Q" != "$P" ]; then URTEIL=ABWEICHUNG; ALLES_GLEICH=0; fi
  printf '%-22s %12s %12s  %s\n' "$T" "$Q" "$P" "$URTEIL"
done
echo "(Abweichung um wenige Zeilen kann von Änderungen seit dem Abzug kommen.)"

if [ "$ALLES_GLEICH" -eq 1 ]; then
  echo "ERGEBNIS: Rückspiel-Probe bestanden"
else
  echo "ERGEBNIS: Rückspiel-Probe NICHT sauber, bitte ansehen"
  exit 1
fi
