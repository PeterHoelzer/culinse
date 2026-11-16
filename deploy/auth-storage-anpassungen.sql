-- Erzeugt die SQL-Befehle für die eigenen Anpassungen in den von Supabase
-- verwalteten Bereichen auth und storage. Der normale Export (schema.sql) lässt
-- diese Bereiche aus; ohne sie fehlten auf dem neuen Server
--   - der Auslöser an auth.users, der beim Registrieren das Profil anlegt,
--   - die Zugriffsregeln am Bildspeicher (storage.objects).
--
--   psql "$QUELLE" -At -f deploy/auth-storage-anpassungen.sql > anpassungen.sql
--   psql "$ZIEL" -v ON_ERROR_STOP=1 -f anpassungen.sql        (nach dem Einspielen der Daten)
--
-- Liest nur. Die zugehörigen Funktionen liegen in public und stehen in schema.sql.

select '-- Ausloeser an verwalteten Tabellen, die eine eigene Funktion aufrufen';
select pg_get_triggerdef(t.oid) || ';'
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where not t.tgisinternal and pn.nspname = 'public' and n.nspname in ('auth', 'storage')
order by 1;

select '-- Zugriffsregeln am Bildspeicher';
select format('create policy %I on %I.%I as %s for %s to %s%s%s;',
              policyname, schemaname, tablename, permissive, cmd,
              array_to_string(roles, ', '),
              case when qual is not null then ' using (' || qual || ')' else '' end,
              case when with_check is not null then ' with check (' || with_check || ')' else '' end)
from pg_policies
where schemaname = 'storage'
order by 1;
