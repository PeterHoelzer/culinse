export interface AffiliateProduct {
  name: string;
  asin?: string;      // Direktlink zu einem konkreten Produkt (bevorzugt)
  search: string;     // Fallback-Suchbegriff falls kein ASIN
  price: string;
  emoji: string;
  type: "tool" | "ingredient";
  tags: string[];
}

const TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21";

export function getAffiliateUrl(product: AffiliateProduct): string {
  if (product.asin) {
    return `https://www.amazon.de/dp/${product.asin}?tag=${TAG}`;
  }
  return `https://www.amazon.de/s?k=${encodeURIComponent(product.search)}&tag=${TAG}`;
}

// ─── Küchenwerkzeuge ─────────────────────────────────────────────────────────
// Tags: Rezept-Eigenschaften die dieses Tool wirklich braucht.
// "general" wird NICHT mehr im Haystack gesetzt → keine zufälligen Treffer mehr.
// Ein Tool erscheint nur wenn ≥ 2 Tags passen.

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [

  // ── Ninja ───────────────────────────────────────────────────────────────────
  {
    type: "tool",
    name: "Ninja Air Fryer",
    search: "Ninja Heißluftfritteuse Air Fryer",
    price: "ab €99", emoji: "🍟",
    tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries", "chicken wings", "nuggets"],
  },
  {
    type: "tool",
    name: "Ninja Foodi Multi-Cooker",
    search: "Ninja Foodi Multi Cooker Multikocher",
    price: "ab €149", emoji: "🍲",
    tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole", "pressure cook", "chili"],
  },
  {
    type: "tool",
    name: "Ninja Woodfire Grill",
    asin: "B0CXDTMM28",
    search: "Ninja Woodfire Outdoor Grill BBQ Smoker",
    price: "ab €299", emoji: "🔥",
    tags: ["grill", "bbq", "barbecue", "grilled", "burger", "ribs", "brisket", "smoky"],
  },
  {
    type: "tool",
    name: "Ninja Blender",
    search: "Ninja Professional Standmixer Blender",
    price: "ab €89", emoji: "🥤",
    tags: ["smoothie", "blend", "shake", "puree", "beverage", "soup puree", "hummus"],
  },
  {
    type: "tool",
    name: "Ninja Creami",
    search: "Ninja Creami Eismaschine",
    price: "ab €179", emoji: "🍦",
    tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "frozen yogurt", "nice cream"],
  },
  {
    type: "tool",
    name: "Ninja Food Processor",
    search: "Ninja Food Processor Küchenmaschine",
    price: "ab €119", emoji: "🥗",
    tags: ["food processor", "coleslaw", "chop", "slice", "shred", "dough", "pulse"],
  },

  // ── Klassische Küchengeräte ─────────────────────────────────────────────────
  {
    type: "tool",
    name: "Kochmesser",
    asin: "B085V653KM",  // Wüsthof Classic 20cm
    search: "Wüsthof Classic Kochmesser 20cm",
    price: "ab €89", emoji: "🔪",
    tags: ["beef", "chicken", "pork", "lamb", "fish", "chop", "mince", "dice", "main course", "salad"],
  },
  {
    type: "tool",
    name: "Gusseisenpfanne",
    asin: "B00006JSUA",  // Lodge 26cm
    search: "Lodge Gusseisenpfanne 26cm",
    price: "ab €29", emoji: "🥩",
    tags: ["steak", "beef", "sear", "pan fry", "burger", "pork chop", "lamb chop", "main course"],
  },
  {
    type: "tool",
    name: "Antihaft-Pfanne",
    search: "Tefal Expertise Pfanne 28cm Antihaft",
    price: "ab €34", emoji: "🍳",
    tags: ["egg", "omelette", "pancake", "sauté", "stir fry", "fish fillet", "breakfast", "crepe"],
  },
  {
    type: "tool",
    name: "Fleischthermometer",
    asin: "B074XND445",  // ThermoPro TP17
    search: "ThermoPro Fleischthermometer digital",
    price: "ab €12", emoji: "🌡️",
    tags: ["steak", "beef", "chicken", "pork", "lamb", "roast", "turkey", "temperature", "medium rare"],
  },
  {
    type: "tool",
    name: "Nudelmaschine",
    search: "Marcato Atlas Nudelmaschine",
    price: "ab €65", emoji: "🍝",
    tags: ["pasta", "fresh pasta", "tagliatelle", "lasagna", "fettuccine", "pappardelle", "ravioli"],
  },
  {
    type: "tool",
    name: "Cocotte / Bräter",
    search: "Staub Cocotte 24cm gusseisen",
    price: "ab €169", emoji: "🫕",
    tags: ["stew", "braise", "roast", "boeuf bourguignon", "coq au vin", "slow cook", "pot roast", "lamb shank"],
  },
  {
    type: "tool",
    name: "KitchenAid Küchenmaschine",
    search: "KitchenAid Artisan Küchenmaschine 4,8L",
    price: "ab €449", emoji: "🎂",
    tags: ["baking", "cake", "cookie", "bread dough", "meringue", "buttercream", "pastry", "muffin"],
  },
  {
    type: "tool",
    name: "Küchenwaage",
    search: "Küchenwaage digital 5kg",
    price: "ab €15", emoji: "⚖️",
    tags: ["baking", "bread", "cake", "pastry", "precise", "dough", "cookie", "macaron"],
  },
  {
    type: "tool",
    name: "Sous-Vide Stick",
    search: "Sous Vide Stick Tauchsieder",
    price: "ab €59", emoji: "🌊",
    tags: ["sous vide", "vacuum", "beef tenderloin", "steak", "salmon", "chicken breast", "precision"],
  },
  {
    type: "tool",
    name: "Wok",
    search: "Wok Stahl 30cm Induktion",
    price: "ab €25", emoji: "🥘",
    tags: ["stir fry", "wok", "asian", "chinese", "thai", "fried rice", "noodles", "toss"],
  },
  {
    type: "tool",
    name: "Stabmixer",
    search: "Braun Stabmixer MultiQuick",
    price: "ab €39", emoji: "🪄",
    tags: ["soup", "puree", "sauce", "blend", "smoothie", "hollandaise", "mayonnaise", "bisque"],
  },
];

