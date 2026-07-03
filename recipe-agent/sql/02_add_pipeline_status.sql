-- ── Rezept-Agent: Pipeline-Status ─────────────────────────────────────────────
-- Additive, nicht-brechende Migration (wie 00_add_language.sql).
-- Im Supabase SQL Editor ausführen, BEVOR der Fotograf mit UPLOAD=1 läuft.
--
-- Warum: Der Rezept-Agent legt fertige Rezepte (inkl. Bild) als Entwurf mit
-- pipeline_status='pending_review' an. Die Review-Seite (Phase 2) liest diese
-- Queue; der Distributor schaltet 'approved' → 'published'. Das bestehende
-- status/is_public der App bleibt unangetastet.
--
-- Werte: pending_review | approved | published | discarded  (NULL = kein Agent-Rezept)

ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT;

COMMENT ON COLUMN user_recipes.pipeline_status IS
  'Rezept-Agent-Queue: pending_review | approved | published | discarded (NULL = nicht vom Agenten).';

-- Schnelles Abfragen der Review-Queue.
CREATE INDEX IF NOT EXISTS user_recipes_pipeline_status_idx
  ON user_recipes (pipeline_status)
  WHERE pipeline_status IS NOT NULL;
