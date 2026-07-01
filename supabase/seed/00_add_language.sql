-- ── Eigener Rezept-Korpus: Sprach-Metadaten ──────────────────────────────────
-- Additive, nicht-brechende Migration. Bestehende Zeilen bleiben unverändert
-- (language / translation_group = NULL). Im Supabase SQL Editor ausführen,
-- BEVOR 01_seed_recipes.sql läuft.
--
-- Warum: user_recipes hatte bisher kein Sprach-Feld — Community-Rezepte werden
-- nie übersetzt, sondern in der Sprache des Autors angezeigt. Für einen eigenen,
-- zweisprachigen Korpus speichern wir jedes Rezept als DE- UND EN-Zeile und
-- markieren die Sprache. So kann die Community-Suche später sauber nach Sprache
-- filtern (statt Laufzeit-Übersetzung = wieder eine externe Anbindung).

ALTER TABLE user_recipes
  ADD COLUMN IF NOT EXISTS language          TEXT,
  ADD COLUMN IF NOT EXISTS translation_group TEXT;

COMMENT ON COLUMN user_recipes.language          IS 'ISO-639-1 Sprachcode des Rezeptinhalts, z. B. de | en (NULL = unbekannt/Altbestand).';
COMMENT ON COLUMN user_recipes.translation_group IS 'Verknüpft Übersetzungen desselben Rezepts (gemeinsamer Slug), z. B. "spaghetti-carbonara".';

-- Schnelle Sprachfilterung in der Community-Suche.
CREATE INDEX IF NOT EXISTS user_recipes_language_idx
  ON user_recipes (language);

-- "Auf anderer Sprache ansehen" / Dedup über Sprachen.
CREATE INDEX IF NOT EXISTS user_recipes_translation_group_idx
  ON user_recipes (translation_group);
