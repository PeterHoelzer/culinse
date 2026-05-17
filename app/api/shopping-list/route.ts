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

// ── Unit conversion to grams ──────────────────────────────────────────────────

// Grams per cup for common ingredients (key = dedupKey fragment)
const GRAMS_PER_CUP: Record<string, number> = {
  // Flours & powders
  flour: 120, "all-purpose flour": 120, "bread flour": 120,
  "whole wheat flour": 120, "almond flour": 96, "cornstarch": 120,
  "cornmeal": 122, "oats": 90, "rolled oats": 90, "cocoa powder": 85,
  "cocoa": 85, "baking powder": 230, "baking soda": 230, "powdered sugar": 120,
  "icing sugar": 120, "breadcrumbs": 108,
  // Sugars
  sugar: 200, "white sugar": 200, "brown sugar": 220, "caster sugar": 200,
  "powdered sugar": 120, "honey": 340, "maple syrup": 322, "molasses": 337,
  // Dairy & fats
  butter: 227, "cream cheese": 232, "ricotta": 246, "yogurt": 245,
  milk: 245, "whole milk": 245, "skim milk": 245, "buttermilk": 245,
  cream: 238, "heavy cream": 238, "sour cream": 230, "whipped cream": 120,
  "half and half": 242,
  // Cheese (grated/shredded)
  parmesan: 100, "parmesan cheese": 100, "mozzarella": 113,
  "cheddar": 113, "gruyere": 100, "feta": 150, cheese: 113,
  // Oils & liquids
  oil: 218, "olive oil": 216, "vegetable oil": 218, "coconut oil": 218,
  water: 240, "chicken broth": 240, "beef broth": 240, "vegetable broth": 240,
  "broth": 240, "stock": 240, "wine": 240, "vinegar": 240,
  "tomato sauce": 245, "tomato paste": 262, "ketchup": 272,
  "soy sauce": 255, "fish sauce": 255,
  // Rice, grains, pasta
  rice: 185, "uncooked rice": 185, "arborio rice": 195, "quinoa": 170,
  "lentils": 192, "chickpeas": 200, pasta: 100, "couscous": 175,
  "barley": 184,
  // Nuts & seeds
  "almonds": 143, "walnuts": 120, "cashews": 130, "peanuts": 145,
  "pecans": 100, "pine nuts": 135, "sesame seeds": 144, "sunflower seeds": 140,
  "pumpkin seeds": 130, nuts: 120,
  // Vegetables (chopped)
  onion: 160, "onions": 160, tomato: 180, "tomatoes": 180,
  spinach: 30, "baby spinach": 30, "kale": 67, "lettuce": 47,
  "mushrooms": 70, "bell pepper": 149, "corn": 154, "peas": 145,
  "green beans": 110, "broccoli": 91, "cauliflower": 107,
  // Fruit
  "blueberries": 148, "strawberries": 152, "raspberries": 123,
  "grapes": 151, "raisins": 165, "cranberries": 100,
  // Default fallbacks
  default: 130,
};

// Grams per tablespoon
const GRAMS_PER_TBSP: Record<string, number> = {
  butter: 14, oil: 14, "olive oil": 14, flour: 8, sugar: 13,
  salt: 18, honey: 21, milk: 15, cream: 15, parmesan: 5,
  "tomato paste": 16, "soy sauce": 16, vinegar: 15, "cream cheese": 15,
  cornstarch: 8, "baking powder": 12, "cocoa powder": 6,
  "peanut butter": 16, tahini: 15, default: 12,
};

// Grams per teaspoon
const GRAMS_PER_TSP: Record<string, number> = {
  salt: 6, sugar: 4, "baking powder": 4, "baking soda": 6,
  yeast: 3, pepper: 2, "black pepper": 2, cumin: 2,
  paprika: 2, cinnamon: 3, "garlic powder": 3, "onion powder": 2,
  turmeric: 3, oregano: 1, thyme: 1, basil: 1, rosemary: 1,
  oil: 5, "vanilla extract": 4, "almond extract": 4,
  "red pepper flakes": 2, "chili powder": 3, "curry powder": 3,
  default: 4,
};

function lookupDensity(table: Record<string, number>, ingredientName: string): number {
  const name = ingredientName.toLowerCase().trim();
  if (table[name]) return table[name];
  // Partial match
  for (const [key, val] of Object.entries(table)) {
    if (key !== "default" && name.includes(key)) return val;
  }
  return table.default ?? 15;
}

interface Converted { amount: number; unit: string }

function convertToWeight(amount: number, rawUnit: string, ingredientName: string): Converted {
  if (!amount || amount <= 0) return { amount: 0, unit: "" };
  const u = rawUnit.toLowerCase().trim();

  // Already metric weight
  if (/^g$|^gram/.test(u))  return { amount: Math.round(amount), unit: "g" };
  if (/^kg$|^kilogram/.test(u)) return { amount: Math.round(amount * 10) / 10, unit: "kg" };

  // Weight: oz → g
  if (/^oz$|^ounce/.test(u)) return { amount: Math.round(amount * 28.35), unit: "g" };

  // Weight: lb → g
  if (/^lb|^pound/.test(u)) return { amount: Math.round(amount * 453.6), unit: "g" };

  // Liquid: ml stays ml, convert to L if large
  if (/^ml$|^milliliter/.test(u)) {
    const ml = Math.round(amount);
    return ml >= 1000 ? { amount: Math.round(ml / 100) / 10, unit: "L" } : { amount: ml, unit: "ml" };
  }
  if (/^l$|^liter/.test(u)) return { amount: Math.round(amount * 10) / 10, unit: "L" };

  // Cup → g
  if (/^cup|^tasse/.test(u)) {
    const g = Math.round(amount * lookupDensity(GRAMS_PER_CUP, ingredientName));
    return g >= 1000 ? { amount: Math.round(g / 100) / 10, unit: "kg" } : { amount: g, unit: "g" };
  }

  // Tablespoon → g
  if (/^tablespoon|^tbsp|^tbs$|^el$/.test(u)) {
    const g = Math.round(amount * lookupDensity(GRAMS_PER_TBSP, ingredientName));
    return { amount: g, unit: "g" };
  }

  // Teaspoon → g
  if (/^teaspoon|^tsp$|^tl$/.test(u)) {
    const g = Math.round(amount * lookupDensity(GRAMS_PER_TSP, ingredientName));
    return { amount: Math.max(g, 1), unit: "g" };
  }

  // Piece-like units — keep as Stück
  if (/^piece|^stück|^whole|^clove|^slice|^stalk|^sprig|^leaf|^leaves|^can|^tin|^bottle|^package|^pack|^bunch/.test(u)) {
    return { amount: Math.round(amount), unit: u.replace(/s$/, "") };
  }

  // Unknown unit — return as-is
  return { amount: Math.round(amount * 10) / 10, unit: rawUnit };
}

function normalizeUnit(u: string): string {
  // Kept for legacy callers — just lowercase + trim
  return u.toLowerCase().trim();
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

      // Convert to weight/metric
      const converted = ing.amount
        ? convertToWeight(ing.amount, ing.unit || "", ing.name)
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
