import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, user_id, created_at, collection_recipes(count)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data ?? [] });
}
