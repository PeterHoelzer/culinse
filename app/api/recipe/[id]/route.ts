import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${BASE}/recipes/${id}/information?includeNutrition=false&apiKey=${API_KEY}`,
      { next: { revalidate: 86400 } } // cache 24h
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