// ─── Zutat → Amazon-Produkt (Direktlink) ─────────────────────────────────────
// Frische Zutaten (Fleisch, Gemüse, Obst, frische Kräuter) werden bewusst
// NICHT gelistet — Amazon verkauft sie nicht sinnvoll.
// Alle anderen haltbaren Zutaten werden mit einem konkreten Produkt verknüpft.

interface IngredientEntry {
  keywords: string[];
  asin?: string;
  search: string;
  label: string;
}

const INGREDIENT_MAP: IngredientEntry[] = [

  // ── Öle & Fette ─────────────────────────────────────────────────────────────
  { keywords: ["olive oil", "olivenöl"],                          asin: "B08ZK875YC", search: "Bertolli Olivenöl extra vergine",      label: "Olivenöl" },
  { keywords: ["coconut oil", "kokosöl"],                                              search: "Bio Kokosöl nativ 1000ml",             label: "Kokosöl" },
  { keywords: ["sesame oil", "sesamöl"],                                               search: "Kikkoman Sesamöl geröstet",            label: "Sesamöl" },
  { keywords: ["vegetable oil", "sunflower oil", "sonnenblumenöl"],                    search: "Rapunzel Sonnenblumenöl nativ",        label: "Pflanzenöl" },
  { keywords: ["butter"],                                                               search: "Kerrygold Butter 250g",               label: "Butter" },
  { keywords: ["ghee", "clarified butter"],                                            search: "Ghee geklärte Butter Bio",            label: "Ghee" },

  // ── Saucen & Würzmittel ─────────────────────────────────────────────────────
  { keywords: ["soy sauce", "sojasauce"],                         asin: "B005E9VL28", search: "Kikkoman Sojasauce 1L",              label: "Sojasauce" },
  { keywords: ["tamari"],                                                               search: "Kikkoman Tamari glutenfrei",          label: "Tamari" },
  { keywords: ["fish sauce", "fischsauce"],                                            search: "Tiparos Fischsauce Thai 700ml",      label: "Fischsauce" },
  { keywords: ["worcestershire"],                                                       search: "Lea Perrins Worcestershire Sauce",   label: "Worcestershire Sauce" },
  { keywords: ["oyster sauce", "austernsauce"],                                        search: "Lee Kum Kee Austernsauce",          label: "Austernsauce" },
  { keywords: ["hoisin sauce", "hoisinsauce"],                                         search: "Lee Kum Kee Hoisin Sauce",          label: "Hoisin Sauce" },
  { keywords: ["sriracha"],                                                             search: "Sriracha Hot Chili Sauce",          label: "Sriracha" },
  { keywords: ["tabasco", "hot sauce", "chilisauce"],                                  search: "Tabasco Red Pepper Sauce",          label: "Tabasco" },
  { keywords: ["mustard", "senf", "dijon"],                                            search: "Maille Dijon Senf",                 label: "Dijon-Senf" },
  { keywords: ["tomato paste", "tomatenmark"],                    asin: "B08L4DJHVP", search: "Mutti Tomatenkonzentrat 200g",       label: "Tomatenmark" },
  { keywords: ["canned tomatoes", "crushed tomatoes", "diced tomatoes", "passata", "tomato sauce"], search: "Mutti Polpa Tomatenstücke 400g", label: "Dosentomaten" },
  { keywords: ["coconut milk", "kokosmilch"],                     asin: "B0042FRIHM", search: "Aroy-D Kokosmilch 400ml",           label: "Kokosmilch" },
  { keywords: ["cream of coconut", "coconut cream"],                                   search: "Chaokoah Coconut Cream 400ml",      label: "Kokosnusscreme" },
  { keywords: ["chicken broth", "chicken stock", "vegetable broth", "vegetable stock", "beef broth", "brühe", "stock"], search: "Knorr Gemüsebrühe Pulver 500g", label: "Brühe" },

  // ── Getreide, Nudeln & Hülsenfrüchte ────────────────────────────────────────
  { keywords: ["pasta", "spaghetti"],                                                   search: "Barilla Spaghetti n°5 500g",         label: "Spaghetti" },
  { keywords: ["penne"],                                                                search: "Barilla Penne Rigate 500g",          label: "Penne" },
  { keywords: ["fusilli"],                                                              search: "Barilla Fusilli 500g",               label: "Fusilli" },
  { keywords: ["rigatoni"],                                                             search: "Barilla Rigatoni 500g",              label: "Rigatoni" },
  { keywords: ["rice", "basmati"],                                                      search: "Tilda Basmati Reis 5kg",             label: "Basmati Reis" },
  { keywords: ["jasmine rice", "jasminreis"],                                           search: "Reishunger Jasminreis Bio",          label: "Jasminreis" },
  { keywords: ["arborio", "risotto rice", "risottoreis"],                               search: "Gallo Arborio Risottoreis 1kg",     label: "Arborio Reis" },
  { keywords: ["couscous"],                                                             search: "Tipiak Couscous 500g",               label: "Couscous" },
  { keywords: ["quinoa"],                                                               search: "Bio Quinoa weiß 1kg",               label: "Quinoa" },
  { keywords: ["flour", "all-purpose flour", "mehl"],                                  search: "Aurora Weizenmehl Type 405 2kg",    label: "Mehl" },
  { keywords: ["bread flour", "brotmehl", "type 550"],                                 search: "Aurora Weizenmehl Type 550",       label: "Brotmehl" },
  { keywords: ["chickpeas", "kichererbsen"],                                            search: "Alnatura Kichererbsen 240g",       label: "Kichererbsen" },
  { keywords: ["lentils", "linsen"],                                                    search: "Alnatura Rote Linsen 500g",        label: "Linsen" },
  { keywords: ["black beans", "kidney beans", "black-eyed peas", "bohnen"],            search: "Bonduelle Kidneybohnen 400g",      label: "Bohnen" },
  { keywords: ["panko", "breadcrumbs", "semmelbrösel"],                                search: "Kikkoman Panko Semmelbrösel",      label: "Panko" },
  { keywords: ["oats", "rolled oats", "haferflocken"],                                 search: "Quaker Hafer Haferflocken zart",   label: "Haferflocken" },

  // ── Gewürze & Kräuter (getrocknet) ──────────────────────────────────────────
  { keywords: ["paprika", "smoked paprika"],                                            search: "Ducros Paprika edelsüß",           label: "Paprika" },
  { keywords: ["cumin", "kreuzkümmel"],                                                 search: "Ducros Kreuzkümmel gemahlen",      label: "Kreuzkümmel" },
  { keywords: ["turmeric", "kurkuma"],                                                  search: "Alnatura Kurkuma gemahlen Bio",    label: "Kurkuma" },
  { keywords: ["coriander", "koriander", "coriander powder"],                          search: "Ducros Koriander gemahlen",        label: "Koriander" },
  { keywords: ["cinnamon", "zimt"],                                                     search: "Ankerkraut Zimt gemahlen Ceylon", label: "Zimt" },
  { keywords: ["oregano"],                                        asin: "B0897C4JRV", search: "Alpi Nature Oregano getrocknet 500g", label: "Oregano" },
  { keywords: ["thyme", "thymian"],                                                     search: "Kotányi Thymian getrocknet",      label: "Thymian" },
  { keywords: ["rosemary", "rosmarin"],                                                 search: "Kotányi Rosmarin getrocknet",     label: "Rosmarin" },
  { keywords: ["cayenne"],                                                               search: "Ducros Cayennepfeffer",           label: "Cayennepfeffer" },
  { keywords: ["chili flakes", "red pepper flakes", "chiliflocken"],                   search: "Chiliflocken getrocknet",         label: "Chiliflocken" },
  { keywords: ["ginger powder", "ingwer", "ground ginger"],                            search: "Alnatura Ingwer gemahlen Bio",    label: "Ingwer" },
  { keywords: ["garlic powder", "garlic granules", "knoblauchpulver"],                 search: "Knoblauch Granulat",              label: "Knoblauchpulver" },
  { keywords: ["onion powder", "zwiebelpulver"],                                        search: "Zwiebelgranulat getrocknet",      label: "Zwiebelpulver" },
  { keywords: ["black pepper", "pfeffer"],                        asin: "B08LTKG129", search: "Alpi Nature schwarzer Pfeffer gemahlen", label: "Pfeffer" },
  { keywords: ["sea salt", "salt", "salz", "kosher salt"],        asin: "B003CNZYGC", search: "Le Saunier de Camargue Fleur de Sel", label: "Meersalz" },
  { keywords: ["bay leaf", "bay leaves", "lorbeer"],                                   search: "Kotányi Lorbeerblätter getrocknet", label: "Lorbeerblätter" },
  { keywords: ["cardamom", "kardamom"],                                                 search: "Kardamom gemahlen",               label: "Kardamom" },
  { keywords: ["za'atar", "zaatar"],                                                    search: "Za'atar Gewürzmischung",          label: "Za'atar" },
  { keywords: ["garam masala"],                                                          search: "Garam Masala Gewürzmischung",    label: "Garam Masala" },
  { keywords: ["curry powder", "currypulver"],                                           search: "Madras Curry Pulver",            label: "Currypulver" },
  { keywords: ["five spice", "fünf-gewürze"],                                           search: "Chinesisches Fünf-Gewürze",      label: "Fünf-Gewürze" },
  { keywords: ["sumac", "sumach"],                                                       search: "Sumach gemahlen Gewürz",         label: "Sumach" },

  // ── Süße Zutaten ────────────────────────────────────────────────────────────
  { keywords: ["honey", "honig"],                                                        search: "Bio Honig flüssig",              label: "Honig" },
  { keywords: ["maple syrup", "ahornsirup"],                                             search: "Ahornsirup Grade A dunkel",      label: "Ahornsirup" },
  { keywords: ["sugar", "zucker"],                                                        search: "Rohrohrzucker Bio",              label: "Rohrzucker" },
  { keywords: ["brown sugar", "brauner zucker"],                                         search: "Billington's brauner Zucker",   label: "Brauner Zucker" },
  { keywords: ["powdered sugar", "icing sugar", "puderzucker"],                         search: "Puderzucker fein",               label: "Puderzucker" },
  { keywords: ["dark chocolate", "bitter chocolate", "schokolade"],                     search: "Valrhona Zartbitterschokolade 70%", label: "Zartbitterschokolade" },
  { keywords: ["chocolate chips", "schokoladentropfen"],                                search: "Callebaut Schokoladentropfen",   label: "Schokoladentropfen" },
  { keywords: ["vanilla", "vanilla extract", "vanille"],                                search: "Vanilleextrakt Bourbon pur",     label: "Vanilleextrakt" },
  { keywords: ["cocoa powder", "kakao"],                                                 search: "Valrhona Kakaopulver",           label: "Kakaopulver" },

  // ── Backzutaten ─────────────────────────────────────────────────────────────
  { keywords: ["baking powder", "backpulver"],                                           search: "Dr. Oetker Backpulver",          label: "Backpulver" },
  { keywords: ["baking soda", "natron"],                                                 search: "Arm & Hammer Natron",            label: "Natron" },
  { keywords: ["yeast", "dry yeast", "hefe"],                                            search: "Dr. Oetker Trockenhefe",         label: "Trockenhefe" },
  { keywords: ["cream of tartar", "weinstein"],                                          search: "Weinstein Backpulver",           label: "Weinstein" },

  // ── Essig & Säure ───────────────────────────────────────────────────────────
  { keywords: ["apple cider vinegar", "apfelessig"],              asin: "B085BDZZKY", search: "Eat Wholesome Apfelessig Bio 1L", label: "Apfelessig" },
  { keywords: ["balsamic vinegar", "balsamessig"],                                       search: "Aceto Balsamico di Modena",      label: "Balsamessig" },
  { keywords: ["red wine vinegar", "rotweinessig"],               asin: "B003TUDAFA", search: "Kühne Rotweinessig 500ml",        label: "Rotweinessig" },
  { keywords: ["rice vinegar", "reisessig"],                                             search: "Kikkoman Reisessig",             label: "Reisessig" },
  { keywords: ["lemon juice", "lime juice", "zitronen"],          asin: "B078K7H3HD", search: "Pfanner 100% Zitronensaft",       label: "Zitronensaft" },

  // ── Spezialzutaten ──────────────────────────────────────────────────────────
  { keywords: ["tahini", "sesame paste"],                                                search: "Al Wadi Tahini Sesampaste",     label: "Tahini" },
  { keywords: ["miso", "miso paste"],                                                    search: "Hikari Miso Paste weiß",        label: "Miso" },
  { keywords: ["gochujang"],                                                              search: "CJ Haechandle Gochujang",       label: "Gochujang" },
  { keywords: ["harissa"],                                                                search: "Harissa Paste Bio",             label: "Harissa" },
  { keywords: ["pesto"],                                                                  search: "Barilla Pesto alla Genovese",   label: "Pesto" },
  { keywords: ["sun-dried tomatoes", "getrocknete tomaten"],                             search: "Getrocknete Tomaten in Öl",    label: "Getrocknete Tomaten" },
  { keywords: ["capers", "kapern"],                                                       search: "Kapern in Lake",               label: "Kapern" },
  { keywords: ["anchovy", "anchovies", "sardellen"],                                     search: "Flott Sardellen in Öl",        label: "Sardellen" },
  { keywords: ["truffle oil", "trüffelöl"],                                              search: "Schwarzes Trüffelöl",          label: "Trüffelöl" },
  { keywords: ["rose water", "rosenwasser"],                                             search: "Rosenwasser Lebensmittel",      label: "Rosenwasser" },
  { keywords: ["pomegranate molasses", "granatapfelsirup"],                              search: "Granatapfelsirup",              label: "Granatapfelsirup" },

  // ── Nüsse & Saaten ──────────────────────────────────────────────────────────
  { keywords: ["almonds", "mandeln"],                                                    search: "Alnatura Mandeln ganz Bio",     label: "Mandeln" },
  { keywords: ["walnuts", "walnüsse"],                                                   search: "Walnüsse Bio",                  label: "Walnüsse" },
  { keywords: ["pine nuts", "pinienkerne"],                                              search: "Pinienkerne geröstet",          label: "Pinienkerne" },
  { keywords: ["sesame seeds", "sesam"],                                                 search: "Sesamsamen geschält",           label: "Sesam" },
  { keywords: ["chia seeds", "chiasamen"],                                               search: "Chia Samen Bio",                label: "Chiasamen" },
  { keywords: ["flaxseed", "leinsamen"],                                                 search: "Leinsamen geschrotet Bio",      label: "Leinsamen" },
  { keywords: ["peanut butter", "erdnussbutter"],                                        search: "Whole Earth Erdnussbutter",     label: "Erdnussbutter" },
  { keywords: ["almond flour", "mandelmehl"],                                            search: "Mandelmehl blanchiert",         label: "Mandelmehl" },

  // ── Molkereiersatz & Pflanzlich ──────────────────────────────────────────────
  { keywords: ["almond milk", "mandelmilch"],                                            search: "Alpro Mandelmilch ungesüßt",   label: "Mandelmilch" },
  { keywords: ["oat milk", "hafermilch"],                                                search: "Oatly Hafermilch Barista",      label: "Hafermilch" },
  { keywords: ["coconut yogurt"],                                                         search: "Kokosnusscreme Kochcreme",      label: "Kokosnusscreme" },

  // ── Weine & Kochweine ───────────────────────────────────────────────────────
  { keywords: ["white wine", "dry white wine", "weißwein"],                             search: "Trockener Weißwein Kochen",     label: "Weißwein (zum Kochen)" },
  { keywords: ["red wine", "rotwein"],                                                   search: "Rotwein zum Kochen",            label: "Rotwein (zum Kochen)" },
  { keywords: ["mirin"],                                                                  search: "Kikkoman Mirin Kochwein",       label: "Mirin" },
  { keywords: ["sake"],                                                                   search: "Sake japanischer Reiswein",     label: "Sake" },
  { keywords: ["parmesan", "parmigiano"],                                                search: "Parmigiano Reggiano DOP",       label: "Parmesan" },
];

