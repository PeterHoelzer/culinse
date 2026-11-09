/** Farben aus dem Rezeptfoto (lib/dishColor.ts): Bühne dunkel, Ton hell, Akzent mittel. */
export interface DishColors {
  stage: string;
  tint: string;
  accent: string;
}

export interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string;
  servings: number | null;
  rating: number | null;
  imagePosition?: string | null;
  /** Sprache des Originalnamens (z. B. "en" bei irischen Gerichten), siehe lib/recipeTitle.ts */
  nameLang?: string | null;
  /** Akzentfarbe aus dem Foto, serverseitig gesetzt; fehlt bei nachgeladenen Karten. */
  accent?: string | null;
  /** Kategorie als Wort für die Metazeile der Karte („Suppe“); optional, liefert die API derzeit nicht. */
  category?: string | null;
  /** Ernährungskennzeichnung für die Metazeile (grün); optional. */
  diet?: "vegetarian" | "vegan" | null;
}

export const EN_CATEGORIES = ["All", "German", "Kurdish", "Air Fryer", "Main Dishes", "Vegetarian", "Quick", "Sides & Snacks", "Festive", "Breakfast", "Dessert", "Salad", "Soup", "Pasta", "Seafood", "Pizza", "Asian"];

// Bundesland-Chips (19.09.26): [URL-Wert, Anzeigename] — Eigennamen bleiben in allen Sprachen deutsch.
export const STATE_CHIPS: [string, string][] = [
  ["baden-wuerttemberg", "Baden-Württemberg"],
  ["bayern", "Bayern"],
  ["berlin", "Berlin"],
  ["brandenburg", "Brandenburg"],
  ["bremen", "Bremen"],
  ["hamburg", "Hamburg"],
  ["hessen", "Hessen"],
  ["mecklenburg-vorpommern", "Mecklenburg-Vorpommern"],
  ["niedersachsen", "Niedersachsen"],
  ["nordrhein-westfalen", "Nordrhein-Westfalen"],
  ["rheinland-pfalz", "Rheinland-Pfalz"],
  ["saarland", "Saarland"],
  ["sachsen", "Sachsen"],
  ["sachsen-anhalt", "Sachsen-Anhalt"],
  ["schleswig-holstein", "Schleswig-Holstein"],
  ["thueringen", "Thüringen"],
];

// key   → must match a messages `trendFilters.<key>` label
// value → unique identity (React key + selection) AND the value sent to the API
// type  → which /api/recipes param the value maps to
// Keine Emojis mehr (DESIGN.md §6); die Chips tragen nur ihr Wort.
export const TREND_FILTER_DEFS = [
  { key: "trending",      value: "",              type: "" },
  { key: "highProtein",   value: "30",            type: "minProtein" },
  { key: "lowCarb",       value: "40",            type: "maxCarbs" },
  { key: "keto",          value: "ketogenic",     type: "diet" },
  { key: "dairyFree",     value: "dairy",         type: "intolerances" },
  { key: "mediterranean", value: "mediterranean", type: "cuisine" },
];

export interface VideoRecipe {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  time?: string;
}
