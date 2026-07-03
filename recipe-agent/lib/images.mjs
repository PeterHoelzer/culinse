/**
 * Fotograf-Bausteine — exakt die erprobte Technik aus supabase/seed/generate_images.mjs:
 * Cloudflare Workers AI, FLUX.1-schnell, steps: 6, NUR prompt+steps (→ quadratisch).
 * Fester Stil-Suffix (Playbook B.2, Regel 6) wird hier angehängt — der Rezept-
 * eigene image_prompt selbst bleibt rein positiv.
 */
import fs from "fs";
import path from "path";
import { ENV, IMAGES_DIR, ensureDirs } from "./env.mjs";

export const CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
export const STEPS = 6; // FLUX schnell: max 8 Schritte

export const STYLE =
  "professional food photography, appetizing, fresh, natural soft daylight, " +
  "45-degree angle, shallow depth of field, plated on a rustic table with linen, " +
  "high detail, photorealistic, no text, no watermark, no people";

export function buildPrompt(recipe) {
  if (!recipe.image_prompt) throw new Error(`${recipe.slug}: image_prompt fehlt`);
  return `${recipe.image_prompt}, ${STYLE}`;
}

export async function genCloudflare(prompt) {
  const token = ENV.CLOUDFLARE_API_TOKEN;
  const account = ENV.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account)
    throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID fehlt in .env.local.");
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CLOUDFLARE_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: STEPS }),
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data?.result?.image;
  if (!b64) throw new Error("Cloudflare: keine Bilddaten (result.image).");
  return Buffer.from(b64, "base64");
}

export function localImagePath(slug) {
  return path.join(IMAGES_DIR, `${slug}.jpg`);
}

export function localVariantPath(slug, i) {
  return path.join(IMAGES_DIR, `${slug}-v${i}.jpg`);
}

/** Alle noch vorhandenen Varianten-Dateien eines Slugs (nach dem Aussortieren). */
export function existingVariants(slug) {
  ensureDirs();
  return fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => new RegExp(`^${slug}-v\\d+\\.jpg$`).test(f))
    .sort()
    .map((f) => path.join(IMAGES_DIR, f));
}

/** Ein Bild erzeugen und NUR lokal speichern (Sichtungs-Pflicht!). */
export async function generateLocal(recipe, file = null) {
  ensureDirs();
  const prompt = buildPrompt(recipe);
  const buf = await genCloudflare(prompt);
  const target = file || localImagePath(recipe.slug);
  fs.writeFileSync(target, buf);
  return { file: target, prompt };
}

/**
 * N Varianten erzeugen (FLUX-schnell streut stark — Peter pickt die beste).
 * Kostenpunkt: 76,8 Neurons/Bild, bei 3 Varianten × 10 Rezepten ~23 % des
 * Gratis-Kontingents (10.000 Neurons/Tag).
 */
export async function generateVariants(recipe, n = 3) {
  const files = [];
  let prompt = null;
  for (let i = 1; i <= n; i++) {
    const res = await generateLocal(recipe, localVariantPath(recipe.slug, i));
    files.push(res.file);
    prompt = res.prompt;
  }
  return { files, prompt };
}

/**
 * Das GESICHTETE lokale Bild hochladen (kein Neu-Generieren!) —
 * Bucket recipe-media, Pfad {user_id}/agent/{slug}.jpg, öffentlich.
 * sourceFile = gewählte Variante (Default: {slug}.jpg).
 */
export async function uploadSighted(sb, userId, slug, sourceFile = null) {
  const file = sourceFile || localImagePath(slug);
  if (!fs.existsSync(file))
    throw new Error(`${slug}: kein lokales Bild — erst erzeugen und sichten.`);
  const buf = fs.readFileSync(file);
  const storagePath = `${userId}/agent/${slug}.jpg`;
  const up = await sb.storage.from("recipe-media").upload(storagePath, buf, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (up.error) throw up.error;
  const { data: pub } = sb.storage.from("recipe-media").getPublicUrl(storagePath);
  return pub.publicUrl;
}
