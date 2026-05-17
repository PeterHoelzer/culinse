export interface AffiliateProduct {
  name: string;
  asin: string;
  price: string;
  emoji: string;
  tags: string[];
}

const TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21";

export function getAffiliateUrl(product: AffiliateProduct): string {
  return `https://www.amazon.de/dp/${product.asin}?tag=${TAG}`;
}

export function getAmazonSearchUrl(query: string): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(query)}&tag=${TAG}`;
}

// ─── Produkte ────────────────────────────────────────────────────────────────

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [

  // ── Ninja Geräte ────────────────────────────────────────────────────────
  { name: "Ninja Air Fryer Max XL",        asin: "B07FDJMC9Q", price: "ab €99",  emoji: "🍟", tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries"] },
  { name: "Ninja Foodi Multi-Cooker",       asin: "B07XBGD84W", price: "ab €149", emoji: "🍲", tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole"] },
  { name: "Ninja Woodfire Outdoor Grill",   asin: "B0B2PQRJ4Y", price: "ab €299", emoji: "🔥", tags: ["grill", "bbq", "barbecue", "grilled", "steak", "burger"] },
  { name: "Ninja Professional Blender",     asin: "B07XC5HWTB", price: "ab €89",  emoji: "🥤", tags: ["smoothie", "blend", "soup", "sauce", "shake", "puree", "beverage"] },
  { name: "Ninja Creami Ice Cream Maker",   asin: "B08J8TZ3LK", price: "ab €179", emoji: "🍦", tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "dessert"] },
  { name: "Ninja 3-in-1 Food Processor",    asin: "B07GKJRTD5", price: "ab €119", emoji: "🥗", tags: ["chop", "slice", "dough", "coleslaw", "salad"] },

  // ── Küchengeräte ────────────────────────────────────────────────────────
  { name: "Wüsthof Classic Kochmesser",     asin: "B00009ZK08", price: "ab €89",  emoji: "🔪", tags: ["general", "meat", "salad", "chop", "slice", "mince"] },
  { name: "Tefal Expertise Pfanne 28cm",    asin: "B005S76HGQ", price: "ab €34",  emoji: "🍳", tags: ["general", "main course", "breakfast", "egg", "pancake", "sauté", "fry"] },
  { name: "KitchenAid Artisan Küchenmaschine", asin: "B00005UP2P", price: "ab €449", emoji: "🎂", tags: ["baking", "dessert", "bread", "cake", "cookie", "dough", "pastry"] },
  { name: "Lodge Gusseisenpfanne 26cm",     asin: "B00006JSUA", price: "ab €29",  emoji: "🥩", tags: ["steak", "meat", "sear", "burger", "pan fry"] },
  { name: "Marcato Atlas Nudelmaschine",    asin: "B00004S1AT", price: "ab €65",  emoji: "🍝", tags: ["pasta", "italian", "noodle", "tagliatelle", "lasagna", "fettuccine"] },
  { name: "Staub Cocotte 24cm",             asin: "B000S1LCU4", price: "ab €169", emoji: "🫕", tags: ["stew", "braise", "roast", "french", "slow cook"] },
  { name: "Thermapen Digital-Thermometer", asin: "B01IHHLB3W", price: "ab €12",  emoji: "🌡️", tags: ["meat", "fish", "roast", "temperature", "baking"] },
  { name: "Westmark Küchenwaage 5kg",       asin: "B004Y3JFPW", price: "ab €18",  emoji: "⚖️", tags: ["baking", "cake", "bread", "pastry", "scale"] },

  // ── Zutaten / Pantry ─────────────────────────────────────────────────────
  { name: "Olivenöl Extra Vergine",         asin: "B07P7MNQMH", price: "ab €8",   emoji: "🫒", tags: ["olive oil", "salad", "mediterranean", "italian", "dressing", "roast"] },
  { name: "Pasta (Barilla Sortiment)",      asin: "B0747R8VXQ", price: "ab €6",   emoji: "🍝", tags: ["pasta", "spaghetti", "penne", "rigatoni", "fusilli", "italian"] },
  { name: "Basmati Reis 5kg",               asin: "B07WQMXP2Q", price: "ab €12",  emoji: "🍚", tags: ["rice", "basmati", "indian", "curry", "asian", "side dish"] },
  { name: "Gewürz-Set (20 Sorten)",         asin: "B08CXZFSDM", price: "ab €19",  emoji: "🌶️", tags: ["spice", "spices", "seasoning", "general", "herbs", "cumin", "paprika", "turmeric"] },
  { name: "Fleur de Sel Meersalz",          asin: "B003YHHGRM", price: "ab €5",   emoji: "🧂", tags: ["salt", "seasoning", "general", "fleur de sel"] },
  { name: "Bio Kokosöl 1L",                 asin: "B00DS842HS", price: "ab €9",   emoji: "🥥", tags: ["coconut oil", "coconut", "asian", "vegan", "thai", "fry"] },
  { name: "Sojasauce (Kikkoman 1L)",        asin: "B00J3X97MA", price: "ab €6",   emoji: "🍱", tags: ["soy sauce", "asian", "japanese", "chinese", "stir fry", "teriyaki", "marinade"] },
  { name: "Parmesan am Stück (DOP)",        asin: "B07BVQCZXD", price: "ab €12",  emoji: "🧀", tags: ["parmesan", "italian", "pasta", "risotto", "cheese"] },
  { name: "Dosentomaten (12er Pack)",       asin: "B07WRMXWDX", price: "ab €14",  emoji: "🍅", tags: ["tomato", "tomatoes", "italian", "sauce", "soup", "stew", "pizza"] },
  { name: "Kokosmilch (12er Pack)",         asin: "B00ELBLQDM", price: "ab €16",  emoji: "🥥", tags: ["coconut milk", "coconut", "thai", "curry", "asian", "soup", "vegan"] },
  { name: "Mehl Type 405 (2.5kg)",          asin: "B00BI1HKNE", price: "ab €4",   emoji: "🌾", tags: ["flour", "baking", "bread", "cake", "pastry", "dough", "pizza"] },
  { name: "Paniermehl / Semmelbrösel",      asin: "B01N3XEKRM", price: "ab €4",   emoji: "🥖", tags: ["breadcrumbs", "panko", "breaded", "schnitzel", "fried", "crispy"] },
  { name: "Honig (Bio, 1kg)",               asin: "B07CWLB3JT", price: "ab €9",   emoji: "🍯", tags: ["honey", "glaze", "sweet", "dressing", "marinade", "dessert"] },
  { name: "Butter (Kerrygold 3x250g)",      asin: "B09FSDZ3G8", price: "ab €7",   emoji: "🧈", tags: ["butter", "baking", "sauce", "cream", "general", "sauté"] },
];

// ─── Matching-Logik ──────────────────────────────────────────────────────────

export function getProductsForRecipe(
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

  const scored = AFFILIATE_PRODUCTS.map(p => ({
    product: p,
    score: p.tags.filter(t => haystack.includes(t)).length,
  })).filter(s => s.score > 0);

  // Mische leicht für Abwechslung, priorisiere aber gute Matches
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  // Mix: max 1 Gerät + max 2 Zutaten
  const tools = scored.filter(s => {
    const t = s.product.tags;
    return !t.some(tag => ["sauce", "oil", "rice", "pasta", "spice", "salt", "flour",
      "honey", "butter", "tomato", "coconut", "soy sauce", "parmesan",
      "breadcrumbs", "milk", "seasoning"].includes(tag));
  }).slice(0, 1);

  const ingredients = scored.filter(s => !tools.find(t => t.product.asin === s.product.asin)).slice(0, 2);

  const result = [...tools, ...ingredients].map(s => s.product);

  // Fallback: allgemeine Produkte
  if (result.length < 2) {
    const fallback = AFFILIATE_PRODUCTS.filter(
      p => p.tags.includes("general") && !result.find(r => r.asin === p.asin)
    ).slice(0, 2 - result.length);
    return [...result, ...fallback].slice(0, 3);
  }

  return result.slice(0, 3);
}
