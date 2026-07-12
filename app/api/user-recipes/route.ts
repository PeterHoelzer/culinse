import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRecipeInput } from "@/lib/userRecipeInput";

const FREE_RECIPE_LIMIT = 5;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("is_pro").eq("id", user.id).single();
  const isPro = profile?.is_pro ?? false;

  if (!isPro) {
    const { count } = await supabase
      .from("user_recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= FREE_RECIPE_LIMIT) {
      return NextResponse.json(
        { error: "limit_reached", limit: FREE_RECIPE_LIMIT },
        { status: 403 }
      );
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const input = sanitizeRecipeInput(body);
  const { data, error } = await supabase
    .from("user_recipes")
    .insert({
      user_id: user.id,
      title: input.title || "Untitled Recipe",
      description: input.description,
      image_url: input.image_url,
      image_position: input.image_position,
      video_url: input.video_url,
      ingredients: input.ingredients,
      instructions: input.instructions,
      cook_time: input.cook_time,
      prep_time: input.prep_time,
      servings: input.servings ?? 2,
      tags: input.tags,
      status: "draft",
      is_public: false,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipe: data }, { status: 201 });
}
