-- ── RLS-Status prüfen + zwei Tabellen absichern ───────────────────────────────
-- Die App-Tabellen (collections, user_recipes, saved_recipes, profiles …) haben
-- bereits RLS-Policies. NICHT in der Policy-Liste auftauchen aber:
--   newsletter_subscribers  (nur der Server schreibt via Service-Role)
--   translation_cache       (nur der Server liest/schreibt via Service-Role)
-- Fehlt dort RLS, sind sie mit dem öffentlichen Anon-Key auslesbar — dann
-- könnte jeder die komplette Newsletter-E-Mail-Liste abgreifen.

-- 1) Status ansehen: relrowsecurity = true bedeutet „RLS aktiv".
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('newsletter_subscribers', 'translation_cache');

-- 2) Falls oben false: RLS aktivieren. Ohne Policy heißt das für anon/
--    authenticated „kein Zugriff" — der Service-Role-Key (Server) umgeht RLS
--    und schreibt weiterhin. Gefahrlos auch bei bereits aktivem RLS.
alter table public.newsletter_subscribers enable row level security;
alter table public.translation_cache      enable row level security;
