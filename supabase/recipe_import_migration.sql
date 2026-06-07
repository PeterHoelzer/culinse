-- ── Recipe Import Migration ───────────────────────────────────────────────────
-- Extends user_recipes so it can also hold recipes IMPORTED from a URL, with
-- proper source attribution. Run this in your Supabase SQL Editor.
--
-- Design note: imported recipes are stored as the importing user's own recipes
-- (private by default, is_public = false) with a link + name of the original
-- source. This is the start of our owned recipe corpus — the same table now
-- holds user-created AND user-imported recipes, served through the existing
-- /recipe/user_<id> pipeline.

ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS source_url   TEXT,
  ADD COLUMN IF NOT EXISTS source_name  TEXT,
  ADD COLUMN IF NOT EXISTS source_type  TEXT NOT NULL DEFAULT 'created';

-- Backfill: everything that exists today was user-created.
UPDATE user_recipes SET source_type = 'created' WHERE source_type IS NULL;

COMMENT ON COLUMN user_recipes.source_url  IS 'Original recipe URL when imported (attribution + backlink).';
COMMENT ON COLUMN user_recipes.source_name IS 'Original site / publisher name when imported.';
COMMENT ON COLUMN user_recipes.source_type IS 'created | imported';

-- Optional: index to query a user''s imports quickly.
CREATE INDEX IF NOT EXISTS user_recipes_source_type_idx
  ON user_recipes (user_id, source_type);
