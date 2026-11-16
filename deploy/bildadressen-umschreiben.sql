-- Schreibt die Adresse des Bildspeichers in allen eigenen Tabellen um.
--
-- In den Rezeptzeilen steht die volle Bildadresse samt Server. Nach dem Umzug
-- muss der alte Server (Supabase-Projekt) durch den neuen ersetzt werden.
--
-- Probelauf (ändert nichts, zeigt nur, was sich ändern würde):
--   psql "$ZIEL" -v alt='https://ztfhnzslyztxfmvkyrrn.supabase.co' -v neu='https://daten.culinse.com' \
--        -f deploy/bildadressen-umschreiben.sql
-- Ernstfall: zusätzlich  -v ausfuehren=1
--
-- NUR auf der neuen Datenbank laufen lassen, nie auf dem Supabase-Projekt.
-- Die Auslöser bleiben währenddessen aus, sonst setzte handle_updated_at bei
-- allen Rezepten das Änderungsdatum auf heute.

\set ON_ERROR_STOP on
\if :{?ausfuehren}
\else
  \set ausfuehren 0
\endif

begin;
select set_config('umzug.alt', :'alt', true) as alt, set_config('umzug.neu', :'neu', true) as neu \gset gesetzt_
set local session_replication_role = replica;

do $$
declare
  alt text := current_setting('umzug.alt');
  neu text := current_setting('umzug.neu');
  sp record;
  treffer bigint;
  gesamt bigint := 0;
begin
  if alt is null or alt = '' or neu is null or neu = '' then
    raise exception 'alt und neu muessen gesetzt sein';
  end if;
  for sp in
    select c.table_name, c.column_name, c.data_type, c.udt_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      and (c.data_type in ('text', 'character varying', 'json', 'jsonb') or c.udt_name = '_text')
    order by c.table_name, c.ordinal_position
  loop
    execute format('select count(*) from public.%I where %I::text like %L', sp.table_name, sp.column_name, '%' || alt || '%')
      into treffer;
    if treffer > 0 then
      raise notice '% Zeilen in %.%', treffer, sp.table_name, sp.column_name;
      gesamt := gesamt + treffer;
      execute format('update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
                     sp.table_name, sp.column_name, sp.column_name, alt, neu,
                     case when sp.udt_name = '_text' then 'text[]' else sp.udt_name end,
                     sp.column_name, '%' || alt || '%');
    end if;
  end loop;
  raise notice 'Zusammen % Felder mit der alten Adresse', gesamt;
end
$$;

\if :ausfuehren
  commit;
  \echo 'Umschreiben ausgefuehrt.'
\else
  rollback;
  \echo 'Probelauf: nichts geaendert. Mit -v ausfuehren=1 wird umgeschrieben.'
\endif
