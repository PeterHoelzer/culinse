import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  const body = await req.json();
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "My Meal Plan";
  const isActive = body.is_active === true;

  // Create plan
  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: user.id, name, is_active: isActive })
    .select()
    .single();

  if (error) {
    console.error("meal-plans:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ plan: data }, { status: 201 });
}
