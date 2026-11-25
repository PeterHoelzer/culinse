import type { StatRow, VisitorDashboard } from "@/lib/visitorStats";

/*
  Erfundene Zahlen für das Besucher-Dashboard, nur im Entwicklungsmodus
  (/de/admin/besucher?beispiel). Damit lässt sich die Seite gestalten und
  prüfen, ohne angemeldet zu sein und ohne echte Besucher. Wird in der
  ausgelieferten Fassung nie geladen (siehe BesucherClient.tsx).
*/

// Feste Folge statt Zufall: die Seite sieht bei jedem Laden gleich aus.
function series(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function shiftDay(iso: string, by: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + by);
  return d.toISOString().slice(0, 10);
}

function share(total: number, parts: [string, number, string?][]): StatRow[] {
  return parts.map(([name, part, kind]) => ({
    name,
    kind,
    visitors: Math.round(total * part),
    views: Math.round(total * part * 1.9),
  }));
}

export function sampleDashboard(days: number): VisitorDashboard {
  const rand = series(7);
  const today = new Date().toISOString().slice(0, 10);
  const byDay = Array.from({ length: days }, (_, i) => {
    const day = shiftDay(today, i - (days - 1));
    const weekend = [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay()) ? 1.35 : 1;
    const growth = 18 + (i / Math.max(1, days - 1)) * 34;
    const visitors = Math.round(growth * weekend * (0.8 + rand() * 0.4) * (i === days - 1 ? 0.45 : 1));
    return { day, visitors, views: Math.round(visitors * (1.6 + rand() * 0.7)) };
  });
  const byHour = Array.from({ length: 24 }, (_, hour) => {
    const visitors = Math.round(Math.max(0, 9 - Math.abs(hour - 18) * 1.1 + (hour === 11 || hour === 12 ? 4 : 0)) * (days === 1 ? 1 : days / 3));
    return { hour, visitors, views: Math.round(visitors * 1.9) };
  });

  const visitors = byDay.reduce((sum, d) => sum + d.visitors, 0);
  const views = byDay.reduce((sum, d) => sum + d.views, 0);
  const last = byDay[byDay.length - 1];
  const dayBefore = byDay[byDay.length - 2] ?? { visitors: 31, views: 58 };

  const pages: StatRow[] = [
    { name: "/de", kind: "home", visitors: 0.22, views: 0.16 },
    { name: "/de/recipe/user_0b6f4c1e-9a52-4d0c-8f3e-2f6a1c7d9e10", kind: "recipe", title: "Schweinebraten mit Kruste", visitors: 0.12, views: 0.09 },
    { name: "/de/recipes/deutsche-rezepte", kind: "topic", visitors: 0.1, views: 0.08 },
    { name: "/de/recipe/user_5d2a9c77-1b3e-4f60-a8d4-6e0b9c3f2a41", kind: "recipe", title: "Königsberger Klopse", visitors: 0.08, views: 0.06 },
    { name: "/en", kind: "home", visitors: 0.07, views: 0.05 },
    { name: "/de/blog/messer-schaerfen", kind: "blog", visitors: 0.06, views: 0.045 },
    { name: "/de/recipes", kind: "browse", visitors: 0.05, views: 0.05 },
    { name: "/de/wochenplaner", kind: "planner", visitors: 0.03, views: 0.04 },
    { name: "/en/recipe/user_c81e7d3a-44f2-4b8b-9d15-7a3c5e2f8b06", kind: "recipe", title: "German Potato Salad", visitors: 0.03, views: 0.025 },
    { name: "/de/login", kind: "account", visitors: 0.02, views: 0.02 },
  ].map((p) => ({ ...p, visitors: Math.round(visitors * p.visitors), views: Math.round(views * p.views) }));

  return {
    generatedAt: new Date().toISOString(),
    outcomes: {
      signups: Math.round(visitors * 0.012),
      newsletter: Math.round(visitors * 0.006),
      affiliateClicks: Math.round(visitors * 0.021),
    },
    stats: {
      days,
      today,
      since: shiftDay(today, -Math.min(days - 1, 41)),
      live: 3,
      totals: { views, visitors, loggedIn: Math.round(visitors * 0.04) },
      previous: { views: Math.round(views * 0.78), visitors: Math.round(visitors * 0.74) },
      todayTotals: { views: last.views, visitors: last.visitors },
      yesterdayTotals: { views: dayBefore.views, visitors: dayBefore.visitors },
      byDay,
      byHour,
      pages,
      entries: pages.filter((p) => p.kind !== "account" && p.kind !== "planner").slice(0, 6),
      channels: share(visitors, [["search", 0.41], ["direct", 0.27], ["social", 0.19], ["website", 0.08], ["ai", 0.03], ["mail", 0.02]]),
      referrers: share(visitors, [
        ["google.com", 0.33, "search"], ["pinterest.com", 0.09, "social"], ["tiktok.com", 0.07, "social"],
        ["bing.com", 0.05, "search"], ["curlie.org", 0.04, "website"], ["germanfoodblogs.de", 0.03, "website"],
        ["chatgpt.com", 0.03, "ai"], ["duckduckgo.com", 0.02, "search"],
      ]),
      campaigns: share(visitors, [["tiktok", 0.05], ["newsletter", 0.02]]),
      countries: share(visitors, [["DE", 0.62], ["AT", 0.11], ["CH", 0.08], ["US", 0.07], ["GB", 0.04], ["NL", 0.03], ["??", 0.02]]),
      locales: share(visitors, [["de", 0.78], ["en", 0.17], ["es", 0.02], ["fr", 0.02], ["tr", 0.01]]),
      kinds: share(visitors, [["recipe", 0.44], ["home", 0.24], ["topic", 0.13], ["blog", 0.08], ["browse", 0.06], ["planner", 0.03], ["account", 0.02]]),
      devices: share(visitors, [["mobile", 0.64], ["desktop", 0.31], ["tablet", 0.05]]),
      browsers: share(visitors, [["Chrome", 0.38], ["Safari", 0.34], ["Firefox", 0.09], ["Pinterest-App", 0.07], ["TikTok-App", 0.06], ["Samsung Internet", 0.04], ["Edge", 0.02]]),
      systems: share(visitors, [["iOS", 0.36], ["Android", 0.31], ["Windows", 0.19], ["macOS", 0.12], ["Linux", 0.02]]),
    },
  };
}
