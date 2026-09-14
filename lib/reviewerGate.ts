import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CULINSE_OWNER_ID } from "@/lib/culinse";

/**
 * Zugangsprüfung für Admin-Werkzeuge: das Culinse-Owner-Konto (Peter) oder
 * ein Reviewer aus CULINSE_REVIEWER_EMAILS (Default: Peters Vater). Gleiche
 * Semantik wie in app/api/admin/review/route.ts — dort lebt noch eine eigene
 * Kopie (Vereinheitlichung als Follow-up, um die Review-Route nicht anzufassen).
 * Nach bestandener Prüfung laufen Datenzugriffe über den Service-Client,
 * strikt gescoped auf das Owner-Konto.
 */
function reviewerEmails(): string[] {
  return (process.env.CULINSE_REVIEWER_EMAILS || "gerd@hoelzer.xyz")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireReviewer(): Promise<
  | { error: NextResponse }
  | { db: ReturnType<typeof createAdminClient>; userId: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const isOwner = user.id === CULINSE_OWNER_ID;
  // Nur BESTÄTIGTE E-Mail zählt (siehe Kommentar in der Review-Route).
  const isReviewer =
    Boolean(user.email_confirmed_at) &&
    reviewerEmails().includes((user.email || "").toLowerCase());
  if (!isOwner && !isReviewer)
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { db: createAdminClient(), userId: user.id };
}
