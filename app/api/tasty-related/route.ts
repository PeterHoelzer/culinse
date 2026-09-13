import { NextResponse } from "next/server";

// Seit 13.09.2026 keine externen Tasty-Videos mehr (Provider-Ausbau) —
// die Rezeptseite blendet die Sektion bei leerer Antwort einfach aus.
export async function GET() {
  return NextResponse.json(
    { videos: [] },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
