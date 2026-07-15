// ── Zutaten-Preisdatenbank (DE-Discounter-Niveau) ────────────────────────────
//
// Grundlage für die Kosten-Schätzung in der Einkaufsliste und den öffentlichen
// Einkaufsrechner (/grocery-list-calculator). Preise sind bewusst SCHÄTZUNGEN
// auf Eigenmarken-/Discounter-Niveau (Aldi/Lidl), gerundet, Stand siehe
// PRICES_UPDATED_AT. Kalibrierpunkte Juli 2026: Frischmilch 3,5 % ≈ 0,95 €/L,
// Butter ≈ 1,05–1,29 €/250 g (Quellen: lebensmittelpraxis.de, agrarheute).
//
// PFLEGE: Ein monatlicher automatischer Preis-Check gleicht die wichtigsten
// Einträge gegen aktuelle Quellen ab und aktualisiert PRICES_UPDATED_AT.
// Einträge NIE löschen, nur Preise anpassen — names[] wird von Matching in
// Einkaufsliste UND Rechner verwendet (EN zuerst, dann DE-Synonyme).
//
// Preislogik: perKg (€/kg) für Feststoffe, perL (€/L) für Flüssigkeiten,
// perPiece (€/Stück) für Stückware, pieceGrams für Stück→Gewicht-Umrechnung.

export const PRICES_UPDATED_AT = "2026-07-14";

export interface PriceEntry {
  /** lowercase Matching-Namen: Englisch zuerst (API-Rohdaten), dann Deutsch */
  names: string[];
  perKg?: number;
  perL?: number;
  perPiece?: number;
  /** typisches Stückgewicht in g — erlaubt "2 pc" → kg-Preis */
  pieceGrams?: number;
}

