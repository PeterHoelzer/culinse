// ── Recipe URL importer ───────────────────────────────────────────────────────
// Fetches an arbitrary recipe page and extracts a structured recipe from its
// schema.org/Recipe JSON-LD (the format the vast majority of recipe sites emit:
// Chefkoch, BBC Good Food, NYT Cooking, Bon Appétit, AllRecipes, …).
//
// Pure, dependency-free TypeScript so it runs in a normal Next.js route on
// Vercel — no Python microservice required. Microdata/RDFa-only sites are out
// of scope for this first version (a later upgrade can add a wider parser).

import { isSafePublicUrl } from "@/lib/ssrfGuard";

export interface ParsedIngredient {
  name: string;
  amount: string; // kept as string ("1.5", "") — matches user_recipes shape
  unit: string;
}

export interface ParsedRecipe {
  title: string;
  description: string | null;
  image: string | null;
  ingredients: ParsedIngredient[];
  instructions: { step: number; text: string }[];
  prepTime: number | null; // minutes
  cookTime: number | null; // minutes
  totalTime: number | null; // minutes
  servings: number | null;
  tags: string[]; // cuisine + category + keywords, deduped
  sourceName: string | null;
  sourceUrl: string;
  lang: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function toArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ISO-8601 duration ("PT1H30M", "PT45M", "PT2H") → minutes
function parseISODuration(value: unknown): number | null {
  if (typeof value === "number" && isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) {
    // Some sites store plain "30" or "30 min"
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }
  const days = parseInt(m[1] || "0", 10);
  const hours = parseInt(m[2] || "0", 10);
  const mins = parseInt(m[3] || "0", 10);
  const total = days * 1440 + hours * 60 + mins;
  return total > 0 ? total : null;
}

function pickImage(image: unknown): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    for (const i of image) {
      const url = pickImage(i);
      if (url) return url;
    }
    return null;
  }
  if (typeof image === "object") {
    const obj = image as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return null;
}

function parseYield(y: unknown): number | null {
  const candidates = toArray(y);
  for (const c of candidates) {
    if (typeof c === "number" && c > 0) return Math.round(c);
    if (typeof c === "string") {
      const m = c.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n > 0 && n < 100) return n;
      }
    }
  }
  return null;
}

// Flatten recipeInstructions (string | string[] | HowToStep[] | HowToSection[])
function collectInstructions(ri: unknown): string[] {
  const steps: string[] = [];
  const visit = (node: unknown) => {
    if (node == null) return;
    if (typeof node === "string") {
      const text = stripHtml(node);
      if (text) {
        // A single big string often contains the whole method — split on newlines.
        if (/\n/.test(node)) {
          node.split(/\r?\n+/).map(stripHtml).filter(Boolean).forEach((s) => steps.push(s));
        } else {
          steps.push(text);
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      const type = String(obj["@type"] || "");
      // HowToSection → recurse into its steps
      if (/HowToSection/i.test(type) && obj.itemListElement) {
        visit(obj.itemListElement);
        return;
      }
      // HowToStep / plain object → take text or name
      const text = (obj.text as string) || (obj.name as string) || "";
      const clean = stripHtml(String(text));
      if (clean) steps.push(clean);
    }
  };
  visit(ri);
  // drop very short noise and consecutive duplicates
  return steps.filter((s, i) => s.length > 1 && s !== steps[i - 1]);
}

// Known measurement units (EN + DE) for light ingredient parsing.
const UNITS = new Set([
  "g", "kg", "mg", "ml", "l", "cl", "dl",
  "oz", "lb", "lbs", "cup", "cups", "tbsp", "tbs", "tablespoon", "tablespoons",
  "tsp", "teaspoon", "teaspoons", "pinch", "dash", "clove", "cloves", "slice",
  "slices", "can", "cans", "package", "packages", "stick", "sticks", "bunch",
  "handful", "piece", "pieces",
  // German
  "el", "tl", "msp", "prise", "prisen", "tasse", "tassen", "stück", "stücke",
  "dose", "dosen", "packung", "packungen", "bund", "scheibe", "scheiben",
  "zehe", "zehen", "becher", "glas", "gläser", "päckchen",
]);

const FRACTION_MAP: Record<string, string> = {
  "¼": "0.25", "½": "0.5", "¾": "0.75",
  "⅓": "0.33", "⅔": "0.67", "⅛": "0.125", "⅜": "0.375", "⅝": "0.625", "⅞": "0.875",
};

function normalizeAmountToken(tok: string): string {
  const t = tok.trim();
  for (const [u, v] of Object.entries(FRACTION_MAP)) {
    if (t.includes(u)) {
      const whole = parseFloat(t.replace(u, "").trim());
      const val = parseFloat(v) + (isNaN(whole) ? 0 : whole);
      return String(Math.round(val * 100) / 100);
    }
  }
  // "1 1/2" mixed
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return String(Math.round((parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])) * 100) / 100);
  // "1/2"
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return String(Math.round((parseInt(frac[1]) / parseInt(frac[2])) * 100) / 100);
  // "1-2" range → take first
  const range = t.match(/^(\d+[.,]?\d*)\s*[-–]\s*\d/);
  if (range) return range[1].replace(",", ".");
  return t.replace(",", ".");
}

