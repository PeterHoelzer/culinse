import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateTexts } from "@/lib/translate";

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;
const EDAMAM_APP_ID   = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY  = process.env.EDAMAM_APP_KEY;
const TASTY_KEY       = process.env.TASTY_API_KEY;
const MDB_OFFSET      = 9_000_000;

// ── Category mapping (English aisle → German) ─────────────────────────────────
const AISLE_MAP: Record<string, { label: string; emoji: string }> = {
  "produce":                        { label: "Produce",             emoji: "🥦" },
  "vegetables":                     { label: "Produce",             emoji: "🥦" },
  "fruit":                          { label: "Produce",             emoji: "🥦" },
  "fresh vegetables":               { label: "Produce",             emoji: "🥦" },
  "fresh fruits":                   { label: "Produce",             emoji: "🥦" },
  "meat":                           { label: "Meat & Fish",         emoji: "🥩" },
  "meat counter":                   { label: "Meat & Fish",         emoji: "🥩" },
  "poultry counter":                { label: "Meat & Fish",         emoji: "🥩" },
  "seafood":                        { label: "Meat & Fish",         emoji: "🥩" },
  "fish":                           { label: "Meat & Fish",         emoji: "🥩" },
  "dairy":                          { label: "Dairy",               emoji: "🧀" },
  "cheese":                         { label: "Dairy",               emoji: "🧀" },
  "milk, eggs, other dairy":        { label: "Dairy",               emoji: "🧀" },
  "eggs":                           { label: "Dairy",               emoji: "🧀" },
  "bakery/bread":                   { label: "Bread & Bakery",      emoji: "🍞" },
  "bread":                          { label: "Bread & Bakery",      emoji: "🍞" },
  "pasta and rice":                 { label: "Pasta, Rice & Grains",emoji: "🍝" },
  "pasta":                          { label: "Pasta, Rice & Grains",emoji: "🍝" },
  "rice":                           { label: "Pasta, Rice & Grains",emoji: "🍝" },
  "grains":                         { label: "Pasta, Rice & Grains",emoji: "🍝" },
  "cereal":                         { label: "Pasta, Rice & Grains",emoji: "🍝" },
  "canned and jarred":              { label: "Canned Goods",        emoji: "🥫" },
  "canned":                         { label: "Canned Goods",        emoji: "🥫" },
  "baking":                         { label: "Baking & Sweets",     emoji: "🧁" },
  "baking ingredients":             { label: "Baking & Sweets",     emoji: "🧁" },
  "sweet":                          { label: "Baking & Sweets",     emoji: "🧁" },
  "spices and seasonings":          { label: "Spices & Herbs",      emoji: "🌶" },
  "spices":                         { label: "Spices & Herbs",      emoji: "🌶" },
  "herbs":                          { label: "Spices & Herbs",      emoji: "🌶" },
  "condiments":                     { label: "Sauces & Oils",       emoji: "🫙" },
  "oil, vinegar, salad dressing":   { label: "Sauces & Oils",       emoji: "🫙" },
  "oil":                            { label: "Sauces & Oils",       emoji: "🫙" },
  "sauce":                          { label: "Sauces & Oils",       emoji: "🫙" },
  "frozen":                         { label: "Frozen",              emoji: "🧊" },
  "beverages":                      { label: "Beverages",           emoji: "🥤" },
  "drinks":                         { label: "Beverages",           emoji: "🥤" },
};

// German labels for the shopping-list categories (header display on the DE site).
const CATEGORY_DE: Record<string, string> = {
  "Produce": "Obst & Gemüse",
  "Meat & Fish": "Fleisch & Fisch",
  "Dairy": "Milchprodukte",
  "Bread & Bakery": "Brot & Backwaren",
  "Pasta, Rice & Grains": "Nudeln, Reis & Getreide",
  "Canned Goods": "Konserven",
  "Baking & Sweets": "Backen & Süßes",
  "Spices & Herbs": "Gewürze & Kräuter",
  "Sauces & Oils": "Saucen & Öle",
  "Frozen": "Tiefkühl",
  "Beverages": "Getränke",
  "Other": "Sonstiges",
};

