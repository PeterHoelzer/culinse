#!/usr/bin/env node
/**
 * Distributor — approved → published
 * Läuft NIE automatisch (nicht Teil des Orchestrator-Tageslaufs): Peter bestätigt
 * jedes Rezept selbst. Erst wenn eine Zeile pipeline_status='approved' hat
 * (Admin-Review-Seite, Phase 2 — oder manuell per SQL), schaltet dieser Worker
 * DE+EN gemeinsam öffentlich. Sicherheitsnetz: nur mit Bild.
 *
 * Aufruf:  node recipe-agent/workers/distributor.mjs
 * Ausbaustufe (Plan §3): danach Übergabe an TikTok/Metricool.
 */
import fs from "fs";
import { SEED_RECIPES, logEvent } from "../lib/env.mjs";
import { getSupabase, findUserId } from "../lib/supa.mjs";

function authorEmail() {
  try { return JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8")).author_email || "peter@hoelzer.xyz"; }
  catch { return "peter@hoelzer.xyz"; }
}

async function main() {
  const sb = await getSupabase();
  const userId = await findUserId(sb, authorEmail());

  const { data: approved, error } = await sb
    .from("user_recipes")
    .select("id, translation_group, language, title, image_url")
    .eq("user_id", userId)
    .eq("pipeline_status", "approved");
  if (error) throw error;
  if (!approved?.length) { console.log("Nichts freigegeben (kein pipeline_status='approved')."); return; }

  // DE+EN gemeinsam schalten — pro translation_group
  const groups = [...new Set(approved.map((r) => r.translation_group))];
  for (const g of groups) {
    const rows = approved.filter((r) => r.translation_group === g);
    if (rows.some((r) => !r.image_url)) {
      console.log(`✗ ${g}: übersprungen — Bild fehlt (Qualitäts-Gate).`);
      continue;
    }
    const { error: upErr } = await sb
      .from("user_recipes")
      .update({ is_public: true, status: "published", pipeline_status: "published", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("translation_group", g)
      .eq("pipeline_status", "approved");
    if (upErr) throw upErr;
    logEvent("distributor", "published", { group: g, rows: rows.length });
    console.log(`✓ ${g}: ${rows.length} Zeile(n) veröffentlicht (${rows.map((r) => r.language).join("+")}).`);
  }
}

main().catch((e) => { console.error("Distributor-Abbruch:", e?.message || e); process.exit(1); });
