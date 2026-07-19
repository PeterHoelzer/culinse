import { NextRequest, NextResponse } from "next/server";
import { getMoneyStats } from "@/lib/moneyStats";

/**
 * Aggregierte Monetarisierungs-Zahlen (JSON-API-Variante).
 *
 * Hinweis: Das Geld-Dashboard-Artefakt liest NICHT diese Route, sondern die
 * Page-Variante /[locale]/geld/[key] (dessen Fetch-Weg rendert nur normale
 * Page-Antworten). Diese Route bleibt für Browser-/Tool-Zugriffe bestehen.
 *
 * Auth: ?key=<MONEY_STATS_KEY>. Nur Aggregate — keine PII.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "text/plain; charset=utf-8",
};

function jsonText(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), { status, headers: CORS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.MONEY_STATS_KEY) {
    return jsonText({ error: "MONEY_STATS_KEY not configured" }, 503);
  }
  if (key !== process.env.MONEY_STATS_KEY) {
    return jsonText({ error: "Unauthorized" }, 401);
  }

  try {
    return jsonText(await getMoneyStats());
  } catch {
    return jsonText({ error: "stats unavailable" }, 500);
  }
}