function resolveCategory(aisle?: string): { label: string; emoji: string } {
  if (!aisle) return { label: "Other", emoji: "🛒" };
  const key = aisle.toLowerCase().split(";")[0].trim();
  for (const [pattern, cat] of Object.entries(AISLE_MAP)) {
    if (key.includes(pattern)) return cat;
  }
  return { label: "Other", emoji: "🛒" };
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
  "cracked", "packed", "heaping", "leveled", "sifted", "melted", "softened",
  // Adverbs of preparation
  "freshly", "finely", "roughly", "coarsely", "thinly", "thickly",
  "lightly", "heavily",
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
  if (/ and /i.test(n) && n.split(/\s+/).length > 6) return true;
  // Just a number
  if (/^\d+(\.\d+)?$/.test(n)) return true;
  // Too many words → likely a description, not an ingredient (> 6 words)
  if (n.split(/\s+/).length > 6) return true;
  // Starts with "additional", "equivalent", "extra" → filler words in descriptions
  if (/^(additional|equivalent|optional|extra large|extra small)/i.test(n)) return true;

  return false;
}

// ── Unit conversion to metric ──────────────────────────────────────────────────

// Liquids: use ml not g
const LIQUID_KEYWORDS = new Set([
  "water", "milk", "cream", "broth", "stock", "wine", "vinegar", "oil",
  "olive oil", "vegetable oil", "coconut oil", "canola oil", "sunflower oil",
  "juice", "beer", "sake", "mirin", "sauce", "soy sauce", "fish sauce",
  "worcestershire", "hot sauce", "sriracha", "tabasco", "ketchup",
  "tomato sauce", "pasta sauce", "coconut milk", "coconut cream",
  "buttermilk", "half and half", "whipping cream", "heavy cream",
  "chicken broth", "beef broth", "vegetable broth", "dashi", "syrup",
  "maple syrup", "agave", "molasses", "honey", "tahini", "aquafaba",
  "lemon juice", "lime juice", "orange juice", "apple cider", "balsamic",
]);

function isLiquid(ingredientName: string): boolean {
  const n = ingredientName.toLowerCase().trim();
  for (const kw of LIQUID_KEYWORDS) {
    // Match keyword only if NOT followed by a hyphen (avoids "water-packed", "oil-cured")
    const re = new RegExp(`\\b${kw.replace(/[-]/g, "\\-")}(?!-)`, "i");
    if (re.test(n)) return true;
  }
  return false;
}

// ml per cup for liquids (most ≈ 240ml)
const ML_PER_CUP: Record<string, number> = {
  water: 240, milk: 240, "whole milk": 240, "skim milk": 240, buttermilk: 240,
  cream: 240, "heavy cream": 240, "whipping cream": 240, "sour cream": 240,
  "half and half": 240, "coconut milk": 240, "coconut cream": 240,
  oil: 240, "olive oil": 240, "vegetable oil": 240, "coconut oil": 240,
  "chicken broth": 240, "beef broth": 240, "vegetable broth": 240,
  broth: 240, stock: 240, wine: 240, vinegar: 240,
  "tomato sauce": 240, "pasta sauce": 240, juice: 240,
  "lemon juice": 240, "lime juice": 240, "orange juice": 240,
  "soy sauce": 240, "fish sauce": 240, "hot sauce": 240,
  honey: 340, "maple syrup": 322, molasses: 337, syrup: 300,
  default: 240,
};

