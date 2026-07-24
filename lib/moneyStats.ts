import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * Aggregierte Monetarisierungs-Zahlen (Klicks + Pro-Bestand + Funnel) fürs
 * Geld-Dashboard. SERVER-ONLY (service role + Stripe-Key).
 * Nur Aggregate — keine PII, keine Einzelklicks, keine Kundendaten.
 *
 * users/newsletter sind nullable: jede Abfrage ist einzeln abgesichert,
 * damit z. B. eine fehlende created_at-Spalte nicht den ganzen Payload killt.
 */
export interface MoneyStats {
  generatedAt: string;
  clicks: {
    total30d: number;
    last7d: number;
    today: number;
    bySource: Record<string, number>;
    byDay: Record<string, number>;
  };
  pro: { trialing: number; active: number; nextTrialEnd: string | null };
  users: { total: number | null; new7d: number | null };
  newsletter: { total: number | null; new7d: number | null };
}

/** Zählt Zeilen; bei Fehler null statt Exception (Dashboard zeigt dann „–"). */
async function safeCount(
  table: string,
  sinceIso?: string
): Promise<number | null> {
  try {
    let q = createAdminClient()
      .from(table)
      .select("*", { count: "exact", head: true });
    if (sinceIso) q = q.gte("created_at", sinceIso);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function getMoneyStats(): Promise<MoneyStats> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: clicks, error } = await createAdminClient()
    .from("affiliate_clicks")
    .select("source, created_at")
    .gte("created_at", since)
    .limit(10000);

  if (error) throw new Error("clicks query failed");

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

  let trialing = 0;
  let active = 0;
  let nextTrialEnd: string | null = null;
  try {
    const stripe = getStripe();
    const [t, a] = await Promise.all([
      stripe.subscriptions.list({ status: "trialing", limit: 100 }),
      stripe.subscriptions.list({ status: "active", limit: 100 }),
    ]);
    trialing = t.data.length;
    active = a.data.length;
    const ends = t.data
      .map((s) => s.trial_end)
      .filter((e): e is number => typeof e === "number")
      .sort((x, y) => x - y);
    if (ends.length) {
      nextTrialEnd = new Date(ends[0] * 1000).toISOString();
    }
  } catch (e) {
    console.error("moneyStats: stripe lookup failed", e);
  }

  // Funnel-Zahlen — parallel, jeweils einzeln abgesichert.
  const [usersTotal, usersNew7d, nlTotal, nlNew7d] = await Promise.all([
    safeCount("profiles"),
    safeCount("profiles", since7d),
    safeCount("newsletter_subscribers"),
    safeCount("newsletter_subscribers", since7d),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    clicks: {
      total30d: (clicks ?? []).length,
      last7d: clicks7d,
      today: clicksToday,
      bySource,
      byDay,
    },
    pro: { trialing, active, nextTrialEnd },
    users: { total: usersTotal, new7d: usersNew7d },
    newsletter: { total: nlTotal, new7d: nlNew7d },
  };
}
