export interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string;
  servings: number | null;
  rating: number | null;
}

export const GRADIENTS = [
  "from-orange-400 to-rose-400",
  "from-violet-400 to-indigo-400",
  "from-emerald-400 to-teal-400",
  "from-amber-400 to-orange-400",
  "from-pink-400 to-rose-400",
  "from-cyan-400 to-blue-400",
];

export const EMOJIS = ["🍝", "🍛", "🥑", "🐟", "🍕", "🍫", "🥗", "🍜", "🥘", "🍲"];

export const EN_CATEGORIES = ["All", "Pasta", "Asian", "Korean", "Breakfast", "Seafood", "Pizza", "Dessert", "Salad", "Soup"];

export const TREND_FILTER_DEFS = [
  { key: "trending",  value: "",         icon: "🔥", type: "" },
  { key: "quick",     value: "30",        icon: "⚡", type: "maxReadyTime" },
  { key: "healthy",   value: "healthy",   icon: "🥗", type: "diet" },
  { key: "comfort",   value: "comfort",   icon: "🍲", type: "cuisine" },
  { key: "asian",     value: "asian",     icon: "🍜", type: "cuisine" },
];

export interface VideoRecipe {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  time?: string;
}
