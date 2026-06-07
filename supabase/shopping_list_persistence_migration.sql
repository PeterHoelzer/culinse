-- ── Shopping List Persistence Migration ───────────────────────────────────────
-- Stores the per-plan shopping-list state so checked-off items survive reloads
-- and sync across devices, and so users can add their own items.
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS shopping_lists (
  plan_id    UUID PRIMARY KEY REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  checked    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of checked item keys ("Category||name")
  manual     JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of user-added items
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own shopping lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
