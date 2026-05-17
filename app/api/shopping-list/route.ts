import { NextRequest, NextResponse } from "next/server";

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;
const EDAMAM_APP_ID   = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY  = process.env.EDAMAM_APP_KEY;
const TASTY_KEY       = process.env.TASTY_API_KEY;
const MDB_OFFSET      = 9_000_000;

// ── Category mapping (English aisle → German) ─────────────────────────────────
const AISLE_MAP: Record<string, { label: string; emoji: string }> = {
  "produce":                        { label: "Gemüse & Obst",      emoji: "🥦" },
  "vegetables":                     { label: "Gemüse & Obst",      emoji: "🥦" },
  "fruit":                          { label: "Gemüse & Obst",      emoji: "🥦" },
  "fresh vegetables":               { label: "Gemüse & Obst",      emoji: "🥦" },
  "fresh fruits":                   { label: "Gemüse & Obst",      emoji: "🥦" },
  "meat":                           { label: "Fleisch & Fisch",     emoji: "🥩" },
  "meat counter":                   { label: "Fleisch & Fisch",     emoji: "🥩" },
  "poultry counter":                { label: "Fleisch & Fisch",     emoji: "🥩" },
  "seafood":                        { label: "Fleisch & Fisch",     emoji: "🥩" },
  "fish":                           { label: "Fleisch & Fisch",     emoji: "🥩" },
  "dairy":                          { label: "Milchprodukte",       emoji: "🧀" },
  "cheese":                         { label: "Milchprodukte",       emoji: "🧀" },
  "milk, eggs, other dairy":        { label: "Milchprodukte",       emoji: "🧀" },
  "eggs":                           { label: "Milchprodukte",       emoji: "🧀" },
  "bakery/bread":                   { label: "Brot & Backwaren",    emoji: "🍞" },
  "bread":                          { label: "Brot & Backwaren",    emoji: "🍞" },
  "pasta and rice":                 { label: "Pasta, Reis & Körner",emoji: "🍝" },
  "pasta":                          { label: "Pasta, Reis & Körner",emoji: "🍝" },
  "rice":                           { label: "Pasta, Reis & Körner",emoji: "🍝" },
  "grains":                         { label: "Pasta, Reis & Körner",emoji: "🍝" },
  "cereal":                         { label: "Pasta, Reis & Körner",emoji: "🍝" },
  "canned and jarred":              { label: "Konserven",           emoji: "🥫" },
  "canned":                         { label: "Konserven",           emoji: "🥫" },
  "baking":                         { label: "Backen & Süßes",      emoji: "🧁" },
  "baking ingredients":             { label: "Backen & Süßes",      emoji: "🧁" },
  "sweet":                          { label: "Backen & Süßes",      emoji: "🧁" },
  "spices and seasonings":          { label: "Gewürze & Kräuter",   emoji: "🌶" },
  "spices":                         { label: "Gewürze & Kräuter",   emoji: "🌶" },
  "herbs":                          { label: "Gewürze & Kräuter",   emoji: "🌶" },
  "condiments":                     { label: "Saucen & Öle",        emoji: "🫙" },
  "oil, vinegar, salad dressing":   { label: "Saucen & Öle",        emoji: "🫙" },
  "oil":                            { label: "Saucen & Öle",        emoji: "🫙" },
  "sauce":                          { label: "Saucen & Öle",        emoji: "🫙" },
  "frozen":                         { label: "Tiefkühl",            emoji: "🧊" },
  "beverages":                      { label: "Getränke",            emoji: "🥤" },
  "drinks":                         { label: "Getränke",            emoji: "🥤" },
};

function resolveCategory(aisle?: string): { label: string; emoji: string } {
  if (!aisle) return { label: "Sonstiges", emoji: "🛒" };
  const key = aisle.toLowerCase().split(";")[0].trim();
  for (const [pattern, cat] of Object.entries(AISLE_MAP)) {
    if (key.includes(pattern)) return cat;
  }
  return { label: "Sonstiges", emoji: "🛒" };
}

