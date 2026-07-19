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

/**
 * Wraps an affiliate URL in our /api/out redirect ("turnstile") so every
 * click is counted before forwarding. source = placement identifier
 * (recipe_ingredient, recipe_tools, shopping_list, …).
 */
export function trackedUrl(url: string, source: string, recipeId?: string | number): string {
  const params = new URLSearchParams({ u: url, s: source });
  if (recipeId !== undefined && recipeId !== null && `${recipeId}` !== "") {
    params.set("r", `${recipeId}`);
  }
  return `/api/out?${params.toString()}`;
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
    asin: "B0CZXXVKS7",  // Ninja MAX PRO 6.2L
    search: "Ninja Heißluftfritteuse Air Fryer",
    price: "ab €129", emoji: "🍟",
    tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries", "chicken wings", "nuggets"],
  },
  {
    type: "tool",
    name: "Ninja Foodi Multi-Cooker",
    asin: "B07VYTNKLT",  // Ninja Foodi 9-in-1 6L
    search: "Ninja Foodi Multi Cooker Multikocher",
    price: "ab €200", emoji: "🍲",
    tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole", "pressure cook", "chili"],
  },
  {
    type: "tool",
    name: "Ninja Woodfire Grill",
    asin: "B0CXDTMM28",  // Ninja Woodfire Pro Connect XL BBQ Smoker
    search: "Ninja Woodfire Outdoor Grill BBQ Smoker",
    price: "ab €429", emoji: "🔥",
    tags: ["grill", "bbq", "barbecue", "grilled", "burger", "ribs", "brisket", "smoky"],
  },
  {
    type: "tool",
    name: "Ninja Blender",
    asin: "B0D8QNV7LM",  // Ninja Detect Power Mixer Pro (Ersatz 19.07.2026, alter ASIN ohne Buybox)
    search: "Ninja Professional Standmixer Blender",
    price: "ab €140", emoji: "🥤",
    tags: ["smoothie", "blend", "shake", "puree", "beverage", "soup puree", "hummus"],
  },
  {
    type: "tool",
    name: "Ninja Creami",
    asin: "B0FP2KH5FP",  // Ninja Creami Deluxe (Ersatz 19.07.2026, NC302EU EOL)
    search: "Ninja Creami Eismaschine",
    price: "ab €200", emoji: "🍦",
    tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "frozen yogurt", "nice cream"],
  },
  {
    type: "tool",
    name: "Ninja Food Processor",
    asin: "B0GLQZJWQG",  // Ninja PrecisionPro 2.1L
    search: "Ninja Food Processor Küchenmaschine",
    price: "ab €120", emoji: "🥗",
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
    asin: "B08GH6R477",  // Tefal Jamie Oliver Cook's Direct On 28cm (Ersatz 19.07.2026)
    search: "Tefal Expertise Pfanne 28cm Antihaft",
    price: "ab €50", emoji: "🍳",
    tags: ["egg", "omelette", "pancake", "sauté", "stir fry", "fish fillet", "breakfast", "crepe"],
  },
  {
    type: "tool",
    name: "Fleischthermometer",
    asin: "B074XND445",  // ThermoPro TP17
    search: "ThermoPro Fleischthermometer digital",
    price: "ab €22", emoji: "🌡️",
    tags: ["steak", "beef", "chicken", "pork", "lamb", "roast", "turkey", "temperature", "medium rare"],
  },
  {
    type: "tool",
    name: "Nudelmaschine",
    asin: "B0009U5OSO",  // Marcato Atlas 150
    search: "Marcato Atlas Nudelmaschine",
    price: "ab €75", emoji: "🍝",
    tags: ["pasta", "fresh pasta", "tagliatelle", "lasagna", "fettuccine", "pappardelle", "ravioli"],
  },
  {
    type: "tool",
    name: "Cocotte / Bräter",
    asin: "B000TSL56G",  // Staub rund 24cm
    search: "Staub Cocotte 24cm gusseisen",
    price: "ab €157", emoji: "🫕",
    tags: ["stew", "braise", "roast", "boeuf bourguignon", "coq au vin", "slow cook", "pot roast", "lamb shank"],
  },
  {
    type: "tool",
    name: "KitchenAid Küchenmaschine",
    asin: "B01HKZ24HE",  // KitchenAid Artisan
    search: "KitchenAid Artisan Küchenmaschine 4,8L",
    price: "ab €399", emoji: "🎂",
    tags: ["baking", "cake", "cookie", "bread dough", "meringue", "buttercream", "pastry", "muffin"],
  },
  {
    type: "tool",
    name: "Küchenwaage",
    asin: "B07PTNZT75",  // ETEKCITY digital 5kg
    search: "Küchenwaage digital 5kg",
    price: "ab €12", emoji: "⚖️",
    tags: ["baking", "bread", "cake", "pastry", "precise", "dough", "cookie", "macaron"],
  },
  {
    type: "tool",
    name: "Sous-Vide Stick",
    asin: "B094921FYY",  // Wancle 1100W
    search: "Sous Vide Stick Tauchsieder",
    price: "ab €60", emoji: "🌊",
    tags: ["sous vide", "vacuum", "beef tenderloin", "steak", "salmon", "chicken breast", "precision"],
  },
  {
    type: "tool",
    name: "Wok",
    asin: "B08C46DHNL",  // pasoli handgehämmert 30cm
    search: "Wok Stahl 30cm Induktion",
    price: "ab €65", emoji: "🥘",
    tags: ["stir fry", "wok", "asian", "chinese", "thai", "fried rice", "noodles", "toss"],
  },
  {
    type: "tool",
    name: "Stabmixer",
    asin: "B0D9VZG1NC",  // Braun MultiQuick 5
    search: "Braun Stabmixer MultiQuick",
    price: "ab €50", emoji: "🪄",
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

  // ── Öle & Fette (nur Spezialöle — Olivenöl/Pflanzenöl/Butter raus: im Supermarkt deutlich günstiger) ──
  { keywords: ["coconut oil", "kokosöl"],                         asin: "B013GBN8MG", search: "Bio Kokosöl nativ 1000ml",                label: "Kokosöl" },
  { keywords: ["sesame oil", "sesamöl"],                          asin: "B09TRSWTQ3", search: "Kikkoman Sesamöl geröstet",               label: "Sesamöl" },
  { keywords: ["ghee", "clarified butter"],                       asin: "B0104EI61G", search: "Maharishi Ayurveda Bio Ghee 500g",        label: "Ghee" },

  // ── Saucen & Würzmittel ─────────────────────────────────────────────────────
  { keywords: ["soy sauce", "sojasauce"],                         asin: "B000RPWGXC", search: "Kikkoman Sojasauce 1L",                   label: "Sojasauce" },
  { keywords: ["tamari"],                                         asin: "B01CQE03RM", search: "Kikkoman Tamari glutenfrei 1L",            label: "Tamari" },
  { keywords: ["fish sauce", "fischsauce"],                       asin: "B0050O7GVW", search: "Tiparos Fischsauce Thai 700ml",           label: "Fischsauce" },
  { keywords: ["worcestershire"],                                 asin: "B0074FOPSM", search: "Lea Perrins Worcestershire Sauce 568ml",  label: "Worcestershire Sauce" },
  { keywords: ["oyster sauce", "austernsauce"],                   asin: "B0DK3Y1RQK", search: "Lee Kum Kee Panda Austernsauce",           label: "Austernsauce" },
  { keywords: ["hoisin sauce", "hoisinsauce"],                    asin: "B0F5WZ61Q4", search: "Reishunger Bio Hoisin Sauce 250ml",       label: "Hoisin Sauce" },
  { keywords: ["sriracha"],                                       asin: "B00568NVTS", search: "Flying Goose Sriracha Sauce 455ml",       label: "Sriracha" },
  { keywords: ["tabasco", "hot sauce", "chilisauce"],             asin: "B004JUA5FW", search: "Tabasco Original Red Pepper Sauce 350ml", label: "Tabasco" },
  { keywords: ["mustard", "senf", "dijon"],                       asin: "B00MWUBJD8", search: "Maille Dijon Senf 215g",                  label: "Dijon-Senf" },
  { keywords: ["coconut milk", "kokosmilch"],                     asin: "B0071JPZHQ", search: "Aroy-D Kokosmilch 400ml",                 label: "Kokosmilch" },
  { keywords: ["cream of coconut", "coconut cream"],              asin: "B00AMXKK2S", search: "Chaokoah Coconut Cream 400ml",            label: "Kokosnusscreme" },

  // ── Getreide & Spezial-Reis (Standard-Nudeln/Mehl/Reis raus — im Supermarkt günstiger) ──
  { keywords: ["jasmine rice", "jasminreis"],                     asin: "B004L5DBPQ", search: "Reishunger Jasminreis Bio",               label: "Jasminreis" },
  { keywords: ["arborio", "risotto rice", "risottoreis"],         asin: "B0CG9R48T8", search: "Gallo Arborio Risottoreis 1kg",           label: "Arborio Reis" },
  { keywords: ["couscous"],                                       asin: "B082VMCB9D", search: "Tipiak Couscous 500g",                    label: "Couscous" },
  { keywords: ["quinoa"],                                         asin: "B07JBXHN5Y", search: "Bio Quinoa weiß 1kg",                    label: "Quinoa" },
  { keywords: ["panko", "breadcrumbs", "semmelbrösel"],           asin: "B09TB8MW9G", search: "Kikkoman Panko Semmelbrösel 227g",        label: "Panko" },

  // ── Gewürze & Kräuter (getrocknet) ──────────────────────────────────────────
  { keywords: ["paprika", "smoked paprika"],                      asin: "B0CD2K52K9", search: "Ducros Paprika edelsüß",                  label: "Paprika" },
  { keywords: ["cumin", "kreuzkümmel"],                           asin: "B0GP7RRJ9T", search: "Ducros Kreuzkümmel gemahlen",              label: "Kreuzkümmel" },
  { keywords: ["turmeric", "kurkuma"],                            asin: "B01N4UHGUI", search: "Alnatura Kurkuma gemahlen Bio",            label: "Kurkuma" },
  { keywords: ["coriander", "koriander", "coriander powder"],    asin: "B0GK31BKJR", search: "Ducros Koriander gemahlen",               label: "Koriander" },
  { keywords: ["cinnamon", "zimt"],                               asin: "B01JPFG10S", search: "Ankerkraut Zimt gemahlen Ceylon",          label: "Zimt" },
  { keywords: ["oregano"],                                        asin: "B0897C4JRV", search: "Alpi Nature Oregano getrocknet 500g",      label: "Oregano" },
  { keywords: ["thyme", "thymian"],                               asin: "B0B9BHD6LZ", search: "Kotányi Thymian getrocknet",               label: "Thymian" },
  { keywords: ["rosemary", "rosmarin"],                           asin: "B0B9BHF862", search: "Kotányi Rosmarin getrocknet",              label: "Rosmarin" },
  { keywords: ["cayenne"],                                        asin: "B0FN4STFDD", search: "Ducros Cayennepfeffer",                   label: "Cayennepfeffer" },
  { keywords: ["chili flakes", "red pepper flakes", "chiliflocken"], asin: "B09WLWWQQN", search: "Chiliflocken getrocknet",              label: "Chiliflocken" },
  { keywords: ["ginger powder", "ingwer", "ground ginger"],      asin: "B0B9BJP3KB", search: "Alnatura Ingwer gemahlen Bio",             label: "Ingwer" },
  { keywords: ["garlic powder", "garlic granules", "knoblauchpulver"], asin: "B0B9BL1TYS", search: "Knoblauch Granulat",                label: "Knoblauchpulver" },
  { keywords: ["onion powder", "zwiebelpulver"],                  asin: "B0FD1NWK6H", search: "Zwiebelgranulat getrocknet",               label: "Zwiebelpulver" },
  { keywords: ["black pepper", "pfeffer"],                        asin: "B08LTKG129", search: "Alpi Nature schwarzer Pfeffer gemahlen",   label: "Pfeffer" },
  { keywords: ["bay leaf", "bay leaves", "lorbeer"],              asin: "B082VNQSRR", search: "Kotányi Lorbeerblätter getrocknet",        label: "Lorbeerblätter" },
  { keywords: ["cardamom", "kardamom"],                           asin: "B084H84C18", search: "Kardamom gemahlen",                       label: "Kardamom" },
  { keywords: ["za'atar", "zaatar"],                              asin: "B087CY9JGC", search: "Za'atar Gewürzmischung",                  label: "Za'atar" },
  { keywords: ["garam masala"],                                   asin: "B0D4223QGB", search: "Garam Masala Gewürzmischung",             label: "Garam Masala" },
  { keywords: ["curry powder", "currypulver"],                    asin: "B00COMCA82", search: "Madras Curry Pulver",                    label: "Currypulver" },
  { keywords: ["five spice", "fünf-gewürze"],                     asin: "B0B9W1NT99", search: "Chinesisches Fünf-Gewürze",               label: "Fünf-Gewürze" },
  { keywords: ["sumac", "sumach"],                                asin: "B0GTWGMNS4", search: "Sumach gemahlen Gewürz",                 label: "Sumach" },

  // ── Süße Spezialzutaten (Zucker/Honig raus — Cent-Artikel im Supermarkt) ──
  { keywords: ["maple syrup", "ahornsirup"],                      asin: "B0748PYFFV", search: "MapleFarm Ahornsirup Dark 500ml",          label: "Ahornsirup" },
  { keywords: ["dark chocolate", "bitter chocolate", "schokolade"], asin: "B09H1P8GW3", search: "Valrhona Zartbitterschokolade 70%",    label: "Zartbitterschokolade" },
  { keywords: ["chocolate chips", "schokoladentropfen"],          asin: "B0794ZBTZY", search: "Callebaut Schokoladentropfen",            label: "Schokoladentropfen" },
  { keywords: ["vanilla", "vanilla extract", "vanille"],          asin: "B0D798BNDL", search: "DECOCINO Vanilleextrakt 100ml",            label: "Vanilleextrakt" },
  { keywords: ["cocoa powder", "kakao"],                          asin: "B01ETNTDW4", search: "Bio Kakaopulver stark entölt 200g",        label: "Kakaopulver" },

  // ── Backzutaten (Backpulver/Natron/Hefe raus — Cent-Artikel) ──
  { keywords: ["cream of tartar", "weinstein"],                   asin: "B0995TP2RB", search: "Weinstein Backpulver",                   label: "Weinstein" },

  // ── Essig (nur Spezial — Apfel-/Rotweinessig & Zitronensaft raus) ──
  { keywords: ["balsamic vinegar", "balsamessig"],                asin: "B0D7J5JHK6", search: "Aceto Balsamico di Modena 250ml",          label: "Balsamessig" },
  { keywords: ["rice vinegar", "reisessig"],                      asin: "B07SCF96KB", search: "Diamond Reisessig 610ml",                  label: "Reisessig" },

  // ── Spezialzutaten ──────────────────────────────────────────────────────────
  { keywords: ["tahini", "sesame paste"],                         asin: "B005I4VEA8", search: "Al Yaman Tahini Sesampaste 454g",          label: "Tahini" },
  { keywords: ["miso", "miso paste"],                             asin: "B0CBT9K6DY", search: "Hikari Miso Paste weiß 400g",              label: "Miso" },
  { keywords: ["gochujang"],                                      asin: "B07YQ91R81", search: "Sempio Gochujang Rote Pfefferpaste 500g",  label: "Gochujang" },
  { keywords: ["harissa"],                                        asin: "B0F636FJJX", search: "Harissa Paste Bio",                       label: "Harissa" },
  { keywords: ["pesto"],                                          asin: "B09R5165CJ", search: "Barilla Pesto alla Genovese",             label: "Pesto" },
  { keywords: ["sun-dried tomatoes", "getrocknete tomaten"],      asin: "B071S2986D", search: "Getrocknete Tomaten in Öl",              label: "Getrocknete Tomaten" },
  { keywords: ["capers", "kapern"],                               asin: "B01M69GSN0", search: "Kapern in Lake",                         label: "Kapern" },
  { keywords: ["anchovy", "anchovies", "sardellen"],              asin: "B0CB1WPXJ8", search: "Flott Sardellen in Öl",                  label: "Sardellen" },
  { keywords: ["truffle oil", "trüffelöl"],                       asin: "B005451N2K", search: "Schwarzes Trüffelöl",                   label: "Trüffelöl" },
  { keywords: ["rose water", "rosenwasser"],                      asin: "B0F21T65YF", search: "Rosenwasser Lebensmittel",               label: "Rosenwasser" },
  { keywords: ["pomegranate molasses", "granatapfelsirup"],       asin: "B0FDXDP5Z9", search: "Granatapfelsirup",                        label: "Granatapfelsirup" },

  // ── Nüsse & Saaten ──────────────────────────────────────────────────────────
  { keywords: ["almonds", "mandeln"],                             asin: "B01M9GF8GL", search: "Alnatura Mandeln ganz Bio",               label: "Mandeln" },
  { keywords: ["walnuts", "walnüsse"],                            asin: "B01MQ230OK", search: "Walnüsse Bio",                            label: "Walnüsse" },
  { keywords: ["pine nuts", "pinienkerne"],                       asin: "B0G59DCJZK", search: "Pinienkerne geröstet",                   label: "Pinienkerne" },
  { keywords: ["sesame seeds", "sesam"],                          asin: "B0FN7WXTP6", search: "Sesamsamen geschält",                    label: "Sesam" },
  { keywords: ["chia seeds", "chiasamen"],                        asin: "B00TY7S4C6", search: "Chia Samen Bio",                          label: "Chiasamen" },
  { keywords: ["flaxseed", "leinsamen"],                          asin: "B0D1CSKPQY", search: "Leinsamen geschrotet Bio",               label: "Leinsamen" },
  { keywords: ["peanut butter", "erdnussbutter"],                 asin: "B0GN94C9WY", search: "Whole Earth Erdnussbutter Crunchy 340g",  label: "Erdnussbutter" },
  { keywords: ["almond flour", "mandelmehl"],                     asin: "B0GN346C38", search: "Mandelmehl blanchiert",                  label: "Mandelmehl" },

  // ── Asiatische Kochweine (Tafelwein, Milch-Alternativen & Parmesan raus) ──
  { keywords: ["mirin"],                                          asin: "B003WVBF80", search: "Kikkoman Mirin Kochwein",               label: "Mirin" },
  { keywords: ["sake"],                                           asin: "B0B59WD9TM", search: "Sake japanischer Reiswein",              label: "Sake" },
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
