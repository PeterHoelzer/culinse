import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CULINSE_OWNER_ID } from "@/lib/culinse";
import { ALLOWED_DAYS, getVisitorDashboard } from "@/lib/visitorStats";

/**
 * Zahlen fürs Besucher-Dashboard (25.11.2026).
 * GET ?tage=1|7|30|90|365 → Auswertung der Seitenaufrufe für den Zeitraum.
 *
 * Zugriff nur für das Culinse-Konto (Peter). Anders als bei der Rezept-Prüfung
 * haben Reviewer hier keinen Zutritt: Geschäftszahlen gehören nur dem Inhaber.
 */

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  if (user.id !== CULINSE_OWNER_ID)
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const wanted = Number(req.nextUrl.searchParams.get("tage"));
  const days = (ALLOWED_DAYS as readonly number[]).includes(wanted) ? wanted : 30;

  try {
    return NextResponse.json(await getVisitorDashboard(days), { headers: noStore });
  } catch (e) {
    console.error("besucher: Auswertung fehlgeschlagen:", e);
    return NextResponse.json({ error: "stats_unavailable" }, { status: 503, headers: noStore });
  }
}