// ── Ingredient normalisation ───────────────────────────────────────────────────
interface RawIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle?: string;
  original?: string;
}

interface ShoppingItem {
  name: string;
  amount: number | null;
  unit: string;
  original: string;
  category: string;
  categoryEmoji: string;
}

// Words to strip when building the dedup key (adjectives, cooking states, etc.)
const STRIP_WORDS = new Set([
  // Freshness / prep state
  "fresh", "dried", "frozen", "canned", "raw", "cooked", "whole", "halved",
  "chopped", "minced", "diced", "sliced", "grated", "shredded", "crushed",
  "ground", "toasted", "roasted", "peeled", "deveined", "trimmed", "rinsed",
  "pureed", "mashed", "boiled", "steamed", "fried", "baked", "aged", "herbed",
  // Size
  "large", "medium", "small", "extra", "fine", "coarse", "thick", "thin",
  "big", "mini", "giant",
  // Quality / marketing
  "organic", "natural", "pure", "plain", "regular", "premium", "additional",
  "equivalent", "boneless", "skinless", "lean", "low-fat", "full-fat",
  "unsalted", "salted", "sweetened", "unsweetened", "unbleached",
  // Colour (usually not the primary dedup dimension)
  "black", "white", "red", "green", "yellow",
]);

// Names that are NOT real ingredients
const BLOCKED_NAMES = new Set([
  "serving", "servings", "portion", "portions", "yield", "yields",
  "or", "and", "to taste", "as needed", "as required", "to garnish",
  "optional", "for garnish", "for serving", "for topping",
]);

// Units that indicate broken/non-ingredient data
const BLOCKED_UNITS = new Set([
  "serving", "servings", "portion", "portions", "yield", "yields",
  "recipe", "recipes", "batch", "batches",
]);

function isBlocked(name: string, unit?: string): boolean {
  const n = name.toLowerCase().trim();
  if (!n || n.length < 2) return true;
  if (BLOCKED_NAMES.has(n)) return true;

  // Block if unit is a serving/yield descriptor
  if (unit) {
    const u = unit.toLowerCase().trim();
    if (BLOCKED_UNITS.has(u)) return true;
    if (/serving/i.test(u)) return true;
  }

  // Single word conjunction
  if (/^(or|and|the|a|an)$/i.test(n)) return true;
  // Serving description in name: "4 servings", "serves 2"
  if (/\b(serving|serves?|portion|yield)\b/i.test(n)) return true;
  // Contains " or " → ambiguous compound
  if (/ or /i.test(n)) return true;
  // Contains " and " → compound like "salt and pepper" — split handled below
  // (filter here if > 2 real words after "and", i.e. it's a description)
  if (/ and /i.test(n) && n.split(/\s+/).length > 4) return true;
  // Just a number
  if (/^\d+(\.\d+)?$/.test(n)) return true;
  // Too many words → likely a description, not an ingredient (> 6 words)
  if (n.split(/\s+/).length > 6) return true;
  // Starts with "additional", "equivalent", "extra" → filler words in descriptions
  if (/^(additional|equivalent|optional|extra large|extra small)/i.test(n)) return true;

  return false;
}

function normalizeUnit(u: string): string {
  return u.toLowerCase().trim()
    .replace(/tablespoons?/, "EL")
    .replace(/teaspoons?/, "TL")
    .replace(/cups?/, "Tasse")
    .replace(/ounces?|oz/, "oz")
    .replace(/pounds?|lbs?/, "g")
    .replace(/grams?/, "g")
    .replace(/kilograms?|kg/, "kg")
    .replace(/milliliters?|ml/, "ml")
    .replace(/liters?/, "L");
}

