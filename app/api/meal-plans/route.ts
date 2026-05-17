import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_PLAN_LIMIT = 1;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Pro status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();

  const isPro = profile?.is_pro ?? false;

  // Count existing plans
  const { count } = await supabase
    .from("meal_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const planCount = count ?? 0;

  if (!isPro && planCount >= FREE_PLAN_LIMIT) {
    return NextResponse.json(
      { error: "Free users can only have one meal plan. Upgrade to Pro for unlimited plans." },
      { status: 403 }
    );
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan: data }, { status: 201 });
}
