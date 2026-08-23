import { NextRequest, NextResponse } from "next/server";
import { translateSearchQuery } from "@/lib/translateSearchQuery";
import { translateTexts } from "@/lib/translate";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel } from "@/lib/culinse";

import { optimizedImageUrl } from "@/lib/imageUrl";
const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCommunityRow(r: any) {
  return {
    id: `user_${r.id}`,
    title: r.title,
    image: r.image_url,
    source: recipeSourceLabel(r.user_id),
    sourceUrl: "#",
    time: r.cook_time ? `${r.cook_time} min` : "—",
    servings: r.servings ?? null,
    rating: null,
    imagePosition: r.image_position ?? "50% 50%",
  };
}

// Public, user-created recipes whose title matches the search term, mapped to
// the homepage recipe shape. Searched with the ORIGINAL query (user recipes may
// be in German or English). Failure is silent — search still returns providers.
async function fetchCommunityMatches(query: string, limit: number, lang: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  const l = lang === "de" ? "de" : "en";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_recipes")
      .select("id, user_id, title, image_url, image_position, cook_time, servings")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .or(`language.eq.${l},language.is.null`)
      .ilike("title", `%${q}%`)
      .limit(limit);
    return (data ?? []).map(mapCommunityRow);
  } catch (err) {
    console.error("community match failed:", err);
    return [];
  }
}

