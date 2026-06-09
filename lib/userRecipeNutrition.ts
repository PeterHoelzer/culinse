import { translateTexts } from "@/lib/translate";

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;

export interface RecipeNutrition {
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

interface Ing {
  name?: string;
  amount?: number | string;
  unit?: string;
}

// Crude German detection so we only translate when needed (translating English
// lines as if they were German would mangle them).
const looksGerman = (text: string): boolean =>
  /[äöüß]/i.test(text) ||
  /\b(und|mit|oder|gramm|esslöffel|teelöffel|prise|stück|packung|möhre|zwiebel|knoblauch|mehl|zucker|salz|butter|eier)\b/i.test(text);

function nutrientAmount(nutrients: Array<{ name?: string; amount?: number }>, name: string): number {
  const n = nutrients.find((x) => x.name === name);
  return n && typeof n.amount === "number" ? n.amount : 0;
}

/**
 * Compute per-serving nutrition for a user-created / imported recipe via
 * Spoonacular's ingredient parser. German ingredient lines are translated to
 * English first so the parser can match them. Returns null on any failure
 * (never throws) so callers can degrade gracefully.
 */
export async function computeUserRecipeNutrition(
  servings: number | null | undefined,
  ingredients: Ing[]
): Promise<RecipeNutrition | null> {
  if (!SPOONACULAR_KEY || !Array.isArray(ingredients) || ingredients.length === 0) return null;

  let lines = ingredients
    .map((i) =>
      [i.amount, i.unit, i.name]
        .filter((x) => x !== undefined && x !== null && String(x).trim())
        .join(" ")
        .trim()
    )
    .filter(Boolean);
  if (lines.length === 0) return null;

  try {
    if (lines.some(looksGerman)) {
      lines = await translateTexts(lines, "DE", "EN");
    }

    const body = new URLSearchParams();
    body.set("ingredientList", lines.join("\n"));
    body.set("servings", String(servings && servings > 0 ? servings : 1));
    body.set("includeNutrition", "true");

    const res = await fetch(`https://api.spoonacular.com/recipes/parseIngredients?apiKey=${SPOONACULAR_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    let cal = 0, protein = 0, fat = 0, carbs = 0, any = false;
    for (const ing of data) {
      const nutrients = ing?.nutrition?.nutrients;
      if (!Array.isArray(nutrients)) continue;
      cal += nutrientAmount(nutrients, "Calories");
      protein += nutrientAmount(nutrients, "Protein");
      fat += nutrientAmount(nutrients, "Fat");
      carbs += nutrientAmount(nutrients, "Carbohydrates");
      any = true;
    }
    if (!any || cal <= 0) return null;

    const s = servings && servings > 0 ? servings : 1;
    return {
      calories: Math.round(cal / s),
      protein: Math.round(protein / s),
      fat: Math.round(fat / s),
      carbs: Math.round(carbs / s),
    };
  } catch {
    return null;
  }
}
