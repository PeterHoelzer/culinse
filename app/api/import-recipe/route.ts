import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRecipeFromUrl } from "@/lib/parseRecipeFromUrl";
import { isSafePublicUrl } from "@/lib/ssrfGuard";

// Imports count against the same free quota as user-created recipes.
const FREE_RECIPE_LIMIT = 5;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse + validate the URL
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  if (!rawUrl) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  // SSRF guard: resolves the hostname and rejects private/internal targets
  // (also catches decimal/hex IP forms and DNS records pointing inward).
  if (!(await isSafePublicUrl(target))) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  // Free-tier limit (shared with created recipes)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();
  if (!(profile?.is_pro ?? false)) {
    const { count } = await supabase
      .from("user_recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= FREE_RECIPE_LIMIT) {
      return NextResponse.json({ error: "limit_reached", limit: FREE_RECIPE_LIMIT }, { status: 403 });
    }
  }

  // Fetch + parse
  const recipe = await parseRecipeFromUrl(target.toString());
  if (!recipe) {
    return NextResponse.json({ error: "parse_failed" }, { status: 422 });
  }

  // Store as the user's own recipe — PRIVATE by default, with source attribution.
  const { data, error } = await supabase
    .from("user_recipes")
    .insert({
      user_id: user.id,
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image,
      image_position: "50% 50%",
      ingredients: recipe.ingredients, // [{ name, amount, unit }]
      instructions: recipe.instructions, // [{ step, text }]
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings ?? 2,
      tags: recipe.tags,
      source_url: recipe.sourceUrl,
      source_name: recipe.sourceName,
      source_type: "imported",
      status: "draft",
      is_public: false,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      id: `user_${data.id}`,
      recipe: {
        id: data.id,
        title: recipe.title,
        image: recipe.image,
        sourceName: recipe.sourceName,
        ingredientCount: recipe.ingredients.length,
        stepCount: recipe.instructions.length,
      },
    },
    { status: 201 }
  );
}