// Grams per cup for solid/semi-solid ingredients
const GRAMS_PER_CUP: Record<string, number> = {
  // Flours & powders
  flour: 120, "all-purpose flour": 120, "bread flour": 120,
  "whole wheat flour": 120, "almond flour": 96, "cornstarch": 120,
  "cornmeal": 122, oats: 90, "rolled oats": 90, "cocoa powder": 85,
  cocoa: 85, "baking powder": 230, "baking soda": 230, breadcrumbs: 108,
  // Sugars
  sugar: 200, "white sugar": 200, "brown sugar": 220, "caster sugar": 200,
  "powdered sugar": 120, "icing sugar": 120,
  // Dairy solids
  butter: 227, "cream cheese": 232, ricotta: 246, yogurt: 245,
  "greek yogurt": 245,
  // Cheese (grated/shredded)
  parmesan: 100, "parmesan cheese": 100, mozzarella: 113,
  cheddar: 113, gruyere: 100, feta: 150, cheese: 113,
  // Rice, grains, pasta
  rice: 185, "uncooked rice": 185, "arborio rice": 195, quinoa: 170,
  lentils: 192, chickpeas: 200, pasta: 100, couscous: 175, barley: 184,
  // Nuts & seeds
  almonds: 143, walnuts: 120, cashews: 130, peanuts: 145,
  pecans: 100, "pine nuts": 135, "sesame seeds": 144, "sunflower seeds": 140,
  "pumpkin seeds": 130, nuts: 120,
  // Vegetables (chopped)
  onion: 160, onions: 160, tomato: 180, tomatoes: 180,
  spinach: 30, "baby spinach": 30, kale: 67, lettuce: 47,
  mushrooms: 70, "bell pepper": 149, corn: 154, peas: 145,
  "green beans": 110, broccoli: 91, cauliflower: 107,
  // Fruit
  blueberries: 148, strawberries: 152, raspberries: 123,
  grapes: 151, raisins: 165, cranberries: 100,
  // Default
  default: 130,
};

// ml per tablespoon for liquids, g per tablespoon for solids
const PER_TBSP_LIQUID = 15; // ml
const GRAMS_PER_TBSP: Record<string, number> = {
  butter: 14, flour: 8, sugar: 13, salt: 18,
  parmesan: 5, "tomato paste": 16, cornstarch: 8,
  "baking powder": 12, "cocoa powder": 6, "peanut butter": 16,
  tahini: 15, "cream cheese": 15, default: 12,
};

// ml per teaspoon for liquids, g per teaspoon for solids
const PER_TSP_LIQUID = 5; // ml
const GRAMS_PER_TSP: Record<string, number> = {
  salt: 6, sugar: 4, "baking powder": 4, "baking soda": 6,
  yeast: 3, pepper: 2, "black pepper": 2, cumin: 2,
  paprika: 2, cinnamon: 3, "garlic powder": 3, "onion powder": 2,
  turmeric: 3, oregano: 1, thyme: 1, basil: 1, rosemary: 1,
  "vanilla extract": 4, "almond extract": 4,
  "red pepper flakes": 2, "chili powder": 3, "curry powder": 3,
  default: 4,
};

function lookupDensity(table: Record<string, number>, ingredientName: string): number {
  const name = ingredientName.toLowerCase().trim();
  if (table[name]) return table[name];
  for (const [key, val] of Object.entries(table)) {
    if (key !== "default" && name.includes(key)) return val;
  }
  return table.default ?? 15;
}

function formatMl(ml: number): Converted {
  if (ml >= 1000) return { amount: Math.round(ml / 100) / 10, unit: "l" };
  return { amount: Math.round(ml), unit: "ml" };
}

function formatG(g: number): Converted {
  if (g >= 1000) return { amount: Math.round(g / 100) / 10, unit: "kg" };
  return { amount: Math.round(g), unit: "g" };
}

interface Converted { amount: number; unit: string }

