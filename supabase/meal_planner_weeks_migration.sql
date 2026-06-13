-- ── Meal Planner: real calendar weeks ────────────────────────────────────────
-- Adds a week anchor (the Monday of the week) to every entry so a single plan
-- can hold a different set of meals for each calendar week, with prev/next
-- navigation in the app. Run this in your Supabase SQL Editor.

-- 1. New column — nullable first so existing rows can be backfilled.
ALTER TABLE meal_plan_entries ADD COLUMN IF NOT EXISTS week_start DATE;

-- 2. Backfill every existing entry into the current week.
--    In Postgres, date_trunc('week', ...) returns the Monday of that week.
UPDATE meal_plan_entries
   SET week_start = date_trunc('week', now())::date
 WHERE week_start IS NULL;

-- 3. New rows default to the current week's Monday, and the column is required.
ALTER TABLE meal_plan_entries ALTER COLUMN week_start SET DEFAULT date_trunc('week', now())::date;
ALTER TABLE meal_plan_entries ALTER COLUMN week_start SET NOT NULL;

-- 4. Replace the old "one recipe per (plan, day, slot)" uniqueness with one that
--    is scoped per week, so the same slot can hold a meal in every week.
--    (The old constraint's auto-generated name is dropped if present.)
ALTER TABLE meal_plan_entries DROP CONSTRAINT IF EXISTS meal_plan_entries_plan_id_day_index_meal_slot_key;
ALTER TABLE meal_plan_entries
  ADD CONSTRAINT meal_plan_entries_plan_week_day_slot_key
  UNIQUE (plan_id, week_start, day_index, meal_slot);

-- 5. Fast lookups when loading one specific week of a plan.
CREATE INDEX IF NOT EXISTS meal_plan_entries_plan_week_idx ON meal_plan_entries (plan_id, week_start);
