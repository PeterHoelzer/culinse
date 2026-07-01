#!/usr/bin/env node
/**
 * Culinse Rezeptbild-Generator — kostenlos, kommerziell nutzbar.
 *
 * Erzeugt zu jedem Rezept in recipes.json ein appetitliches Food-Foto mit
 * FLUX.1 [schnell] (Apache-2.0 → Bilder kommerziell frei nutzbar), speichert es
 * lokal und lädt es in den Supabase-Bucket `recipe-media` (denselben, den der
 * Editor nutzt). Ergebnis: images.json (slug → öffentliche URL), das build_seed.py
 * dann in image_url einsetzt. Ein Bild pro Gericht — DE und EN teilen es sich.
 *
 * Zwei Anbieter (Umschalten über IMAGE_PROVIDER):
 *   together     – FLUX.1-schnell-Free, beste Qualität, gratis (API-Key nötig)
 *   pollinations – keyless, sofort, etwas variabler (Default ohne Key)
 *
 * Lokal auf dem Mac ausführen (dort ist Supabase erreichbar), aus dem
 * Projektordner:
 *   node supabase/seed/generate_images.mjs
 *
 * Env (in .env.local oder vorangestellt):
 *   TOGETHER_API_KEY=...   → aktiviert FLUX über Together (api.together.ai, gratis)
 *   IMAGE_PROVIDER=pollinations|together   (Default: together wenn Key, sonst pollinations)
 *   NO_UPLOAD=1            → nur lokal erzeugen (kein Supabase-Upload, kein images.json)
 *   UPDATE_DB=1            → image_url direkt in user_recipes schreiben (für bereits
 *                           eingespielte Rezepte; setzt zusätzlich is_public=true)
 *   ONLY=slug1,slug2       → nur bestimmte Rezepte (zum Nachgenerieren)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const IMG_DIR = path.join(HERE, "images");

// ── Bildformat & Stil ─────────────────────────────────────────────────────────
const WIDTH = 1024;
const HEIGHT = 768; // 4:3 — passt zu den Rezeptkarten (object-cover)
const STYLE =
  "professional food photography, appetizing, fresh, natural soft daylight, " +
  "45-degree angle, shallow depth of field, plated on a rustic table with linen, " +
  "high detail, photorealistic, no text, no watermark, no people";

const TOGETHER_MODEL = "black-forest-labs/FLUX.1-schnell-Free"; // kostenloser Endpoint
const CLOUDFLARE_MODEL = "@cf/black-forest-labs/flux-1-schnell"; // 10k Neurons/Tag gratis
const POLLINATIONS_DELAY_MS = 9000; // fair-use-Schonfrist zwischen Anfragen

// ── .env.local laden (best effort) ────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  try {
    const p = path.join(ROOT, ".env.local");
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      if (env[k] === undefined) env[k] = t.slice(i + 1).trim();
    }
  } catch {
    /* keine .env.local — Env-Variablen müssen anders gesetzt sein */
  }
  return env;
}

const ENV = loadEnv();
const DRY_RUN = !!ENV.DRY_RUN; // nur Prompts ausgeben, nichts generieren/hochladen
const PROVIDER = (ENV.IMAGE_PROVIDER || (
  ENV.CLOUDFLARE_API_TOKEN ? "cloudflare" :
  ENV.TOGETHER_API_KEY ? "together" : "pollinations"
)).toLowerCase();
const DO_UPLOAD = !!ENV.UPLOAD && !DRY_RUN; // Upload NUR mit UPLOAD=1 — sonst erst lokal sichten
const DO_DB = !!ENV.UPDATE_DB;
const ONLY = (ENV.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(r) {
  if (r.image_prompt) return `${r.image_prompt}, ${STYLE}`;
  const title = r.en?.title || r.de?.title || r.slug;
  const desc = (r.en?.description || "").replace(/\s+/g, " ").trim();
  return `${title}. ${desc} ${STYLE}`;
}

// ── Bildanbieter ──────────────────────────────────────────────────────────────
async function genTogether(prompt) {
  const key = ENV.TOGETHER_API_KEY;
  if (!key) throw new Error("TOGETHER_API_KEY fehlt (für IMAGE_PROVIDER=together).");
  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TOGETHER_MODEL,
      prompt,
      width: WIDTH,
      height: HEIGHT,
      steps: 4, // FLUX schnell ist auf wenige Schritte ausgelegt
      n: 1,
    }),
  });
  if (!res.ok) throw new Error(`Together ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const img = await fetch(item.url);
    if (!img.ok) throw new Error(`Bild-Download ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("Together: keine Bilddaten in der Antwort.");
}

