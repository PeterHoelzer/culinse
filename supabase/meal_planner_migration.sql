-- ── Meal Planner Migration ────────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor

-- 1. meal_plans — one plan per user (free) or multiple (pro)
CREATE TABLE IF NOT EXISTS meal_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'My Meal Plan',
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON meal_plans(user_id);

-- RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plans"
  ON meal_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. meal_plan_entries — one recipe per slot (plan × day × meal)
CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index     SMALLINT NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  meal_slot     TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner')),
  recipe_id     TEXT NOT NULL,
  recipe_title  TEXT NOT NULL,
  recipe_image  TEXT,
  recipe_time   INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One recipe per slot — upsert uses this constraint
  UNIQUE (plan_id, day_index, meal_slot)
);

-- Index for fast plan lookups
CREATE INDEX IF NOT EXISTS meal_plan_entries_plan_id_idx ON meal_plan_entries(plan_id);
CREATE INDEX IF NOT EXISTS meal_plan_entries_user_id_idx ON meal_plan_entries(user_id);

-- RLS
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own entries"
  ON meal_plan_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
