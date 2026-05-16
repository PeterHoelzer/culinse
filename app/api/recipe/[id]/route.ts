import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";
const MDB = "https://www.themealdb.com/api/json/v1/1";
const MDB_OFFSET = 9_000_000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  // TheMealDB recipe
  if (numId >= MDB_OFFSET) {
    const mealId = numId - MDB_OFFSET;
    try {
      const res = await fetch(`${MDB}/lookup.php?i=${mealId}`, { next: { revalidate: 86400 } });
      const data = await res.json();
      const m = data.meals?.[0];
      if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Extract ingredients (strIngredient1..20 + strMeasure1..20)
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const name = m[`strIngredient${i}`]?.trim();
        const measure = m[`strMeasure${i}`]?.trim();
        if (name) ingredients.push({ id: i, name, amount: 0, unit: measure || "", original: `${measure} ${name}`.trim() });
      }

      // Parse instructions into steps
      const rawSteps = (m.strInstructions || "").split(/\r?\n/).filter((s: string) => s.trim());
      const instructions = rawSteps.map((step: string, i: number) => ({ number: i + 1, step: step.trim() }));

      const recipe = {
        id: numId,
        title: m.strMeal,
        image: m.strMealThumb || null,
        source: m.strArea ? `${m.strArea} Cuisine` : "TheMealDB",
        sourceUrl: m.strSource || m.strYoutube || "#",
        time: null,
        servings: null,
        summary: null,
        ingredients,
        instructions,
        diets: [],
        dishTypes: [m.strCategory || ""],
      };
      return NextResponse.json({ recipe });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }
  }

  // Spoonacular recipe
  try {
    const res = await fetch(
      `${BASE}/recipes/${id}/information?includeNutrition=false&apiKey=${API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);
    const data = await res.json();

    const recipe = {
      id: data.id,
      title: data.title,
      image: data.image || null,
      source: data.sourceName || data.creditsText || "Unknown",
      sourceUrl: data.sourceUrl || "#",
      time: data.readyInMinutes ? `${data.readyInMinutes} min` : null,
      servings: data.servings || null,
      summary: data.summary || null,
      ingredients: (data.extendedIngredients || []).map((ing: Record<string, unknown>) => ({
        id: ing.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        original: ing.original,
      })),
      instructions: (data.analyzedInstructions?.[0]?.steps || []).map((step: Record<string, unknown>) => ({
        number: step.number,
        step: step.step,
      })),
      diets: data.diets || [],
      dishTypes: data.dishTypes || [],
    };
    return NextResponse.json({ recipe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}
