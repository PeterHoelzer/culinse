import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRecipeInput } from "@/lib/userRecipeInput";

type Params = { params: Promise<{ id: string }> };

// Nutrition is client-computed display data — accept only the known numeric shape.
function sanitizeNutrition(v: unknown): { calories: number; protein: number | null; fat: number | null; carbs: number | null } | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const num = (x: unknown): number | null => {
    const n = Number(x);
    return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n) : null;
  };
  const calories = num(o.calories);
  if (calories == null) return null;
  return { calories, protein: num(o.protein), fat: num(o.fat), carbs: num(o.carbs) };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("user_recipes").select("*").eq("id", id).single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!data.is_public && data.user_id !== user?.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ recipe: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const input = sanitizeRecipeInput(body);

  // Quality check before going public
  if (body.is_public === true) {
    // Imported recipes carry third-party photos/text — they may NEVER be made
    // public (personal-use only). Verified server-side against the stored row so
    // it can't be bypassed by a crafted request.
    const { data: existing } = await supabase
      .from("user_recipes")
      .select("source_type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (existing?.source_type === "imported") {
      return NextResponse.json({ error: "imported_cannot_publish" }, { status: 403 });
    }

    const issues: string[] = [];
    if (!input.image_url) issues.push("A photo is required to publish publicly.");
    if (input.instructions.length < 2)
      issues.push("At least 2 instruction steps are required.");
    const totalWords = input.instructions
      .map((s) => s.text).join(" ").split(/\s+/).length;
    if (totalWords < 30) issues.push("Instructions need more detail (at least 30 words total).");
    if (!input.title || input.title.length < 3) issues.push("A proper title is required.");
    if (issues.length > 0)
      return NextResponse.json({ error: "quality_check_failed", issues }, { status: 422 });
  }

  const isPublic = body.is_public === true;
  const { data, error } = await supabase
    .from("user_recipes")
    .update({
      title: input.title,
      description: input.description,
      image_url: input.image_url,
      image_position: input.image_position,
      video_url: input.video_url,
      ingredients: input.ingredients,
      instructions: input.instructions,
      cook_time: input.cook_time,
      prep_time: input.prep_time,
      servings: input.servings,
      tags: input.tags,
      nutrition: sanitizeNutrition(body.nutrition),
      is_public: isPublic,
      status: isPublic ? "published" : "draft",
    })
    .eq("id", id).eq("user_id", user.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recipe: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("user_recipes").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