/**
 * Gibt eine direkte Amazon-URL für eine Zutat zurück.
 * Bevorzugt ASIN-Direktlink, Fallback auf Suche.
 * Gibt null zurück wenn kein Match → kein Link wird angezeigt.
 */
export function getIngredientAffiliateUrl(ingredientName: string): string | null {
  const name = ingredientName.toLowerCase();

  // Don't link fresh herbs — they can't be shipped and dried is not a substitute in context.
  // e.g. "fresh oregano leaves" should NOT link to dried oregano.
  const freshHerbs = ["oregano", "thyme", "thymian", "rosemary", "rosmarin", "basil", "basilikum",
    "parsley", "petersilie", "cilantro", "koriander", "mint", "minze", "dill", "sage", "salbei",
    "chives", "schnittlauch", "tarragon", "estragon"];
  if (name.includes("fresh ") && freshHerbs.some(h => name.includes(h))) {
    return null;
  }

  for (const entry of INGREDIENT_MAP) {
    if (entry.keywords.some(kw => name.includes(kw))) {
      if (entry.asin) {
        return `https://www.amazon.de/dp/${entry.asin}?tag=${TAG}`;
      }
      return `https://www.amazon.de/s?k=${encodeURIComponent(entry.search)}&tag=${TAG}`;
    }
  }
  return null;
}

