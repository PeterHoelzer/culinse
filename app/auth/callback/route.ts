import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    // New user? Send them to profile setup first
    if (user) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!prefs) {
        return NextResponse.redirect(`${origin}/profile?welcome=1`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
