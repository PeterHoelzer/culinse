import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";

  try {
    let url: string;

    if (query) {
      // Search mode
      url = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=6&addRecipeInformation=true&fillIngredients=false&apiKey=${API_KEY}`;
    } else if (category && category !== "All") {
      // Category filter (map to cuisine or meal type)
      const cuisineMap: Record<string, string> = {
        Asian: "asian",
        Italian: "italian",
        Mexican: "mexican",
        Breakfast: "american",
        Dessert: "european",
      };
      const mealTypeMap: Record<string, string> = {
        Breakfast: "breakfast",
        Dessert: "dessert",
        Soup: "soup",
      };

      if (mealTypeMap[category]) {
        url = `${BASE}/recipes/complexSearch?type=${mealTypeMap[category]}&number=6&addRecipeInformation=true&apiKey=${API_KEY}`;
      } else if (cuisineMap[category]) {
        url = `${BASE}/recipes/complexSearch?cuisine=${cuisineMap[category]}&number=6&addRecipeInformation=true&apiKey=${API_KEY}`;
      } else {
        url = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(category)}&number=6&addRecipeInformation=true&apiKey=${API_KEY}`;
      }
    } else {
      // Default: trending (random)
      url = `${BASE}/recipes/random?number=6&apiKey=${API_KEY}`;
    }

    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
    if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

    const data = await res.json();

    // Normalize both endpoints to same shape
    const recipes = (data.results ?? data.recipes ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      title: r.title,
      image: r.image || null,
      source: r.sourceName || r.creditsText || "Culinse",
      sourceUrl: r.sourceUrl || "#",
      time: r.readyInMinutes ? `${r.readyInMinutes} min` : "—",
      calories: null, // only available with nutrition data (extra API call)
      servings: r.servings || null,
      rating: r.spoonacularScore ? Math.round((r.spoonacularScore as number) / 20) / 1 : null,
    }));

    return NextResponse.json({ recipes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
