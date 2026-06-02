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

// key   → must match a messages `trendFilters.<key>` label
// value → unique identity (React key + selection) AND the value sent to the API
// type  → which /api/recipes param the value maps to
export const TREND_FILTER_DEFS = [
  { key: "trending",      value: "",             icon: "🔥", type: "" },
  { key: "highProtein",   value: "30",           icon: "💪", type: "minProtein" },
  { key: "lowCarb",       value: "40",           icon: "⚡", type: "maxCarbs" },
  { key: "keto",          value: "ketogenic",    icon: "🥑", type: "diet" },
  { key: "dairyFree",     value: "dairy",        icon: "🥛", type: "intolerances" },
  { key: "mediterranean", value: "mediterranean", icon: "🫒", type: "cuisine" },
];

export interface VideoRecipe {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  time?: string;
}
