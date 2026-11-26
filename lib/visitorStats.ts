import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Zahlen fürs Besucher-Dashboard (/de/admin/besucher). SERVER-ONLY.
 * Die Auswertung der Seitenaufrufe rechnet die Datenbank selbst
 * (Funktion page_view_stats in supabase/page_views_migration.sql); dazu kommen
 * zwei Zähler aus vorhandenen Tabellen: neue Konten, Newsletter.
 * Nur Summen, keine einzelnen Besucher.
 */

export interface StatRow {
  name: string;
  views: number;
  visitors: number;
  kind?: string;
  /** Nur bei Rezeptseiten: der Titel des Rezepts statt der Kennung in der Adresse. */
  title?: string;
}

export interface VisitorStats {
  days: number;
  today: string;
  /** Erster Tag mit gezählten Aufrufen; null, solange nichts gezählt wurde. */
  since: string | null;
  /** Besucher in den letzten fünf Minuten. */
  live: number;
  totals: { views: number; visitors: number; loggedIn: number };
  previous: { views: number; visitors: number };
  todayTotals: { views: number; visitors: number };
  yesterdayTotals: { views: number; visitors: number };
  byDay: { day: string; views: number; visitors: number }[];
  byHour: { hour: number; views: number; visitors: number }[];
  pages: StatRow[];
  entries: StatRow[];
  channels: StatRow[];
  referrers: StatRow[];
  campaigns: StatRow[];
  countries: StatRow[];
  locales: StatRow[];
  kinds: StatRow[];
  devices: StatRow[];
  browsers: StatRow[];
  systems: StatRow[];
}

export interface VisitorDashboard {
  generatedAt: string;
  stats: VisitorStats;
  /** Was im selben Zeitraum daraus wurde; null, wenn die Abfrage scheitert. */
  outcomes: { signups: number | null; newsletter: number | null };
}

export const ALLOWED_DAYS = [1, 7, 30, 90, 365] as const;

async function countSince(table: string, sinceIso: string): Promise<number | null> {
  try {
    const { count, error } = await createAdminClient()
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceIso);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

const RECIPE_ID = /\/recipe\/(?:user_)?([0-9a-f]{8}-[0-9a-f-]{27})$/;

/** Rezeptseiten heißen in der Adresse nur nach ihrer Kennung; hier kommt der Titel dazu. */
async function addRecipeTitles(rows: StatRow[]): Promise<void> {
  const ids = new Map<string, StatRow[]>();
  for (const row of rows) {
    const id = row.name.match(RECIPE_ID)?.[1];
    if (id) ids.set(id, [...(ids.get(id) ?? []), row]);
  }
  if (!ids.size) return;
  try {
    const { data } = await createAdminClient()
      .from("user_recipes")
      .select("id, title")
      .in("id", [...ids.keys()]);
    for (const recipe of data ?? []) {
      for (const row of ids.get(recipe.id) ?? []) row.title = recipe.title;
    }
  } catch {
    // Ohne Titel bleibt die Adresse stehen.
  }
}

export async function getVisitorDashboard(days: number): Promise<VisitorDashboard> {
  const { data, error } = await createAdminClient().rpc("page_view_stats", { p_days: days });
  if (error || !data) throw new Error(error?.message ?? "page_view_stats lieferte nichts");
  const stats = data as VisitorStats;
  await addRecipeTitles([...stats.pages, ...stats.entries]);

  // Beginn des Zeitraums: Mitternacht deutscher Zeit am ersten Tag. Die halbe
  // Stunde Unschärfe an den Tagen der Zeitumstellung spielt für Summen keine Rolle.
  const firstDay = stats.byDay[0]?.day ?? stats.today;
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "longOffset" })
    .formatToParts(new Date(`${firstDay}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "+01:00";
  const since = new Date(`${firstDay}T00:00:00${offset}`).toISOString();

  const [signups, newsletter] = await Promise.all([
    countSince("profiles", since),
    countSince("newsletter_subscribers", since),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    stats,
    outcomes: { signups, newsletter },
  };
}
