import { NextResponse } from "next/server";

// Seit 13.09.2026 keine externen Tasty-Videos mehr — eigene Koch-Videos sind
// in Arbeit (Coming-soon-Sektion auf der Startseite). Die Route bleibt fuer
// gecachte Clients bestehen und antwortet bewusst leer.
export async function GET() {
  return NextResponse.json(
    { videos: [], comingSoon: true },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
