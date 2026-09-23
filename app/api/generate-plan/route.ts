import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizedImageUrl } from "@/lib/imageUrl";

// Wochenplan-Generator aus dem EIGENEN Korpus (13.09.2026; vorher
// Spoonacular-Mealplanner). 7 Tage x Fruehstueck/Mittag/Abend aus
// oeffentlichen user_recipes: Fruehstuecks-Slots bevorzugen passende Tags,
// der Rest wird ohne Wiederholung ueber die Woche verteilt.

const SLOTS = ["breakfast", "lunch", "dinner"] as const;

interface Row {
  id: string;
  title: string;
  image_url: string | null;
  cook_time: number | null;
  prep_time: number | null;
  tags: string[] | null;
}

interface GeneratedEntry {
  day_index: number;
  meal_slot: (typeof SLOTS)[number];
  recipe_id: string;
  recipe_title: string;
  recipe_image: string | null;
  recipe_time: number | null;
}

const BREAKFAST_TAGS = ["breakfast", "frühstück", "fruehstueck", "porridge", "müsli", "muesli"];
const DIET_TAGS: Record<string, string[]> = {
  vegetarian: ["vegetarian", "vegetarisch", "vegan"],
  vegan: ["vegan"],
  "gluten free": ["gluten free", "glutenfrei"],
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toEntry(r: Row, dayIndex: number, slot: (typeof SLOTS)[number]): GeneratedEntry {
  const total = (r.cook_time ?? 0) + (r.prep_time ?? 0);
  return {
    day_index: dayIndex,
    meal_slot: slot,
    recipe_id: `user_${r.id}`,
    recipe_title: r.title,
    recipe_image: optimizedImageUrl(r.image_url, 312) ?? r.image_url,
    recipe_time: total > 0 ? total : null,
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { targetCalories?: unknown; diet?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const diet = typeof body.diet === "string" ? body.diet.toLowerCase() : "";
  const lang = body.lang === "de" ? "de" : body.lang === "en" ? "en" : body.lang === "es" ? "es" : body.lang === "fr" ? "fr" : body.lang === "it" ? "it" : body.lang === "pl" ? "pl" : body.lang === "tr" ? "tr" : body.lang === "nl" ? "nl" : null;

  try {
    const admin = createAdminClient();
    let q = admin
      .from("user_recipes")
      .select("id, title, image_url, cook_time, prep_time, tags")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(400);
    if (lang) q = q.or(`language.eq.${lang},language.is.null`);
    if (diet && DIET_TAGS[diet]) q = q.overlaps("tags", DIET_TAGS[diet]);
    const { data } = await q;
    const pool = shuffle(((data ?? []) as Row[]).filter((r) => r?.id && r.title));
    if (pool.length < 7) return NextResponse.json({ error: "no_results" }, { status: 422 });

    const isBreakfast = (r: Row) =>
      (r.tags ?? []).some((t) => BREAKFAST_TAGS.includes(String(t).toLowerCase()));
    const breakfasts = pool.filter(isBreakfast);
    const mains = pool.filter((r) => !isBreakfast(r));

    // Verbrauchs-Stacks; wenn ein Stack leer laeuft, wird er neu gemischt
    // aufgefuellt (kleine Korpusse duerfen sich wiederholen, grosse nicht).
    const stacks: Record<string, Row[]> = {
      breakfast: breakfasts.length >= 7 ? [...breakfasts] : [],
      main: [...mains],
    };
    const take = (kind: "breakfast" | "main"): Row => {
      let stack = stacks[kind];
      if (!stack.length) {
        stack = stacks[kind] = shuffle(
          kind === "breakfast" && breakfasts.length ? breakfasts : pool
        );
      }
      return stack.pop() as Row;
    };

    const entries: GeneratedEntry[] = [];
    for (let day = 0; day < 7; day++) {
      for (const slot of SLOTS) {
        const r = slot === "breakfast" && stacks.breakfast.length + breakfasts.length > 0
          ? take(stacks.breakfast.length ? "breakfast" : "main")
          : take("main");
        entries.push(toEntry(r, day, slot));
      }
    }
    return NextResponse.json({ entries });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "generate_failed" }, { status: 502 });
  }
}