export const PRICE_TABLE: PriceEntry[] = [
  // ── Molkerei & Eier ──
  { names: ["milk", "whole milk", "milch", "vollmilch"], perL: 0.95 },
  { names: ["butter"], perKg: 4.8 },
  { names: ["egg", "eggs", "ei", "eier"], perPiece: 0.22, pieceGrams: 60 },
  { names: ["cream", "heavy cream", "whipping cream", "sahne", "schlagsahne"], perL: 2.6 },
  { names: ["sour cream", "creme fraiche", "crème fraîche", "schmand", "saure sahne"], perKg: 3.2 },
  { names: ["yogurt", "greek yogurt", "joghurt", "griechischer joghurt"], perKg: 2.2 },
  { names: ["quark", "magerquark", "cottage cheese", "hüttenkäse", "huettenkaese"], perKg: 3.0 },
  { names: ["skyr"], perKg: 3.4 },
  { names: ["cheese", "cheddar", "gouda", "edam", "käse", "kaese"], perKg: 9.0 },
  { names: ["parmesan", "parmigiano", "pecorino"], perKg: 16.0 },
  { names: ["mozzarella"], perKg: 6.4, perPiece: 0.95, pieceGrams: 125 },
  { names: ["feta", "schafskäse"], perKg: 8.5, perPiece: 1.29, pieceGrams: 150 },
  { names: ["halloumi"], perKg: 12.0, perPiece: 2.79, pieceGrams: 225 },
  { names: ["cream cheese", "frischkäse", "frischkaese"], perKg: 5.5 },
  { names: ["ricotta"], perKg: 6.0 },

  // ── Fleisch & Fisch ──
  { names: ["chicken breast", "chicken", "hähnchenbrust", "haehnchenbrust", "hähnchen", "hühnchen"], perKg: 8.5 },
  { names: ["chicken thigh", "hähnchenschenkel", "hähnchenkeule"], perKg: 5.5 },
  { names: ["ground beef", "minced beef", "beef mince", "hackfleisch", "rinderhack"], perKg: 8.0 },
  { names: ["mixed ground meat", "gemischtes hack"], perKg: 6.5 },
  { names: ["beef", "steak", "rindfleisch", "rind"], perKg: 14.0 },
  { names: ["pork", "pork loin", "schweinefleisch", "schwein", "schweinefilet"], perKg: 7.5 },
  { names: ["bacon", "speck", "bauchspeck"], perKg: 10.0 },
  { names: ["ham", "schinken"], perKg: 11.0 },
  { names: ["sausage", "sausages", "bratwurst", "wurst", "würstchen"], perKg: 7.0, perPiece: 0.7, pieceGrams: 100 },
  { names: ["salmon", "lachs", "lachsfilet"], perKg: 20.0 },
  { names: ["smoked salmon", "räucherlachs", "raeucherlachs"], perKg: 26.0 },
  { names: ["tuna", "canned tuna", "thunfisch"], perPiece: 1.15, pieceGrams: 140, perKg: 8.2 },
  { names: ["white fish", "cod", "kabeljau", "seelachs", "fischfilet"], perKg: 13.0 },
  { names: ["shrimp", "prawns", "garnelen", "shrimps"], perKg: 16.0 },
  { names: ["turkey", "pute", "putenbrust"], perKg: 9.0 },

  // ── Obst & Gemüse ──
  { names: ["onion", "onions", "zwiebel", "zwiebeln"], perKg: 1.3, pieceGrams: 100 },
  { names: ["red onion", "rote zwiebel", "rote zwiebeln"], perKg: 1.8, pieceGrams: 100 },
  { names: ["garlic", "garlic clove", "knoblauch", "knoblauchzehe"], perKg: 6.0, perPiece: 0.08, pieceGrams: 6 },
  { names: ["spring onion", "scallion", "green onion", "frühlingszwiebel", "lauchzwiebel"], perPiece: 0.99, pieceGrams: 100 },
  { names: ["tomato", "tomatoes", "tomate", "tomaten"], perKg: 2.8, pieceGrams: 120 },
  { names: ["cherry tomatoes", "kirschtomaten", "cocktailtomaten"], perKg: 4.0 },
  { names: ["cucumber", "gurke", "salatgurke"], perPiece: 0.89, pieceGrams: 400 },
  { names: ["bell pepper", "pepper", "paprika"], perKg: 3.3, perPiece: 0.85, pieceGrams: 180 },
  { names: ["carrot", "carrots", "karotte", "karotten", "möhre", "möhren", "moehren"], perKg: 1.2, pieceGrams: 80 },
  { names: ["potato", "potatoes", "kartoffel", "kartoffeln"], perKg: 1.3, pieceGrams: 120 },
  { names: ["sweet potato", "süßkartoffel", "suesskartoffel"], perKg: 2.6, pieceGrams: 250 },
  { names: ["zucchini", "courgette"], perKg: 2.5, perPiece: 0.79, pieceGrams: 300 },
  { names: ["eggplant", "aubergine"], perPiece: 1.19, pieceGrams: 300 },
  { names: ["broccoli", "brokkoli"], perKg: 2.9, perPiece: 1.09, pieceGrams: 400 },
  { names: ["cauliflower", "blumenkohl"], perPiece: 1.99, pieceGrams: 800 },
  { names: ["spinach", "spinat", "blattspinat"], perKg: 4.5 },
  { names: ["kale", "grünkohl", "gruenkohl"], perKg: 3.5 },
  { names: ["lettuce", "salad", "kopfsalat", "salat"], perPiece: 1.09, pieceGrams: 300 },
  { names: ["arugula", "rocket", "rucola"], perKg: 9.0 },
  { names: ["mixed greens", "blattsalat", "salatmix"], perKg: 8.0 },
  { names: ["cabbage", "white cabbage", "weißkohl", "weisskohl", "kohl"], perKg: 1.3, pieceGrams: 1200 },
  { names: ["red cabbage", "rotkohl"], perKg: 1.5, pieceGrams: 1000 },
  { names: ["mushroom", "mushrooms", "champignons", "pilze"], perKg: 4.5 },
  { names: ["leek", "lauch", "porree"], perPiece: 1.29, pieceGrams: 300 },
  { names: ["celery", "sellerie", "staudensellerie"], perPiece: 1.49, pieceGrams: 400 },
  { names: ["avocado"], perPiece: 1.19, pieceGrams: 200 },
  { names: ["corn", "sweetcorn", "mais", "maiskolben"], perPiece: 0.99, pieceGrams: 285 },
  { names: ["peas", "erbsen"], perKg: 2.4 },
  { names: ["green beans", "grüne bohnen", "gruene bohnen"], perKg: 3.5 },
  { names: ["asparagus", "green asparagus", "spargel", "grüner spargel"], perKg: 6.5 },
  { names: ["radish", "radishes", "radieschen"], perPiece: 0.69, pieceGrams: 150 },
  { names: ["ginger", "ingwer"], perKg: 5.5 },
  { names: ["chili", "chilli", "chili pepper", "chilischote"], perPiece: 0.25, pieceGrams: 15 },
  { names: ["lemon", "zitrone", "zitronen"], perPiece: 0.45, pieceGrams: 100 },
  { names: ["lime", "limette", "limetten"], perPiece: 0.4, pieceGrams: 70 },
  { names: ["orange", "orangen"], perKg: 2.2, pieceGrams: 180 },
  { names: ["apple", "apples", "apfel", "äpfel", "aepfel"], perKg: 2.4, pieceGrams: 160 },
  { names: ["banana", "bananas", "banane", "bananen"], perKg: 1.5, pieceGrams: 120 },
  { names: ["berries", "mixed berries", "beeren"], perKg: 7.0 },
  { names: ["strawberries", "erdbeeren"], perKg: 5.5 },
  { names: ["blueberries", "blaubeeren", "heidelbeeren"], perKg: 9.0 },
  { names: ["raspberries", "himbeeren"], perKg: 11.0 },
  { names: ["watermelon", "wassermelone"], perKg: 1.5 },
  { names: ["mango"], perPiece: 1.49, pieceGrams: 350 },
  { names: ["pomegranate", "granatapfel"], perPiece: 1.79, pieceGrams: 300 },
  { names: ["grapes", "trauben", "weintrauben"], perKg: 3.5 },

  // ── Trockenwaren, Reis & Nudeln ──
  { names: ["pasta", "spaghetti", "penne", "fusilli", "nudeln"], perKg: 1.8 },
  { names: ["rice", "basmati rice", "reis", "basmatireis"], perKg: 2.4 },
  { names: ["risotto rice", "arborio", "risottoreis"], perKg: 3.8 },
  { names: ["quinoa"], perKg: 6.5 },
  { names: ["couscous"], perKg: 3.2 },
  { names: ["bulgur"], perKg: 3.0 },
  { names: ["oats", "rolled oats", "oatmeal", "haferflocken"], perKg: 1.5 },
  { names: ["flour", "all-purpose flour", "mehl", "weizenmehl"], perKg: 0.85 },
  { names: ["lentils", "red lentils", "linsen", "rote linsen"], perKg: 3.2 },
  { names: ["chickpeas", "kichererbsen"], perKg: 3.0, perPiece: 0.89, pieceGrams: 240 },
  { names: ["beans", "black beans", "kidney beans", "white beans", "bohnen", "kidneybohnen", "schwarze bohnen", "weiße bohnen"], perKg: 3.0, perPiece: 0.79, pieceGrams: 240 },
  { names: ["noodles", "soba", "asia nudeln", "mie nudeln"], perKg: 4.5 },
  { names: ["gnocchi"], perKg: 3.4 },
  { names: ["orzo", "kritharaki"], perKg: 2.8 },
  { names: ["breadcrumbs", "paniermehl", "semmelbrösel"], perKg: 2.2 },
  { names: ["cornstarch", "speisestärke", "speisestaerke"], perKg: 2.6 },
  { names: ["sugar", "zucker"], perKg: 1.1 },
  { names: ["brown sugar", "brauner zucker"], perKg: 2.2 },
  { names: ["baking powder", "backpulver"], perKg: 8.0 },
  { names: ["yeast", "hefe"], perPiece: 0.15, pieceGrams: 42 },

  // ── Konserven & Saucen ──
  { names: ["canned tomatoes", "chopped tomatoes", "dosentomaten", "gehackte tomaten"], perPiece: 0.75, pieceGrams: 400 },
  { names: ["tomato paste", "tomatenmark"], perKg: 4.5, perPiece: 0.85, pieceGrams: 200 },
  { names: ["passata", "tomato sauce", "passierte tomaten", "tomatensauce"], perL: 1.4, perPiece: 0.95, pieceGrams: 500 },
  { names: ["coconut milk", "kokosmilch"], perL: 4.0, perPiece: 1.29, pieceGrams: 400 },
  { names: ["broth", "stock", "chicken broth", "vegetable broth", "brühe", "bruehe", "gemüsebrühe", "hühnerbrühe"], perL: 0.6 },
  { names: ["soy sauce", "sojasauce", "sojasoße"], perL: 6.0 },
  { names: ["olive oil", "olivenöl", "olivenoel"], perL: 7.5 },
  { names: ["vegetable oil", "sunflower oil", "rapsöl", "rapsoel", "sonnenblumenöl", "pflanzenöl", "öl", "oel", "oil"], perL: 2.2 },
  { names: ["sesame oil", "sesamöl"], perL: 12.0 },
  { names: ["vinegar", "essig"], perL: 1.6 },
  { names: ["balsamic vinegar", "balsamico"], perL: 4.5 },
  { names: ["mustard", "senf"], perKg: 3.0 },
  { names: ["ketchup"], perKg: 2.4 },
  { names: ["mayonnaise", "mayo"], perKg: 3.5 },
  { names: ["pesto"], perKg: 8.5, perPiece: 1.69, pieceGrams: 190 },
  { names: ["curry paste", "currypaste"], perKg: 12.0, perPiece: 1.99, pieceGrams: 165 },
  { names: ["salsa"], perKg: 4.5 },
  { names: ["hummus"], perKg: 7.0, perPiece: 1.39, pieceGrams: 200 },
  { names: ["tahini", "tahin"], perKg: 12.0 },
  { names: ["peanut butter", "erdnussbutter", "erdnussmus"], perKg: 5.5 },
  { names: ["honey", "honig"], perKg: 6.5 },
  { names: ["maple syrup", "ahornsirup"], perL: 16.0 },
  { names: ["jam", "marmelade", "konfitüre"], perKg: 3.5 },
  { names: ["olives", "oliven"], perKg: 6.0 },
  { names: ["capers", "kapern"], perKg: 12.0 },
  { names: ["pickles", "gewürzgurken", "gurken (glas)"], perKg: 2.8 },

  // ── Brot & Backwaren ──
  { names: ["bread", "brot"], perKg: 2.4, perPiece: 1.29, pieceGrams: 500 },
  { names: ["whole grain bread", "vollkornbrot"], perKg: 2.8, perPiece: 1.49, pieceGrams: 500 },
  { names: ["baguette"], perPiece: 0.99, pieceGrams: 250 },
  { names: ["tortilla", "tortillas", "wrap", "wraps"], perPiece: 0.35, pieceGrams: 62 },
  { names: ["pita", "flatbread", "fladenbrot"], perPiece: 0.89, pieceGrams: 250 },
  { names: ["burger buns", "burgerbrötchen", "brötchen", "broetchen"], perPiece: 0.35, pieceGrams: 75 },
  { names: ["bagel"], perPiece: 0.55, pieceGrams: 85 },
  { names: ["puff pastry", "blätterteig", "blaetterteig"], perPiece: 1.19, pieceGrams: 275 },
  { names: ["pizza dough", "pizzateig"], perPiece: 1.29, pieceGrams: 400 },

  // ── Pflanzlich & Protein ──
  { names: ["tofu"], perKg: 5.5, perPiece: 1.09, pieceGrams: 200 },
  { names: ["tempeh"], perKg: 11.0, perPiece: 2.19, pieceGrams: 200 },
  { names: ["seitan"], perKg: 12.0 },
  { names: ["edamame"], perKg: 4.5 },
  { names: ["falafel"], perKg: 7.0 },
  { names: ["soy milk", "oat milk", "sojadrink", "sojamilch", "haferdrink", "hafermilch"], perL: 1.1 },
  { names: ["soy yogurt", "sojajoghurt"], perKg: 2.6 },
  { names: ["protein powder", "proteinpulver", "eiweißpulver"], perKg: 16.0 },

  // ── Nüsse, Samen & Snacks ──
  { names: ["nuts", "mixed nuts", "nüsse", "nuesse"], perKg: 12.0 },
  { names: ["almonds", "mandeln"], perKg: 10.0 },
  { names: ["walnuts", "walnüsse", "walnuesse"], perKg: 11.0 },
  { names: ["cashews", "cashewkerne"], perKg: 12.0 },
  { names: ["peanuts", "erdnüsse", "erdnuesse"], perKg: 5.0 },
  { names: ["pine nuts", "pinienkerne"], perKg: 40.0 },
  { names: ["sesame", "sesame seeds", "sesam"], perKg: 7.0 },
  { names: ["chia seeds", "chiasamen", "chia"], perKg: 8.0 },
  { names: ["sunflower seeds", "sonnenblumenkerne"], perKg: 4.5 },
  { names: ["pumpkin seeds", "kürbiskerne", "kuerbiskerne"], perKg: 9.0 },
  { names: ["raisins", "rosinen"], perKg: 4.0 },
  { names: ["granola", "müsli", "muesli"], perKg: 4.0 },
  { names: ["dark chocolate", "chocolate", "schokolade", "zartbitterschokolade"], perKg: 9.0 },
  { names: ["cocoa powder", "kakao", "kakaopulver"], perKg: 7.0 },

  // ── Kräuter & Gewürze (Verbrauchsmengen sind klein) ──
  { names: ["basil", "basilikum"], perPiece: 1.49, pieceGrams: 30 },
  { names: ["parsley", "petersilie"], perPiece: 0.99, pieceGrams: 30 },
  { names: ["cilantro", "coriander", "koriander"], perPiece: 1.19, pieceGrams: 30 },
  { names: ["dill"], perPiece: 0.99, pieceGrams: 30 },
  { names: ["mint", "minze"], perPiece: 1.19, pieceGrams: 30 },
  { names: ["chives", "schnittlauch"], perPiece: 0.99, pieceGrams: 30 },
  { names: ["rosemary", "rosmarin"], perPiece: 1.19, pieceGrams: 20 },
  { names: ["thyme", "thymian"], perPiece: 1.19, pieceGrams: 20 },
  { names: ["salt", "salz", "sea salt", "meersalz"], perKg: 0.9 },
  { names: ["black pepper", "pepper (spice)", "pfeffer"], perKg: 18.0 },
  { names: ["paprika powder", "paprikapulver", "paprika (gewürz)"], perKg: 12.0 },
  { names: ["curry powder", "currypulver"], perKg: 14.0 },
  { names: ["cumin", "kreuzkümmel", "kreuzkuemmel"], perKg: 16.0 },
  { names: ["cinnamon", "zimt"], perKg: 14.0 },
  { names: ["turmeric", "kurkuma"], perKg: 13.0 },
  { names: ["oregano"], perKg: 20.0 },
  { names: ["chili flakes", "chiliflocken"], perKg: 18.0 },
  { names: ["vanilla", "vanille", "vanillezucker"], perPiece: 0.4, pieceGrams: 8 },

  // ── Tiefkühl & Sonstiges ──
  { names: ["frozen vegetables", "tiefkühlgemüse", "tk-gemüse", "tk gemüse"], perKg: 2.2 },
  { names: ["frozen berries", "tk-beeren", "tiefkühlbeeren"], perKg: 4.0 },
  { names: ["frozen spinach", "tk-spinat", "tiefkühlspinat"], perKg: 2.4 },
  { names: ["french fries", "pommes"], perKg: 2.2 },
  { names: ["fish sticks", "fischstäbchen"], perKg: 6.5 },
  { names: ["ice cream", "eis", "eiscreme"], perL: 3.0 },
  { names: ["wine", "white wine", "red wine", "wein", "weißwein", "rotwein"], perL: 4.5 },
  { names: ["orange juice", "juice", "orangensaft", "saft"], perL: 1.8 },
  { names: ["coffee", "kaffee"], perKg: 12.0 },
];

