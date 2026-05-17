export interface AffiliateProduct {
  name: string;
  asin: string;
  price: string;
  emoji: string;
  type: "tool" | "ingredient";
  tags: string[];
}

const TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21";

export function getAffiliateUrl(product: AffiliateProduct): string {
  return `https://www.amazon.de/dp/${product.asin}?tag=${TAG}`;
}

export function getAmazonSearchUrl(query: string): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(query)}&tag=${TAG}`;
}

// ─── Keyword → ASIN Mapping für Zutaten ─────────────────────────────────────
// Nur für Zutaten wo wir ein wirklich gutes Produkt kennen.
// Kein Match = kein Link (besser als schlechte Suchergebnisse).

const INGREDIENT_MAP: { keywords: string[]; asin: string }[] = [
  { keywords: ["olive oil", "olivenöl", "oliven öl"],                                  asin: "B07P7MNQMH" },
  { keywords: ["pasta", "spaghetti", "penne", "rigatoni", "fusilli", "farfalle"],       asin: "B0747R8VXQ" },
  { keywords: ["rice", "basmati", "jasmine rice", "long grain"],                        asin: "B07WQMXP2Q" },
  { keywords: ["salt", "sea salt", "kosher salt", "fleur de sel"],                      asin: "B003YHHGRM" },
  { keywords: ["coconut oil", "kokosöl"],                                               asin: "B00DS842HS" },
  { keywords: ["soy sauce", "sojasauce", "tamari"],                                     asin: "B00J3X97MA" },
  { keywords: ["parmesan", "parmigiano"],                                               asin: "B07BVQCZXD" },
  { keywords: ["canned tomatoes", "crushed tomatoes", "diced tomatoes", "tomato sauce", "passata"], asin: "B07WRMXWDX" },
  { keywords: ["coconut milk", "kokosmilch"],                                           asin: "B00ELBLQDM" },
  { keywords: ["flour", "all-purpose flour", "mehl", "bread flour"],                   asin: "B00BI1HKNE" },
  { keywords: ["breadcrumbs", "panko", "semmelbrösel"],                                 asin: "B01N3XEKRM" },
  { keywords: ["honey", "honig"],                                                       asin: "B07CWLB3JT" },
  { keywords: ["butter"],                                                               asin: "B09FSDZ3G8" },
  { keywords: ["paprika", "smoked paprika", "sweet paprika"],                           asin: "B08CXZFSDM" },
  { keywords: ["cumin", "kreuzkümmel"],                                                 asin: "B08CXZFSDM" },
  { keywords: ["turmeric", "kurkuma"],                                                  asin: "B08CXZFSDM" },
  { keywords: ["oregano", "thyme", "rosemary", "basil", "herbs"],                       asin: "B08CXZFSDM" },
];

/**
 * Gibt eine direkte Amazon-Produkt-URL zurück wenn wir ein gutes Match haben.
 * Gibt null zurück wenn kein Match — dann kein Link anzeigen.
 */
export function getIngredientAffiliateUrl(ingredientName: string): string | null {
  const name = ingredientName.toLowerCase();
  for (const entry of INGREDIENT_MAP) {
    if (entry.keywords.some(kw => name.includes(kw))) {
      return `https://www.amazon.de/dp/${entry.asin}?tag=${TAG}`;
    }
  }
  return null;
}

