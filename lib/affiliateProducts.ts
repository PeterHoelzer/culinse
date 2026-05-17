export interface AffiliateProduct {
  name: string;
  asin?: string;         // Amazon ASIN
  ninjaUrl?: string;     // Direktlink Ninja (für Ninja-Produkte)
  network: "amazon" | "ninja";
  price: string;
  image: string;
  tags: string[];        // Matched gegen dishTypes + Zutaten + Titel-Keywords
}

// ─── Produktliste ────────────────────────────────────────────────────────────
// Preise sind Richtwerte — werden nicht live abgefragt (Amazon ToS erlaubt keine statischen Preise,
// daher "ab €X" Formulierung). Bilder-URLs müssen nach Amazon-Associates-Approval durch echte CDN-URLs ersetzt werden.

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ── Ninja Produkte (via Amazon) ─────────────────────────────────────────
  {
    name: "Ninja Air Fryer Max XL",
    asin: "B07FDJMC9Q",
    network: "amazon",
    price: "ab €99",
    image: "https://m.media-amazon.com/images/I/71yFBEGRGJL._AC_SL1500_.jpg",
    tags: ["air fryer", "airfryer", "fried", "crispy", "wings", "fries", "side dish"],
  },
  {
    name: "Ninja Foodi Multi-Cooker",
    asin: "B07XBGD84W",
    network: "amazon",
    price: "ab €149",
    image: "https://m.media-amazon.com/images/I/71QRpXRGjAL._AC_SL1500_.jpg",
    tags: ["slow cooker", "stew", "soup", "braise", "one pot", "casserole", "main course"],
  },
  {
    name: "Ninja Woodfire Outdoor Grill",
    asin: "B0B2PQRJ4Y",
    network: "amazon",
    price: "ab €299",
    image: "https://m.media-amazon.com/images/I/81yHRsxIZGL._AC_SL1500_.jpg",
    tags: ["grill", "bbq", "barbecue", "grilled", "steak", "burger", "outdoor"],
  },
  {
    name: "Ninja Professional Blender",
    asin: "B07XC5HWTB",
    network: "amazon",
    price: "ab €89",
    image: "https://m.media-amazon.com/images/I/61YQWxnI9NL._AC_SL1500_.jpg",
    tags: ["smoothie", "blend", "soup", "sauce", "beverage", "shake", "puree"],
  },
  {
    name: "Ninja Creami Ice Cream Maker",
    asin: "B08J8TZ3LK",
    network: "amazon",
    price: "ab €179",
    image: "https://m.media-amazon.com/images/I/71WxEXpR0QL._AC_SL1500_.jpg",
    tags: ["ice cream", "frozen", "dessert", "sorbet", "gelato", "frozen dessert"],
  },
  {
    name: "Ninja 3-in-1 Food Processor",
    asin: "B07GKJRTD5",
    network: "amazon",
    price: "ab €119",
    image: "https://m.media-amazon.com/images/I/71yK5HGLXVL._AC_SL1500_.jpg",
    tags: ["chop", "slice", "dough", "baking", "salad", "coleslaw"],
  },

  // ── Amazon Produkte ──────────────────────────────────────────────────────
  {
    name: "Wüsthof Classic Kochmesser 20cm",
    asin: "B00009ZK08",
    network: "amazon",
    price: "ab €89",
    image: "https://m.media-amazon.com/images/I/41pBBLCBSeL._AC_SL1200_.jpg",
    tags: ["general", "meat", "salad", "main course", "chop", "slice", "mince"],
  },
  {
    name: "Tefal Expertise Pfanne 28cm",
    asin: "B005S76HGQ",
    network: "amazon",
    price: "ab €34",
    image: "https://m.media-amazon.com/images/I/51hVbNjKXHL._AC_SL1080_.jpg",
    tags: ["general", "main course", "breakfast", "egg", "pancake", "sauté", "fry"],
  },
  {
    name: "KitchenAid Artisan Küchenmaschine",
    asin: "B00005UP2P",
    network: "amazon",
    price: "ab €449",
    image: "https://m.media-amazon.com/images/I/51AqNXTEZJL._AC_SL1000_.jpg",
    tags: ["baking", "dessert", "bread", "cake", "cookie", "dough", "pastry"],
  },
  {
    name: "Lodge Gusseisen-Pfanne 26cm",
    asin: "B00006JSUA",
    network: "amazon",
    price: "ab €29",
    image: "https://m.media-amazon.com/images/I/71SA6CFFBWL._AC_SL1500_.jpg",
    tags: ["steak", "meat", "sear", "cast iron", "main course", "burger"],
  },
  {
    name: "Marcato Atlas Nudelmaschine",
    asin: "B00004S1AT",
    network: "amazon",
    price: "ab €65",
    image: "https://m.media-amazon.com/images/I/61z6j2jMjGL._AC_SL1000_.jpg",
    tags: ["pasta", "italian", "noodle", "tagliatelle", "lasagna", "fettuccine"],
  },
  {
    name: "Thermapen Digital-Thermometer",
    asin: "B01IHHLB3W",
    network: "amazon",
    price: "ab €12",
    image: "https://m.media-amazon.com/images/I/61X10LXEJZL._AC_SL1000_.jpg",
    tags: ["meat", "baking", "fish", "roast", "temperature", "general"],
  },
  {
    name: "Westmark Küchenwaage 5kg",
    asin: "B004Y3JFPW",
    network: "amazon",
    price: "ab €18",
    image: "https://m.media-amazon.com/images/I/51dOFuGE7xL._AC_SL1000_.jpg",
    tags: ["baking", "cake", "bread", "pastry", "dessert", "scale"],
  },
  {
    name: "Staub Cocotte 24cm",
    asin: "B000S1LCU4",
    network: "amazon",
    price: "ab €169",
    image: "https://m.media-amazon.com/images/I/61j5PYdySmL._AC_SL1000_.jpg",
    tags: ["stew", "braise", "soup", "slow cook", "roast", "french", "main course"],
  },
  {
    name: "Rösle Küchensieb 20cm",
    asin: "B0000AN3CS",
    network: "amazon",
    price: "ab €22",
    image: "https://m.media-amazon.com/images/I/61tHy7UCKFL._AC_SL1000_.jpg",
    tags: ["pasta", "salad", "vegetables", "drain", "rinse", "side dish"],
  },
];

// ─── Affiliate-URL generieren ────────────────────────────────────────────────

export function getAffiliateUrl(product: AffiliateProduct): string {
  if (product.asin) {
    const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21";
    return `https://www.amazon.de/dp/${product.asin}?tag=${tag}`;
  }
  return "#";
}

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
  }));

  // Sortiert nach Übereinstimmungen, dann zufällig mischen damit nicht immer dieselben kommen
  const matched = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);

  // Ninja-Produkte bevorzugen wenn sie matchen (höhere Provision)
  const ninja = matched.filter(s => s.product.network === "ninja").slice(0, 1);
  const amazon = matched.filter(s => s.product.network === "amazon").slice(0, 2);

  // Fallback: wenn kein Match, generische Amazon-Produkte
  const fallback = AFFILIATE_PRODUCTS.filter(p =>
    p.tags.includes("general") && p.network === "amazon"
  ).slice(0, 2);

  const result = [...ninja.map(s => s.product), ...amazon.map(s => s.product)];
  return result.length >= 2 ? result.slice(0, 3) : [...result, ...fallback].slice(0, 3);
}