function convertToMetric(amount: number, rawUnit: string, ingredientName: string): Converted {
  if (!amount || amount <= 0) return { amount: 0, unit: "" };
  const u = rawUnit.toLowerCase().trim();
  const liquid = isLiquid(ingredientName);

  // Already metric
  if (/^g$|^gram/.test(u))       return formatG(amount);
  if (/^kg$|^kilogram/.test(u))  return { amount: Math.round(amount * 10) / 10, unit: "kg" };
  if (/^ml$|^milliliter/.test(u)) return formatMl(amount);
  if (/^l$|^liter/.test(u))      return { amount: Math.round(amount * 10) / 10, unit: "l" };

  // oz → g
  if (/^oz$|^ounce/.test(u)) return formatG(amount * 28.35);
  // lb → g/kg
  if (/^lb|^pound/.test(u))  return formatG(amount * 453.6);
  // fl oz → ml
  if (/^fl.?oz/.test(u))     return formatMl(amount * 29.57);
  // pint → ml
  if (/^pint/.test(u))       return formatMl(amount * 473);
  // quart → l
  if (/^quart/.test(u))      return formatMl(amount * 946);

  // Cup
  if (/^cup|^tasse/.test(u)) {
    if (liquid) return formatMl(amount * lookupDensity(ML_PER_CUP, ingredientName));
    return formatG(amount * lookupDensity(GRAMS_PER_CUP, ingredientName));
  }

  // Tablespoon
  if (/^tablespoon|^tbsp|^tbs$|^el$/.test(u)) {
    if (liquid) return formatMl(amount * PER_TBSP_LIQUID);
    return formatG(amount * lookupDensity(GRAMS_PER_TBSP, ingredientName));
  }

  // Teaspoon
  if (/^teaspoon|^tsp$|^tl$/.test(u)) {
    if (liquid) return formatMl(amount * PER_TSP_LIQUID);
    const g = Math.round(amount * lookupDensity(GRAMS_PER_TSP, ingredientName));
    return { amount: Math.max(g, 1), unit: "g" };
  }

  // Piece-like units — keep as-is (handle both singular and plural, incl. -es endings)
  const pieceBase = u.replace(/ches$/, "ch").replace(/ves$/, "f").replace(/es$/, "").replace(/s$/, "");
  const pieceUnits = new Set(["piece","stück","whole","clove","slice","stalk","sprig","leaf","can","tin","bottle","package","pack","bunch","pinch","dash","handful","head","ear","fillet","sheet"]);
  if (pieceUnits.has(u) || pieceUnits.has(pieceBase)) {
    return { amount: Math.round(amount), unit: pieceBase || u };
  }

  // Size-as-unit: "large", "small", "medium", "extra-large" → treat as count
  if (/^(large|small|medium|extra.large|extra.small|big|mini)$/i.test(u)) {
    return { amount: Math.round(amount), unit: "pc" };
  }

  // Unknown — return as-is
  return { amount: Math.round(amount * 10) / 10, unit: rawUnit };
}

function normalizeUnit(u: string): string {
  // Kept for legacy callers — just lowercase + trim
  return u.toLowerCase().trim();
}