// ─── Produkte ────────────────────────────────────────────────────────────────

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [

  // ── TOOLS: Ninja Geräte ─────────────────────────────────────────────────
  { type: "tool", name: "Ninja Air Fryer Max XL",           asin: "B07FDJMC9Q", price: "ab €99",  emoji: "🍟", tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries"] },
  { type: "tool", name: "Ninja Foodi Multi-Cooker",          asin: "B07XBGD84W", price: "ab €149", emoji: "🍲", tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole"] },
  { type: "tool", name: "Ninja Woodfire Outdoor Grill",      asin: "B0B2PQRJ4Y", price: "ab €299", emoji: "🔥", tags: ["grill", "bbq", "barbecue", "grilled", "steak", "burger"] },
  { type: "tool", name: "Ninja Professional Blender",        asin: "B07XC5HWTB", price: "ab €89",  emoji: "🥤", tags: ["smoothie", "blend", "soup", "sauce", "shake", "puree", "beverage"] },
  { type: "tool", name: "Ninja Creami Ice Cream Maker",      asin: "B08J8TZ3LK", price: "ab €179", emoji: "🍦", tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "dessert"] },
  { type: "tool", name: "Ninja 3-in-1 Food Processor",       asin: "B07GKJRTD5", price: "ab €119", emoji: "🥗", tags: ["chop", "slice", "coleslaw", "salad", "dough"] },

  // ── TOOLS: Klassische Küchengeräte ──────────────────────────────────────
  { type: "tool", name: "Wüsthof Classic Kochmesser",        asin: "B00009ZK08", price: "ab €89",  emoji: "🔪", tags: ["general", "meat", "salad", "chop", "slice", "mince"] },
  { type: "tool", name: "Tefal Expertise Pfanne 28cm",       asin: "B005S76HGQ", price: "ab €34",  emoji: "🍳", tags: ["general", "main course", "breakfast", "egg", "pancake", "sauté", "fry"] },
  { type: "tool", name: "KitchenAid Artisan Küchenmaschine", asin: "B00005UP2P", price: "ab €449", emoji: "🎂", tags: ["baking", "dessert", "bread", "cake", "cookie", "dough", "pastry"] },
  { type: "tool", name: "Lodge Gusseisenpfanne 26cm",        asin: "B00006JSUA", price: "ab €29",  emoji: "🥩", tags: ["steak", "meat", "sear", "burger", "pan fry"] },
  { type: "tool", name: "Marcato Atlas Nudelmaschine",       asin: "B00004S1AT", price: "ab €65",  emoji: "🍝", tags: ["pasta", "italian", "noodle", "tagliatelle", "lasagna", "fettuccine"] },
  { type: "tool", name: "Staub Cocotte 24cm",                asin: "B000S1LCU4", price: "ab €169", emoji: "🫕", tags: ["stew", "braise", "roast", "french", "slow cook"] },
  { type: "tool", name: "Thermapen Digital-Thermometer",     asin: "B01IHHLB3W", price: "ab €12",  emoji: "🌡️", tags: ["meat", "fish", "roast", "temperature", "baking"] },
  { type: "tool", name: "Westmark Küchenwaage 5kg",          asin: "B004Y3JFPW", price: "ab €18",  emoji: "⚖️", tags: ["baking", "cake", "bread", "pastry"] },

  // ── INGREDIENTS: Pantry-Basics ───────────────────────────────────────────
  { type: "ingredient", name: "Olivenöl Extra Vergine",      asin: "B07P7MNQMH", price: "ab €8",   emoji: "🫒", tags: ["olive oil", "salad", "mediterranean", "italian", "dressing", "roast"] },
  { type: "ingredient", name: "Pasta (Barilla Sortiment)",   asin: "B0747R8VXQ", price: "ab €6",   emoji: "🍝", tags: ["pasta", "spaghetti", "penne", "rigatoni", "fusilli", "italian"] },
  { type: "ingredient", name: "Basmati Reis 5kg",            asin: "B07WQMXP2Q", price: "ab €12",  emoji: "🍚", tags: ["rice", "basmati", "indian", "curry", "asian", "side dish"] },
  { type: "ingredient", name: "Gewürz-Set (20 Sorten)",      asin: "B08CXZFSDM", price: "ab €19",  emoji: "🌶️", tags: ["spice", "spices", "seasoning", "general", "herbs", "cumin", "paprika", "turmeric"] },
  { type: "ingredient", name: "Fleur de Sel Meersalz",       asin: "B003YHHGRM", price: "ab €5",   emoji: "🧂", tags: ["salt", "seasoning", "general"] },
  { type: "ingredient", name: "Bio Kokosöl 1L",              asin: "B00DS842HS", price: "ab €9",   emoji: "🥥", tags: ["coconut oil", "coconut", "asian", "vegan", "thai", "fry"] },
  { type: "ingredient", name: "Sojasauce (Kikkoman 1L)",     asin: "B00J3X97MA", price: "ab €6",   emoji: "🍱", tags: ["soy sauce", "asian", "japanese", "chinese", "stir fry", "teriyaki", "marinade"] },
  { type: "ingredient", name: "Parmesan am Stück (DOP)",     asin: "B07BVQCZXD", price: "ab €12",  emoji: "🧀", tags: ["parmesan", "italian", "pasta", "risotto", "cheese"] },
  { type: "ingredient", name: "Dosentomaten (12er Pack)",    asin: "B07WRMXWDX", price: "ab €14",  emoji: "🍅", tags: ["tomato", "tomatoes", "italian", "sauce", "soup", "stew", "pizza"] },
  { type: "ingredient", name: "Kokosmilch (12er Pack)",      asin: "B00ELBLQDM", price: "ab €16",  emoji: "🥥", tags: ["coconut milk", "coconut", "thai", "curry", "asian", "soup", "vegan"] },
  { type: "ingredient", name: "Mehl Type 405 (2.5kg)",       asin: "B00BI1HKNE", price: "ab €4",   emoji: "🌾", tags: ["flour", "baking", "bread", "cake", "pastry", "dough", "pizza"] },
  { type: "ingredient", name: "Panko Semmelbrösel",          asin: "B01N3XEKRM", price: "ab €4",   emoji: "🥖", tags: ["breadcrumbs", "panko", "breaded", "schnitzel", "fried", "crispy"] },
  { type: "ingredient", name: "Honig (Bio, 1kg)",            asin: "B07CWLB3JT", price: "ab €9",   emoji: "🍯", tags: ["honey", "glaze", "sweet", "dressing", "marinade", "dessert"] },
  { type: "ingredient", name: "Butter (Kerrygold 3x250g)",   asin: "B09FSDZ3G8", price: "ab €7",   emoji: "🧈", tags: ["butter", "baking", "sauce", "cream", "general", "sauté"] },
];

// ─── Nur Küchengeräte für die AffiliateBox ──────────────────────────────────

export function getToolsForRecipe(
  dishTypes: string[],
  ingredientNames: string[],
  recipeTitle: string = ""
): AffiliateProduct[] {
  const haystack = [
    ...dishTypes.map(d => d.toLowerCase()),
    ...ingredientNames.map(i => i.toLowerCase()),
    recipeTitle.toLowerCase(),
    "general",
  ].join(" ");

  const tools = AFFILIATE_PRODUCTS.filter(p => p.type === "tool");

  const scored = tools
    .map(p => ({ product: p, score: p.tags.filter(t => haystack.includes(t)).length }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);

  if (scored.length >= 2) return scored.slice(0, 3).map(s => s.product);

  // Fallback: generische Tools
  const fallback = tools.filter(p => p.tags.includes("general") && !scored.find(s => s.product.asin === p.asin));
  return [...scored.map(s => s.product), ...fallback].slice(0, 3);
}

// ─── Alte Funktion für Rückwärtskompatibilität ───────────────────────────────
export function getProductsForRecipe(
  dishTypes: string[],
  ingredientNames: string[],
  recipeTitle: string = ""
): AffiliateProduct[] {
  return getToolsForRecipe(dishTypes, ingredientNames, recipeTitle);
}
