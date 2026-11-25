"use client";

/**
 * Besucher-Dashboard (25.11.2026): zeigt, wie viele Leute kommen, woher und
 * wohin. Die Zahlen liefert /api/admin/besucher (nur für das Culinse-Konto).
 * Gezählt wird ohne Cookies über components/VisitBeacon.tsx.
 *
 * Aufbau von oben nach unten: Kennzahlen, Verlauf, Herkunft, Seiten, Leute
 * (Land, Sprache, Gerät), Tageszeit, und was aus den Besuchen wurde.
 * Diagramme sind schlichtes HTML (Balken als Flächen), keine Bibliothek.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, EmptyState, Icon, Notice, SectionHeader, Skeleton } from "@/components/ui";
import type { StatRow, VisitorDashboard } from "@/lib/visitorStats";

const RANGES = [
  { days: 1, label: "Heute", phrase: "heute" },
  { days: 7, label: "7 Tage", phrase: "in 7 Tagen" },
  { days: 30, label: "30 Tage", phrase: "in 30 Tagen" },
  { days: 90, label: "90 Tage", phrase: "in 90 Tagen" },
  { days: 365, label: "12 Monate", phrase: "in 12 Monaten" },
] as const;

const CHANNELS: Record<string, string> = {
  direct: "Direkt oder unbekannt",
  search: "Suchmaschinen",
  social: "Soziale Netzwerke",
  ai: "KI-Assistenten",
  mail: "E-Mail",
  website: "Andere Websites",
  campaign: "Kampagnen-Links",
};

const KINDS: Record<string, string> = {
  home: "Startseite",
  recipe: "Rezepte",
  topic: "Themenseiten",
  browse: "Stöbern",
  blog: "Ratgeber",
  collections: "Sammlungen",
  planner: "Wochenplaner",
  library: "Eigener Bereich",
  account: "Anmeldung und Konto",
  pro: "Pro",
  info: "Über uns und Rechtliches",
  other: "Sonstiges",
};

const DEVICES: Record<string, string> = { mobile: "Handy", tablet: "Tablet", desktop: "Computer" };

const num = (n: number) => n.toLocaleString("de-DE");

function displayName(type: "region" | "language", code: string): string {
  if (code === "??") return "Unbekannt";
  try {
    return new Intl.DisplayNames(["de"], { type }).of(code) ?? code;
  } catch {
    return code;
  }
}

function dayLabel(iso: string, style: "long" | "short" | "weekday"): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const opts: Intl.DateTimeFormatOptions =
    style === "long" ? { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }
    : style === "weekday" ? { weekday: "short", timeZone: "UTC" }
    : { day: "numeric", month: "numeric", timeZone: "UTC" };
  return date.toLocaleDateString("de-DE", opts);
}

/** Veränderung in Prozent; null, wenn es davor nichts zum Vergleichen gab. */
function change(now: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

// ─── Kennzahl ───────────────────────────────────────────────────────────────
function Trend({ now, before, versus }: { now: number; before: number; versus: string }) {
  const pct = change(now, before);
  if (pct === null) return <span className="text-ink-3">{versus}: noch kein Vergleich</span>;
  if (pct === 0) return <span className="text-ink-2">gleich wie {versus}</span>;
  const up = pct > 0;
  return (
    <span className={up ? "text-green-deep" : "text-error"}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {up ? "+" : "−"}
      {num(Math.abs(pct))} % <span className="text-ink-2">gegenüber {versus}</span>
    </span>
  );
}

function Figure({ label, value, children, wide = false }: { label: string; value: string; children?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={["bg-surface px-5 py-4", wide ? "col-span-2 lg:col-span-1" : ""].join(" ")}>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-serif text-h1-sm font-semibold text-ink tabular">{value}</p>
      {children && <p className="mt-1 text-caption text-ink-2">{children}</p>}
    </div>
  );
}

// ─── Verlauf ────────────────────────────────────────────────────────────────
interface Column { key: string; title: string; axis: string; views: number; visitors: number; running?: boolean }

/** Obergrenze der Achse: eine runde Zahl, deren Hälfte auch rund ist. */
function axisMax(value: number): number {
  if (value <= 2) return 2;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1, 2, 4, 6, 8, 10]) {
    if (m * pow >= value && m * pow >= 2) return m * pow;
  }
  return 10 * pow;
}

function mondayOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function buildColumns(data: VisitorDashboard["stats"]): { columns: Column[]; unit: string } {
  if (data.days === 1) {
    const byHour = new Map(data.byHour.map((h) => [h.hour, h]));
    // "en-GB" liefert die blanke Stunde ("17"); "de-DE" hängt " Uhr" an.
    const nowHour = parseInt(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Berlin" }).format(new Date()),
      10,
    );
    return {
      unit: "Stunde",
      columns: Array.from({ length: 24 }, (_, hour) => ({
        key: String(hour),
        title: `${hour} bis ${hour + 1} Uhr`,
        axis: `${hour} Uhr`,
        views: byHour.get(hour)?.views ?? 0,
        visitors: byHour.get(hour)?.visitors ?? 0,
        running: hour === nowHour,
      })),
    };
  }
  if (data.days > 120) {
    const weeks = new Map<string, Column>();
    for (const d of data.byDay) {
      const monday = mondayOf(d.day);
      const week = weeks.get(monday) ?? {
        key: monday,
        title: `Woche ab ${dayLabel(monday, "long")}`,
        axis: dayLabel(monday, "short"),
        views: 0,
        visitors: 0,
      };
      week.views += d.views;
      week.visitors += d.visitors;
      week.running = week.running || d.day === data.today;
      weeks.set(monday, week);
    }
    return { unit: "Woche", columns: [...weeks.values()] };
  }
  return {
    unit: "Tag",
    columns: data.byDay.map((d) => ({
      key: d.day,
      title: dayLabel(d.day, "long"),
      axis: data.days <= 7 ? dayLabel(d.day, "weekday") : dayLabel(d.day, "short"),
      views: d.views,
      visitors: d.visitors,
      running: d.day === data.today,
    })),
  };
}