// ── Matching & Schätzung ──────────────────────────────────────────────────────

// Adjektive/Zubereitungswörter, die vor dem Matching entfernt werden (EN + DE)
const STRIP = new Set([
  "fresh", "dried", "frozen", "canned", "raw", "cooked", "whole", "large",
  "medium", "small", "extra", "organic", "chopped", "minced", "diced", "sliced",
  "grated", "shredded", "ground", "boneless", "skinless", "lean", "firm",
  "ripe", "baby", "mini", "low-fat", "full-fat", "plain", "unsalted", "salted",
  "frisch", "frische", "frischer", "frisches", "getrocknet", "getrocknete",
  "gehackt", "gehackte", "gewürfelt", "gerieben", "groß", "große", "grosse",
  "klein", "kleine", "bio", "mager", "fein", "feine", "grob", "reif", "reife",
]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-zäöüß\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STRIP.has(w))
    .join(" ")
    .trim();
}

/** Findet den Preiseintrag für einen Zutatennamen (EN oder DE), sonst null. */
export function findPriceEntry(rawName: string): PriceEntry | null {
  const name = normalize(rawName);
  if (!name) return null;

  // 1) exakter Treffer
  for (const entry of PRICE_TABLE) {
    if (entry.names.some((n) => n === name)) return entry;
  }
  // 2) Eintragsname vollständig im Zutatennamen enthalten (längster gewinnt,
  //    damit "chicken broth" → Brühe, nicht → Hähnchen)
  let best: PriceEntry | null = null;
  let bestLen = 0;
  for (const entry of PRICE_TABLE) {
    for (const n of entry.names) {
      if (n.length > bestLen && (` ${name} `.includes(` ${n} `) || name === n)) {
        best = entry;
        bestLen = n.length;
      }
    }
  }
  return best;
}

