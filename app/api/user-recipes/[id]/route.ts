import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

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

  const body = await req.json();

  // Quality check before going public
  if (body.is_public === true) {
    const issues: string[] = [];
    if (!body.image_url) issues.push("A photo is required to publish publicly.");
    if (!body.instructions?.length || body.instructions.length < 2)
      issues.push("At least 2 instruction steps are required.");
    const totalWords = (body.instructions || [])
      .map((s: { text: string }) => s.text || "").join(" ").split(/\s+/).length;
    if (totalWords < 30) issues.push("Instructions need more detail (at least 30 words total).");
    if (!body.title || body.title.trim().length < 3) issues.push("A proper title is required.");
    if (issues.length > 0)
      return NextResponse.json({ error: "quality_check_failed", issues }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("user_recipes")
    .update({
      title: body.title,
      description: body.description,
      image_url: body.image_url,
      video_url: body.video_url,
      ingredients: body.ingredients,
      instructions: body.instructions,
      cook_time: body.cook_time,
      prep_time: body.prep_time,
      servings: body.servings,
      tags: body.tags,
      is_public: body.is_public,
      status: body.is_public ? "published" : "draft",
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
