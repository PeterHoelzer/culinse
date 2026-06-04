import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const body = await req.json();
  const { data, error } = await supabase
    .from("user_recipes")
    .insert({
      user_id: user.id,
      title: body.title || "Untitled Recipe",
      description: body.description || null,
      image_url: body.image_url || null,
      image_position: body.image_position || "50% 50%",
      video_url: body.video_url || null,
      ingredients: body.ingredients || [],
      instructions: body.instructions || [],
      cook_time: body.cook_time || null,
      prep_time: body.prep_time || null,
      servings: body.servings || 2,
      tags: body.tags || [],
      status: "draft",
      is_public: false,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipe: data }, { status: 201 });
}
