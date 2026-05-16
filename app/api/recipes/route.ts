import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";
const MDB = "https://www.themealdb.com/api/json/v1/1";
const MDB_OFFSET = 9_000_000; // prevents ID collision with Spoonacular

// ─── TheMealDB helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMDB(m: any) {
  if (!m || !m.strMealThumb) return null;
  return {
    id: MDB_OFFSET + Number(m.idMeal),
    title: m.strMeal,
    image: m.strMealThumb,
    source: m.strArea ? `${m.strArea} Cuisine` : "TheMealDB",
    sourceUrl: m.strSource || m.strYoutube || "#",
    time: "—",
    servings: null,
    rating: null,
  };
}

async function fetchMDB(query: string, category: string): Promise<ReturnType<typeof normalizeMDB>[]> {
  try {
    let url: string;
    const mdbCategoryMap: Record<string, string> = {
      Breakfast: "Breakfast",
      Dessert: "Dessert",
      Seafood: "Seafood",
      Pasta: "Pasta",
    };
    const mdbAreaMap: Record<string, string> = {
      Asian: "Japanese",
      Korean: "Japanese",
    };

    if (query) {
      url = `${MDB}/search.php?s=${encodeURIComponent(query)}`;
    } else if (category && category !== "All" && mdbCategoryMap[category]) {
      url = `${MDB}/filter.php?c=${mdbCategoryMap[category]}`;
    } else if (category && mdbAreaMap[category]) {
      url = `${MDB}/filter.php?a=${mdbAreaMap[category]}`;
    } else {
      // Fetch multiple randoms
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          fetch(`${MDB}/random.php`, { next: { revalidate: 3600 } }).then(r => r.json())
        )
      );
      return results
        .flatMap(d => d.meals || [])
        .map(normalizeMDB)
        .filter(Boolean) as ReturnType<typeof normalizeMDB>[];
    }

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return ((data.meals || []) as any[])
      .slice(0, 4)
      .map(normalizeMDB)
      .filter(Boolean) as ReturnType<typeof normalizeMDB>[];
  } catch {
    return [];
  }
}

// ─── Main route ───────────────────────────────────────────────────────────────

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

  // Only fetch MDB when no advanced filters active (MDB doesn't support them)
  const hasFilters = !!(maxTime || diet || minProtein || maxCarbs || intolerances || cuisine);

  try {
    const extras = [
      maxTime ? `maxReadyTime=${maxTime}` : "",
      diet ? `diet=${encodeURIComponent(diet)}` : "",
      minProtein ? `minProtein=${minProtein}` : "",
      maxCarbs ? `maxCarbs=${maxCarbs}` : "",
      intolerances ? `intolerances=${encodeURIComponent(intolerances)}` : "",
      cuisine ? `cuisine=${encodeURIComponent(cuisine)}` : "",
    ].filter(Boolean).join("&");

    let spoonUrl: string;

    if (query) {
      spoonUrl = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true&fillIngredients=false${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
    } else if (category && category !== "All") {
      const cuisineMap: Record<string, string> = {
        Asian: "asian",
        Korean: "korean",
        Italian: "italian",
        Mexican: "mexican",
      };
      const mealTypeMap: Record<string, string> = {
        Breakfast: "breakfast",
        Dessert: "dessert",
        Soup: "soup",
      };
      if (mealTypeMap[category]) {
        spoonUrl = `${BASE}/recipes/complexSearch?type=${mealTypeMap[category]}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else if (cuisineMap[category]) {
        spoonUrl = `${BASE}/recipes/complexSearch?cuisine=${cuisineMap[category]}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else {
        spoonUrl = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(category)}&number=${number}&addRecipeInformation=true${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      }
    } else if (extras) {
      spoonUrl = `${BASE}/recipes/complexSearch?number=${number}&addRecipeInformation=true&${extras}&apiKey=${API_KEY}`;
    } else {
      spoonUrl = `${BASE}/recipes/random?number=${number}&apiKey=${API_KEY}`;
    }

    // Fetch Spoonacular + TheMealDB in parallel
    const [spoonRes, mdbRecipes] = await Promise.all([
      fetch(spoonUrl, { next: { revalidate: 3600 } }),
      hasFilters ? Promise.resolve([]) : fetchMDB(query, category),
    ]);

    if (!spoonRes.ok) throw new Error(`Spoonacular error: ${spoonRes.status}`);
    const spoonData = await spoonRes.json();

    const spoonRecipes = (spoonData.results ?? spoonData.recipes ?? [])
      .filter((r: Record<string, unknown>) => r.image)
      .map((r: Record<string, unknown>) => ({
        id: r.id,
        title: r.title,
        image: r.image || null,
        source: r.sourceName || r.creditsText || "Culinse",
        sourceUrl: r.sourceUrl || "#",
        time: r.readyInMinutes ? `${r.readyInMinutes} min` : "—",
        servings: r.servings || null,
        rating: r.spoonacularScore ? Math.round((r.spoonacularScore as number) / 20) : null,
      }));

    // Merge & deduplicate by title
    const titles = new Set(spoonRecipes.map((r: { title: string }) => r.title.toLowerCase()));
    const uniqueMDB = (mdbRecipes as NonNullable<ReturnType<typeof normalizeMDB>>[])
      .filter(r => r && !titles.has(r.title.toLowerCase()));

    // Interleave: 2 Spoonacular, 1 MDB pattern
    const merged: typeof spoonRecipes = [];
    let si = 0, mi = 0;
    while (merged.length < number && (si < spoonRecipes.length || mi < uniqueMDB.length)) {
      if (si < spoonRecipes.length) merged.push(spoonRecipes[si++]);
      if (si < spoonRecipes.length) merged.push(spoonRecipes[si++]);
      if (mi < uniqueMDB.length) merged.push(uniqueMDB[mi++]);
    }

    return NextResponse.json({ recipes: merged.slice(0, number) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