// Light parse of an ingredient line → {amount, unit, name}; degrades gracefully.
export function parseIngredientLine(raw: string): ParsedIngredient {
  const line = stripHtml(raw);
  if (!line) return { name: "", amount: "", unit: "" };

  // leading amount (mixed number / fraction / unicode fraction / number / range).
  // Order matters: mixed "1 1/2" and fractions must be tried BEFORE a plain
  // number, otherwise "1 1/2" would match just "1".
  const amountRe = /^(\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*/;
  const am = line.match(amountRe);
  let rest = line;
  let amount = "";
  if (am) {
    amount = normalizeAmountToken(am[1]);
    rest = line.slice(am[0].length).trim();
  }

  // optional unit as the next word
  let unit = "";
  const words = rest.split(/\s+/);
  if (words.length > 1) {
    const candidate = words[0].toLowerCase().replace(/\.$/, "");
    if (UNITS.has(candidate)) {
      unit = words[0].replace(/\.$/, "");
      rest = words.slice(1).join(" ");
    }
  }

  const name = rest.trim() || line;
  return { name, amount, unit };
}

// ── JSON-LD extraction ──────────────────────────────────────────────────────────

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Lenient recovery for slightly malformed JSON-LD seen in the wild:
      // trailing commas, and (last resort) raw newlines/tabs inside strings.
      const cleaned = raw.replace(/,\s*([}\]])/g, "$1");
      try {
        blocks.push(JSON.parse(cleaned));
      } catch {
        try {
          blocks.push(JSON.parse(cleaned.replace(/[\r\n\t]+/g, " ")));
        } catch {
          /* skip this block */
        }
      }
    }
  }
  return blocks;
}

function isRecipeType(t: unknown): boolean {
  return toArray(t).some((x) => String(x).toLowerCase() === "recipe");
}

// Recursively find the first node that is a schema.org/Recipe.
export function findRecipeNode(node: unknown, depth = 0): Record<string, unknown> | null {
  if (node == null || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (isRecipeType(obj["@type"])) return obj;
    if (obj["@graph"]) {
      const found = findRecipeNode(obj["@graph"], depth + 1);
      if (found) return found;
    }
    // Some sites nest the recipe under mainEntity
    if (obj.mainEntity) {
      const found = findRecipeNode(obj.mainEntity, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function htmlLang(html: string): string | null {
  const m = html.match(/<html[^>]+lang=["']([a-zA-Z-]{2,5})["']/i);
  return m ? m[1].slice(0, 2).toLowerCase() : null;
}

function authorName(a: unknown): string | null {
  for (const x of toArray(a)) {
    if (typeof x === "string") return x;
    if (x && typeof x === "object") {
      const n = (x as Record<string, unknown>).name;
      if (typeof n === "string") return n;
    }
  }
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────────

export function recipeFromJsonLd(node: Record<string, unknown>, url: string): ParsedRecipe | null {
  const title = stripHtml(String(node.name || node.headline || "")).slice(0, 200);
  if (!title) return null;

  const ingredients = toArray(node.recipeIngredient as unknown)
    .map((i) => parseIngredientLine(String(i)))
    .filter((i) => i.name);

  const instructions = collectInstructions(node.recipeInstructions).map((text, idx) => ({
    step: idx + 1,
    text,
  }));

  // Need at least *some* substance to call it a recipe.
  if (ingredients.length === 0 && instructions.length === 0) return null;

  const prepTime = parseISODuration(node.prepTime);
  const cookTime = parseISODuration(node.cookTime);
  let totalTime = parseISODuration(node.totalTime);
  if (!totalTime && (prepTime || cookTime)) totalTime = (prepTime || 0) + (cookTime || 0);

  const tags = Array.from(
    new Set(
      [
        ...toArray(node.recipeCuisine as unknown).map((x) => String(x)),
        ...toArray(node.recipeCategory as unknown).map((x) => String(x)),
        ...(typeof node.keywords === "string"
          ? node.keywords.split(",")
          : toArray(node.keywords as unknown).map((x) => String(x))),
      ]
        .map((t) => stripHtml(t).toLowerCase())
        .filter((t) => t && t.length < 30)
    )
  ).slice(0, 8);

  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  return {
    title,
    description: node.description ? stripHtml(String(node.description)).slice(0, 500) : null,
    image: pickImage(node.image),
    ingredients,
    instructions,
    prepTime,
    cookTime,
    totalTime,
    servings: parseYield(node.recipeYield),
    tags,
    sourceName: authorName(node.author) || host || null,
    sourceUrl: url,
    lang: null,
  };
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  let html: string;
  try {
    // Follow redirects manually so every hop passes the SSRF guard — with
    // redirect:"follow" an approved public URL could bounce the fetch to an
    // internal host (169.254.169.254, localhost, …).
    const MAX_REDIRECTS = 3;
    let current = new URL(url);
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafePublicUrl(current))) return null;
      res = await fetch(current.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CulinseBot/1.0; +https://culinse.com/bot)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || hop === MAX_REDIRECTS) return null;
        current = new URL(location, current);
        continue;
      }
      break;
    }
    if (!res || !res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/i.test(ct)) return null;
    html = (await res.text()).slice(0, 3_000_000); // cap at ~3 MB
  } catch {
    return null;
  }

  const blocks = extractJsonLdBlocks(html);
  let node: Record<string, unknown> | null = null;
  for (const b of blocks) {
    node = findRecipeNode(b);
    if (node) break;
  }
  if (!node) return null;

  const recipe = recipeFromJsonLd(node, url);
  if (!recipe) return null;

  // Enrich source/lang from page <head> when JSON-LD didn't give us a good one.
  const siteName = metaContent(html, "og:site_name");
  if (siteName) recipe.sourceName = stripHtml(siteName);
  recipe.lang = htmlLang(html);
  if (!recipe.image) recipe.image = metaContent(html, "og:image");

  return recipe;
}
