import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import Navbar from "@/components/Navbar";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide text-center mb-2">
          {t("badge")}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
          {share.estTotal != null
            ? t("titleWithCost", { cost: formatEuro(share.estTotal, locale) })
            : t("title")}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          {t("subtitle", { count: share.totalRecipes, date: formatWeek(share.weekStart, locale) })}
        </p>

        {share.estTotal != null && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 mb-8 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-gray-700">{t("estCost")}</span>
            <span className="text-xl font-bold text-orange-600">{formatEuro(share.estTotal, locale)}</span>
          </div>
        )}

        <div className="space-y-6 mb-10">
          {dayIndexes.map((day) => (
            <section key={day}>
              <h2 className="text-sm font-bold text-gray-900 mb-2">{DAYS_FULL[day] ?? `Tag ${day + 1}`}</h2>
              <div className="space-y-2">
                {(byDay.get(day) ?? [])
                  .sort((a, b) => (SLOT_INDEX[a.slot] ?? 9) - (SLOT_INDEX[b.slot] ?? 9))
                  .map((r) => (
                    <Link
                      key={`${day}-${r.slot}`}
                      href={`/recipe/${r.id}`}
                      className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all p-3"
                    >
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt={r.title} loading="lazy" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <span className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍳</span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-orange-500 mb-0.5">
                          {MEALS[SLOT_INDEX[r.slot] ?? 2] ?? r.slot}
                        </span>
                        <span className="block text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{r.title}</span>
                        {r.time ? <span className="block text-xs text-gray-400 mt-0.5">⏱ {r.time} min</span> : null}
                      </span>
                      <span className="text-gray-300 flex-shrink-0">→</span>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>

        {share.estTotal != null && (
          <p className="text-xs text-gray-400 text-center mb-10">
            {t("estCostHint", { priced: share.pricedRecipes, total: share.totalRecipes })}
          </p>
        )}

        {/* Viraler Loop: Jede geteilte Woche wirbt fuer den Planer. */}
        <section
          className="rounded-3xl p-8 text-center text-white"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("ctaTitle")}</h2>
          <p className="text-sm text-orange-50 mb-6 max-w-md mx-auto">{t("ctaText")}</p>
          <Link
            href="/"
            className="inline-block px-8 py-3.5 rounded-full bg-white text-orange-600 text-sm font-bold shadow-lg hover:scale-105 transition-transform"
          >
            {t("ctaButton")}
          </Link>
        </section>
      </main>
    </div>
  );
}
