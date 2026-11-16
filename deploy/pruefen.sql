-- Vergleichsbericht für den Umzug der Datenbank.
--
-- Auf BEIDEN Seiten laufen lassen und die Ergebnisse vergleichen:
--   psql "$QUELLE" -At -f deploy/pruefen.sql > bericht-quelle.txt
--   psql "$ZIEL"   -At -f deploy/pruefen.sql > bericht-ziel.txt
--   diff bericht-quelle.txt bericht-ziel.txt && echo "gleich"
--
-- Der Bericht liest nur. Vor dem Umschreiben der Bildadressen laufen lassen
-- (danach unterscheiden sich die Zeilen absichtlich nicht, die Prüfsumme lässt
-- Bildadressen aus). Erwartete Unterschiede stehen in deploy/LIESMICH.md.

-- 1) Postgres-Hauptversion
select 'postgres|' || split_part(current_setting('server_version'), '.', 1);

-- 2) Exakte Zeilenzahl jeder eigenen Tabelle sowie der Konten und Bild-Einträge
select 'zeilen|' || table_schema || '.' || table_name || '|' ||
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables
where table_type = 'BASE TABLE'
  and (table_schema = 'public'
       or (table_schema, table_name) in (('auth', 'users'), ('auth', 'identities'), ('storage', 'buckets'), ('storage', 'objects')))
order by 1;

-- 3) Prüfsumme über alle Rezepte (ID, Titel, Sprache, Änderungszeit, Sichtbarkeit)
select 'pruefsumme|public.user_recipes|' ||
       md5(string_agg(id::text || '|' || coalesce(title, '') || '|' || coalesce(language, '') || '|' ||
                      coalesce(extract(epoch from updated_at)::text, '') || '|' || coalesce(is_public::text, ''),
                      E'\n' order by id))
from public.user_recipes;

-- 4) Prüfsumme über die Konten (ID, E-Mail, ob ein Passwort gesetzt ist)
select 'pruefsumme|auth.users|' ||
       md5(string_agg(id::text || '|' || coalesce(email, '') || '|' || (encrypted_password is not null)::text, E'\n' order by id))
from auth.users;

-- 5) Spalten der eigenen Tabellen
select 'spalte|' || table_name || '|' || column_name || '|' || data_type
from information_schema.columns
where table_schema = 'public'
order by 1;

-- 6) Zeilenschutz (RLS) je Tabelle und alle Zugriffsregeln, auch am Bildspeicher
select 'rls|' || relname || '|' || relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by 1;

select 'regel|' || schemaname || '.' || tablename || '|' || policyname || '|' || cmd || '|' ||
       md5(coalesce(qual, '') || '#' || coalesce(with_check, ''))
from pg_policies
where schemaname in ('public', 'storage')
order by 1;

-- 7) Eigene Funktionen und alle Auslöser, die eine eigene Funktion aufrufen
--    (auch der an der Kontentabelle auth.users)
select 'funktion|' || proname || '|' || md5(prosrc)
from pg_proc
where pronamespace = 'public'::regnamespace
order by 1;

select 'ausloeser|' || n.nspname || '.' || c.relname || '|' || t.tgname || '|' || p.proname || '|' || t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where not t.tgisinternal and pn.nspname = 'public'
order by 1;

-- 8) Erweiterungen (nur Namen; Versionen dürfen abweichen)
select 'erweiterung|' || extname from pg_extension order by 1;
