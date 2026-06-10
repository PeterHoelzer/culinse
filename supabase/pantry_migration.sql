-- ── Pantry Migration ──────────────────────────────────────────────────────────
-- A per-user list of ingredients they already have at home. Items on the
-- shopping list that match the pantry are moved to a "Already have" section so
-- you don't re-buy them. Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS pantry_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pantry"
  ON pantry_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pantry_items_user_idx ON pantry_items (user_id);
