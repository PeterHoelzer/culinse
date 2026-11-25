import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { httpUrl } from "@/lib/userRecipeInput";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const cap = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
  const recipe_id = cap(body.recipe_id, 100) ?? (typeof body.recipe_id === "number" ? String(body.recipe_id) : null);
  const title = cap(body.title, 300);
  const image = httpUrl(body.image);
  const source = cap(body.source, 100);
  const source_url = httpUrl(body.source_url);
  const time = cap(body.time, 32);
  if (!recipe_id) return NextResponse.json({ error: "Missing recipe_id" }, { status: 400 });

  const { error } = await supabase.from("saved_recipes").insert({
    user_id: user.id, recipe_id, title, image, source, source_url, time,
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, already: true });
    console.error("saved-recipes:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let recipe_id: unknown;
  try {
    ({ recipe_id } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!recipe_id || (typeof recipe_id !== "string" && typeof recipe_id !== "number"))
    return NextResponse.json({ error: "Missing recipe_id" }, { status: 400 });

  await supabase.from("saved_recipes").delete()
    .eq("recipe_id", recipe_id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
