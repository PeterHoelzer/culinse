#!/usr/bin/env node
/**
 * Fotograf — ready_for_image → image_ready → (nach Sichtung) pending_review
 * Peters feste Regel: ERST lokal erzeugen und SICHTEN, DANN hochladen.
 *
 *   Schritt 1 (Default):  node recipe-agent/workers/photographer.mjs
 *     erzeugt Bilder NUR lokal in recipe-agent/state/images/ → Status image_ready.
 *     Sichten: open recipe-agent/state/images/
 *     Neu würfeln: ONLY=slug node recipe-agent/workers/photographer.mjs REROLL=1
 *
 *   Schritt 2 (nach Sichtung):  UPLOAD=1 node recipe-agent/workers/photographer.mjs
 *     lädt GENAU die gesichteten lokalen Bilder in recipe-media hoch (kein
 *     Neu-Generieren), legt das Rezept als DE+EN-Zeilen in user_recipes an
 *     (status='draft', is_public=false, pipeline_status='pending_review').
 *     Voraussetzung: sql/02_add_pipeline_status.sql wurde einmalig eingespielt.
 *
 * Ein Bild pro Gericht — DE und EN teilen es. Technik exakt wie
 * supabase/seed/generate_images.mjs (Cloudflare FLUX.1-schnell, steps 6).
 */
import fs from "fs";
import { ENV, SEED_RECIPES, logEvent } from "../lib/env.mjs";
import * as queue from "../lib/queue.mjs";
import { generateVariants, uploadSighted, localImagePath, localVariantPath, existingVariants } from "../lib/images.mjs";
import { getSupabase, findUserId } from "../lib/supa.mjs";
import { rememberRecipe } from "../lib/dedup.mjs";

const DO_UPLOAD = !!ENV.UPLOAD;
const REROLL = !!ENV.REROLL;
const ONLY = (ENV.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const VARIANTS = Math.max(1, parseInt(ENV.VARIANTS || "3", 10));

// PICK="slug:2,anderer-slug:1" → gewählte Variante pro Gericht beim Upload
const PICKS = Object.fromEntries(
  (ENV.PICK || "").split(",").map((s) => s.trim()).filter(Boolean)
    .map((p) => { const [slug, n] = p.split(":"); return [slug, parseInt(n, 10)]; })
);

/** Gewählte Bilddatei fürs Hochladen bestimmen (Sichtungs-Ergebnis). */
function chooseFile(slug) {
  if (PICKS[slug]) {
    const f = localVariantPath(slug, PICKS[slug]);
    if (!fs.existsSync(f)) throw new Error(`${slug}: Variante v${PICKS[slug]} existiert nicht.`);
    return f;
  }
  const variants = existingVariants(slug);
  if (variants.length === 1) return variants[0];            // Rest gelöscht → eindeutig
  if (variants.length === 0 && fs.existsSync(localImagePath(slug)))
    return localImagePath(slug);                            // Einzelbild-Modus (alt)
  if (variants.length > 1)
    return { ambiguous: variants.map((f) => f.split("/").pop()) };
  return null;
}

function authorEmail() {
  try { return JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8")).author_email || "peter@hoelzer.xyz"; }
  catch { return "peter@hoelzer.xyz"; }
}

function rowFor(userId, r, lang, imageUrl) {
  const loc = r[lang];
  const now = new Date().toISOString();
  return {
    user_id: userId,
    language: lang,
    translation_group: r.slug,
    title: loc.title,
    description: loc.description || "",
    image_url: imageUrl,
    image_position: "50% 50%",
    video_url: null,
    ingredients: loc.ingredients,      // jsonb
    instructions: loc.instructions,    // jsonb
    cook_time: r.cook_time,
    prep_time: r.prep_time,
    servings: r.servings,
    tags: loc.tags || [],              // text[] — supabase-js mappt JS-Array korrekt
    status: "draft",
    is_public: false,
    source_type: "created",
    source_name: "Culinse",
    nutrition: r.nutrition,            // jsonb, pro Portion, vorab → kein Spoonacular
    pipeline_status: "pending_review",
    created_at: now,
    updated_at: now,
  };
}

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
      queue.put({ ...queue.get(item.slug), image: { prompt, variants: files } });
    logEvent("photographer", REROLL ? "rerolled" : "generated", { slug: item.slug, variants: files.length });
    console.log(`ok ✓ (${files.length} Variante${files.length === 1 ? "" : "n"} lokal)`);
  }
  console.log(
    `\nBilder NUR lokal erzeugt — bitte SICHTEN: open recipe-agent/state/images/\n` +
    `Beste Variante wählen: entweder die anderen löschen ODER beim Upload PICK angeben.\n` +
    `Alles neu würfeln:  ONLY=<slug> REROLL=1 node recipe-agent/workers/photographer.mjs\n` +
    `Hochladen:          UPLOAD=1 [PICK=<slug>:<n>] node recipe-agent/workers/photographer.mjs`
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
    const chosen = chooseFile(item.slug);
    if (!chosen) { console.log("übersprungen (kein lokales Bild — erst erzeugen)"); continue; }
    if (chosen.ambiguous) {
      console.log(`übersprungen — ${chosen.ambiguous.length} Varianten da (${chosen.ambiguous.join(", ")}). PICK=${item.slug}:<n> angeben oder überzählige löschen.`);
      continue;
    }

    // Idempotenz: nie doppelt einfügen
    const { data: existing, error: exErr } = await sb
      .from("user_recipes").select("id, language")
      .eq("user_id", userId).eq("translation_group", item.slug);
    if (exErr) throw exErr;
    if (existing?.length) { console.log(`übersprungen (schon ${existing.length} Zeile(n) in der DB)`); continue; }

    const imageUrl = await uploadSighted(sb, userId, item.slug, chosen);
    const rows = [rowFor(userId, item.recipe, "de", imageUrl), rowFor(userId, item.recipe, "en", imageUrl)];
    const { error } = await sb.from("user_recipes").insert(rows);
    if (error) throw new Error(`DB-Insert fehlgeschlagen: ${error.message}`);

    queue.move(item.slug, "image_ready", "pending_review", "photographer", {
      image: { ...item.image, chosen, url: imageUrl },
    });
    rememberRecipe(item.recipe);
    logEvent("photographer", "uploaded_inserted", { slug: item.slug, url: imageUrl });
    console.log("ok ✓ (hochgeladen + als Entwurf/pending_review in der DB)");
  }
  console.log("\nFertig — Rezepte warten als Entwurf auf dein Review (pipeline_status='pending_review').");
}

async function main() {
  console.log(`Fotograf · Cloudflare FLUX.1-schnell · Upload: ${DO_UPLOAD}\n`);
  if (DO_UPLOAD) await uploadPhase();
  else await generatePhase();
}

main().catch((e) => { console.error("Fotograf-Abbruch:", e?.message || e); process.exit(1); });
