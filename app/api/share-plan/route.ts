import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimateRecipeCost } from "@/lib/ingredient-prices";
import { optimizedImageUrl } from "@/lib/imageUrl";

// C11: Wochenplan teilen. Friert die aktuelle Woche als JSON-Snapshot in
// Supabase Storage ein (public Bucket, unerratbare UUID) — bewusst ohne neue
// Tabelle/Migration. Der Snapshot ist eingefroren: spaetere Planaenderungen
// aendern die geteilte Seite nicht.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

    let body: { planId?: string; weekStart?: string; locale?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "bad_json" }, { status: 400 });
    }
    const planId = String(body.planId || "");
    const weekStart = String(body.weekStart || "");
    const locale = body.locale === "de" ? "de" : "en";
    if (!planId || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return NextResponse.json({ error: "bad_input" }, { status: 400 });
    }

    // RLS-gesichert (Server-Client mit User-Session): nur eigene Eintraege.
    const { data: entries, error } = await supabase
      .from("meal_plan_entries")
      .select("day_index, meal_slot, recipe_id, recipe_title, recipe_image, recipe_time")
      .eq("plan_id", planId)
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .order("day_index")
      .limit(30);
    if (error) throw error;
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "empty_week" }, { status: 400 });
    }

    // Kostenschaetzung ueber die Korpus-Rezepte (Zutaten liegen in der DB);
    // Provider-Rezepte zaehlen mit, aber ohne Preisbeitrag.
    const admin = createAdminClient();
    const uuids = entries
      .map((e) => String(e.recipe_id))
      .filter((id) => id.startsWith("user_"))
      .map((id) => id.slice("user_".length));
    let estTotal = 0;
    let pricedRecipes = 0;
    if (uuids.length) {
      const { data: recipes } = await admin
        .from("user_recipes")
        .select("id, ingredients, servings")
        .in("id", uuids);
      for (const r of recipes ?? []) {
        const ings = (Array.isArray(r.ingredients) ? r.ingredients : []) as { name?: string; amount?: string; unit?: string }[];
        const cost = estimateRecipeCost(
          ings
            .filter((i) => i && i.name)
            .map((i) => ({ name: String(i.name), amount: i.amount ? Number(i.amount) || null : null, unit: String(i.unit || "") })),
          r.servings ?? null
        );
        // Gleiche Guete-Schwelle wie auf der Rezeptseite: nur zaehlen, wenn
        // genug Zutaten einen Preis haben.
        if (cost.priced >= 3 && cost.priced / Math.max(cost.count, 1) >= 0.5) {
          estTotal += cost.total;
          pricedRecipes++;
        }
      }
    }

    const snapshot = {
      v: 1,
      locale,
      weekStart,
      days: entries.map((e) => ({
        day: e.day_index,
        slot: e.meal_slot,
        id: String(e.recipe_id),
        title: e.recipe_title,
        image: optimizedImageUrl(e.recipe_image, 640),
        time: e.recipe_time ?? null,
      })),
      estTotal: pricedRecipes > 0 ? Math.round(estTotal * 100) / 100 : null,
      pricedRecipes,
      totalRecipes: entries.length,
      createdAt: new Date().toISOString(),
    };

    const id = crypto.randomUUID();
    const { error: uploadError } = await admin.storage
      .from("recipe-media")
      .upload(`shares/${id}.json`, JSON.stringify(snapshot), {
        contentType: "application/json",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    return NextResponse.json({ id, path: `/${locale}/plan/${id}` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "share_failed" }, { status: 500 });
  }
}