function TimeChart({ data }: { data: VisitorDashboard["stats"] }) {
  const [metric, setMetric] = useState<"visitors" | "views">("visitors");
  const [hover, setHover] = useState<number | null>(null);
  const { columns, unit } = useMemo(() => buildColumns(data), [data]);
  const max = axisMax(Math.max(0, ...columns.map((c) => c[metric])));
  const labelEvery = Math.max(1, Math.ceil(columns.length / 7));
  const active = hover !== null ? columns[hover] : null;
  const metricLabel = metric === "visitors" ? "Besucher" : "Seitenaufrufe";

  return (
    <section aria-labelledby="verlauf" className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="verlauf" className="text-h2-sm">Verlauf</h2>
          <p className="mt-1 text-sm text-ink-2">
            {metricLabel} je {unit}. Der hellere Balken läuft noch.
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Messgröße">
          <Chip size="sm" active={metric === "visitors"} onClick={() => setMetric("visitors")}>Besucher</Chip>
          <Chip size="sm" active={metric === "views"} onClick={() => setMetric("views")}>Seitenaufrufe</Chip>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Achse links: drei Marken, passend zu den Linien im Feld */}
        <div aria-hidden="true" className="flex h-56 w-9 shrink-0 flex-col justify-between text-right text-caption text-ink-3 tabular">
          <span className="-translate-y-1/2">{num(max)}</span>
          <span>{num(max / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-56" onMouseLeave={() => setHover(null)}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              <span className="block border-t border-line" />
              <span className="block border-t border-line" />
              <span className="block border-t border-line-strong" />
            </div>

            <div className="absolute inset-0 flex items-end" role="img" aria-label={`${metricLabel} je ${unit}; Werte in der Tabelle darunter`}>
              {columns.map((c, i) => (
                <div
                  key={c.key}
                  className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center px-px"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover(hover === i ? null : i)}
                >
                  <div
                    className={[
                      "w-full max-w-7 rounded-t-1",
                      c.running ? "bg-brand/50" : "bg-brand",
                      hover === i ? "outline outline-2 outline-offset-1 outline-ink" : "",
                    ].join(" ")}
                    style={{ height: `${(c[metric] / max) * 100}%`, minHeight: c[metric] > 0 ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>

            {active && hover !== null && (
              <div
                role="status"
                className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-2 bg-surface px-3 py-2 text-sm shadow-float"
                style={{ left: `clamp(5.5rem, ${((hover + 0.5) / columns.length) * 100}%, calc(100% - 5.5rem))` }}
              >
                <p className="font-semibold text-ink">{active.title}</p>
                <p className="mt-0.5 flex justify-between gap-3 text-ink-2 tabular">
                  <span>Besucher</span>
                  <span className="font-semibold text-ink">{num(active.visitors)}</span>
                </p>
                <p className="flex justify-between gap-3 text-ink-2 tabular">
                  <span>Seitenaufrufe</span>
                  <span className="font-semibold text-ink">{num(active.views)}</span>
                </p>
                {active.running && <p className="mt-0.5 text-caption text-ink-3">läuft noch</p>}
              </div>
            )}
          </div>

          <div aria-hidden="true" className="mt-2 flex text-caption text-ink-3 tabular">
            {columns.map((c, i) => (
              <span key={c.key} className="relative h-4 min-w-0 flex-1">
                {i % labelEvery === 0 && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{c.axis}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-brand hover:text-brand-hover">Als Tabelle zeigen</summary>
        <div className="mt-3 max-h-80 overflow-auto rounded-2 border border-line">
          <table className="w-full text-left tabular">
            <thead className="sticky top-0 bg-surface-soft text-ink-2">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">{unit}</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Besucher</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Seitenaufrufe</th>
              </tr>
            </thead>
            <tbody>
              {[...columns].reverse().map((c) => (
                <tr key={c.key} className="border-t border-line">
                  <th scope="row" className="px-3 py-1.5 font-normal text-ink">{c.title}</th>
                  <td className="px-3 py-1.5 text-right text-ink">{num(c.visitors)}</td>
                  <td className="px-3 py-1.5 text-right text-ink">{num(c.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

// ─── Rangliste mit Balken ───────────────────────────────────────────────────
interface ListRow { key: string; label: string; note?: string; href?: string; visitors: number; views: number }

function RankList({
  title,
  hint,
  first,
  rows,
  by = "visitors",
  empty = "In diesem Zeitraum noch nichts gezählt.",
}: {
  title: string;
  hint?: string;
  first: string;
  rows: ListRow[];
  by?: "visitors" | "views";
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r[by]));
  return (
    <section className="min-w-0">
      <h3 className="text-h3">{title}</h3>
      {hint && <p className="mt-1 text-sm text-ink-2">{hint}</p>}
      {rows.length === 0 ? (
        <p className="mt-4 rounded-2 bg-surface-soft px-4 py-3 text-sm text-ink-2">{empty}</p>
      ) : (
        <table className="mt-3 w-full table-fixed text-sm">
          <thead>
            <tr className="text-caption text-ink-3">
              <th scope="col" className="pb-1.5 text-left font-normal">{first}</th>
              <th scope="col" className="w-20 pb-1.5 text-right font-normal">Besucher</th>
              <th scope="col" className="w-20 pb-1.5 text-right font-normal">Aufrufe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line">
                <th scope="row" className="relative py-0 text-left font-normal">
                  {/* Balken hinter dem Namen: Länge im Verhältnis zum größten Wert der Liste */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-0 rounded-1 bg-brand-soft"
                    style={{ width: `${Math.max(1.5, (r[by] / max) * 100)}%` }}
                  />
                  <span className="relative block truncate px-2 py-2 text-ink" title={r.note ? `${r.label} (${r.note})` : r.label}>
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noreferrer" className="underline-offset-[3px] hover:underline">
                        {r.label}
                      </a>
                    ) : (
                      r.label
                    )}
                    {r.note && <span className="ml-2 text-caption text-ink-3">{r.note}</span>}
                  </span>
                </th>
                <td className={["py-2 text-right tabular", by === "visitors" ? "font-semibold text-ink" : "text-ink-2"].join(" ")}>
                  {num(r.visitors)}
                </td>
                <td className={["py-2 text-right tabular", by === "views" ? "font-semibold text-ink" : "text-ink-2"].join(" ")}>
                  {num(r.views)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const plain = (rows: StatRow[], label: (name: string) => string = (n) => n): ListRow[] =>
  rows.map((r) => ({ key: r.name, label: label(r.name), visitors: r.visitors, views: r.views }));

function pageRows(rows: StatRow[]): ListRow[] {
  return rows.map((r) => {
    let path = r.name;
    try {
      path = decodeURI(r.name);
    } catch {}
    return {
      key: r.name,
      label: r.title ?? path,
      note: r.title ? path.split("/")[1] : KINDS[r.kind ?? ""] ?? undefined,
      href: r.name,
      visitors: r.visitors,
      views: r.views,
    };
  });
}

// ─── Seite ──────────────────────────────────────────────────────────────────
type State = "loading" | "ok" | "forbidden" | "error";

export default function BesucherClient() {
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<State>("loading");
  const [data, setData] = useState<VisitorDashboard | null>(null);
  const [sample, setSample] = useState(false);

  // quiet: leises Nachladen im Hintergrund; ein Fehler lässt dann die alten Zahlen stehen.
  const load = useCallback((range: number, quiet = false) => {
    // Nur im Entwicklungsmodus: /de/admin/besucher?beispiel zeigt erfundene
    // Zahlen, damit sich die Seite ohne Anmeldung und ohne Daten ansehen lässt.
    const wantsSample =
      process.env.NODE_ENV === "development" && new URLSearchParams(location.search).has("beispiel");
    const request: Promise<{ data: VisitorDashboard; sample: boolean } | "forbidden"> = wantsSample
      ? import("./beispielDaten").then((m) => ({ data: m.sampleDashboard(range), sample: true }))
      : fetch(`/api/admin/besucher?tage=${range}`, { cache: "no-store" }).then(async (res) => {
          if (res.status === 401 || res.status === 403) return "forbidden" as const;
          if (!res.ok) throw new Error(String(res.status));
          return { data: (await res.json()) as VisitorDashboard, sample: false };
        });
    request
      .then((result) => {
        if (result === "forbidden") return setState("forbidden");
        setData(result.data);
        setSample(result.sample);
        setState("ok");
      })
      .catch(() => {
        if (!quiet) setState("error");
      });
  }, []);

  useEffect(() => {
    load(days);
    // Jede Minute leise nachladen, solange die Seite zu sehen ist.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load(days, true);
    }, 60_000);
    return () => clearInterval(timer);
  }, [days, load]);

  const pick = (range: number) => {
    if (range === days) return;
    setState("loading");
    setDays(range);
  };
  const reload = () => {
    setState("loading");
    load(days);
  };

  const range = RANGES.find((r) => r.days === days) ?? RANGES[2];
  const stats = data?.stats;
  const perVisitor = stats && stats.totals.visitors ? stats.totals.views / stats.totals.visitors : 0;
  const before = days === 1 ? "gestern" : `den ${days === 365 ? "12 Monaten" : `${days} Tagen`} davor`;

  return (
    <main className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <SectionHeader
        as="h1"
        title="Besucher"
        subtitle="Wie viele Leute kommen, woher und wohin. Gezählt ohne Cookies; Suchroboter und deine eigenen Aufrufe sind nicht dabei."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Zeitraum">
          {RANGES.map((r) => (
            <Chip key={r.days} size="sm" active={days === r.days} onClick={() => pick(r.days)}>
              {r.label}
            </Chip>
          ))}
        </div>
        {data && state === "ok" && (
          <p className="text-sm text-ink-2 tabular">
            Stand {new Date(data.generatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr.{" "}
            <button type="button" onClick={reload} className="font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
              Neu laden
            </button>
          </p>
        )}
      </div>

      {sample && (
        <Notice tone="warn" className="mt-6">
          Beispielzahlen zum Ansehen der Seite, keine echten Besucher.
        </Notice>
      )}

      {state === "loading" && (
        <div className="mt-8 space-y-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
          <Skeleton className="h-64" />
        </div>
      )}

      {state === "forbidden" && (
        <Notice tone="warn" className="mt-8">
          Kein Zugriff. Diese Seite ist nur für das Culinse-Konto. Melde dich mit dem Culinse-Konto an und lade die Seite neu.
        </Notice>
      )}

      {state === "error" && (
        <EmptyState
          className="mt-8"
          tone="error"
          icon="alert"
          title="Die Zahlen ließen sich nicht laden"
          text="Entweder ist die Zähltabelle in der Datenbank noch nicht angelegt, oder die Datenbank antwortet gerade nicht."
          action={
            <button type="button" onClick={reload} className="font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
              Erneut versuchen
            </button>
          }
        />
      )}

      {state === "ok" && stats && data && !stats.since && (
        <EmptyState
          className="mt-8"
          icon="users"
          title="Noch kein Besuch gezählt"
          text="Die Zählung läuft, sobald diese Fassung der Website ausgeliefert ist. Der erste Besucher erscheint hier nach spätestens einer Minute."
        />
      )}

      {state === "ok" && stats && data && stats.since && (
        <>
          {/* Kennzahlen: ein Feld mit Trennlinien statt einzelner Karten */}
          <div className={["mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2 border border-line bg-line", days === 1 ? "lg:grid-cols-4" : "lg:grid-cols-5"].join(" ")}>
            <Figure label="Gerade auf der Seite" value={num(stats.live)} wide={days !== 1}>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={["inline-block h-2 w-2 rounded-pill", stats.live > 0 ? "bg-green" : "bg-line-strong"].join(" ")} />
                in den letzten 5 Minuten
              </span>
            </Figure>
            {days !== 1 && (
              <Figure label="Besucher heute" value={num(stats.todayTotals.visitors)}>
                gestern {num(stats.yesterdayTotals.visitors)}, heute {num(stats.todayTotals.views)} Aufrufe
              </Figure>
            )}
            <Figure label={`Besucher ${range.phrase}`} value={num(stats.totals.visitors)}>
              <Trend now={stats.totals.visitors} before={stats.previous.visitors} versus={before} />
            </Figure>
            <Figure label={`Seitenaufrufe ${range.phrase}`} value={num(stats.totals.views)}>
              <Trend now={stats.totals.views} before={stats.previous.views} versus={before} />
            </Figure>
            <Figure label="Seiten je Besucher" value={perVisitor.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}>
              {num(stats.totals.loggedIn)} davon angemeldet
            </Figure>
          </div>

          <TimeChart data={stats} />

          <section aria-labelledby="herkunft" className="mt-14">
            <h2 id="herkunft" className="text-h2-sm">Woher sie kommen</h2>
            <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <div className="grid content-start gap-y-10">
                <RankList
                  title="Wege"
                  hint="„Direkt“ heißt: Adresse eingetippt, Lesezeichen, oder die Herkunft wurde nicht übermittelt."
                  first="Weg"
                  rows={plain(stats.channels, (n) => CHANNELS[n] ?? n)}
                />
                {stats.campaigns.length > 0 && (
                  <RankList
                    title="Kampagnen-Links"
                    hint="Links mit ?utm_source=… am Ende, zum Beispiel aus dem TikTok-Profil."
                    first="Quelle"
                    rows={plain(stats.campaigns)}
                  />
                )}
              </div>
              <RankList
                title="Verweisende Websites"
                first="Website"
                rows={stats.referrers.map((r) => ({
                  key: r.name,
                  label: r.name,
                  note: r.kind && r.kind !== "website" ? CHANNELS[r.kind] : undefined,
                  visitors: r.visitors,
                  views: r.views,
                }))}
                empty="Noch kein Besuch über einen Link von einer anderen Website."
              />
            </div>
          </section>

          <section aria-labelledby="seiten" className="mt-14">
            <h2 id="seiten" className="text-h2-sm">Was sie ansehen</h2>
            <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <RankList title="Meistbesuchte Seiten" first="Seite" by="views" rows={pageRows(stats.pages)} />
              <div className="grid content-start gap-y-10">
                <RankList
                  title="Einstiegsseiten"
                  hint="Die erste Seite eines Besuchs: hier landen die Leute von außen."
                  first="Seite"
                  by="views"
                  rows={pageRows(stats.entries)}
                />
                <RankList title="Bereiche" first="Bereich" by="views" rows={plain(stats.kinds, (n) => KINDS[n] ?? n)} />
              </div>
            </div>
          </section>

          <section aria-labelledby="leute" className="mt-14">
            <h2 id="leute" className="text-h2-sm">Wer sie sind</h2>
            <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <RankList title="Länder" first="Land" rows={plain(stats.countries, (n) => displayName("region", n))} />
              <RankList title="Sprache der Seite" first="Sprache" rows={plain(stats.locales, (n) => displayName("language", n))} />
            </div>
            <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-3">
              <RankList title="Geräte" first="Gerät" rows={plain(stats.devices, (n) => DEVICES[n] ?? n)} />
              <RankList
                title="Browser"
                hint="„…-App“ heißt: Der Link wurde direkt in der App geöffnet."
                first="Browser"
                rows={plain(stats.browsers)}
              />
              <RankList title="Betriebssysteme" first="System" rows={plain(stats.systems)} />
            </div>
          </section>

          <section aria-labelledby="ergebnis" className="mt-14">
            <h2 id="ergebnis" className="text-h2-sm">Was daraus wurde</h2>
            <p className="mt-1 text-sm text-ink-2">Im selben Zeitraum, {range.phrase}.</p>
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2 border border-line bg-line sm:grid-cols-3">
              {[
                { label: "Neue Konten", value: data.outcomes.signups },
                { label: "Newsletter-Anmeldungen", value: data.outcomes.newsletter },
                { label: "Klicks auf Partner-Links", value: data.outcomes.affiliateClicks },
              ].map((o) => (
                <Figure key={o.label} label={o.label} value={o.value === null ? "–" : num(o.value)}>
                  {o.value !== null && stats.totals.visitors > 0
                    ? `${((o.value / stats.totals.visitors) * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} je 100 Besucher`
                    : undefined}
                </Figure>
              ))}
            </div>
          </section>

          <p className="mt-14 max-w-prose text-sm text-ink-2">
            <Icon name="info" size={16} className="mr-1.5 inline-block align-[-3px] text-ink-3" />
            Gezählt seit {dayLabel(stats.since, "long")}. Ein Besucher ist ein Gerät an einem Tag; wer an zwei Tagen kommt,
            zählt zweimal, weil die Zählung niemanden über den Tag hinaus wiedererkennt. Tage beginnen um Mitternacht
            deutscher Zeit. Wer JavaScript abgeschaltet hat oder Zählungen blockiert, fehlt.
          </p>
        </>
      )}
    </main>
  );
}
