-- ── User Recipe Nutrition Migration ───────────────────────────────────────────
-- Caches per-serving nutrition for user-created and imported recipes so the
-- recipe page and the meal-planner macro totals can show them.
-- Computed lazily on first view, cleared on edit. Run in the Supabase SQL Editor.

ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS nutrition JSONB;

COMMENT ON COLUMN user_recipes.nutrition IS 'Cached per-serving nutrition {calories,protein,fat,carbs}; computed lazily, cleared on edit (NULL = not yet computed).';
