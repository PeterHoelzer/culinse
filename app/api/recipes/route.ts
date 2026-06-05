import { NextRequest, NextResponse } from "next/server";
import { translateSearchQuery } from "@/lib/translateSearchQuery";
import { translateTexts } from "@/lib/translate";
import { createAdminClient } from "@/lib/supabase/admin";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

// Public, user-created recipes whose title matches the search term, mapped to
// the homepage recipe shape. Searched with the ORIGINAL query (user recipes may
// be in German or English). Failure is silent — search still returns providers.
async function fetchCommunityMatches(query: string, limit: number) {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_recipes")
      .select("id, title, image_url, image_position, cook_time, servings")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .ilike("title", `%${q}%`)
      .limit(limit);
    return (data ?? []).map((r) => ({
      id: `user_${r.id}`,
      title: r.title,
      image: r.image_url,
      source: "Community",
      sourceUrl: "#",
      time: r.cook_time ? `${r.cook_time} min` : "—",
      servings: r.servings ?? null,
      rating: null,
      imagePosition: r.image_position ?? "50% 50%",
    }));
  } catch (err) {
    console.error("community match failed:", err);
    return [];
  }
}
const MDB = "https://www.themealdb.com/api/json/v1/1";
const MDB_OFFSET = 9_000_000; // prevents ID collision with Spoonacular

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_BASE = "https://api.edamam.com/api/recipes/v2";

// ─── TheMealDB helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMDB(m: any) {
  if (!m || !m.strMealThumb) return null;
  const area = m.strArea?.trim();
  const category = m.strCategory?.trim();
  const source = area ? `${area} Cuisine` : category || null;
  if (!source) return null; // skip uncategorized recipes
  return {
    id: MDB_OFFSET + Number(m.idMeal),
    title: m.strMeal,
    image: m.strMealThumb,
    source,
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
  if (!API_KEY) {
    return NextResponse.json({ error: "Spoonacular API key not configured" }, { status: 503 });
  }

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
  const lang = (searchParams.get("lang") || "en").toLowerCase();

  // Translate the search term to English before hitting the providers (e.g.
  // "Nudeln" → "pasta"). Falls back to the original on any failure.
  const searchTerm = query
    ? await translateSearchQuery(query, lang === "de" ? "DE" : "EN")
    : query;

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
      spoonUrl = `${BASE}/recipes/complexSearch?query=${encodeURIComponent(searchTerm)}&number=${number}&addRecipeInformation=true&fillIngredients=false&${QUALITY}${extras ? "&" + extras : ""}&apiKey=${API_KEY}`;
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

    // Matching community (user-created) recipes — only for text searches.
    const communityPromise = query ? fetchCommunityMatches(query, 4) : Promise.resolve([]);

    // Fetch Spoonacular + TheMealDB + Edamam in parallel
    const [spoonRes, mdbRecipes, edamamRecipes] = await Promise.all([
      fetch(spoonUrl, { next: { revalidate: 3600 } }),
      hasFilters ? Promise.resolve([]) : fetchMDB(searchTerm, category),
      hasFilters ? Promise.resolve([]) : fetchEdamam(searchTerm, category),
    ]);
    const communityMatches = await communityPromise;

    // 402 = quota exceeded — return whatever MDB/Edamam already fetched (or empty)
    if (spoonRes.status === 402) {
      const fallback = [
        ...(mdbRecipes as NonNullable<ReturnType<typeof normalizeMDB>>[]).filter(Boolean),
        ...(edamamRecipes as NonNullable<ReturnType<typeof normalizeEdamam>>[]).filter(Boolean),
      ];
      return NextResponse.json(
        { recipes: [...communityMatches, ...fallback].slice(0, number), quota_exceeded: true, hasMore: false },
        { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
      );
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

    // Whether a "Load more" makes sense: we filled the requested page, we're
    // still below the hard cap of 24, and the source reports more matches than
    // we've shown. Prevents an empty/pointless Load more button.
    const totalAvailable =
      typeof spoonData.totalResults === "number" ? spoonData.totalResults : merged.length;
    const hasMore = merged.length >= number && number < 24 && totalAvailable > number;

    // Community matches lead, then the provider results, capped at `number`.
    let combined = [...communityMatches, ...merged].slice(0, number);

    // On the German site, translate provider titles to German (cached).
    // Community recipe titles (id "user_…") are left as the author wrote them.
    if (lang === "de" && combined.length) {
      const sourceTitles = combined.map((r) =>
        typeof r.id === "string" && r.id.startsWith("user_") ? "" : r.title || ""
      );
      const deTitles = await translateTexts(sourceTitles, "EN", "DE");
      combined = combined.map((r, i) =>
        deTitles[i] && deTitles[i] !== r.title ? { ...r, title: deTitles[i] } : r
      );
    }

    return NextResponse.json({ recipes: combined, hasMore }, {
      headers: {
        // Community results can change, so keep search responses uncached when a
        // query is present; cache the (stable) default/category views as before.
        "Cache-Control": query
          ? "no-store"
          : "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