/**
 * Wählt 2–3 passende Küchengeräte für ein Rezept aus.
 * Zeigt KEINE Tools wenn kein guter Match gefunden wurde — lieber nichts
 * als eine Eismaschine beim Steak.
 */
export function getToolsForRecipe(
  dishTypes: string[],
  ingredientNames: string[],
  recipeTitle: string = ""
): AffiliateProduct[] {
  // "general" wird NICHT mehr in den Haystack gesetzt.
  // Tools erscheinen nur wenn sie wirklich zum Rezept passen.
  const haystack = [
    ...dishTypes.map(d => d.toLowerCase()),
    ...ingredientNames.map(i => i.toLowerCase()),
    recipeTitle.toLowerCase(),
  ].join(" ");

  const tools = AFFILIATE_PRODUCTS.filter(p => p.type === "tool");

  const scored = tools
    .map(p => ({
      product: p,
      score: p.tags.filter(t => haystack.includes(t)).length,
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score); // deterministisch, kein Math.random()

  // Mindestens 2 Tools mit Score ≥ 2 → zeige Top 3
  const highScore = scored.filter(s => s.score >= 2);
  if (highScore.length >= 2) {
    return highScore.slice(0, 3).map(s => s.product);
  }

  // 1 High-Score + weitere mit Score 1 → fülle auf max. 3 auf
  if (highScore.length === 1) {
    const extras = scored.filter(s => s.score === 1).slice(0, 2);
    return [...highScore, ...extras].slice(0, 3).map(s => s.product);
  }

  // Kein guter Match → lieber nichts anzeigen als falsches Produkt
  return [];
}

// Alias für bestehende Aufrufe
export function getProductsForRecipe(
  dishTypes: string[],
  ingredientNames: string[],
  recipeTitle: string = ""
): AffiliateProduct[] {
  return getToolsForRecipe(dishTypes, ingredientNames, recipeTitle);
}