/**
 * Schätzt den Preis (€) für eine Zutatenmenge. amount/unit kommen aus der
 * metrisch normalisierten Einkaufsliste (g, kg, ml, L, pc, can, …).
 * Gibt null zurück, wenn keine seriöse Schätzung möglich ist — die UI zeigt
 * dann keinen Preis (lieber keine Zahl als eine falsche).
 */
export function estimatePrice(
  rawName: string,
  amount: number | null,
  unit: string
): number | null {
  const entry = findPriceEntry(rawName);
  if (!entry) return null;

  const u = (unit || "").toLowerCase();
  let price: number | null = null;

  if (amount && amount > 0) {
    if (u === "g") price = entry.perKg != null ? (amount / 1000) * entry.perKg : null;
    else if (u === "kg") price = entry.perKg != null ? amount * entry.perKg : null;
    else if (u === "ml") price = entry.perL != null ? (amount / 1000) * entry.perL : entry.perKg != null ? (amount / 1000) * entry.perKg : null;
    else if (u === "l") price = entry.perL != null ? amount * entry.perL : null;
    else if (u === "pc" || u === "piece" || u === "pieces" || u === "stück" || u === "stk" || u === "can" || u === "cans" || u === "dose" || u === "" ) {
      if (entry.perPiece != null) price = amount * entry.perPiece;
      else if (entry.pieceGrams && entry.perKg != null) price = amount * (entry.pieceGrams / 1000) * entry.perKg;
    } else if (u === "bunch" || u === "bund" || u === "sprig" || u === "zweig") {
      price = entry.perPiece ?? null;
    }
  } else if (entry.perPiece != null && (u === "" || u === "pinch" || u === "prise")) {
    // Menge unbekannt → eine typische Kaufeinheit ansetzen
    price = entry.perPiece;
  }

  if (price == null || !isFinite(price)) return null;
  // Gewürz-/Kleinstmengen: auf mindestens 5 Cent runden
  return Math.max(0.05, Math.round(price * 20) / 20);
}