async function genPollinations(prompt) {
  const seed = Math.floor(Math.random() * 1e9);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${WIDTH}&height=${HEIGHT}&model=flux&nologo=true&seed=${seed}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pollinations ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function genCloudflare(prompt) {
  const token = ENV.CLOUDFLARE_API_TOKEN;
  const account = ENV.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) throw new Error("CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID fehlt (für IMAGE_PROVIDER=cloudflare).");
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CLOUDFLARE_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 6 }), // FLUX schnell: max 8 Schritte
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const b64 = data?.result?.image;
  if (!b64) throw new Error("Cloudflare: keine Bilddaten (result.image).");
  return Buffer.from(b64, "base64");
}

function generate(prompt) {
  if (PROVIDER === "cloudflare") return genCloudflare(prompt);
  if (PROVIDER === "together") return genTogether(prompt);
  return genPollinations(prompt);
}

// ── Supabase (nur wenn Upload/DB gewünscht) ──────────────────────────────────
async function getSupabase() {
  const url = ENV.NEXT_PUBLIC_SUPABASE_URL;
  const skey = ENV.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !skey) throw new Error("Supabase-Zugang fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, skey, { auth: { persistSession: false } });
}

async function findUserId(sb, email) {
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`Kein Nutzer mit E-Mail ${email}.`);
}

// ── Hauptlauf ─────────────────────────────────────────────────────────────────
async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "recipes.json"), "utf8"));
  const email = cfg.author_email || "peter@hoelzer.xyz";
  let recipes = cfg.recipes;
  if (ONLY.length) recipes = recipes.filter((r) => ONLY.includes(r.slug));
  if (!recipes.length) { console.error("Keine passenden Rezepte."); process.exit(1); }

  fs.mkdirSync(IMG_DIR, { recursive: true });
  console.log(`Anbieter: ${PROVIDER} · Bilder: ${recipes.length} · Upload: ${DO_UPLOAD} · DB-Update: ${DO_DB}\n`);

  if (DRY_RUN) {
    console.log("DRY_RUN — nur Prompts, keine Generierung:\n");
    for (const r of recipes) console.log(`• ${r.slug}\n  ${buildPrompt(r)}\n`);
    return;
  }

  let sb = null, userId = null;
  if (DO_UPLOAD || DO_DB) {
    sb = await getSupabase();
    userId = await findUserId(sb, email);
  }

  const images = {};
  let ok = 0, fail = 0;
  for (const r of recipes) {
    const localFile = path.join(IMG_DIR, `${r.slug}.jpg`);
    try {
      process.stdout.write(`• ${r.slug} … `);
      let buf;
      if (DO_UPLOAD) {
        // Upload-Modus: das bereits gesichtete lokale Bild nehmen — NICHT neu erzeugen
        if (!fs.existsSync(localFile)) { console.log("übersprungen (kein lokales Bild — erst erzeugen)"); fail++; continue; }
        buf = fs.readFileSync(localFile);
      } else {
        // Erzeugen + lokal speichern (zum Sichten)
        buf = await generate(buildPrompt(r));
        fs.writeFileSync(localFile, buf);
      }

      if (DO_UPLOAD) {
        const storagePath = `${userId}/seed/${r.slug}.jpg`;
        const up = await sb.storage.from("recipe-media").upload(storagePath, buf, {
          contentType: "image/jpeg",
          upsert: true,
        });
        if (up.error) throw up.error;
        const { data: pub } = sb.storage.from("recipe-media").getPublicUrl(storagePath);
        images[r.slug] = pub.publicUrl;

        if (DO_DB) {
          const { error } = await sb
            .from("user_recipes")
            .update({ image_url: pub.publicUrl, is_public: true, status: "published" })
            .eq("user_id", userId)
            .eq("translation_group", r.slug);
          if (error) throw error;
        }
        console.log("ok ✓ (hochgeladen)");
      } else {
        console.log("ok ✓ (lokal)");
      }
      ok++;
    } catch (e) {
      console.log(`FEHLER: ${e.message || e}`);
      fail++;
    }
    if (PROVIDER === "pollinations") await sleep(POLLINATIONS_DELAY_MS);
  }

  if (DO_UPLOAD && Object.keys(images).length) {
    const imgPath = path.join(HERE, "images.json");
    const existing = fs.existsSync(imgPath) ? JSON.parse(fs.readFileSync(imgPath, "utf8")) : {};
    const merged = { ...existing, ...images };
    fs.writeFileSync(imgPath, JSON.stringify(merged, null, 2));
    console.log(`\nimages.json aktualisiert (${Object.keys(images).length} neu, ${Object.keys(merged).length} gesamt).`);
  }
  console.log(`\nFertig: ${ok} ok, ${fail} fehlgeschlagen. Lokale Bilder in: ${path.relative(ROOT, IMG_DIR)}/`);
  if (!DO_UPLOAD) console.log("Nur lokal erzeugt — zuerst sichten. Zum Hochladen den bestätigten Lauf mit UPLOAD=1 voranstellen.");
}

main().catch((e) => { console.error("Abbruch:", e?.message || e); process.exit(1); });
