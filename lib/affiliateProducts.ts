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
    asin: "B09LGMJJ25",
    search: "Ninja Air Fryer Heißluftfritteuse",
    price: "ab €99", emoji: "🍟",
    tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries", "chicken wings", "nuggets"],
  },
  {
    type: "tool",
    name: "Ninja Foodi Multi-Cooker",
    asin: "B07V5PNX13",
    search: "Ninja Foodi Multi Cooker Multikocher",
    price: "ab €149", emoji: "🍲",
    tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole", "pressure cook", "chili"],
  },
  {
    type: "tool",
    name: "Ninja Woodfire Grill",
    asin: "B0B5NTCP6X",
    search: "Ninja Woodfire Outdoor Grill",
    price: "ab €299", emoji: "🔥",
    tags: ["grill", "bbq", "barbecue", "grilled", "burger", "ribs", "brisket", "smoky"],
  },
  {
    type: "tool",
    name: "Ninja Blender",
    asin: "B07FQWQKCP",
    search: "Ninja Professional Standmixer Blender",
    price: "ab €89", emoji: "🥤",
    tags: ["smoothie", "blend", "shake", "puree", "beverage", "soup puree", "hummus"],
  },
  {
    type: "tool",
    name: "Ninja Creami",
    asin: "B09HLKQMTV",
    search: "Ninja Creami Eismaschine",
    price: "ab €179", emoji: "🍦",
    tags: ["ice cream", "frozen dessert", "sorbet", "gelato", "frozen yogurt", "nice cream"],
  },
  {
    type: "tool",
    name: "Ninja Food Processor",
    asin: "B083BQBPQB",
    search: "Ninja Food Processor Küchenmaschine",
    price: "ab €119", emoji: "🥗",
    tags: ["food processor", "coleslaw", "chop", "slice", "shred", "dough", "pulse"],
  },

  // ── Klassische Küchengeräte ─────────────────────────────────────────────────
  {
    type: "tool",
    name: "Kochmesser",
    asin: "B00009ZK08",  // Wüsthof Classic 20cm
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
    asin: "B003OLYMAK",  // Tefal Expertise
    search: "Tefal Expertise Pfanne 28cm",
    price: "ab €34", emoji: "🍳",
    tags: ["egg", "omelette", "pancake", "sauté", "stir fry", "fish fillet", "breakfast", "crepe"],
  },
  {
    type: "tool",
    name: "Fleischthermometer",
    asin: "B01IHHLB3W",  // ThermoPro TP03
    search: "Digitales Fleischthermometer Küche",
    price: "ab €12", emoji: "🌡️",
    tags: ["steak", "beef", "chicken", "pork", "lamb", "roast", "turkey", "temperature", "medium rare"],
  },
  {
    type: "tool",
    name: "Nudelmaschine",
    asin: "B00004RCIT",  // Marcato Atlas
    search: "Marcato Atlas Nudelmaschine",
    price: "ab €65", emoji: "🍝",
    tags: ["pasta", "fresh pasta", "tagliatelle", "lasagna", "fettuccine", "pappardelle", "ravioli"],
  },
  {
    type: "tool",
    name: "Cocotte / Bräter",
    asin: "B00IVNLZQ0",  // Staub 24cm
    search: "Staub Cocotte 24cm gusseisen",
    price: "ab €169", emoji: "🫕",
    tags: ["stew", "braise", "roast", "boeuf bourguignon", "coq au vin", "slow cook", "pot roast", "lamb shank"],
  },
  {
    type: "tool",
    name: "KitchenAid Küchenmaschine",
    asin: "B00005UP2P",
    search: "KitchenAid Artisan Küchenmaschine 4,8L",
    price: "ab €449", emoji: "🎂",
    tags: ["baking", "cake", "cookie", "bread dough", "meringue", "buttercream", "pastry", "muffin"],
  },
  {
    type: "tool",
    name: "Küchenwaage",
    asin: "B005QQUUZQ",
    search: "Küchenwaage digital 5kg",
    price: "ab €15", emoji: "⚖️",
    tags: ["baking", "bread", "cake", "pastry", "precise", "dough", "cookie", "macaron"],
  },
  {
    type: "tool",
    name: "Sous-Vide Stick",
    asin: "B08SLLS2LT",
    search: "Sous Vide Stick Tauchsieder",
    price: "ab €59", emoji: "🌊",
    tags: ["sous vide", "vacuum", "beef tenderloin", "steak", "salmon", "chicken breast", "precision"],
  },
  {
    type: "tool",
    name: "Wok",
    asin: "B00063RWQK",
    search: "Wok Stahl 30cm Induktion",
    price: "ab €25", emoji: "🥘",
    tags: ["stir fry", "wok", "asian", "chinese", "thai", "fried rice", "noodles", "toss"],
  },
  {
    type: "tool",
    name: "Stabmixer",
    asin: "B004NH8XWC",
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
  { keywords: ["olive oil", "olivenöl"],                          asin: "B07D2XN2HR", search: "Bertolli Olivenöl extra vergine",      label: "Olivenöl" },
  { keywords: ["coconut oil", "kokosöl"],                         asin: "B00DS842HS", search: "Bio Kokosöl nativ 1000ml",             label: "Kokosöl" },
  { keywords: ["sesame oil", "sesamöl"],                          asin: "B00BP4YHJM", search: "Kikkoman Sesamöl geröstet",            label: "Sesamöl" },
  { keywords: ["vegetable oil", "sunflower oil", "sonnenblumenöl"], asin: "B01HHQKFHI", search: "Rapunzel Sonnenblumenöl nativ",     label: "Pflanzenöl" },
  { keywords: ["butter"],                                         asin: "B07QPWZ3T6", search: "Kerrygold Butter 250g",               label: "Butter" },
  { keywords: ["ghee", "clarified butter"],                       asin: "B00DS842IQ", search: "Ghee geklärte Butter Bio",            label: "Ghee" },

  // ── Saucen & Würzmittel ─────────────────────────────────────────────────────
  { keywords: ["soy sauce", "sojasauce"],                         asin: "B00V7WJ6ZW", search: "Kikkoman Sojasauce 1L",              label: "Sojasauce" },
  { keywords: ["tamari"],                                         asin: "B001FFOO7Q", search: "Kikkoman Tamari glutenfrei",          label: "Tamari" },
  { keywords: ["fish sauce", "fischsauce"],                       asin: "B00BSQEZNE", search: "Tiparos Fischsauce Thai 700ml",      label: "Fischsauce" },
  { keywords: ["worcestershire"],                                  asin: "B000LKTJUI", search: "Lea Perrins Worcestershire Sauce",   label: "Worcestershire Sauce" },
  { keywords: ["oyster sauce", "austernsauce"],                   asin: "B007Y9KXGU", search: "Lee Kum Kee Austernsauce",          label: "Austernsauce" },
  { keywords: ["hoisin sauce", "hoisinsauce"],                    asin: "B000LKS07U", search: "Lee Kum Kee Hoisin Sauce",          label: "Hoisin Sauce" },
  { keywords: ["sriracha"],                                        asin: "B000OKWNHQ", search: "Sriracha Hot Chili Sauce",          label: "Sriracha" },
  { keywords: ["tabasco", "hot sauce", "chilisauce"],             asin: "B0032OFY8S", search: "Tabasco Red Pepper Sauce",          label: "Tabasco" },
  { keywords: ["mustard", "senf", "dijon"],                       asin: "B000LR5PNW", search: "Maille Dijon Senf",                 label: "Dijon-Senf" },
  { keywords: ["tomato paste", "tomatenmark"],                    asin: "B00JLXJ3KO", search: "Mutti Tomatenmark dreifach konzentriert", label: "Tomatenmark" },
  { keywords: ["canned tomatoes", "crushed tomatoes", "diced tomatoes", "passata", "tomato sauce"], asin: "B07F4V7ZZS", search: "Mutti Polpa Tomatenstücke 400g", label: "Dosentomaten" },
  { keywords: ["coconut milk", "kokosmilch"],                     asin: "B00BSQEYN6", search: "Aroy-D Kokosmilch 400ml",           label: "Kokosmilch" },
  { keywords: ["cream of coconut", "coconut cream"],              asin: "B07K18C5HK", search: "Chaokoah Coconut Cream 400ml",      label: "Kokosnusscreme" },
  { keywords: ["chicken broth", "chicken stock", "vegetable broth", "vegetable stock", "beef broth", "brühe", "stock"], asin: "B00TIYV5LE", search: "Knorr Gemüsebrühe Pulver 500g", label: "Brühe" },

  // ── Getreide, Nudeln & Hülsenfrüchte ────────────────────────────────────────
  { keywords: ["pasta", "spaghetti"],                             asin: "B00BG9XRJA", search: "Barilla Spaghetti n°5 500g",         label: "Spaghetti" },
  { keywords: ["penne"],                                          asin: "B00BG9XQN8", search: "Barilla Penne Rigate 500g",          label: "Penne" },
  { keywords: ["fusilli"],                                        asin: "B00BG9XQBC", search: "Barilla Fusilli 500g",               label: "Fusilli" },
  { keywords: ["rigatoni"],                                       asin: "B00BG9XQJK", search: "Barilla Rigatoni 500g",              label: "Rigatoni" },
  { keywords: ["rice", "basmati"],                                asin: "B002KFYF60", search: "Tilda Basmati Reis 5kg",             label: "Basmati Reis" },
  { keywords: ["jasmine rice", "jasminreis"],                     asin: "B07RLTH7YB", search: "Reishunger Jasminreis Bio",          label: "Jasminreis" },
  { keywords: ["arborio", "risotto rice", "risottoreis"],         asin: "B00ESXRQQA", search: "Gallo Arborio Risottoreis 1kg",     label: "Arborio Reis" },
  { keywords: ["couscous"],                                       asin: "B002TLHZ3E", search: "Tipiak Couscous 500g",               label: "Couscous" },
  { keywords: ["quinoa"],                                         asin: "B00JV36HDE", search: "Bio Quinoa weiß 1kg",               label: "Quinoa" },
  { keywords: ["flour", "all-purpose flour", "mehl"],             asin: "B09BGCGWPH", search: "Aurora Weizenmehl Type 405 2kg",    label: "Mehl" },
  { keywords: ["bread flour", "brotmehl", "type 550"],            asin: "B09BGCJR5H", search: "Aurora Weizenmehl Type 550",       label: "Brotmehl" },
  { keywords: ["chickpeas", "kichererbsen"],                      asin: "B00B3LBFQO", search: "Alnatura Kichererbsen 240g",       label: "Kichererbsen" },
  { keywords: ["lentils", "linsen"],                              asin: "B00B3LBDQ4", search: "Alnatura Rote Linsen 500g",        label: "Linsen" },
  { keywords: ["black beans", "kidney beans", "black-eyed peas", "bohnen"], asin: "B07B4YXMTF", search: "Bonduelle Kidneybohnen 400g", label: "Bohnen" },
  { keywords: ["panko", "breadcrumbs", "semmelbrösel"],           asin: "B00BG9XQ9A", search: "Kikkoman Panko Semmelbrösel",      label: "Panko" },
  { keywords: ["oats", "rolled oats", "haferflocken"],            asin: "B07GH7SZJ9", search: "Quaker Hafer Haferflocken zart",   label: "Haferflocken" },

  // ── Gewürze & Kräuter (getrocknet) ──────────────────────────────────────────
  { keywords: ["paprika", "smoked paprika"],                      asin: "B00CMQNLWM", search: "Ducros Paprika edelsüß",           label: "Paprika" },
  { keywords: ["cumin", "kreuzkümmel"],                           asin: "B00CMQNKTA", search: "Ducros Kreuzkümmel gemahlen",      label: "Kreuzkümmel" },
  { keywords: ["turmeric", "kurkuma"],                            asin: "B00CMQNM1Q", search: "Alnatura Kurkuma gemahlen Bio",    label: "Kurkuma" },
  { keywords: ["coriander", "koriander", "coriander powder"],    asin: "B00CMQNMOE", search: "Ducros Koriander gemahlen",        label: "Koriander" },
  { keywords: ["cinnamon", "zimt"],                               asin: "B00CMQNMZS", search: "Ankerkraut Zimt gemahlen Ceylon", label: "Zimt" },
  { keywords: ["oregano"],                                        asin: "B00CMQNM5C", search: "Kotányi Oregano getrocknet",       label: "Oregano" },
  { keywords: ["thyme", "thymian"],                               asin: "B00CMQNMVU", search: "Kotányi Thymian getrocknet",      label: "Thymian" },
  { keywords: ["rosemary", "rosmarin"],                           asin: "B00CMQNN4W", search: "Kotányi Rosmarin getrocknet",     label: "Rosmarin" },
  { keywords: ["cayenne"],                                        asin: "B00CMQNM9Y", search: "Ducros Cayennepfeffer",           label: "Cayennepfeffer" },
  { keywords: ["chili flakes", "red pepper flakes", "chiliflocken"], asin: "B00CMQNLT2", search: "Chiliflocken getrocknet",     label: "Chiliflocken" },
  { keywords: ["ginger powder", "ingwer", "ground ginger"],      asin: "B00CMQNMBI", search: "Alnatura Ingwer gemahlen Bio",    label: "Ingwer" },
  { keywords: ["garlic powder", "garlic granules", "knoblauchpulver"], asin: "B00CMQNL3S", search: "Knoblauch Granulat",       label: "Knoblauchpulver" },
  { keywords: ["onion powder", "zwiebelpulver"],                  asin: "B00CMQNLXO", search: "Zwiebelgranulat getrocknet",     label: "Zwiebelpulver" },
  { keywords: ["black pepper", "pfeffer"],                        asin: "B003BGGM5E", search: "Ankerkraut schwarzer Pfeffer",   label: "Pfeffer" },
  { keywords: ["sea salt", "salt", "salz"],                       asin: "B00BSQEWHK", search: "Fleur de Sel Meersalz",         label: "Meersalz" },
  { keywords: ["bay leaf", "bay leaves", "lorbeer"],              asin: "B00CMQNLSC", search: "Kotányi Lorbeerblätter getrocknet", label: "Lorbeerblätter" },
  { keywords: ["cardamom", "kardamom"],                           asin: "B07B4YXMQD", search: "Kardamom gemahlen",             label: "Kardamom" },
  { keywords: ["za'atar", "zaatar"],                              asin: "B07F4V7RZS", search: "Za'atar Gewürzmischung",         label: "Za'atar" },
  { keywords: ["garam masala"],                                   asin: "B00CMQNLUA", search: "Garam Masala Gewürzmischung",    label: "Garam Masala" },
  { keywords: ["curry powder", "currypulver"],                    asin: "B00CMQNM3K", search: "Madras Curry Pulver",           label: "Currypulver" },
  { keywords: ["five spice", "fünf-gewürze"],                     asin: "B07B4YXNHZ", search: "Chinesisches Fünf-Gewürze",     label: "Fünf-Gewürze" },
  { keywords: ["sumac", "sumach"],                                asin: "B07B4YXMWM", search: "Sumach gemahlen Gewürz",        label: "Sumach" },

  // ── Süße Zutaten ────────────────────────────────────────────────────────────
  { keywords: ["honey", "honig"],                                 asin: "B00BSQEWTM", search: "Bio Honig flüssig 1kg",          label: "Honig" },
  { keywords: ["maple syrup", "ahornsirup"],                      asin: "B001EPQ57O", search: "Ahornsirup Grade A dunkel",      label: "Ahornsirup" },
  { keywords: ["sugar", "zucker"],                                asin: "B09BGCJRC8", search: "Rohrohrzucker Bio",              label: "Rohrzucker" },
  { keywords: ["brown sugar", "brauner zucker"],                  asin: "B09BGCJRZ9", search: "Billington's brauner Zucker",   label: "Brauner Zucker" },
  { keywords: ["powdered sugar", "icing sugar", "puderzucker"],  asin: "B09BGCJRN2", search: "Puderzucker fein",              label: "Puderzucker" },
  { keywords: ["dark chocolate", "bitter chocolate", "schokolade"], asin: "B00KZO2U66", search: "Valrhona Zartbitterschokolade 70%", label: "Zartbitterschokolade" },
  { keywords: ["chocolate chips", "schokoladentropfen"],          asin: "B00KZO2U70", search: "Callebaut Schokoladentropfen",  label: "Schokoladentropfen" },
  { keywords: ["vanilla", "vanilla extract", "vanille"],          asin: "B000LR5PK8", search: "Vanilleextrakt Bourbon pur",    label: "Vanilleextrakt" },
  { keywords: ["cocoa powder", "kakao"],                          asin: "B00KZO2UEK", search: "Valrhona Kakaopulver",          label: "Kakaopulver" },

  // ── Backzutaten ─────────────────────────────────────────────────────────────
  { keywords: ["baking powder", "backpulver"],                    asin: "B00DS84206", search: "Dr. Oetker Backpulver",         label: "Backpulver" },
  { keywords: ["baking soda", "natron"],                          asin: "B00DS8421A", search: "Arm & Hammer Natron",           label: "Natron" },
  { keywords: ["yeast", "dry yeast", "hefe"],                     asin: "B00DS8422O", search: "Dr. Oetker Trockenhefe",        label: "Trockenhefe" },
  { keywords: ["cream of tartar", "weinstein"],                   asin: "B07B4YXNBT", search: "Weinstein Backpulver",         label: "Weinstein" },

  // ── Essig & Säure ───────────────────────────────────────────────────────────
  { keywords: ["apple cider vinegar", "apfelessig"],              asin: "B00BSQF0WM", search: "Alnatura Apfelessig naturtrüb", label: "Apfelessig" },
  { keywords: ["balsamic vinegar", "balsamessig"],                asin: "B007Y9KXLQ", search: "Aceto Balsamico di Modena",     label: "Balsamessig" },
  { keywords: ["red wine vinegar", "rotweinessig"],               asin: "B007Y9KXKM", search: "Maille Rotweinessig",          label: "Rotweinessig" },
  { keywords: ["rice vinegar", "reisessig"],                      asin: "B007Y9KXHK", search: "Kikkoman Reisessig",           label: "Reisessig" },
  { keywords: ["lemon juice", "lime juice", "zitronen"],          asin: "B00JLXJ3WU", search: "Zitronensaft Bio 100%",        label: "Zitronensaft" },

  // ── Spezialzutaten ──────────────────────────────────────────────────────────
  { keywords: ["tahini", "sesame paste"],                         asin: "B00BSQF15W", search: "Al Wadi Tahini Sesampaste",    label: "Tahini" },
  { keywords: ["miso", "miso paste"],                             asin: "B00BSQF1V2", search: "Hikari Miso Paste weiß",       label: "Miso" },
  { keywords: ["gochujang"],                                      asin: "B07F4V8S2T", search: "CJ Haechandle Gochujang",      label: "Gochujang" },
  { keywords: ["harissa"],                                        asin: "B07B4YXMJK", search: "Harissa Paste Bio",            label: "Harissa" },
  { keywords: ["pesto"],                                          asin: "B00JLXJ3ZW", search: "Barilla Pesto alla Genovese",  label: "Pesto" },
  { keywords: ["sun-dried tomatoes", "getrocknete tomaten"],      asin: "B07B4YXN7H", search: "Getrocknete Tomaten in Öl",   label: "Getrocknete Tomaten" },
  { keywords: ["capers", "kapern"],                               asin: "B07B4YXNLV", search: "Kapern in Lake",              label: "Kapern" },
  { keywords: ["anchovy", "anchovies", "sardellen"],              asin: "B07B4YXNQ1", search: "Flott Sardellen in Öl",       label: "Sardellen" },
  { keywords: ["truffle oil", "trüffelöl"],                       asin: "B07B4YXNXK", search: "Schwarzes Trüffelöl",        label: "Trüffelöl" },
  { keywords: ["rose water", "rosenwasser"],                      asin: "B07B4YXNYZ", search: "Rosenwasser Lebensmittel",    label: "Rosenwasser" },
  { keywords: ["pomegranate molasses", "granatapfelsirup"],       asin: "B07B4YXP2M", search: "Granatapfelsirup",            label: "Granatapfelsirup" },

  // ── Nüsse & Saaten ──────────────────────────────────────────────────────────
  { keywords: ["almonds", "mandeln"],                             asin: "B00BSQF2OA", search: "Alnatura Mandeln ganz Bio",    label: "Mandeln" },
  { keywords: ["walnuts", "walnüsse"],                            asin: "B00BSQF2XK", search: "Walnüsse Bio",               label: "Walnüsse" },
  { keywords: ["pine nuts", "pinienkerne"],                       asin: "B00BSQF3BG", search: "Pinienkerne geröstet",        label: "Pinienkerne" },
  { keywords: ["sesame seeds", "sesam"],                          asin: "B07B4YXP7M", search: "Sesamsamen geschält",         label: "Sesam" },
  { keywords: ["chia seeds", "chiasamen"],                        asin: "B07B4YXPBH", search: "Chia Samen Bio",             label: "Chiasamen" },
  { keywords: ["flaxseed", "leinsamen"],                          asin: "B07B4YXPGC", search: "Leinsamen geschrotet Bio",   label: "Leinsamen" },
  { keywords: ["peanut butter", "erdnussbutter"],                 asin: "B00BSQF3PW", search: "Whole Earth Erdnussbutter",  label: "Erdnussbutter" },
  { keywords: ["almond flour", "mandelmehl"],                     asin: "B00BSQF4EI", search: "Mandelmehl blanchiert",      label: "Mandelmehl" },

  // ── Molkereiersatz & Pflanzlich ──────────────────────────────────────────────
  { keywords: ["almond milk", "mandelmilch"],                     asin: "B07B4YXPPB", search: "Alpro Mandelmilch ungesüßt", label: "Mandelmilch" },
  { keywords: ["oat milk", "hafermilch"],                         asin: "B07B4YXPUF", search: "Oatly Hafermilch Barista",   label: "Hafermilch" },
  { keywords: ["coconut cream", "coconut yogurt"],                asin: "B07K18C5HK", search: "Kokosnusscreme Kochcreme",   label: "Kokosnusscreme" },

  // ── Weine & Kochweine ───────────────────────────────────────────────────────
  { keywords: ["white wine", "dry white wine", "weißwein"],       asin: "B007Y9KXDQ", search: "Trockener Weißwein Kochen",  label: "Weißwein (zum Kochen)" },
  { keywords: ["red wine", "rotwein"],                            asin: "B007Y9KXEM", search: "Rotwein zum Kochen",         label: "Rotwein (zum Kochen)" },
  { keywords: ["mirin"],                                          asin: "B00BSQF5H2", search: "Kikkoman Mirin Kochwein",    label: "Mirin" },
  { keywords: ["sake"],                                           asin: "B07B4YXPZK", search: "Sake japanischer Reiswein",  label: "Sake" },
  { keywords: ["parmesan", "parmigiano"],                         asin: "B07B4YXQ4L", search: "Parmigiano Reggiano DOP",   label: "Parmesan" },
];

/**
 * Gibt eine direkte Amazon-URL für eine Zutat zurück.
 * Bevorzugt ASIN-Direktlink, Fallback auf Suche.
 * Gibt null zurück wenn kein Match → kein Link wird angezeigt.
 */
export function getIngredientAffiliateUrl(ingredientName: string): string | null {
  const name = ingredientName.toLowerCase();
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
