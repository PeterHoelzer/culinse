import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_SAVE_LIMIT = 25;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { recipe_id, title, image, source, source_url, time } = body;
  if (!recipe_id) return NextResponse.json({ error: "Missing recipe_id" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles").select("is_pro").eq("id", user.id).single();
  const isPro = profile?.is_pro ?? false;

  if (!isPro) {
    const { count } = await supabase
      .from("saved_recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= FREE_SAVE_LIMIT) {
      return NextResponse.json({ error: "limit_reached", limit: FREE_SAVE_LIMIT }, { status: 403 });
    }
  }

  const { error } = await supabase.from("saved_recipes").insert({
    user_id: user.id, recipe_id, title, image, source, source_url, time,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipe_id } = await req.json();
  if (!recipe_id) return NextResponse.json({ error: "Missing recipe_id" }, { status: 400 });

  await supabase.from("saved_recipes").delete()
    .eq("recipe_id", recipe_id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