// Build a dedup key by stripping adjectives and normalising spelling
function dedupKey(name: string): string {
  const key = name
    .toLowerCase()
    .trim()
    // Remove parenthetical notes like "(grated)" or "(optional)"
    .replace(/\(.*?\)/g, "")
    // Remove leading/trailing punctuation
    .replace(/[,;:.!?]+$/, "")
    // Remove common phrase suffixes that aren't part of the ingredient name
    .replace(/\b(to taste|as needed|as required|to garnish|for garnish|for serving|for topping|or to taste)\b/g, "")
    .trim()
    // Split into words, drop strip-words
    .split(/\s+/)
    .filter(w => w.length > 0 && !STRIP_WORDS.has(w))
    .join(" ")
    .trim()
    // Common spelling variants → canonical form
    .replace(/parmigiano.*/,    "parmesan")
    .replace(/parmesan.*/,      "parmesan")
    .replace(/chilli/,          "chili")
    .replace(/bell pepper/,     "paprika")
    .replace(/black pepper/,    "pepper")
    .replace(/white pepper/,    "pepper")
    .replace(/cracked pepper/,  "pepper")
    .replace(/ground pepper/,   "pepper")
    .replace(/sea salt/,        "salt")
    .replace(/kosher salt/,     "salt")
    .replace(/table salt/,      "salt")
    .replace(/rock salt/,       "salt")
    .replace(/olive oil.*/,     "olive oil")
    .replace(/vegetable oil.*/, "oil")
    .replace(/canola oil.*/,    "oil")
    .replace(/sunflower oil.*/, "oil")
    .replace(/spring onion/,    "green onion")
    .replace(/scallion/,        "green onion");

  // Plural normalisation (eggs→egg, onions→onion, tomatoes→tomato)
  return key
    .replace(/oes$/, "o")                // tomatoes→tomato, potatoes→potato
    .replace(/ies$/, "y")                // berries→berry, cherries→cherry
    .replace(/(?<![su])s$/, "");         // onions→onion, eggs→egg (not asparagus/hummus)
}

// Split "X and Y" compound names into individual ingredients
function splitCompound(ing: RawIngredient): RawIngredient[] {
  const n = ing.name.toLowerCase();
  // Split 2-part compounds like "salt and pepper" or "salt and pepper to taste"
  if (/ and /i.test(n) && n.split(/\s+/).length <= 6) {
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

      // Convert to weight/metric
      const converted = ing.amount
        ? convertToMetric(ing.amount, ing.unit || "", ing.name)
        : { amount: 0, unit: normalizeUnit(ing.unit || "") };

      const key = dedupKey(ing.name);
      const { label, emoji } = resolveCategory(ing.aisle);

      if (map.has(key)) {
        const existing = map.get(key)!;
        // Add amounts when same unit (both converted to same metric)
        if (existing.unit === converted.unit && existing.amount !== null && converted.amount > 0) {
          existing.amount = Math.round((existing.amount + converted.amount) * 10) / 10;
          // Upgrade to kg if over 1000g
          if (existing.unit === "g" && existing.amount >= 1000) {
            existing.amount = Math.round(existing.amount / 100) / 10;
            existing.unit = "kg";
          }
        }
        if (ing.name.trim().length < existing.name.length) {
          existing.name = ing.name.trim();
        }
      } else {
        map.set(key, {
          name: ing.name.trim(),
          amount: converted.amount || null,
          unit: converted.unit,
          original: ing.original || ing.name,
          category: label,
          categoryEmoji: emoji,
        });
      }
    }
  }

  return Array.from(map.values());
}

// ── Fraction parser (handles "1/2", "¼", "½", "1 1/2", etc.) ─────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

function parseFraction(str: string): number {
  const s = str.trim();

  // Replace unicode fractions first
  for (const [frac, val] of Object.entries(UNICODE_FRACTIONS)) {
    if (s.includes(frac)) {
      const whole = parseFloat(s.replace(frac, "").trim()) || 0;
      return whole + val;
    }
  }

  // Mixed number: "1 1/2"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Simple fraction: "1/2"
  const slashMatch = s.match(/^(\d+)\/(\d+)$/);
  if (slashMatch) {
    return parseInt(slashMatch[1]) / parseInt(slashMatch[2]);
  }

  return parseFloat(s);
}

// ── Fetchers ───────────────────────────────────────────────────────────────────

// Per-recipe target servings (recipeId → desired servings). When both a target
// and the recipe's original servings are known, amounts are scaled by
// target/original; otherwise they pass through unchanged.
type Targets = Record<string, number>;

function scaleRatio(target: number | undefined, original: number | undefined | null): number {
  if (target && original && original > 0) {
    const r = target / original;
    return r > 0 && isFinite(r) ? r : 1;
  }
  return 1;
}

