import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const number = Math.min(Number(searchParams.get("number") || 6), 24);
  const maxTime = searchParams.get("maxTime") || "";
  const diet = searchParams.get("diet") || "";
  const minProtein = searchParams.get("minProtein") || "";
  const maxCarbs = searchParams.get("maxCarbs") || "";
  const intolerances = searchParams.get("intolerances") || "";
  const cuisine = searchParams.get("cuisine") || "";

  try {
    let url: string;

    const extras = [
      maxTime ? `maxReadyTime=${maxTime}` : "",
      diet ? `diet=${encodeURIComponent(diet)}` : "",
      minProtein ? `minProtein=${minProtein}` : "",
      maxCarbs ? `maxCarbs=${maxCarbs}` : "",
      intolerances ? `intolerances=${encodeURIComponent(intolerances)}` : "",
      cuisine ? `cuisine=${encodeURIComponent(cuisine)}` : "",
    ].filter(Boolean).join("&");

    if (query) {
      url = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true&fillIngredients=false${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
    } else if (category && category !== "All") {
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
        url = `${BASE}/recipes/complexSearch?type=${mealTypeMap[category]}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else if (cuisineMap[category]) {
        url = `${BASE}/recipes/complexSearch?cuisine=${cuisineMap[category]}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else {
        url = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(category)}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      }
    } else if (extras) {
      url = `${BASE}/recipes/complexSearch?number=${number}&addRecipeInformation=true&${extras}&apiKey=${API_KEY}`;
    } else {
      url = `${BASE}/recipes/random?number=${number}&apiKey=${API_KEY}`;
    }

    const res = await fetch(url, { next: { revalidate: 3600 } }); // cache 1h
    if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

    const data = await res.json();

    // Normalize both endpoints to same shape — only recipes with images
    const recipes = (data.results ?? data.recipes ?? []).filter((r: Record<string, unknown>) => r.image).map((r: Record<string, unknown>) => ({
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
