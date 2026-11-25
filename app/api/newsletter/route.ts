import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allowRequest, clientIp, tooManyRequests } from "@/lib/rateLimit";

// Service role bypasses RLS — safe because this is a server-only API route
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Ohne Anmeldung erreichbar: höchstens 5 Eintragungen je Stunde von einer Adresse.
  if (!allowRequest("newsletter", clientIp(req.headers), 5, 60 * 60_000)) return tooManyRequests();

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Unauthenticated endpoint writing via service role — validate strictly so it
  // can't be used to flood the table with arbitrary strings.
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  ) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  // Dieselbe Antwort wie bei einer neuen Adresse. Vorher verriet "already",
  // ob eine fremde Adresse schon eingetragen ist.
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: email.toLowerCase().trim() });

  if (error) {
    console.error("Newsletter insert error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