// Build a dedup key by stripping adjectives and normalising spelling
function dedupKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove parenthetical notes like "(grated)" or "(optional)"
    .replace(/\(.*?\)/g, "")
    // Remove leading/trailing punctuation
    .replace(/[,;:.!?]+$/, "")
    .trim()
    // Split into words, drop strip-words
    .split(/\s+/)
    .filter(w => !STRIP_WORDS.has(w))
    .join(" ")
    .trim()
    // Common spelling variants → canonical form
    .replace(/parmigiano.*/,  "parmesan")
    .replace(/parmesan.*/,    "parmesan")
    .replace(/chilli/,        "chili")
    .replace(/bell pepper/,   "paprika")
    .replace(/black pepper/,  "pepper")
    .replace(/white pepper/,  "pepper")
    .replace(/sea salt/,      "salt")
    .replace(/kosher salt/,   "salt")
    .replace(/table salt/,    "salt")
    .replace(/olive oil.*/,   "olive oil")
    .replace(/vegetable oil.*/, "oil")
    .replace(/canola oil.*/,  "oil")
    .replace(/spring onion/, "green onion")
    .replace(/scallion/,      "green onion");
}

// Split "X and Y" compound names into individual ingredients
function splitCompound(ing: RawIngredient): RawIngredient[] {
  const n = ing.name.toLowerCase();
  // Only split simple 2-part compounds like "salt and pepper"
  if (/ and /i.test(n) && n.split(/\s+/).length <= 4) {
    return n.split(/ and /i).map(part => ({
      ...ing,
      name: part.trim(),
      amount: 0,   // amount is ambiguous when split
      unit: "",
    }));
  }
  return [ing];
}

function aggregateIngredients(raws: RawIngredient[]): ShoppingItem[] {
  // Dedup key = normalised name only (ignore unit to merge "1 tbs parmesan" + "0.8 Tasse parmesan")
  const map = new Map<string, ShoppingItem>();

  for (const raw of raws) {
    // Expand compound "X and Y" ingredients
    const expanded = splitCompound(raw);

    for (const ing of expanded) {
      if (!ing.name?.trim()) continue;
      if (isBlocked(ing.name, ing.unit)) continue;

      const unit = normalizeUnit(ing.unit || "");
      const key  = dedupKey(ing.name);            // unit NOT in key
      const { label, emoji } = resolveCategory(ing.aisle);

      if (map.has(key)) {
        const existing = map.get(key)!;
        // Only add amounts when units match
        if (existing.unit === unit && existing.amount !== null && ing.amount) {
          existing.amount = Math.round((existing.amount + ing.amount) * 100) / 100;
        }
        // Prefer the shorter, cleaner display name
        if (ing.name.trim().length < existing.name.length) {
          existing.name = ing.name.trim();
        }
      } else {
        map.set(key, {
          name: ing.name.trim(),
          amount: ing.amount || null,
          unit,
          original: ing.original || ing.name,
          category: label,
          categoryEmoji: emoji,
        });
      }
    }
  }

  return Array.from(map.values());
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

async function fetchSpoonacularIngredients(ids: string[]): Promise<RawIngredient[]> {
  if (!SPOONACULAR_KEY || ids.length === 0) return [];
  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/informationBulk?ids=${ids.join(",")}&includeNutrition=false&apiKey=${SPOONACULAR_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: Array<{ extendedIngredients?: Array<{ name: string; amount: number; unit: string; aisle: string; original: string }> }> = await res.json();
    return data.flatMap(r =>
      (r.extendedIngredients || []).map(i => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        aisle: i.aisle,
        original: i.original,
      }))
    );
  } catch { return []; }
}

