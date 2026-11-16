import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/*
  Prüfadresse für die Überwachung des Servers.

  GET /api/health          → 200, sobald die Website antwortet
  GET /api/health?tief=1   → prüft zusätzlich, ob die Datenbank erreichbar ist
                             (eine Zeile aus user_recipes); 503, wenn nicht

  Die Antwort wird nie zwischengespeichert, sonst meldete ein Cache "gesund",
  während der Server steht.
*/
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("tief") !== "1") {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }
  try {
    const { error } = await createAdminClient().from("user_recipes").select("id").limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, datenbank: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("health: Datenbank nicht erreichbar", err);
    return NextResponse.json({ ok: false, datenbank: false }, { status: 503, headers: NO_STORE });
  }
}
