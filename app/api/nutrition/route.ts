import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Batch per-recipe nutrition (per serving) for the meal planner's day/week
// totals. Currently covers Spoonacular recipes (the primary source) via a
// single informationBulk call; other sources return no data yet (USDA mapping
// for own/imported recipes is a later step).

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;
const MDB_OFFSET = 9_000_000;

interface Nut {
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

function extractNutrition(nutrients: Array<{ name?: string; amount?: number }>): Nut | null {
  const get = (name: string): number | null => {
    const n = nutrients.find((x) => x.name === name);
    return n && typeof n.amount === "number" ? Math.round(n.amount) : null;
  };
  const calories = get("Calories");
  if (calories == null) return null;
  return { calories, protein: get("Protein"), fat: get("Fat"), carbs: get("Carbohydrates") };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { recipeIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ nutrition: {} });
  }
  const recipeIds: string[] = (Array.isArray(body.recipeIds) ? body.recipeIds : []).map(String).slice(0, 30);

  const nutrition: Record<string, Nut> = {};

  // Spoonacular recipes (numeric ids below the MealDB offset) — one bulk call.
  const spoonIds = Array.from(
    new Set(recipeIds.filter((id) => /^\d+$/.test(id) && parseInt(id) < MDB_OFFSET))
  );
  if (SPOONACULAR_KEY && spoonIds.length) {
    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/informationBulk?ids=${spoonIds.join(",")}&includeNutrition=true&apiKey=${SPOONACULAR_KEY}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        for (const r of Array.isArray(data) ? data : []) {
          const n = extractNutrition(r?.nutrition?.nutrients ?? []);
          if (n) nutrition[String(r.id)] = n;
        }
      }
    } catch {
      /* ignore — nutrition is best-effort */
    }
  }

  return NextResponse.json({ nutrition });
}
