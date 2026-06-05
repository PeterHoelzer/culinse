-- Bilingual search: translate German search terms to English before querying
-- the recipe providers (Spoonacular / TheMealDB), so "Nudeln" finds pasta.
--
-- Run this in the Supabase SQL editor before deploying the bilingual search code.
-- The app reads/writes these tables via the service-role client, so no RLS
-- policies are required (the anon key never touches them).

-- Cache for translated search terms (so we only translate each term once).
CREATE TABLE IF NOT EXISTS search_query_cache (
  id SERIAL PRIMARY KEY,
  query_original TEXT NOT NULL,
  query_translated TEXT NOT NULL,
  source_lang TEXT NOT NULL DEFAULT 'DE',
  target_lang TEXT NOT NULL DEFAULT 'EN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(query_original, source_lang, target_lang)
);

-- Curated DE↔EN synonyms for common recipe terms (checked before DeepL).
CREATE TABLE IF NOT EXISTS search_synonyms (
  id SERIAL PRIMARY KEY,
  term_de TEXT NOT NULL UNIQUE,
  term_en TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO search_synonyms (term_de, term_en) VALUES
('nudeln', 'pasta'),
('hähnchen', 'chicken'),
('haehnchen', 'chicken'),
('hühnchen', 'chicken'),
('rindfleisch', 'beef'),
('schweinefleisch', 'pork'),
('kartoffeln', 'potatoes'),
('kartoffel', 'potato'),
('reis', 'rice'),
('suppe', 'soup'),
('kuchen', 'cake'),
('brot', 'bread'),
('salat', 'salad'),
('fisch', 'fish'),
('garnelen', 'shrimp'),
('pilze', 'mushrooms'),
('spinat', 'spinach'),
('tomaten', 'tomatoes'),
('käse', 'cheese'),
('kaese', 'cheese'),
('ei', 'egg'),
('eier', 'eggs'),
('sahne', 'cream'),
('zwiebeln', 'onions'),
('knoblauch', 'garlic'),
('sauerbraten', 'pot roast'),
('schnitzel', 'schnitzel'),
('gulasch', 'goulash'),
('bratwurst', 'bratwurst'),
('spätzle', 'spaetzle'),
('spaetzle', 'spaetzle'),
('brötchen', 'bread rolls'),
('broetchen', 'bread rolls'),
('pfannkuchen', 'pancakes'),
('quark', 'quark cheese'),
('lebkuchen', 'gingerbread'),
('nachtisch', 'dessert'),
('vorspeise', 'appetizer'),
('hauptgericht', 'main course'),
('frühstück', 'breakfast'),
('fruehstueck', 'breakfast'),
('abendessen', 'dinner'),
('mittagessen', 'lunch'),
('gemüse', 'vegetables'),
('gemuese', 'vegetables'),
('hackfleisch', 'ground meat'),
('lachs', 'salmon'),
('nudelsalat', 'pasta salad'),
('auflauf', 'casserole'),
('eintopf', 'stew'),
('curry', 'curry'),
('pizza', 'pizza')
ON CONFLICT (term_de) DO NOTHING;
