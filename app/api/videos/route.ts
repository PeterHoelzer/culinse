import { NextResponse } from "next/server";
import { CULINSE_VIDEOS } from "@/lib/videos";

// 12.10.2026: Die eigenen Koch-Videos sind da — die Route liefert jetzt die
// echte Liste (gleiche Datenquelle wie die Startseiten-Sektion, lib/videos.ts).
export async function GET() {
  return NextResponse.json(
    { videos: CULINSE_VIDEOS, comingSoon: false },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
