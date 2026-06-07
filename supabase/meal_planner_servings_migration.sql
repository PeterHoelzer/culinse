-- ── Meal Planner Servings Migration ───────────────────────────────────────────
-- Adds a per-meal target servings count so the shopping list can scale
-- ingredient amounts (e.g. cook a 2-serving recipe for 4 → quantities ×2).
-- Run this in your Supabase SQL Editor.
--
-- NULL = use the recipe as-is (no scaling, current behaviour).

ALTER TABLE meal_plan_entries
  ADD COLUMN IF NOT EXISTS servings INT;

COMMENT ON COLUMN meal_plan_entries.servings IS 'Target servings for this meal; NULL = recipe default (no scaling).';
