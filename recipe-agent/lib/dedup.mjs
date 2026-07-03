/**
 * Doublettenschutz (Plan §5), Stufen 1+2:
 *   1. Slug/Titel normalisiert (Scout, Schnellcheck)
 *   2. Zutaten-Fingerprint via Jaccard (Prüfer, gründlich)
 * Korpus = supabase/seed/recipes.json + state/seen.json + DB (falls erreichbar).
 */
import fs from "fs";
import { SEED_RECIPES, SEEN_FILE, ensureDirs } from "./env.mjs";
import { fetchDbCorpus } from "./supa.mjs";

const JACCARD_DUP = 0.6;  // ≥ 0.6 → Dublette
const JACCARD_WARN = 0.45; // Grauzone → Warnung

export function normalizeTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(mit|und|and|with|der|die|das|the|a|an|klassische?r?|classic|einfache?r?|easy|cremige?r?|creamy)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GENERIC_INGREDIENTS = new Set([
  "salz", "pfeffer", "salz und pfeffer", "wasser", "salt", "pepper",
  "salt and pepper", "water", "zucker", "sugar",
]);

export function normalizeIngredient(name) {
  let n = String(name || "").toLowerCase().replace(/\(.*?\)/g, "").trim();
  n = n.replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss");
  n = n.split(",")[0].trim(); // "Pecorino, gerieben" → "pecorino"
  return n;
}

export function ingredientSet(ingredients) {
  return new Set(
    (ingredients || [])
      .map((i) => normalizeIngredient(i.name))
      .filter((n) => n && !GENERIC_INGREDIENTS.has(n))
  );
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function loadSeen() {
  ensureDirs();
  if (!fs.existsSync(SEEN_FILE)) return { slugs: [], titles: [], fingerprints: [] };
  return JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"));
}

export function saveSeen(seen) {
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}

export function rememberRecipe(r) {
  const seen = loadSeen();
  if (!seen.slugs.includes(r.slug)) seen.slugs.push(r.slug);
  for (const t of [r.de?.title, r.en?.title].filter(Boolean)) {
    const nt = normalizeTitle(t);
    if (!seen.titles.includes(nt)) seen.titles.push(nt);
  }
  seen.fingerprints.push({ slug: r.slug, ingredients: [...ingredientSet(r.de?.ingredients)] });
  saveSeen(seen);
}

/**
 * Korpus laden: lokal (Seed + seen) und — falls erreichbar — DB.
 * Rückgabe: { entries: [{slug,title,ingSet}], dbReachable }
 */
export async function loadCorpus({ withDb = true } = {}) {
  const entries = [];

  const seed = JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8"));
  for (const r of seed.recipes) {
    entries.push({ slug: r.slug, title: normalizeTitle(r.de?.title), ingSet: ingredientSet(r.de?.ingredients) });
    entries.push({ slug: r.slug, title: normalizeTitle(r.en?.title), ingSet: ingredientSet(r.en?.ingredients) });
  }

  const seen = loadSeen();
  for (const fp of seen.fingerprints || [])
    entries.push({ slug: fp.slug, title: null, ingSet: new Set(fp.ingredients) });
  for (const t of seen.titles || []) entries.push({ slug: null, title: t, ingSet: new Set() });
  const seenSlugs = new Set([...(seen.slugs || []), ...seed.recipes.map((r) => r.slug)]);

  let dbReachable = false;
  if (withDb) {
    const rows = await fetchDbCorpus();
    if (rows) {
      dbReachable = true;
      for (const row of rows) {
        seenSlugs.add(row.translation_group);
        entries.push({
          slug: row.translation_group,
          title: normalizeTitle(row.title),
          ingSet: ingredientSet(row.ingredients),
        });
      }
    }
  }

  return { entries, seenSlugs, dbReachable };
}

/** Stufe 1 (Scout): Slug/Titel-Schnellcheck. */
export function quickDup(slug, titleDe, titleEn, corpus) {
  if (corpus.seenSlugs.has(slug)) return `Slug existiert schon: ${slug}`;
  for (const t of [titleDe, titleEn].filter(Boolean)) {
    const nt = normalizeTitle(t);
    if (nt && corpus.entries.some((e) => e.title && e.title === nt))
      return `Titel existiert schon: „${t}"`;
  }
  return null;
}

/** Stufe 2 (Prüfer): Zutaten-Jaccard gegen den ganzen Korpus. */
export function deepDup(recipe, corpus) {
  const mine = ingredientSet(recipe.de?.ingredients);
  let worst = { sim: 0, slug: null };
  for (const e of corpus.entries) {
    if (!e.ingSet?.size || e.slug === recipe.slug) continue;
    const sim = jaccard(mine, e.ingSet);
    if (sim > worst.sim) worst = { sim, slug: e.slug };
  }
  if (worst.sim >= JACCARD_DUP)
    return { verdict: "duplicate", ...worst };
  if (worst.sim >= JACCARD_WARN)
    return { verdict: "warn", ...worst };
  return { verdict: "ok", ...worst };
}
