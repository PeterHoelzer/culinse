-- ── Affiliate Clicks Migration ────────────────────────────────────────────────
-- Logs every outbound affiliate click (via /api/out redirect) so we can see
-- which placements earn their keep. No user_id / no IP — anonymous by design
-- (DSGVO-friendly). Written exclusively by the service-role client.
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target     TEXT NOT NULL,             -- full outbound URL (amazon.de/…)
  source     TEXT NOT NULL,             -- placement: recipe_ingredient | recipe_tools | shopping_list | shopping_list_all | blog | …
  recipe_id  TEXT,                      -- optional: which recipe triggered it
  referer    TEXT,                      -- page the click came from
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS on, and NO policies: the anon/authenticated roles can neither read nor
-- write. Only the service-role key (used by /api/out) bypasses RLS.
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS affiliate_clicks_source_idx  ON affiliate_clicks (source);
CREATE INDEX IF NOT EXISTS affiliate_clicks_created_idx ON affiliate_clicks (created_at);

-- Handy view: clicks per placement per day (query via service role / SQL editor)
CREATE OR REPLACE VIEW affiliate_clicks_daily AS
  SELECT date_trunc('day', created_at)::date AS day,
         source,
         count(*) AS clicks
  FROM affiliate_clicks
  GROUP BY 1, 2
  ORDER BY 1 DESC, 3 DESC;
