-- Central cache for machine-translated recipe content (titles, ingredients,
-- steps, summaries). Each unique source text is translated once and reused,
-- which keeps the translation API usage (DeepL / MyMemory) low.
--
-- Run this in the Supabase SQL editor before deploying the translation code.
-- The app reads/writes it via the service-role client (no RLS needed).
--
-- We key uniqueness on an md5 hash of the source text (computed in the app) so
-- long texts like instruction steps don't hit Postgres' btree index size limit.

CREATE TABLE IF NOT EXISTS translation_cache (
  id BIGSERIAL PRIMARY KEY,
  source_hash TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_hash, source_lang, target_lang)
);
