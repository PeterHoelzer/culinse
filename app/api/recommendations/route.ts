import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { translateTexts } from "@/lib/translate";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";
const MDB_OFFSET = 9_000_000;

interface HomeRecipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string;
  servings: number | null;
  rating: number | null;
}

interface SimilarItem {
  id: number;
  title: string;
  imageType?: string;
  readyInMinutes?: number;
  servings?: number;
}

// Spoonacular's "similar recipes" endpoint only works with native Spoonacular
// ids — numeric and below the TheMealDB offset. Our other sources use prefixed
// ids (user_, tasty_, edamam_), so they're skipped as seeds.
const isSpoonId = (id: string) => /^\d+$/.test(id) && Number(id) < MDB_OFFSET;

/**
 * Behaviour-based recommendations: take the recipes the user has saved and
 * planned, ask Spoonacular for recipes similar to each, then rank candidates by
 * how often they came up (a recipe similar to several of your picks ranks
 * higher) while excluding anything you already have. Returns an empty list when
 * there's no usable signal yet, so the UI can fall back gracefully.
 */
export async function GET(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ recipes: [], basedOn: [] });

  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") || "en").toLowerCase();
  const number = Math.min(Number(searchParams.get("number") || 6), 12);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ recipes: [], basedOn: [] });

  // ── Behaviour signal: saved + planned recipes, most recent first ──
  const [{ data: saved }, { data: planned }] = await Promise.all([
    supabase.from("saved_recipes").select("recipe_id, title, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("meal_plan_entries").select("recipe_id, recipe_title, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  const seen = new Set<string>();              // everything the user already knows
  const seeds: { id: string; title: string }[] = [];
  const addSeed = (rawId: unknown, title: unknown) => {
    const id = String(rawId);
    seen.add(id);
    if (isSpoonId(id) && !seeds.some((s) => s.id === id)) {
      seeds.push({ id, title: typeof title === "string" ? title : "" });
    }
  };
  for (const r of saved ?? []) addSeed(r.recipe_id, r.title);
  for (const r of planned ?? []) addSeed(r.recipe_id, r.recipe_title);

  if (seeds.length === 0) return NextResponse.json({ recipes: [], basedOn: [] });

  const seedSlice = seeds.slice(0, 6);

  // ── Fetch "similar" recipes for each seed in parallel ──
  const results = await Promise.all(
    seedSlice.map(async (s) => {
      try {
        const res = await fetch(`${BASE}/recipes/${s.id}/similar?number=4&apiKey=${API_KEY}`, {
          next: { revalidate: 86400 },
        });
        if (!res.ok) return [] as SimilarItem[];
        const arr = (await res.json()) as SimilarItem[];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [] as SimilarItem[];
      }
    })
  );

  // ── Rank candidates by frequency, drop anything already saved/planned ──
  const freq = new Map<string, number>();
  const meta = new Map<string, SimilarItem>();
  for (const arr of results) {
    for (const c of arr) {
      if (!c || typeof c.id === "undefined") continue;
      const id = String(c.id);
      if (seen.has(id)) continue;
      freq.set(id, (freq.get(id) ?? 0) + 1);
      if (!meta.has(id)) meta.set(id, c);
    }
  }

  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => meta.get(id))
    .filter((c): c is SimilarItem => Boolean(c))
    .slice(0, number);

  let recipes: HomeRecipe[] = ranked.map((c) => ({
    id: c.id,
    title: c.title,
    image: c.imageType ? `https://img.spoonacular.com/recipes/${c.id}-636x393.${c.imageType}` : null,
    source: "Culinse",
    sourceUrl: "#",
    time: c.readyInMinutes ? `${c.readyInMinutes} min` : "—",
    servings: c.servings ?? null,
    rating: null,
  }));

  // German titles (cached translation), matching the rest of the site.
  if (lang === "de" && recipes.length) {
    const de = await translateTexts(recipes.map((r) => r.title), "EN", "DE");
    recipes = recipes.map((r, i) => (de[i] && de[i] !== r.title ? { ...r, title: de[i] } : r));
  }

  const basedOn = seedSlice.map((s) => s.title).filter(Boolean).slice(0, 3);

  return NextResponse.json({ recipes, basedOn }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
