import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";
const MDB = "https://www.themealdb.com/api/json/v1/1";
const MDB_OFFSET = 9_000_000;

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_BASE = "https://api.edamam.com/api/recipes/v2";

const TASTY_KEY = process.env.TASTY_API_KEY;
const TASTY_BASE = "https://tasty.p.rapidapi.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── User-created (community) recipe ──────────────────────────────────────────
  if (id.startsWith("user_")) {
    const uuid = id.replace("user_", "");
    try {
      const supabase = createAdminClient();
      const { data: r, error } = await supabase
        .from("user_recipes")
        .select("*")
        .eq("id", uuid)
        .single();

      if (error || !r) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Public recipes are visible to everyone; a private draft is visible only
      // to its owner (so creators can preview before publishing).
      if (!r.is_public) {
        const sb = await createServerClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user || user.id !== r.user_id) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }

      const ingredients = ((r.ingredients || []) as { name?: string; amount?: string; unit?: string }[])
        .filter((i) => i && i.name)
        .map((i, idx) => ({
          id: idx,
          name: i.name || "",
          amount: i.amount ? Number(i.amount) || 0 : 0,
          unit: i.unit || "",
          original: [i.amount, i.unit, i.name].filter(Boolean).join(" ").trim(),
        }));

      const instructions = ((r.instructions || []) as { step?: number; text?: string }[])
        .filter((s) => s && s.text)
        .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
        .map((s, idx) => ({ number: s.step ?? idx + 1, step: s.text || "" }));

      const totalTime = (r.cook_time || 0) + (r.prep_time || 0);

      const recipe = {
        id,
        title: r.title,
        image: r.image_url || null,
        imagePosition: r.image_position || "50% 50%",
        videoUrl: r.video_url || null,
        // Imported recipes carry their original site name + link for attribution;
        // user-created recipes fall back to the "Community" label.
        source: r.source_name || "Community",
        sourceUrl: r.source_url || "",
        time: totalTime > 0 ? `${totalTime} min` : null,
        servings: r.servings || null,
        summary: r.description || null,
        ingredients,
        instructions,
        diets: Array.isArray(r.tags) ? r.tags : [],
        dishTypes: [],
      };

      return NextResponse.json({ recipe }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }
  }

  // ── Tasty recipe ───────────────────────────────────────────────────────────
  if (id.startsWith("tasty_")) {
    const tastyId = id.replace("tasty_", "");
    try {
      const res = await fetch(`${TASTY_BASE}/recipes/get-more-info?id=${tastyId}`, {
        headers: {
          "x-rapidapi-host": "tasty.p.rapidapi.com",
          "x-rapidapi-key": TASTY_KEY || "",
        },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const r = await res.json();
      if (!r.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const ingredients = (r.sections || []).flatMap(
        (sec: Record<string, unknown>) =>
          ((sec.components || []) as Record<string, unknown>[]).map((c, i: number) => ({
            id: i,
            name: (c.ingredient as Record<string, unknown>)?.name || c.raw_text || "",
            amount: (c.measurements as Record<string, unknown>[])?.[0]?.quantity || 0,
            unit: ((c.measurements as Record<string, unknown>[])?.[0]?.unit as Record<string, unknown>)?.abbreviation || "",
            original: c.raw_text || "",
          }))
      );

      const instructions = ((r.instructions || []) as Record<string, unknown>[]).map((step, i: number) => ({
        number: i + 1,
        step: step.display_text as string || "",
      }));

      const recipe = {
        id,
        title: r.name,
        image: r.thumbnail_url || null,
        videoUrl: r.original_video_url || r.video_url || null,
        source: "Tasty",
        sourceUrl: `https://tasty.co/recipe/${r.slug || r.id}`,
        time: r.total_time_minutes ? `${r.total_time_minutes} min` : null,
        servings: r.yields || null,
        summary: r.description || null,
        ingredients,
        instructions,
        diets: (r.tags || []).filter((t: Record<string, unknown>) => t.type === "dietary").map((t: Record<string, unknown>) => t.display_name),
        dishTypes: (r.tags || []).filter((t: Record<string, unknown>) => t.type === "meal").map((t: Record<string, unknown>) => t.display_name),
      };
      return NextResponse.json({ recipe }, {
        headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
      });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }
  }

  // ── Edamam recipe ──────────────────────────────────────────────────────────
  if (id.startsWith("edamam_")) {
    const edamamId = id.replace("edamam_", "");
    try {
      const res = await fetch(
        `${EDAMAM_BASE}/${edamamId}?type=public&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
        { next: { revalidate: 86400 }, headers: { Accept: "application/json" } }
      );
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const data = await res.json();
      const r = data.recipe;
      if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const ingredients = (r.ingredients || []).map((ing: Record<string, unknown>, i: number) => ({
        id: i,
        name: ing.food as string,
        amount: ing.quantity as number || 0,
        unit: ing.measure as string || "",
        original: ing.text as string || `${ing.quantity} ${ing.measure} ${ing.food}`.trim(),
      }));

      const recipe = {
        id,
        title: r.label,
        image: r.image || null,
        source: r.source || "Edamam",
        sourceUrl: r.url || "#",
        time: r.totalTime ? `${Math.round(r.totalTime)} min` : null,
        servings: r.yield ? Math.round(r.yield) : null,
        summary: null,
        ingredients,
        instructions: [], // Edamam free tier doesn't provide step-by-step instructions
        diets: r.dietLabels || [],
        dishTypes: r.dishType || [],
      };
      return NextResponse.json({ recipe }, {
        headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
      });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }
  }

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
      return NextResponse.json({ recipe }, {
        headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
      });
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
    return NextResponse.json({ recipe }, {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}
