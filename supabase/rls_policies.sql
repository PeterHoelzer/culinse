-- ── Row-Level-Security-Policies ───────────────────────────────────────────────
-- Im Supabase SQL Editor ausführen. WICHTIG: vorher testen (siehe unten).
--
-- Warum das nötig ist: Die App liest/schreibt mehrere Tabellen DIREKT aus dem
-- Browser mit dem öffentlichen Anon-Key (supabase-js in den Client-Komponenten).
-- Die clientseitigen Prüfungen (z. B. „private Collection nur dem Owner zeigen"
-- in CollectionDetailClient.tsx) betreffen nur, was die UI anzeigt — sie halten
-- niemanden davon ab, die Tabelle mit einem selbst gebauten Query direkt
-- abzufragen. Ohne die folgenden Policies könnte jeder eingeloggte Nutzer
-- fremde PRIVATE Collections, fremde Rezept-Entwürfe usw. auslesen.
--
-- meal_plans, meal_plan_entries, shopping_lists und pantry_items haben bereits
-- Policies (siehe die jeweiligen *_migration.sql) — hier fehlen nur die übrigen
-- client-zugänglichen Tabellen.
--
-- Idempotent: mehrfaches Ausführen ist gefahrlos (DROP POLICY IF EXISTS).
--
-- ⚠️  VOR PRODUKTIV-EINSATZ TESTEN: Falls in eurer Live-DB schon andere Policies
--    unter anderen Namen existieren, prüft mit
--        select tablename, policyname, cmd, qual, with_check
--        from pg_policies where schemaname = 'public';
--    dass sich die Zugriffe wie erwartet verhalten (eigenes Konto: Speichern,
--    Sammlungen, eigene Rezepte; zweites Konto: sieht fremde Privates NICHT).

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Jeder sieht/ändert nur die EIGENE Zeile. Billing-Spalten sind zusätzlich per
-- Trigger geschützt (siehe security_hardening.sql) — die UPDATE-Policy allein
-- würde sonst erlauben, is_pro in der eigenen Zeile zu setzen.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── collections ──────────────────────────────────────────────────────────────
-- Lesen: öffentliche ODER eigene. Schreiben: nur eigene.
alter table public.collections enable row level security;

drop policy if exists "collections_select_public_or_own" on public.collections;
create policy "collections_select_public_or_own" on public.collections
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "collections_insert_own" on public.collections;
create policy "collections_insert_own" on public.collections
  for insert with check (auth.uid() = user_id);

drop policy if exists "collections_update_own" on public.collections;
create policy "collections_update_own" on public.collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collections_delete_own" on public.collections;
create policy "collections_delete_own" on public.collections
  for delete using (auth.uid() = user_id);

-- ── collection_recipes ───────────────────────────────────────────────────────
-- Hat keine user_id-Spalte → Zugriff über die Eltern-Collection ableiten.
alter table public.collection_recipes enable row level security;

drop policy if exists "collection_recipes_select" on public.collection_recipes;
create policy "collection_recipes_select" on public.collection_recipes
  for select using (
    exists (
      select 1 from public.collections c
      where c.id = collection_recipes.collection_id
        and (c.is_public = true or c.user_id = auth.uid())
    )
  );

drop policy if exists "collection_recipes_write" on public.collection_recipes;
create policy "collection_recipes_write" on public.collection_recipes
  for all using (
    exists (
      select 1 from public.collections c
      where c.id = collection_recipes.collection_id
        and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_recipes.collection_id
        and c.user_id = auth.uid()
    )
  );

-- ── saved_recipes ────────────────────────────────────────────────────────────
alter table public.saved_recipes enable row level security;

drop policy if exists "saved_recipes_own" on public.saved_recipes;
create policy "saved_recipes_own" on public.saved_recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── user_recipes ─────────────────────────────────────────────────────────────
-- Lesen: öffentliche ODER eigene (Entwürfe bleiben privat). Schreiben: nur
-- eigene. Der öffentliche Detail-Abruf fremder Rezepte läuft ohnehin über den
-- Service-Client in der API (/api/recipe/[id]).
alter table public.user_recipes enable row level security;

drop policy if exists "user_recipes_select_public_or_own" on public.user_recipes;
create policy "user_recipes_select_public_or_own" on public.user_recipes
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "user_recipes_insert_own" on public.user_recipes;
create policy "user_recipes_insert_own" on public.user_recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_recipes_update_own" on public.user_recipes;
create policy "user_recipes_update_own" on public.user_recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_recipes_delete_own" on public.user_recipes;
create policy "user_recipes_delete_own" on public.user_recipes
  for delete using (auth.uid() = user_id);

-- ── newsletter_subscribers ───────────────────────────────────────────────────
-- Nur der Server (Service-Role) schreibt hier (siehe /api/newsletter). RLS an,
-- KEINE Policy für anon/authenticated → Tabelle ist für Clients komplett dicht
-- (E-Mail-Liste kann nicht ausgelesen werden). Service-Role umgeht RLS.
alter table public.newsletter_subscribers enable row level security;

-- ── translation_cache ────────────────────────────────────────────────────────
-- Wird ausschließlich serverseitig über den Admin-Client gelesen/geschrieben
-- (lib/translate.ts). Für Clients dichtmachen.
alter table public.translation_cache enable row level security;
