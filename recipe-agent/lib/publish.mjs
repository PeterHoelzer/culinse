/**
 * Gemeinsame Upload-/Insert-Logik für Fotograf (CLI) und Sichtungs-Seite (Browser).
 * Ein Rezept gilt erst als fertig, wenn das GESICHTETE Bild hochgeladen und
 * beide Sprachzeilen als Entwurf (pipeline_status='pending_review') in der DB sind.
 */
import fs from "fs";
import { SEED_RECIPES, logEvent } from "./env.mjs";
import * as queue from "./queue.mjs";
import { uploadSighted, localImagePath, localVariantPath, existingVariants } from "./images.mjs";
import { rememberRecipe } from "./dedup.mjs";

export function authorEmail() {
  try { return JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8")).author_email || "peter@hoelzer.xyz"; }
  catch { return "peter@hoelzer.xyz"; }
}

/**
 * Gewählte Bilddatei bestimmen. Priorität:
 *   1. pickMap (ENV PICK="slug:n")           — CLI-Übersteuerung
 *   2. image.chosen_variant im Queue-Eintrag — Klick auf der Sichtungs-Seite
 *   3. genau EINE übrige Varianten-Datei     — Rest wurde gelöscht
 *   4. klassisches {slug}.jpg                — Einzelbild-Modus
 * Rückgabe: Pfad | { ambiguous: [Dateinamen] } | null
 */
export function resolveChosenFile(slug, pickMap = {}) {
  if (pickMap[slug]) {
    const f = localVariantPath(slug, pickMap[slug]);
    if (!fs.existsSync(f)) throw new Error(`${slug}: Variante v${pickMap[slug]} existiert nicht.`);
    return f;
  }
  const item = queue.get(slug);
  const chosen = item?.image?.chosen_variant;
  if (chosen) {
    const f = localVariantPath(slug, chosen);
    if (fs.existsSync(f)) return f;
  }
  const variants = existingVariants(slug);
  if (variants.length === 1) return variants[0];
  if (variants.length === 0 && fs.existsSync(localImagePath(slug))) return localImagePath(slug);
  if (variants.length > 1) return { ambiguous: variants.map((f) => f.split("/").pop()) };
  return null;
}

export function rowFor(userId, r, lang, imageUrl) {
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
    tags: loc.tags || [],              // text[]
    status: "draft",
    is_public: false,
    source_type: "created",
    source_name: "Culinse",
    nutrition: r.nutrition,            // jsonb, pro Portion, vorab
    pipeline_status: "pending_review",
    created_at: now,
    updated_at: now,
  };
}

/**
 * Ein image_ready-Rezept hochladen + als Entwurf einfügen.
 * Rückgabe: { ok: true, url } | { skip: "grund" }
 */
export async function uploadOne(sb, userId, item, chosenFile) {
  // Idempotenz: nie doppelt einfügen
  const { data: existing, error: exErr } = await sb
    .from("user_recipes").select("id, language")
    .eq("user_id", userId).eq("translation_group", item.slug);
  if (exErr) throw exErr;
  if (existing?.length) return { skip: `schon ${existing.length} Zeile(n) in der DB` };

  const imageUrl = await uploadSighted(sb, userId, item.slug, chosenFile);
  const rows = [rowFor(userId, item.recipe, "de", imageUrl), rowFor(userId, item.recipe, "en", imageUrl)];
  const { error } = await sb.from("user_recipes").insert(rows);
  if (error) throw new Error(`DB-Insert fehlgeschlagen: ${error.message}`);

  queue.move(item.slug, "image_ready", "pending_review", "photographer", {
    image: { ...item.image, chosen: chosenFile, url: imageUrl },
  });
  rememberRecipe(item.recipe);
  logEvent("photographer", "uploaded_inserted", { slug: item.slug, url: imageUrl });
  return { ok: true, url: imageUrl };
}
