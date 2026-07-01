import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/community-recipes?number=2
// Returns up to `number` random public, user-created recipes, mapped to the
// same shape the homepage recipe cards use. IDs are prefixed with "user_" so
// the cards link to /recipe/user_<uuid> and the detail API knows the source.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = Math.min(Math.max(Number(searchParams.get("number") || 2), 1), 6);
  const lang = searchParams.get("lang") === "de" ? "de" : "en";

  try {
    const supabase = createAdminClient();
    // Only public recipes that have an image (cards look broken without one).
    // Filter by language so German recipes stay on the German site and vice
    // versa; legacy rows without a language (NULL) remain visible everywhere.
    const { data, error } = await supabase
      .from("user_recipes")
      .select("id, title, image_url, image_position, cook_time, servings")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .or(`language.eq.${lang},language.is.null`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const pool = data ?? [];
    // Fisher–Yates shuffle, then take `number` — gives a rotating selection.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const recipes = pool.slice(0, number).map((r) => ({
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

    return NextResponse.json({ recipes }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    // Non-fatal: the homepage simply shows no community recipes on failure.
    return NextResponse.json({ recipes: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
