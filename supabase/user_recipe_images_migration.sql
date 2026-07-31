-- C14: Mehrbild-Galerie fuer Community-Rezepte.
-- images = geordnete Galerie (jsonb-Array von URLs), Cover an Position 0;
-- image_url bleibt als Cover-Spiegel fuer Karten/Planer/Shares erhalten.
-- Additiv & idempotent — im Supabase SQL Editor ausfuehren (Projekt ztfhnzslyztxfmvkyrrn).
alter table public.user_recipes
  add column if not exists images jsonb not null default '[]'::jsonb;
