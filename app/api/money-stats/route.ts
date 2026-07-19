import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * Aggregierte Monetarisierungs-Zahlen für das private Geld-Dashboard.
 *
 * Auth: ?key=<MONEY_STATS_KEY> (env). Liefert NUR Aggregate — keine PII,
 * keine einzelnen Klicks, keine Kundendaten. CORS offen, damit das lokale
 * Dashboard-Artefakt fetchen kann; der Key bleibt die Zugangskontrolle.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.MONEY_STATS_KEY) {
    return NextResponse.json({ error: "MONEY_STATS_KEY not configured" }, { status: 503, headers: CORS });
  }
  if (key !== process.env.MONEY_STATS_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  // ── Affiliate-Klicks (letzte 30 Tage, roh → hier aggregiert) ──
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: clicks, error } = await createAdminClient()
    .from("affiliate_clicks")
    .select("source, created_at")
    .gte("created_at", since)
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: "clicks query failed" }, { status: 500, headers: CORS });
  }

  const bySource: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const todayKey = new Date().toISOString().slice(0, 10);
  let clicksToday = 0;
  let clicks7d = 0;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const c of clicks ?? []) {
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
    const day = String(c.created_at).slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    if (day === todayKey) clicksToday++;
    if (new Date(c.created_at).getTime() >= sevenDaysAgo) clicks7d++;
  }

  // ── Stripe: Pro-Bestand (nur Counts) ──
  let trialing = 0;
  let active = 0;
  try {
    const stripe = getStripe();
    const [t, a] = await Promise.all([
      stripe.subscriptions.list({ status: "trialing", limit: 100 }),
      stripe.subscriptions.list({ status: "active", limit: 100 }),
    ]);
    trialing = t.data.length;
    active = a.data.length;
  } catch (e) {
    console.error("money-stats: stripe lookup failed", e);
  }

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      clicks: {
        total30d: (clicks ?? []).length,
        last7d: clicks7d,
        today: clicksToday,
        bySource,
        byDay,
      },
      pro: { trialing, active },
    },
    { headers: CORS }
  );
}
