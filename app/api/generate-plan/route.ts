import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Generates a full week meal plan targeting a daily calorie goal (and optional
// diet) via Spoonacular's meal planner, mapped to our plan-entry shape. The
// client then replaces the active plan with these entries.

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY;
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SLOTS = ["breakfast", "lunch", "dinner"] as const;

interface MealItem {
  id?: number;
  title?: string;
  imageType?: string;
  readyInMinutes?: number;
}

interface GeneratedEntry {
  day_index: number;
  meal_slot: "breakfast" | "lunch" | "dinner";
  recipe_id: string;
  recipe_title: string;
  recipe_image: string | null;
  recipe_time: number | null;
}

function mapWeekToEntries(week: Record<string, { meals?: MealItem[] }> | undefined): GeneratedEntry[] {
  const entries: GeneratedEntry[] = [];
  if (!week) return entries;
  DAY_KEYS.forEach((dk, dayIndex) => {
    const meals = week[dk]?.meals ?? [];
    meals.slice(0, 3).forEach((m, i) => {
      if (!m?.id || !m?.title) return;
      entries.push({
        day_index: dayIndex,
        meal_slot: SLOTS[i],
        recipe_id: String(m.id),
        recipe_title: m.title,
        recipe_image: m.imageType ? `https://img.spoonacular.com/recipes/${m.id}-312x231.${m.imageType}` : null,
        recipe_time: typeof m.readyInMinutes === "number" ? m.readyInMinutes : null,
      });
    });
  });
  return entries;
}

const ALLOWED_DIETS = new Set([
  "vegetarian", "vegan", "gluten free", "ketogenic", "paleo", "pescetarian", "whole30",
]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SPOONACULAR_KEY) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { targetCalories?: unknown; diet?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const targetCalories = Math.min(Math.max(Math.round(Number(body.targetCalories) || 2000), 800), 5000);
  const diet = typeof body.diet === "string" && ALLOWED_DIETS.has(body.diet) ? body.diet : "";

  const params = new URLSearchParams({
    timeFrame: "week",
    targetCalories: String(targetCalories),
    apiKey: SPOONACULAR_KEY,
  });
  if (diet) params.set("diet", diet);

  try {
    const res = await fetch(`https://api.spoonacular.com/mealplanner/generate?${params}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "generate_failed" }, { status: 502 });
    }
    const data = await res.json();
    const entries = mapWeekToEntries(data?.week);
    if (entries.length === 0) {
      return NextResponse.json({ error: "no_results" }, { status: 422 });
    }
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "generate_failed" }, { status: 502 });
  }
}
