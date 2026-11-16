-- Erzeugt die SQL-Befehle für die eigenen Anpassungen in den von Supabase
-- verwalteten Bereichen auth und storage. Der normale Export (schema.sql) lässt
-- diese Bereiche aus; ohne sie fehlten auf dem neuen Server
--   - der Auslöser an auth.users, der beim Registrieren das Profil anlegt,
--   - die Zugriffsregeln am Bildspeicher (storage.objects).
--
-- Eine einzige Abfrage mit einem Textergebnis, damit sie auch mit
-- "supabase db query" läuft. Liest nur. Die zugehörigen Funktionen liegen in
-- public und stehen in schema.sql.
with befehle as (
  select 1 as rang, pg_get_triggerdef(t.oid) || ';' as befehl
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace pn on pn.oid = p.pronamespace
  where not t.tgisinternal and pn.nspname = 'public' and n.nspname in ('auth', 'storage')

  union all
  select 2, format('create policy %I on %I.%I as %s for %s to %s%s%s;',
                   policyname, schemaname, tablename, permissive, cmd,
                   array_to_string(roles, ', '),
                   case when qual is not null then ' using (' || qual || ')' else '' end,
                   case when with_check is not null then ' with check (' || with_check || ')' else '' end)
  from pg_policies
  where schemaname = 'storage'
)
select coalesce(string_agg(befehl, E'\n' order by rang, befehl), '-- keine Anpassungen gefunden') as befehle from befehle;
