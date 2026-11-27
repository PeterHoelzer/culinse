-- ── Klick-Tabelle der Amazon-Links entfernen (27.11.2026) ────────────────────
-- Seit 26.11.2026 gibt es auf culinse.com keine Amazon-Links mehr, seit
-- 27.11.2026 auch kein Geld-Dashboard. Die Website liest und schreibt die
-- Tabelle affiliate_clicks nicht mehr. Diese Datei löscht
--   · die Ansicht  public.affiliate_clicks_daily  (Klicks pro Tag) und
--   · die Tabelle  public.affiliate_clicks        (jeder einzelne Klick).
-- Sonst wird nichts angefasst.
--
-- ACHTUNG: Die alten Klickzahlen sind danach weg. Wer sie aufheben will, zieht
-- vorher eine Kopie auf den Mac (legt eine CSV-Datei auf den Schreibtisch):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -c "\copy (select * from public.affiliate_clicks order by created_at) to stdout with csv header"' > ~/Desktop/affiliate_clicks_sicherung.csv
--
-- Einspielen auf dem Server, vom Mac aus im Projektordner (ZIEL siehe deploy/LIESMICH.md):
--   ssh culinse 'set -a; . /root/umzug/ziel.env; set +a; psql "$ZIEL" -v ON_ERROR_STOP=1 --single-transaction -f -' < supabase/affiliate_clicks_entfernen.sql
-- Läuft in einem Stück oder gar nicht und darf wiederholt werden.
--
-- Bewusst ohne CASCADE: Hängt wider Erwarten noch etwas an der Tabelle, bricht
-- der Lauf mit einer Fehlermeldung ab und löscht nichts.
--
-- Rückweg: supabase/affiliate_clicks_migration.sql legt Tabelle und Ansicht
-- wieder an, aber leer. Die Zahlen kommen nur aus der Kopie oben zurück.
-- Wer die Ansicht wieder anlegt, spielt danach supabase/security_hardening_2026_11.sql
-- ein, sonst kann sie wieder jeder Besucher lesen.

drop view  if exists public.affiliate_clicks_daily;
drop table if exists public.affiliate_clicks;

-- ── Bericht ──────────────────────────────────────────────────────────────────
-- Beide Zeilen müssen "entfernt" zeigen.
select 'affiliate_clicks_daily' as objekt,
       case when to_regclass('public.affiliate_clicks_daily') is null
            then 'entfernt' else 'NOCH DA' end as stand
union all
select 'affiliate_clicks',
       case when to_regclass('public.affiliate_clicks') is null
            then 'entfernt' else 'NOCH DA' end;
