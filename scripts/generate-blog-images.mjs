#!/usr/bin/env node
/**
 * Blog-Titelbilder via Cloudflare Workers AI (FLUX.1-schnell) — dieselbe
 * erprobte, KOSTENLOSE und kommerziell nutzbare Technik wie der Rezept-Agent
 * (Apache-2.0-Modell, keine Fremdrechte, kein Stock-Abmahnrisiko).
 *
 * - 25 Motive für 39 Artikel (DE/EN-Sprachpaare teilen sich ein Bild)
 * - Ausgabe: public/blog/<name>.jpg, center-crop auf 1024×536 (og-Ratio 1.91:1)
 *   via macOS `sips` — kein zusätzliches npm-Paket nötig
 * - Idempotent: vorhandene Dateien werden übersprungen (einzelne löschen = neu würfeln)
 *
 * Aufruf:  node scripts/generate-blog-images.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "blog");
const STEPS = 6;

// .env.local lesen (wie recipe-agent)
const ENV = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) ENV[m[1]] = m[2].trim();
}

// Stil-Suffix — identisch zum Fotografen des Rezept-Agenten (Playbook B.2)
const STYLE =
  "professional food photography, appetizing, fresh, natural soft daylight, " +
  "45-degree angle, shallow depth of field, plated on a rustic table with linen, " +
  "high detail, photorealistic, no text, no watermark, no people";

// 25 Motive — Dateiname = EN-Slug (bzw. DE-Slug bei DE-only-Artikeln).
// Prompts nach den Bild-Prompt-Regeln: rein positiv, spezifisch, Farben/Texturen.
const MOTIFS = [
  // ── Sprachpaare (ein Bild für EN + DE) ──
  { file: "how-to-meal-prep-for-the-week", prompt: "five glass meal prep containers in a row filled with colorful rice bowls, grilled chicken, roasted vegetables and fresh greens, organized weekly meal prep spread" },
  { file: "best-free-meal-planner-apps-2026", prompt: "modern kitchen counter with a notebook meal plan, fresh vegetables, a bowl of tomatoes and a cutting board with herbs, organized cooking planning scene" },
  { file: "weekly-meal-plan-with-shopping-list", prompt: "open notebook with a handwritten weekly meal grid on a wooden table, surrounded by fresh bell peppers, carrots, a wicker basket and a pen" },
  { file: "easy-dinner-ideas-for-busy-weeknights", prompt: "steaming cast iron skillet with golden seared chicken, cherry tomatoes and green beans, quick weeknight dinner, warm evening kitchen light" },
  { file: "quick-dinner-recipes-under-30-minutes", prompt: "bright bowl of creamy lemon pasta with basil and parmesan beside a small kitchen timer, fast fresh dinner scene" },
  { file: "high-protein-meals-for-muscle-building", prompt: "grilled chicken breast sliced over brown rice with steamed broccoli and edamame in a bowl, high protein athlete meal, vibrant colors" },
  { file: "vegetarian-dinner-ideas-easy-recipes", prompt: "three colorful vegetarian bowls with roasted chickpeas, grilled halloumi, avocado, quinoa and bright vegetables on a linen tablecloth" },
  { file: "mediterranean-diet-recipes-beginners", prompt: "mediterranean table spread with olives, cherry tomatoes, feta cheese, hummus, olive oil in a small jug and warm flatbread" },
  { file: "budget-meals-under-5-euros", prompt: "rustic pot of hearty red lentil stew with carrots beside dried beans, rice and pasta in glass jars, simple affordable pantry cooking" },
  { file: "meal-prep-for-beginners", prompt: "neat rows of glass containers with rice, roasted vegetables and chicken on a bright kitchen counter, beginner meal prep sunday, clean organized scene" },
  { file: "what-should-i-cook-tonight", prompt: "wooden kitchen table at dusk with fresh ingredients laid out, eggs, pasta, tomatoes, garlic and herbs, warm cozy evening cooking inspiration" },
  { file: "weekly-grocery-list-from-meal-plan", prompt: "paper grocery list with a pen on a kitchen table next to a full shopping basket with leafy greens, baguette, bell peppers and milk bottle" },
  { file: "meal-planning-on-a-budget", prompt: "market basket overflowing with seasonal vegetables, potatoes, onions, carrots and cabbage on a rustic table, affordable fresh produce, warm daylight" },
  { file: "family-meal-planning", prompt: "large family dinner table with a big pot of pasta, shared salad bowl, bread basket and several plates, generous inviting home cooking" },
  // ── EN-only ──
  { file: "meal-prep-for-weight-loss", prompt: "light meal prep containers with grilled chicken salad, zucchini noodles, colorful raw vegetables and berries, fresh healthy weight loss meals" },
  { file: "high-protein-vegetarian-meals", prompt: "protein rich vegetarian spread with crispy tofu cubes, tempeh strips, chickpea bowl, greek yogurt and edamame, colorful plant based table" },
  { file: "easy-summer-dinner-ideas", prompt: "summer dinner table outdoors with caprese salad, grilled corn, watermelon wedges and a chilled pitcher of lemon water, golden hour light" },
  { file: "cheap-healthy-meals", prompt: "budget pantry staples arranged on wood, brown eggs in a bowl, oats in a jar, dried lentils, canned tomatoes and fresh carrots, honest simple cooking" },
  { file: "5-ingredient-dinners", prompt: "flat lay of exactly five ingredients on a rustic board, pasta nest, cherry tomatoes, garlic cloves, parmesan wedge and fresh basil bunch, minimalist cooking" },
  // ── DE-only ──
  { file: "proteinreiches-fruehstueck", prompt: "protein breakfast table with a creamy skyr bowl topped with berries, soft boiled eggs, whole grain bread and a small glass of milk, bright morning light" },
  { file: "sommer-meal-prep", prompt: "mason jar salads in a row with layered quinoa, cucumber, tomatoes and chickpeas beside a small cooler bag, fresh summer meal prep, light airy scene" },
  { file: "schnelle-grillbeilagen", prompt: "barbecue side dishes spread with coleslaw bowl, tzatziki dip, grilled corn cobs, potato salad and flatbread on a wooden garden table" },
  { file: "rezepte-fuer-studenten", prompt: "small student kitchen scene with a single pot of one-pot pasta, wooden spoon, simple ingredients and a small cutting board, cozy compact cooking" },
  { file: "was-koche-ich-am-wochenende", prompt: "relaxed weekend brunch table with a shakshuka pan, fresh bread, orange juice and a small vase of flowers, slow morning atmosphere" },
  { file: "vorratshaltung-speisekammer", prompt: "well organized pantry shelf with glass jars of rice, lentils, pasta and oats, canned tomatoes and neatly stacked supplies, warm tidy storage" },
];

async function generate(motif) {
  const outPath = path.join(OUT_DIR, `${motif.file}.jpg`);
  if (fs.existsSync(outPath)) return "skip";

  const url = `https://api.cloudflare.com/client/v4/accounts/${ENV.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: `${motif.prompt}, ${STYLE}`, steps: STEPS }),
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();
  const b64 = data?.result?.image;
  if (!b64) throw new Error("keine Bilddaten");
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));

  // Center-Crop auf og-Ratio 1.91:1 (1024×536) via macOS sips
  execSync(`sips -c 536 1024 "${outPath}" >/dev/null 2>&1`);
  return "ok";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0, skip = 0, fail = 0;
  for (const m of MOTIFS) {
    try {
      const r = await generate(m);
      if (r === "skip") { skip++; console.log(`→ ${m.file}: übersprungen (existiert)`); }
      else { ok++; console.log(`✓ ${m.file}`); }
    } catch (e) {
      fail++;
      console.log(`✗ ${m.file}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log(`\nFERTIG: ${ok} neu, ${skip} übersprungen, ${fail} Fehler`);
}

main();
