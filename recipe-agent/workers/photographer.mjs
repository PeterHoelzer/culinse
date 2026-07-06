#!/usr/bin/env node
/**
 * Fotograf — ready_for_image → image_ready → (nach Sichtung) pending_review
 * Peters feste Regel: ERST lokal erzeugen und SICHTEN, DANN hochladen.
 *
 * Bequemer Weg: node recipe-agent/sichtung.mjs — Browser-Seite mit Buttons
 * (erzeugen, Variante anklicken, neu würfeln, hochladen). Dieser Worker bleibt
 * der CLI-Weg und wird vom Orchestrator für die lokale Erzeugung genutzt.
 *
 *   Schritt 1 (Default):  node recipe-agent/workers/photographer.mjs
 *     erzeugt VARIANTS Bilder (Default 3) je Gericht NUR lokal → Status image_ready.
 *     Neu würfeln: ONLY=slug REROLL=1 node recipe-agent/workers/photographer.mjs
 *
 *   Schritt 2 (nach Sichtung):  UPLOAD=1 [PICK=slug:n] node …/photographer.mjs
 *     lädt GENAU die gewählten lokalen Bilder hoch (kein Neu-Generieren) und legt
 *     DE+EN als Entwurf an (status='draft', is_public=false, pipeline_status=
 *     'pending_review'). Wahl: PICK-Env > Klick auf der Sichtungs-Seite > einzige
 *     übrige Datei. Voraussetzung: sql/02_add_pipeline_status.sql eingespielt.
 *
 * Ein Bild pro Gericht — DE und EN teilen es. Technik exakt wie
 * supabase/seed/generate_images.mjs (Cloudflare FLUX.1-schnell, steps 6).
 */
import { ENV, logEvent } from "../lib/env.mjs";
import * as queue from "../lib/queue.mjs";
import { generateVariants } from "../lib/images.mjs";
import { getSupabase, findUserId } from "../lib/supa.mjs";
import { authorEmail, resolveChosenFile, uploadOne } from "../lib/publish.mjs";

const DO_UPLOAD = !!ENV.UPLOAD;
const REROLL = !!ENV.REROLL;
const ONLY = (ENV.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const VARIANTS = Math.max(1, parseInt(ENV.VARIANTS || "3", 10));

// PICK="slug:2,anderer-slug:1" → gewählte Variante pro Gericht beim Upload
const PICKS = Object.fromEntries(
  (ENV.PICK || "").split(",").map((s) => s.trim()).filter(Boolean)
    .map((p) => { const [slug, n] = p.split(":"); return [slug, parseInt(n, 10)]; })
);

async function generatePhase() {
  let items = queue.list(REROLL ? "image_ready" : "ready_for_image");
  if (ONLY.length) items = items.filter((i) => ONLY.includes(i.slug));
  if (!items.length) { console.log(`Nichts zu fotografieren (Status ${REROLL ? "image_ready" : "ready_for_image"}).`); return; }

  for (const item of items) {
    process.stdout.write(`• ${item.slug} … `);
    const { files, prompt } = await generateVariants(item.recipe, VARIANTS);
    if (!REROLL)
      queue.move(item.slug, "ready_for_image", "image_ready", "photographer", { image: { prompt, variants: files } });
    else
      queue.put({ ...queue.get(item.slug), image: { prompt, variants: files, chosen_variant: null } });
    logEvent("photographer", REROLL ? "rerolled" : "generated", { slug: item.slug, variants: files.length });
    console.log(`ok ✓ (${files.length} Variante${files.length === 1 ? "" : "n"} lokal)`);
  }
  console.log(
    `\nBilder NUR lokal erzeugt — jetzt bequem im Browser sichten:\n` +
    `  node recipe-agent/sichtung.mjs\n` +
    `(oder klassisch: Dateien in recipe-agent/state/images/ aussortieren und UPLOAD=1 …)`
  );
}

async function uploadPhase() {
  let items = queue.list("image_ready");
  if (ONLY.length) items = items.filter((i) => ONLY.includes(i.slug));
  if (!items.length) { console.log("Nichts hochzuladen (kein Eintrag im Status image_ready)."); return; }

  const sb = await getSupabase();
  const userId = await findUserId(sb, authorEmail());

  for (const item of items) {
    process.stdout.write(`• ${item.slug} … `);
    const chosen = resolveChosenFile(item.slug, PICKS);
    if (!chosen) { console.log("übersprungen (kein lokales Bild — erst erzeugen)"); continue; }
    if (chosen.ambiguous) {
      console.log(`übersprungen — ${chosen.ambiguous.length} Varianten da (${chosen.ambiguous.join(", ")}). Auf der Sichtungs-Seite wählen oder PICK=${item.slug}:<n>.`);
      continue;
    }
    const res = await uploadOne(sb, userId, item, chosen);
    console.log(res.ok ? "ok ✓ (hochgeladen + als Entwurf/pending_review in der DB)" : `übersprungen (${res.skip})`);
  }
  console.log("\nFertig — Rezepte warten als Entwurf auf dein Review: https://culinse.com/de/admin/review");
}

async function main() {
  console.log(`Fotograf · Cloudflare FLUX.1-schnell · Upload: ${DO_UPLOAD}\n`);
  if (DO_UPLOAD) await uploadPhase();
  else await generatePhase();
}

main().catch((e) => { console.error("Fotograf-Abbruch:", e?.message || e); process.exit(1); });
