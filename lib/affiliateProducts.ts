export interface AffiliateProduct {
  name: string;
  search: string;   // Exakter Amazon-Suchbegriff → zeigt immer verfügbare Produkte
  price: string;
  emoji: string;
  type: "tool" | "ingredient";
  tags: string[];
}

const TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21";

export function getAffiliateUrl(product: AffiliateProduct): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(product.search)}&tag=${TAG}`;
}

// ─── Produkte ────────────────────────────────────────────────────────────────

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [

  // ── TOOLS: Ninja ────────────────────────────────────────────────────────
  { type: "tool", name: "Ninja Air Fryer",           search: "Ninja Air Fryer Heißluftfritteuse",    price: "ab €99",  emoji: "🍟", tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries"] },
  { type: "tool", name: "Ninja Foodi Multi-Cooker",  search: "Ninja Foodi Multi Cooker Multikocher", price: "ab €149", emoji: "🍲", tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole"] },
  { type: "tool", name: "Ninja Woodfire Grill",      search: "Ninja Woodfire Outdoor Grill",         price: "ab €299", emoji: "🔥", tags: ["grill", "bbq", "barbecue", "grilled", "steak", "burger"] },
  { type: "tool", name: "Ninja Blender",             search: "Ninja Professional Standmixer Blender",price: "ab €89",  emoji: "🥤", tags: ["smoothie", "blend", "soup", "sauce", "shake", "puree", "beverage"] },
  { type: "tool", name: "Ninja Creami",              search: "Ninja Creami Eismaschine",             price: "ab €179", emoji: "🍦", tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "dessert"] },
  { type: "tool", name: "Ninja Food Processor",      search: "Ninja Food Processor Küchenmaschine",  price: "ab €119", emoji: "🥗", tags: ["chop", "slice", "coleslaw", "salad", "dough"] },

  // ── TOOLS: Klassisch ────────────────────────────────────────────────────
  { type: "tool", name: "Kochmesser",                search: "Wüsthof Classic Kochmesser 20cm",      price: "ab €89",  emoji: "🔪", tags: ["general", "meat", "salad", "chop", "slice", "mince"] },
  { type: "tool", name: "Antihaft-Pfanne 28cm",      search: "Tefal Expertise Pfanne 28cm",          price: "ab €34",  emoji: "🍳", tags: ["general", "main course", "breakfast", "egg", "pancake", "sauté", "fry"] },
  { type: "tool", name: "KitchenAid Küchenmaschine", search: "KitchenAid Artisan Küchenmaschine 4,8L",price: "ab €449", emoji: "🎂", tags: ["baking", "dessert", "bread", "cake", "cookie", "dough", "pastry"] },
  { type: "tool", name: "Gusseisenpfanne",           search: "Lodge Gusseisenpfanne 26cm",           price: "ab €29",  emoji: "🥩", tags: ["steak", "meat", "sear", "burger", "pan fry"] },
  { type: "tool", name: "Nudelmaschine",             search: "Marcato Atlas Nudelmaschine",          price: "ab €65",  emoji: "🍝", tags: ["pasta", "italian", "noodle", "tagliatelle", "lasagna", "fettuccine"] },
  { type: "tool", name: "Cocotte / Bräter",          search: "Staub Cocotte 24cm gusseisen",         price: "ab €169", emoji: "🫕", tags: ["stew", "braise", "roast", "french", "slow cook"] },
  { type: "tool", name: "Küchenthermometer",         search: "Digitales Fleischthermometer Küche",   price: "ab €12",  emoji: "🌡️", tags: ["meat", "fish", "roast", "temperature", "baking"] },
  { type: "tool", name: "Küchenwaage",               search: "Küchenwaage digital 5kg Präzision",    price: "ab €15",  emoji: "⚖️", tags: ["baking", "cake", "bread", "pastry"] },

  // ── INGREDIENTS ─────────────────────────────────────────────────────────
  { type: "ingredient", name: "Olivenöl",            search: "Bertolli Olivenöl extra vergine",      price: "ab €8",   emoji: "🫒", tags: ["olive oil", "olivenöl"] },
  { type: "ingredient", name: "Pasta",               search: "Barilla Pasta Spaghetti 500g",         price: "ab €2",   emoji: "🍝", tags: ["pasta", "spaghetti", "penne", "fusilli"] },
  { type: "ingredient", name: "Basmati Reis",        search: "Tilda Basmati Reis 5kg",               price: "ab €12",  emoji: "🍚", tags: ["rice", "basmati"] },
  { type: "ingredient", name: "Meersalz",            search: "Fleur de Sel Meersalz fein",           price: "ab €5",   emoji: "🧂", tags: ["salt", "sea salt"] },
  { type: "ingredient", name: "Kokosöl",             search: "Bio Kokosöl nativ 1000ml",             price: "ab €9",   emoji: "🥥", tags: ["coconut oil", "kokosöl"] },
  { type: "ingredient", name: "Sojasauce",           search: "Kikkoman Sojasauce 1L",                price: "ab €6",   emoji: "🍱", tags: ["soy sauce", "sojasauce", "tamari"] },
  { type: "ingredient", name: "Parmesan",            search: "Parmigiano Reggiano DOP am Stück",     price: "ab €12",  emoji: "🧀", tags: ["parmesan", "parmigiano"] },
  { type: "ingredient", name: "Dosentomaten",        search: "Mutti Polpa Tomatenstücke 400g",       price: "ab €2",   emoji: "🍅", tags: ["tomato", "tomatoes", "canned tomatoes", "passata"] },
  { type: "ingredient", name: "Kokosmilch",          search: "Aroy-D Kokosmilch 400ml",              price: "ab €2",   emoji: "🥥", tags: ["coconut milk", "kokosmilch"] },
  { type: "ingredient", name: "Mehl",                search: "Aurora Weizenmehl Type 405 2,5kg",     price: "ab €4",   emoji: "🌾", tags: ["flour", "all-purpose flour", "mehl"] },
  { type: "ingredient", name: "Panko / Semmelbrösel",search: "Panko Semmelbrösel japanisch",         price: "ab €4",   emoji: "🥖", tags: ["breadcrumbs", "panko"] },
  { type: "ingredient", name: "Honig",               search: "Bio Honig flüssig 1kg",                price: "ab €9",   emoji: "🍯", tags: ["honey", "honig"] },
  { type: "ingredient", name: "Butter",              search: "Kerrygold Butter 250g",                price: "ab €3",   emoji: "🧈", tags: ["butter"] },
  { type: "ingredient", name: "Gewürzset",           search: "Gewürzset Kräuter Gewürze Set 20",     price: "ab €19",  emoji: "🌶️", tags: ["spices", "seasoning", "paprika", "cumin", "turmeric", "oregano", "herbs"] },
];

// ─── Ingredient Keyword → Produkt ────────────────────────────────────────────

const INGREDIENT_MAP: { keywords: string[]; search: string }[] = [
  { keywords: ["olive oil", "olivenöl"],                                      search: "Bertolli Olivenöl extra vergine" },
  { keywords: ["pasta", "spaghetti", "penne", "rigatoni", "fusilli"],         search: "Barilla Pasta Spaghetti 500g" },
  { keywords: ["rice", "basmati", "jasmine rice"],                            search: "Tilda Basmati Reis 5kg" },
  { keywords: ["salt", "sea salt", "kosher salt", "fleur de sel"],            search: "Fleur de Sel Meersalz fein" },
  { keywords: ["coconut oil", "kokosöl"],                                     search: "Bio Kokosöl nativ 1000ml" },
  { keywords: ["soy sauce", "sojasauce", "tamari"],                           search: "Kikkoman Sojasauce 1L" },
  { keywords: ["parmesan", "parmigiano"],                                     search: "Parmigiano Reggiano DOP am Stück" },
  { keywords: ["canned tomatoes", "crushed tomatoes", "diced tomatoes", "tomato sauce", "passata", "tomato paste"], search: "Mutti Polpa Tomatenstücke 400g" },
  { keywords: ["coconut milk", "kokosmilch"],                                 search: "Aroy-D Kokosmilch 400ml" },
  { keywords: ["flour", "all-purpose flour", "mehl", "bread flour"],         search: "Aurora Weizenmehl Type 405 2,5kg" },
  { keywords: ["breadcrumbs", "panko"],                                       search: "Panko Semmelbrösel japanisch" },
  { keywords: ["honey", "honig"],                                             search: "Bio Honig flüssig 1kg" },
  { keywords: ["butter"],                                                     search: "Kerrygold Butter 250g" },
  { keywords: ["paprika", "smoked paprika", "cumin", "turmeric", "oregano", "thyme", "rosemary", "spice", "seasoning"], search: "Gewürzset Kräuter Gewürze Set 20" },
  { keywords: ["chicken broth", "vegetable broth", "stock", "brühe"],        search: "Knorr Gemüsebrühe Pulver" },
  { keywords: ["cream", "heavy cream", "whipping cream", "sahne"],           search: "Rama Cremefine Kochcreme" },
  { keywords: ["bread"],                                                      search: "Brotbackmischung Sauerteig" },
  { keywords: ["chocolate", "dark chocolate", "schokolade"],                 search: "Valrhona Zartbitterschokolade 70%" },
  { keywords: ["vanilla", "vanilla extract", "vanille"],                     search: "Vanilleextrakt Bourbon pur" },
  { keywords: ["baking powder", "backpulver"],                               search: "Dr. Oetker Backpulver" },
  { keywords: ["yeast", "dry yeast", "hefe"],                                search: "Dr. Oetker Trockenhefe" },
  { keywords: ["vinegar", "apple cider vinegar", "essig"],                   search: "Alnatura Apfelessig naturtrüb" },
  { keywords: ["lemon juice", "lime juice", "zitronen"],                     search: "Zitronensaft Bio 100%" },
  { keywords: ["garlic", "knoblauch"],                                       search: "Knoblauch Granulat 250g" },
  { keywords: ["ginger", "ingwer"],                                          search: "Ingwer gemahlen Bio" },
  { keywords: ["mustard", "senf"],                                           search: "Dijon Senf Maille" },
  { keywords: ["tahini", "sesame paste"],                                    search: "Tahini Sesampaste Bio" },
  { keywords: ["fish sauce", "fischsauce"],                                  search: "Tiparos Fischsauce Thai" },
  { keywords: ["worcestershire", "worcestershiresauce"],                     search: "Lea Perrins Worcestershire Sauce" },
  { keywords: ["tomato paste", "tomatenmark"],                               search: "Tomatenmark dreifach konzentriert" },
  { keywords: ["maple syrup", "ahornsirup"],                                 search: "Ahornsirup Grade A dunkel" },
];

/**
 * Gibt eine direkte Amazon-Such-URL für eine Zutat zurück.
 * Gibt null zurück wenn kein Match — dann kein Link anzeigen.
 */
export function getIngredientAffiliateUrl(ingredientName: string): string | null {
  const name = ingredientName.toLowerCase();
  for (const entry of INGREDIENT_MAP) {
    if (entry.keywords.some(kw => name.includes(kw))) {
      return `https://www.amazon.de/s?k=${encodeURIComponent(entry.search)}&tag=${TAG}`;
    }
  }
  return null;
}

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

  const fallback = tools
    .filter(p => p.tags.includes("general") && !scored.find(s => s.product.search === p.search))
    .slice(0, 3 - scored.length);

  return [...scored.map(s => s.product), ...fallback].slice(0, 3);
}

export function getProductsForRecipe(
  dishTypes: string[],
  ingredientNames: string[],
  recipeTitle: string = ""
): AffiliateProduct[] {
  return getToolsForRecipe(dishTypes, ingredientNames, recipeTitle);
}
