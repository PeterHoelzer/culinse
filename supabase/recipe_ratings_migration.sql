-- Bewertungen für Rezepte (1 bis 5 Sterne). Am 10.11.2026 im SQL Editor ausgeführt
-- (dort ohne die drop-Zeilen, weil die Tabelle neu war) und von außen geprüft:
-- ohne Anmeldung kein Lesen, kein Schreiben; 6 Sterne werden abgelehnt.
--
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen. Die Datei legt nur
-- Neues an und ändert keine bestehende Tabelle; mehrfaches Ausführen ist unschädlich.
--
-- Aufbau:
-- - Eine Bewertung je Konto und Gericht. "rating_key" ist die translation_group
--   des Rezepts, damit ein Gericht in allen 16 Sprachen dieselben Sterne trägt.
--   Rezepte ohne Gruppe (Familien- und Community-Rezepte) nutzen "id:<uuid>".
-- - Lesen darf jedes Konto nur die eigene Bewertung. Durchschnitt und Anzahl
--   liefert die Seite über ihre Server-Schnittstelle (Service Role), so ist
--   von außen nicht sichtbar, wer was bewertet hat.

create table if not exists public.recipe_ratings (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  rating_key text        not null check (char_length(rating_key) between 1 and 200),
  stars      smallint    not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, rating_key)
);

create index if not exists recipe_ratings_key_idx on public.recipe_ratings (rating_key);

alter table public.recipe_ratings enable row level security;

drop policy if exists "recipe_ratings select own" on public.recipe_ratings;
create policy "recipe_ratings select own" on public.recipe_ratings
  for select using (auth.uid() = user_id);

drop policy if exists "recipe_ratings insert own" on public.recipe_ratings;
create policy "recipe_ratings insert own" on public.recipe_ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists "recipe_ratings update own" on public.recipe_ratings;
create policy "recipe_ratings update own" on public.recipe_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "recipe_ratings delete own" on public.recipe_ratings;
create policy "recipe_ratings delete own" on public.recipe_ratings
  for delete using (auth.uid() = user_id);

-- Prüfen nach dem Ausführen (soll 4 Zeilen liefern):
-- select policyname, cmd from pg_policies where tablename = 'recipe_ratings';