async function fetchSpoonacularIngredients(ids: string[], targets: Targets): Promise<RawIngredient[]> {
  if (!SPOONACULAR_KEY || ids.length === 0) return [];
  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/informationBulk?ids=${ids.join(",")}&includeNutrition=false&apiKey=${SPOONACULAR_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: Array<{ id?: number; servings?: number; extendedIngredients?: Array<{ name: string; amount: number; unit: string; aisle: string; original: string }> }> = await res.json();
    return data.flatMap(r => {
      const ratio = scaleRatio(targets[String(r.id)], r.servings);
      return (r.extendedIngredients || []).map(i => ({
        name: i.name,
        amount: i.amount * ratio,
        unit: i.unit,
        aisle: i.aisle,
        original: i.original,
      }));
    });
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

        // MealDB often uses fractions: "1/2 tbs", "¼ cup", "1 1/2 tsp"
        const measureStr = (measure || "").trim();
        // Match leading number/fraction token(s), rest is unit
        const fracMatch = measureStr.match(/^([\d\s¼½¾⅓⅔⅛⅜⅝⅞\/]+)\s*(.*)/);
        const rawNum  = fracMatch ? fracMatch[1].trim() : "";
        const unit    = fracMatch ? fracMatch[2].trim() : measureStr;
        const parsed  = rawNum ? parseFraction(rawNum) : NaN;
        const amount  = isNaN(parsed) ? 0 : parsed;

        results.push({ name, amount, unit, aisle: undefined, original: `${measure} ${name}`.trim() });
      }
    } catch { continue; }
  }
  return results;
}

async function fetchEdamamIngredients(ids: string[], targets: Targets): Promise<RawIngredient[]> {
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
      const ratio = scaleRatio(targets[id], r.yield);
      for (const ing of (r.ingredients || []) as Array<{ food: string; quantity: number; measure: string; text: string }>) {
        results.push({ name: ing.food, amount: ing.quantity * ratio, unit: ing.measure || "", aisle: undefined, original: ing.text });
      }
    } catch { continue; }
  }
  return results;
}

async function fetchTastyIngredients(ids: string[], targets: Targets): Promise<RawIngredient[]> {
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
      const ratio = scaleRatio(targets[id], r.num_servings);
      const components = (r.sections || []).flatMap(
        (sec: { components?: Array<{ ingredient?: { name: string }; measurements?: Array<{ quantity: number; unit?: { abbreviation: string } }>; raw_text?: string }> }) =>
          sec.components || []
      );
      for (const c of components) {
        const name = c.ingredient?.name || c.raw_text || "";
        const amount = (c.measurements?.[0]?.quantity || 0) * ratio;
        const unit = c.measurements?.[0]?.unit?.abbreviation || "";
        results.push({ name, amount, unit, aisle: undefined, original: c.raw_text || name });
      }
    } catch { continue; }
  }
  return results;
}