/** Für den öffentlichen Rechner: alle Namen (dedupliziert) fürs Autocomplete. */
export function allIngredientNames(locale: "de" | "en"): string[] {
  const isDe = (s: string) => /[äöüß]/.test(s) || DE_HINTS.has(s);
  const out: string[] = [];
  for (const entry of PRICE_TABLE) {
    const candidates = entry.names.filter((n) => (locale === "de" ? isDe(n) : !isDe(n)));
    out.push(candidates[0] ?? entry.names[0]);
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b, locale));
}

// Deutsche Namen ohne Umlaute, die die Heuristik oben sonst nicht erkennt
const DE_HINTS = new Set([
  "milch", "vollmilch", "eier", "sahne", "schlagsahne", "schmand", "joghurt",
  "magerquark", "quark", "kaese", "frischkaese", "schafskäse", "hackfleisch",
  "rinderhack", "schinken", "wurst", "lachs", "lachsfilet", "thunfisch",
  "garnelen", "pute", "putenbrust", "zwiebel", "zwiebeln", "knoblauch",
  "tomate", "tomaten", "kirschtomaten", "gurke", "salatgurke", "paprika",
  "karotte", "karotten", "kartoffel", "kartoffeln", "brokkoli", "blumenkohl",
  "spinat", "blattspinat", "kopfsalat", "salat", "rucola", "salatmix",
  "weisskohl", "kohl", "rotkohl", "champignons", "pilze", "lauch", "porree",
  "sellerie", "staudensellerie", "mais", "maiskolben", "erbsen", "spargel",
  "radieschen", "ingwer", "chilischote", "zitrone", "zitronen", "limette",
  "limetten", "orangen", "apfel", "bananen", "banane", "beeren", "erdbeeren",
  "blaubeeren", "heidelbeeren", "himbeeren", "wassermelone", "granatapfel",
  "trauben", "weintrauben", "nudeln", "reis", "basmatireis", "risottoreis",
  "haferflocken", "mehl", "weizenmehl", "linsen", "kichererbsen", "bohnen",
  "kidneybohnen", "paniermehl", "zucker", "brauner zucker", "backpulver",
  "hefe", "dosentomaten", "gehackte tomaten", "tomatenmark",
  "passierte tomaten", "tomatensauce", "kokosmilch", "bruehe", "sojasauce",
  "rapsoel", "essig", "balsamico", "senf", "mayo", "erdnussbutter",
  "erdnussmus", "honig", "ahornsirup", "marmelade", "oliven", "kapern",
  "brot", "vollkornbrot", "fladenbrot", "broetchen", "pizzateig",
  "sojadrink", "sojamilch", "haferdrink", "hafermilch", "sojajoghurt",
  "proteinpulver", "mandeln", "walnuesse", "cashewkerne", "erdnuesse",
  "pinienkerne", "sesam", "chiasamen", "sonnenblumenkerne", "kuerbiskerne",
  "rosinen", "muesli", "schokolade", "zartbitterschokolade", "kakao",
  "kakaopulver", "basilikum", "petersilie", "koriander", "minze",
  "schnittlauch", "rosmarin", "thymian", "salz", "meersalz", "pfeffer",
  "paprikapulver", "currypulver", "kreuzkuemmel", "zimt", "kurkuma",
  "chiliflocken", "vanille", "vanillezucker", "pommes", "eis", "eiscreme",
  "wein", "rotwein", "orangensaft", "saft", "kaffee", "tahin",
]);

/** Formatiert einen Schätzpreis fürs UI (deutsches Format). */
export function formatEstPrice(price: number, locale: string): string {
  const s = price.toFixed(2);
  return locale === "de" ? `~${s.replace(".", ",")} €` : `~€${s}`;
}
