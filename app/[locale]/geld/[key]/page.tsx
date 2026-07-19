import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMoneyStats } from "@/lib/moneyStats";

/**
 * Geld-Dashboard-Datenseite: liefert die aggregierten Monetarisierungs-Zahlen
 * als <pre>-JSON über den normalen Page-Renderweg (derselbe, über den auch
 * der Blog ausgeliefert wird) — API-Route-Antworten kommen beim Dashboard-
 * Fetcher nicht an, Page-HTML nachweislich schon.
 *
 * Zugriff nur mit korrektem Key im Pfad (/de/geld/<MONEY_STATS_KEY>);
 * falscher Key → 404. noindex, keine interne Verlinkung.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "stats",
};

export default async function GeldStatsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!process.env.MONEY_STATS_KEY || key !== process.env.MONEY_STATS_KEY) {
    notFound();
  }

  let payload: string;
  try {
    payload = JSON.stringify(await getMoneyStats());
  } catch {
    payload = JSON.stringify({ error: "stats unavailable" });
  }

  return <pre id="money-stats-json">{payload}</pre>;
}