async function fetchMealDBIngredients(ids: string[]): Promise<RawIngredient[]> {
  const results: RawIngredient[] = [];
  for (const id of ids) {
    try {
      const realId = parseInt(id) - MDB_OFFSET;
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${realId}`, { next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const data = await res.json();
      const meal = data.meals?.[0];
      if (!meal) continue;
      for (let n = 1; n <= 20; n++) {
        const name = meal[`strIngredient${n}`];
        const measure = meal[`strMeasure${n}`];
        if (!name?.trim()) break;
        const parts = (measure || "").trim().split(" ");
        const amount = parseFloat(parts[0]) || 0;
        const unit = parts.slice(1).join(" ");
        results.push({ name, amount, unit, aisle: undefined, original: `${measure} ${name}`.trim() });
      }
    } catch { continue; }
  }
  return results;
}

async function fetchEdamamIngredients(ids: string[]): Promise<RawIngredient[]> {
  const results: RawIngredient[] = [];
  for (const id of ids) {
    try {
      const realId = id.replace("edamam_", "");
      const res = await fetch(
        `https://api.edamam.com/api/recipes/v2/${realId}?type=public&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
        { next: { revalidate: 86400 }, headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const r = data.recipe;
      if (!r) continue;
      for (const ing of (r.ingredients || []) as Array<{ food: string; quantity: number; measure: string; text: string }>) {
        results.push({ name: ing.food, amount: ing.quantity, unit: ing.measure || "", aisle: undefined, original: ing.text });
      }
    } catch { continue; }
  }
  return results;
}

async function fetchTastyIngredients(ids: string[]): Promise<RawIngredient[]> {
  const results: RawIngredient[] = [];
  for (const id of ids) {
    try {
      const realId = id.replace("tasty_", "");
      const res = await fetch(`https://tasty.p.rapidapi.com/recipes/get-more-info?id=${realId}`, {
        headers: { "x-rapidapi-host": "tasty.p.rapidapi.com", "x-rapidapi-key": TASTY_KEY || "" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;
      const r = await res.json();
      const components = (r.sections || []).flatMap(
        (sec: { components?: Array<{ ingredient?: { name: string }; measurements?: Array<{ quantity: number; unit?: { abbreviation: string } }>; raw_text?: string }> }) =>
          sec.components || []
      );
      for (const c of components) {
        const name = c.ingredient?.name || c.raw_text || "";
        const amount = c.measurements?.[0]?.quantity || 0;
        const unit = c.measurements?.[0]?.unit?.abbreviation || "";
        results.push({ name, amount, unit, aisle: undefined, original: c.raw_text || name });
      }
    } catch { continue; }
  }
  return results;
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const recipeIds: string[] = body.recipeIds || [];

  if (recipeIds.length === 0) {
    return NextResponse.json({ items: [], grouped: {} });
  }

  // Partition by source
  const spoonIds  = recipeIds.filter(id => /^\d+$/.test(id));
  const mealdbIds = recipeIds.filter(id => /^\d+$/.test(id) && parseInt(id) >= MDB_OFFSET);
  const spoonOnly = spoonIds.filter(id => parseInt(id) < MDB_OFFSET);
  const edamamIds = recipeIds.filter(id => id.startsWith("edamam_"));
  const tastyIds  = recipeIds.filter(id => id.startsWith("tasty_"));

  const [spoonRaw, mealdbRaw, edamamRaw, tastyRaw] = await Promise.all([
    fetchSpoonacularIngredients(spoonOnly),
    fetchMealDBIngredients(mealdbIds),
    fetchEdamamIngredients(edamamIds),
    fetchTastyIngredients(tastyIds),
  ]);

  const allRaw = [...spoonRaw, ...mealdbRaw, ...edamamRaw, ...tastyRaw];
  const items = aggregateIngredients(allRaw);

  // Group by category
  const grouped: Record<string, { emoji: string; items: ShoppingItem[] }> = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = { emoji: item.categoryEmoji, items: [] };
    }
    grouped[item.category].items.push(item);
  }

  // Sort items within each category alphabetically
  for (const cat of Object.values(grouped)) {
    cat.items.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return NextResponse.json({ items, grouped });
}
