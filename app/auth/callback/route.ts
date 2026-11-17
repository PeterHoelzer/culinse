import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { publicOrigin } from "@/lib/siteUrls";
import { LOGIN_TARGET_COOKIE, safeLoginTarget } from "@/lib/loginRedirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Nicht aus request.url: Hinter dem Eingang des eigenen Servers stünde dort localhost.
  const origin = publicOrigin(request);
  const code = searchParams.get("code");

  // Seite, von der die Anmeldung ausging. LoginClient legt sie vor dem Absprung
  // zu Google bzw. vor der Bestätigungs-Mail in ein Cookie. Einmal lesen, dann
  // löschen; gültig ist nur ein Pfad auf der eigenen Seite.
  const cookieStore = await cookies();
  const target = safeLoginTarget(cookieStore.get(LOGIN_TARGET_COOKIE)?.value);
  cookieStore.delete(LOGIN_TARGET_COOKIE);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Invalid or expired code — redirect to login with error message
      return NextResponse.redirect(`${origin}/login?error=link_expired`);
    }

    const user = data.user;

    // New user? Send them to profile setup first
    if (user) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!prefs) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${target ?? "/"}`);
}