// User-created / imported recipes (ids prefixed "user_"): ingredients live on the
// `user_recipes` row as [{ name, amount, unit }]. Read via the service-role client
// (RLS-bypassing), but scope the visibility ourselves — only rows that are public
// OR owned by the requesting user, so a private draft is never leaked into another
// user's shopping list.
async function fetchUserRecipeIngredients(
  ids: string[],
  targets: Targets,
  currentUserId: string
): Promise<RawIngredient[]> {
  if (ids.length === 0) return [];
  try {
    const uuidById = new Map(ids.map(id => [id.replace("user_", ""), id]));
    const admin = createAdminClient();
    const { data: rows } = await admin
      .from("user_recipes")
      .select("id, ingredients, servings, is_public, user_id")
      .in("id", Array.from(uuidById.keys()));

    const results: RawIngredient[] = [];
    for (const r of (rows ?? []) as Array<{
      id: string;
      ingredients: unknown;
      servings: number | null;
      is_public: boolean | null;
      user_id: string | null;
    }>) {
      // Visibility gate: skip private drafts that don't belong to the caller.
      if (!r.is_public && r.user_id !== currentUserId) continue;
      if (!Array.isArray(r.ingredients)) continue;

      const fullId = uuidById.get(r.id) ?? `user_${r.id}`;
      const ratio = scaleRatio(targets[fullId], r.servings);

      for (const ing of r.ingredients as Array<{ name?: unknown; amount?: unknown; unit?: unknown }>) {
        const name = typeof ing?.name === "string" ? ing.name : "";
        if (!name.trim()) continue;
        // amount may be stored as a number or a string ("1/2", "1 1/2", "¼").
        const parsed =
          typeof ing.amount === "number"
            ? ing.amount
            : ing.amount != null
              ? parseFraction(String(ing.amount))
              : NaN;
        const amount = isNaN(parsed) ? 0 : parsed * ratio;
        const unit = typeof ing.unit === "string" ? ing.unit : "";
        results.push({
          name,
          amount,
          unit,
          aisle: undefined,
          original: [ing.amount, unit, name].filter(Boolean).join(" ").trim(),
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users may call this endpoint
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { recipeIds?: unknown; targets?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  // Limit to max 21 recipe IDs (7 days × 3 meals) to prevent API quota abuse
  const recipeIds: string[] = (Array.isArray(body.recipeIds) ? body.recipeIds : []).slice(0, 21);

  if (recipeIds.length === 0) {
    return NextResponse.json({ items: [], grouped: {} });
  }

  // Partition by source
  const mealdbIds = recipeIds.filter(id => /^\d+$/.test(id) && parseInt(id) >= MDB_OFFSET);
  const spoonOnly = recipeIds.filter(id => /^\d+$/.test(id) && parseInt(id) < MDB_OFFSET);
  const edamamIds = recipeIds.filter(id => id.startsWith("edamam_"));
  const tastyIds  = recipeIds.filter(id => id.startsWith("tasty_"));
  const userIds   = recipeIds.filter(id => id.startsWith("user_"));

  // Per-recipe target servings → scale ingredient amounts (target/original)
  const targets: Targets =
    body.targets && typeof body.targets === "object" && !Array.isArray(body.targets)
      ? (body.targets as Targets)
      : {};
  const lang = typeof body.lang === "string" ? body.lang.toLowerCase() : "en";

  const [spoonRaw, mealdbRaw, edamamRaw, tastyRaw, userRaw] = await Promise.all([
    fetchSpoonacularIngredients(spoonOnly, targets),
    fetchMealDBIngredients(mealdbIds),
    fetchEdamamIngredients(edamamIds, targets),
    fetchTastyIngredients(tastyIds, targets),
    fetchUserRecipeIngredients(userIds, targets, session.user.id),
  ]);

  const allRaw = [...spoonRaw, ...mealdbRaw, ...edamamRaw, ...tastyRaw, ...userRaw];
  const items = aggregateIngredients(allRaw);

  // Translate ingredient names to German on the DE site (cached, never throws).
  if (lang === "de" && items.length) {
    const deNames = await translateTexts(items.map(i => i.name), "EN", "DE");
    items.forEach((item, i) => { if (deNames[i]) item.name = deNames[i]; });
  }

  // Group by category — keep the English category as the key (stable sorting),
  // but carry a localized label for the header.
  const grouped: Record<string, { emoji: string; label: string; items: ShoppingItem[] }> = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = {
        emoji: item.categoryEmoji,
        label: lang === "de" ? (CATEGORY_DE[item.category] ?? item.category) : item.category,
        items: [],
      };
    }
    grouped[item.category].items.push(item);
  }

  // Sort items within each category alphabetically (by the displayed name)
  for (const cat of Object.values(grouped)) {
    cat.items.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return NextResponse.json({ items, grouped });
}