// One RANDOM public community recipe for the default (landing) view, so member
// recipes are always represented among the trending cards. PostgREST can't sort
// randomly, so we load a pool of recent public recipes and pick one in JS.
// Failure is silent — the landing page then just shows provider recipes.
async function fetchRandomCommunityRecipe(lang: string) {
  const l = lang === "de" ? "de" : "en";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_recipes")
      .select("id, user_id, title, image_url, image_position, cook_time, servings")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .or(`language.eq.${l},language.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data?.length) return [];
    return [mapCommunityRow(data[Math.floor(Math.random() * data.length)])];
  } catch (err) {
    console.error("random community recipe failed:", err);
    return [];
  }
}

// ─── Failsafe: eigener Katalog (23.08) ────────────────────────────────────────
// Nutzer duerfen NIE eine leere Rezeptansicht sehen (Vorfall 13.08.: Spoonacular-
// Quota 402 -> leere Startseite). Oeffentliche Culinse-Rezepte als Auffangnetz:
// neueste zuerst; mit Suchbegriff erst roh, dann uebersetzt gefiltert, zur Not
// ungefiltert. Fehler hier sind still — der aufrufende Pfad entscheidet weiter.
async function fetchOwnCatalog(
  rawQuery: string,
  translatedTerm: string | null,
  lang: string,
  limit: number
) {
  const l = lang === "de" ? "de" : "en";
  try {
    const supabase = createAdminClient();
    const run = async (term: string | null) => {
      let q = supabase
        .from("user_recipes")
        .select("id, user_id, title, image_url, image_position, cook_time, servings")
        .eq("is_public", true)
        .not("image_url", "is", null)
        .or(`language.eq.${l},language.is.null`);
      const t = term?.trim() ?? "";
      if (t.length >= 2) q = q.ilike("title", `%${t}%`);
      const { data } = await q.order("created_at", { ascending: false }).limit(limit);
      return data ?? [];
    };
    let rows = await run(rawQuery || null);
    if (!rows.length && translatedTerm && translatedTerm !== rawQuery) {
      rows = await run(translatedTerm);
    }
    if (!rows.length && rawQuery) rows = await run(null);
    return rows.map((r) => ({
      ...mapCommunityRow(r),
      image: optimizedImageUrl(r.image_url, 640) ?? r.image_url,
    }));
  } catch (err) {
    console.error("own catalog failsafe failed:", err);
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
    // Failsafe (23.08): auch ohne konfigurierten Key keine leere Ansicht —
    // eigener Katalog, sonst wie bisher 503.
    const sp = new URL(req.url).searchParams;
    const fbLang = (sp.get("lang") || "en").toLowerCase();
    const fbNumber = Math.min(Math.max(Math.floor(Number(sp.get("number")) || 6), 1), 24);
    const own = await fetchOwnCatalog(sp.get("query") || "", null, fbLang, fbNumber);
    if (own.length) {
      return NextResponse.json(
        { recipes: own.slice(0, fbNumber), quota_exceeded: true, degraded: true, hasMore: false },
        { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
      );
    }
    return NextResponse.json({ error: "Spoonacular API key not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const number = Math.min(Math.max(Math.floor(Number(searchParams.get("number")) || 6), 1), 24);
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

    // Community (user-created) recipes: title matches for text searches; on the
    // default landing view (no query/category/filters) always ONE random public
    // community recipe — it replaces a provider recipe via the spread+slice below.
    const isDefaultView = !query && !hasFilters && (!category || category === "All");
    const communityPromise = query
      ? fetchCommunityMatches(query, 4, lang)
      : isDefaultView
        ? fetchRandomCommunityRecipe(lang)
        : Promise.resolve([]);

    // Fetch Spoonacular + TheMealDB + Edamam in parallel
    const [spoonRes, mdbRecipes, edamamRecipes] = await Promise.all([
      fetch(spoonUrl, { next: { revalidate: 3600 } }),
      hasFilters ? Promise.resolve([]) : fetchMDB(searchTerm, category),
      hasFilters ? Promise.resolve([]) : fetchEdamam(searchTerm, category),
    ]);
    const communityMatches = await communityPromise;

    // 402 = Quota erschoepft — Failsafe (23.08): eigener Katalog zuerst, dann
    // MDB/Edamam, damit die Ansicht NIE leer ist (Vorfall 13.08.).
    if (spoonRes.status === 402) {
      const fallback = [
        ...(mdbRecipes as NonNullable<ReturnType<typeof normalizeMDB>>[]).filter(Boolean),
        ...(edamamRecipes as NonNullable<ReturnType<typeof normalizeEdamam>>[]).filter(Boolean),
      ];
      const own = await fetchOwnCatalog(query, searchTerm || null, lang, number);
      const seenIds = new Set<string>();
      const seenTitles = new Set<string>();
      const pool = [...communityMatches, ...own, ...fallback].filter((r) => {
        const id = String(r.id);
        const t = String(r.title || "").toLowerCase().trim();
        if (seenIds.has(id) || (t && seenTitles.has(t))) return false;
        seenIds.add(id);
        if (t) seenTitles.add(t);
        return true;
      });
      return NextResponse.json(
        { recipes: pool.slice(0, number), quota_exceeded: true, hasMore: false },
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
        source: r.sourceName || r.creditsText || "Spoonacular",
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

    // Culinse recipes flow into the normal results — spread across the list so
    // they rank alongside the provider recipes instead of as a separate block.
    const spread = [...merged] as Array<(typeof merged)[number] | (typeof communityMatches)[number]>;
    communityMatches.forEach((c, i) => {
      spread.splice(Math.min(spread.length, i * 3 + 1), 0, c);
    });
    let combined = spread.slice(0, number);

    // Failsafe (23.08): Standard-Ansicht (ohne Suche/Kategorie/Filter) nie
    // duenn oder leer lassen — mit eigenem Katalog auffuellen.
    if (isDefaultView && combined.length < number) {
      const own = await fetchOwnCatalog("", null, lang, number);
      const fillIds = new Set(combined.map((r) => String(r.id)));
      const fillTitles = new Set(combined.map((r) => String(r.title || "").toLowerCase().trim()));
      for (const r of own) {
        if (combined.length >= number) break;
        const t = String(r.title || "").toLowerCase().trim();
        if (fillIds.has(String(r.id)) || fillTitles.has(t)) continue;
        fillIds.add(String(r.id));
        fillTitles.add(t);
        combined.push(r);
      }
    }

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
    // Failsafe (23.08): Provider-Totalausfall (Netzwerk, Nicht-402-Fehler) —
    // eigener Katalog statt 500er, damit Nutzer nie eine leere Ansicht sehen.
    try {
      const own = await fetchOwnCatalog(query, searchTerm || null, lang, number);
      if (own.length) {
        return NextResponse.json(
          { recipes: own.slice(0, number), quota_exceeded: true, degraded: true, hasMore: false },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch (fallbackErr) {
      console.error("own catalog failsafe failed:", fallbackErr);
    }
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
