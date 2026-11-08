import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import Navbar from "@/components/Navbar";
import { Button, Icon, Notice } from "@/components/ui";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

interface ShareDay {
  day: number;
  slot: string;
  id: string;
  title: string;
  image: string | null;
  time: number | null;
}

interface ShareSnapshot {
  v: number;
  locale: string;
  weekStart: string;
  days: ShareDay[];
  estTotal: number | null;
  pricedRecipes: number;
  totalRecipes: number;
  createdAt: string;
}

async function fetchShare(shareId: string): Promise<ShareSnapshot | null> {
  if (!/^[a-f0-9-]{36}$/.test(shareId) || !SUPABASE_URL) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/recipe-media/shares/${shareId}.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as ShareSnapshot;
  } catch {
    return null;
  }
}

function formatEuro(n: number, locale: string): string {
  return locale === "de" ? `${n.toFixed(2).replace(".", ",")} €` : `€${n.toFixed(2)}`;
}

function formatWeek(weekStart: string, locale: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  if (!y || !m || !d) return weekStart;
  return locale === "de"
    ? `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`
    : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}, ${y}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; shareId: string }> }
): Promise<Metadata> {
  const { locale, shareId } = await params;
  const share = await fetchShare(shareId);
  const de = locale === "de";
  const title = share?.estTotal
    ? de
      ? `Mein Wochenplan für ${formatEuro(share.estTotal, "de")}`
      : `My week of meals for ${formatEuro(share.estTotal, "en")}`
    : de
    ? "Mein Wochenplan"
    : "My meal plan";
  const description = de
    ? `${share?.totalRecipes ?? ""} Gerichte, geplant mit Culinse — kostenloser Wochenplaner mit automatischer Einkaufsliste und Preisschätzung auf Discounter-Niveau.`
    : `${share?.totalRecipes ?? ""} meals planned with Culinse — the free meal planner with automatic shopping list and price estimate.`;
  const url = `${BASE_URL}/${locale}/plan/${shareId}`;
  return {
    title,
    description,
    // Geteilte Schnappschuesse: nicht indexieren (thin/UGC), Links folgen.
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title: `${title} | Culinse`, description, url, type: "article", siteName: "Culinse" },
    twitter: { card: "summary_large_image", title: `${title} | Culinse`, description },
  };
}

export default async function SharedPlanPage(
  { params }: { params: Promise<{ locale: string; shareId: string }> }
) {
  const { locale, shareId } = await params;
  const share = await fetchShare(shareId);
  if (!share) notFound();

  const t = await getTranslations("planShare");
  const tm = await getTranslations("mealPlanner");
  const DAYS_FULL = tm.raw("daysFull") as string[];
  const MEALS = tm.raw("meals") as string[];
  const SLOT_INDEX: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2 };

  const byDay = new Map<number, ShareDay[]>();
  for (const d of share.days) {
    const arr = byDay.get(d.day) ?? [];
    arr.push(d);
    byDay.set(d.day, arr);
  }
  const dayIndexes = [...byDay.keys()].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-prose">
          <p className="mb-2 text-sm text-ink-3">{t("badge")}</p>
          <h1 className="text-h1-sm sm:text-h1">
            {share.estTotal != null
              ? t("titleWithCost", { cost: formatEuro(share.estTotal, locale) })
              : t("title")}
          </h1>
          <p className="mt-2 mb-8 text-body-lg text-ink-2">
            {t("subtitle", { count: share.totalRecipes, date: formatWeek(share.weekStart, locale) })}
          </p>

          {share.estTotal != null && (
            <Notice tone="info" className="mb-8">
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{t("estCost")}</span>
                <span className="text-h3 font-serif tabular">{formatEuro(share.estTotal, locale)}</span>
              </span>
            </Notice>
          )}

          <div className="mb-10 space-y-8">
            {dayIndexes.map((day) => (
              <section key={day} aria-labelledby={`share-day-${day}`}>
                <h2 id={`share-day-${day}`} className="mb-3 border-b border-line pb-2 text-h3">
                  {DAYS_FULL[day] ?? `Tag ${day + 1}`}
                </h2>
                <ul className="divide-y divide-line">
                  {(byDay.get(day) ?? [])
                    .sort((a, b) => (SLOT_INDEX[a.slot] ?? 9) - (SLOT_INDEX[b.slot] ?? 9))
                    .map((r) => (
                      <li key={`${day}-${r.slot}`}>
                        <Link href={`/recipe/${r.id}` as "/"} className="group flex items-center gap-4 py-3">
                          <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2 bg-surface-soft">
                            {r.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <Icon name="utensils" size={24} className="text-line-strong" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-ink-3 tabular">
                              {MEALS[SLOT_INDEX[r.slot] ?? 2] ?? r.slot}
                              {r.time ? ` · ${r.time} min` : ""}
                            </span>
                            <span className="line-clamp-2 block text-base font-semibold text-ink group-hover:underline underline-offset-[3px]">{r.title}</span>
                          </span>
                          <Icon name="chevronRight" size={20} className="shrink-0 text-ink-3" />
                        </Link>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>

          {share.estTotal != null && (
            <p className="mb-10 text-caption text-ink-3">
              {t("estCostHint", { priced: share.pricedRecipes, total: share.totalRecipes })}
            </p>
          )}

          {/* Jede geteilte Woche wirbt für den Planer. */}
          <section className="rounded-2 bg-surface-soft p-6">
            <h2 className="text-h2-sm">{t("ctaTitle")}</h2>
            <p className="mt-2 mb-5 text-base text-ink-2">{t("ctaText")}</p>
            <Button href="/">{t("ctaButton")}</Button>
          </section>
        </div>
      </main>
    </div>
  );
}
