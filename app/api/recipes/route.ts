import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";
const MDB = "https://www.themealdb.com/api/json/v1/1";
const MDB_OFFSET = 9_000_000; // prevents ID collision with Spoonacular

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_BASE = "https://api.edamam.com/api/recipes/v2";

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
    } else if (category && category !== "All" && mdbAreaMap[category]) {
      url = `${MDB}/filter.php?a=${mdbAreaMap[category]}`;
    } else {
      // No query/category — skip MDB for default view (avoid duplicate randoms due to caching)
      return [];
    }

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    const seenIds = new Set<string>();
    return ((data.meals || []) as any[])
      .filter((m: any) => { if (seenIds.has(m.idMeal)) return false; seenIds.add(m.idMeal); return true; })
      .slice(0, 4)
      .map(normalizeMDB)
      .filter(Boolean) as ReturnType<typeof normalizeMDB>[];
  } catch {
    return [];
  }
}

// ─── Edamam helpers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEdamam(hit: any) {
  const r = hit?.recipe;
  if (!r || !r.image) return null;
  const rawId = r.uri?.split("#recipe_")[1];
  if (!rawId) return null;
  return {
    id: `edamam_${rawId}`,
    title: r.label,
    image: r.image,
    source: r.source || "Edamam",
    sourceUrl: r.url || "#",
    time: r.totalTime ? `${Math.round(r.totalTime)} min` : "—",
    servings: r.yield ? Math.round(r.yield) : null,
    rating: null,
  };
}

async function fetchEdamam(query: string, category: string): Promise<ReturnType<typeof normalizeEdamam>[]> {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) return [];
  try {
    const mealTypeMap: Record<string, string> = {
      Breakfast: "breakfast",
      Dessert: "dessert",
      Soup: "soup",
    };

    const params = new URLSearchParams({
      type: "public",
      app_id: EDAMAM_APP_ID,
      app_key: EDAMAM_APP_KEY,
    });

    if (query) {
      params.set("q", query);
    } else if (category && category !== "All" && mealTypeMap[category]) {
      params.set("mealType", mealTypeMap[category]);
      params.set("q", category);
    } else if (category && category !== "All") {
      params.set("q", category);
    } else {
      // Skip Edamam for default random view (save API quota)
      return [];
    }

    const res = await fetch(`${EDAMAM_BASE}?${params}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.hits || []) as any[])
      .slice(0, 3)
      .map(normalizeEdamam)
      .filter(Boolean) as ReturnType<typeof normalizeEdamam>[];
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

  // Only fetch MDB/Edamam when no advanced filters active (they don't support them)
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

    // Quality params applied to all Spoonacular requests
    const QUALITY = "sort=meta-score&minPopularity=30&instructionsRequired=true";

    let spoonUrl: string;

    if (query) {
      spoonUrl = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true&fillIngredients=false&${QUALITY}${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
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
        spoonUrl = `${BASE}/recipes/complexSearch?type=${mealTypeMap[category]}&number=${number}&addRecipeInformation=true&${QUALITY}${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else if (cuisineMap[category]) {
        spoonUrl = `${BASE}/recipes/complexSearch?cuisine=${cuisineMap[category]}&number=${number}&addRecipeInformation=true&${QUALITY}${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      } else {
        spoonUrl = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(category)}&number=${number}&addRecipeInformation=true&${QUALITY}${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
      }
    } else if (extras) {
      spoonUrl = `${BASE}/recipes/complexSearch?number=${number}&addRecipeInformation=true&${QUALITY}&${extras}&apiKey=${API_KEY}`;
    } else {
      // Default trending: sort by popularity, rotate daily so users see fresh content
      // offset cycles through 15 sets (one per day) — stays cacheable within a day
      const dailyOffset = (Math.floor(Date.now() / 86400000) % 15) * number;
      spoonUrl = `${BASE}/recipes/complexSearch?number=${number}&addRecipeInformation=true&sort=popularity&minPopularity=50&instructionsRequired=true&offset=${dailyOffset}&apiKey=${API_KEY}`;
    }

    // Fetch Spoonacular + TheMealDB + Edamam in parallel
    const [spoonRes, mdbRecipes, edamamRecipes] = await Promise.all([
      fetch(spoonUrl, { next: { revalidate: 3600 } }),
      hasFilters ? Promise.resolve([]) : fetchMDB(query, category),
      hasFilters ? Promise.resolve([]) : fetchEdamam(query, category),
    ]);

    // 402 = quota exceeded — degrade gracefully instead of crashing
    if (spoonRes.status === 402) {
      let fallback = [
        ...(mdbRecipes as NonNullable<ReturnType<typeof normalizeMDB>>[]).filter(Boolean),
        ...(edamamRecipes as NonNullable<ReturnType<typeof normalizeEdamam>>[]).filter(Boolean),
      ];
      // For default view MDB/Edamam return [] — fetch diverse emergency fallback
      if (fallback.length < number) {
        const [r1, r2, r3] = await Promise.all([
          fetchMDB("chicken", ""),
          fetchMDB("pasta", ""),
          fetchMDB("beef", ""),
        ]);
        const combined = [...r1, ...r2, ...r3].filter(Boolean) as NonNullable<ReturnType<typeof normalizeMDB>>[];
        // Shuffle so it's not always the same order
        combined.sort(() => Math.random() - 0.5);
        fallback = [...fallback, ...combined];
      }
      return NextResponse.json({ recipes: fallback.slice(0, number) }, {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
      });
    }
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
    uniqueMDB.forEach(r => r && titles.add(r.title.toLowerCase()));

    const uniqueEdamam = (edamamRecipes as NonNullable<ReturnType<typeof normalizeEdamam>>[])
      .filter(r => r && !titles.has(r.title.toLowerCase()));

    // Interleave: 2 Spoonacular, 1 MDB, 1 Edamam pattern
    const merged: typeof spoonRecipes = [];
    let si = 0, mi = 0, ei = 0;
    while (merged.length < number && (si < spoonRecipes.length || mi < uniqueMDB.length || ei < uniqueEdamam.length)) {
      if (si < spoonRecipes.length && merged.length < number) merged.push(spoonRecipes[si++]);
      if (si < spoonRecipes.length && merged.length < number) merged.push(spoonRecipes[si++]);
      if (mi < uniqueMDB.length && merged.length < number) merged.push(uniqueMDB[mi++]);
      if (ei < uniqueEdamam.length && merged.length < number) merged.push(uniqueEdamam[ei++]);
    }

    return NextResponse.json({ recipes: merged.slice(0, number) }, {
      headers: {
        // Cache on Vercel CDN: 1h fresh, serve stale for 24h while revalidating
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
