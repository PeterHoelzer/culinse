import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomeClient from "./HomeClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import type { Recipe } from "./components/home-types";
import { dishColorsWithin } from "@/lib/dishColor";
import { routing } from "@/i18n/routing";
import { siteDescription } from "@/lib/siteMeta";
import { originalImageUrl } from "@/lib/imageUrl";
import { LANDINGS, LANDING_MIN, emptyState } from "@/lib/browse/facets";
import { runBrowse } from "@/lib/browse";
import { landingPath } from "@/lib/browse/slugs";

// Startseite als ISR: alle 15 Minuten neu gerendert, dazwischen aus dem
// Edge-Cache (TTFB ~20 ms statt ~350 ms). Die ersten Karten, das Tagesrezept
// und seine Farben stecken bereits im HTML; Nutzerbezogenes (Für dich,
// Speichern) lädt der Client. Vorher force-dynamic, weil das Grid einst nur
// client-seitig kam und ein gecachtes Skelett hängen blieb.
export const revalidate = 900;

// Ohne generateStaticParams rendert Next eine Route mit dynamischem Segment
// bei jedem Abruf neu, egal was in revalidate steht (Build-Tabelle: ƒ, Antwort
// "private, no-store"). Erst die Liste der Sprachen macht aus /[locale] eine
// ISR-Seite: alle 16 entstehen beim Build und liegen danach im Edge-Cache.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ─── WebSite + Organization JSON-LD ──────────────────────────────────────────
function buildWebsiteSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://culinse.com/#website",
        url: "https://culinse.com",
        name: "Culinse",
        description: siteDescription(locale),
        inLanguage: locale,
        // Die Suche wird auf der Stöberseite schon auf dem Server ausgewertet;
        // auf der Startseite erst im Browser.
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `https://culinse.com/${locale}/recipes?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://culinse.com/#organization",
        name: "Culinse",
        url: "https://culinse.com",
        logo: {
          "@type": "ImageObject",
          // Google verlangt mindestens 112 px; /icon hat 32.
          url: "https://culinse.com/culinse-logo.png",
        },
      },
    ],
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

interface FeaturedRecipe {
  id: string;
  title: string;
}

// Server-gefetchte Rezeptlinks fuer den SEO-Block am Seitenende.
// Zweck (GSC 09.08.2026): 429 Rezept-URLs "Gefunden - zurzeit nicht
// indexiert" - die Startseite ist die staerkste Seite der Domain, hatte im
// crawlbaren HTML aber keinen einzigen Rezeptlink (das Grid laedt
// client-seitig). revalidate haelt die Antwort im Data Cache, kostet also
// trotz force-dynamic praktisch keinen TTFB; Fehler degradieren still zu
// einer leeren Liste (der Block rendert dann nur die Hub-Links).
async function fetchFeatured(locale: string): Promise<FeaturedRecipe[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/featured-recipes?lang=${locale === "de" ? "de" : locale === "es" ? "es" : locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "pl" ? "pl" : locale === "tr" ? "tr" : locale === "nl" ? "nl" : locale === "cs" ? "cs" : locale === "ru" ? "ru" : locale === "pt" ? "pt" : locale === "zh" ? "zh" : locale === "ja" ? "ja" : locale === "id" ? "id" : locale === "vi" ? "vi" : locale === "bn" ? "bn" : "en"}&number=12`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch {
    return [];
  }
}

// Erste Discover-Karten server-seitig vorladen (E2, SEO-Runde 09.08):
// Vorher kamen die Karten erst nach Hydration + Client-Fetch - der mobile
// LCP lag bei ~8,8 s, weil das LCP-Element (erstes Kartenbild) so spaet
// startete. Der Data-Cache-Fetch (15 min) macht die ersten 6 Karten Teil
// des SSR-HTML: Das LCP-Bild startet mit dem First Paint, Google sieht die
// Karten-Links, und die Provider-APIs werden seltener aufgerufen. Fehler
// degradieren still - das Grid faellt auf den bisherigen Client-Fetch
// zurueck.
async function fetchInitialRecipes(locale: string): Promise<Recipe[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/recipes?lang=${locale === "de" ? "de" : locale === "es" ? "es" : locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "pl" ? "pl" : locale === "tr" ? "tr" : locale === "nl" ? "nl" : locale === "cs" ? "cs" : locale === "ru" ? "ru" : locale === "pt" ? "pt" : locale === "zh" ? "zh" : locale === "ja" ? "ja" : locale === "id" ? "id" : locale === "vi" ? "vi" : locale === "bn" ? "bn" : "en"}&number=10`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch {
    return [];
  }
}

// Die Rezept-API liefert Supabase-Render-URLs mit width/height=640 (Karten).
// Fürs Hero-Foto heben wir die Größe an; fremde URLs bleiben unverändert.
// Das Hero-Foto läuft durch den Next-Bildoptimierer (next/image). Als Quelle
// nimmt er die Originaldatei aus dem Storage, nicht die Supabase-Render-URL:
// die transformiert bei jedem neuen Abruf erst selbst (2–4 s kalt) und wäre
// eine zweite Skalierung hintereinander.
function heroImageUrl(url: string | null): string | null {
  // Original statt Render-Adresse oder fester 640er-Fassung: der Next-Optimierer skaliert selbst.
  return url ? originalImageUrl(url) : url;
}

const OG_LOCALES: Record<string, string> = {
  en: "en_US", de: "de_DE", es: "es_ES", fr: "fr_FR", it: "it_IT", pl: "pl_PL", tr: "tr_TR", nl: "nl_NL", cs: "cs_CZ", ru: "ru_RU", pt: "pt_BR", zh: "zh_CN", ja: "ja_JP", id: "id_ID", vi: "vi_VN", bn: "bn_BD",
};
const HOME_META: Record<string, { title: string }> = {
  de: {
    title: "Culinse – Rezepte entdecken, die du lieben wirst",
  },
  en: {
    title: "Culinse – Discover Recipes You'll Love",
  },
  es: {
    title: "Culinse – Descubre recetas que te encantarán",
  },
  fr: {
    title: "Culinse – Découvre des recettes que tu vas adorer",
  },
  it: {
    title: "Culinse – Scopri ricette che amerai",
  },
  pl: {
    title: "Culinse – Odkrywaj przepisy, które pokochasz",
  },
  tr: {
    title: "Culinse – Seveceğin tarifleri keşfet",
  },
  nl: {
    title: "Culinse – Ontdek recepten waar je van houdt",
  },
  cs: {
    title: "Culinse – Objevuj recepty, které si zamiluješ",
  },
  ru: {
    title: "Culinse – Открой рецепты, которые полюбишь",
  },
  pt: {
    title: "Culinse – Descubra receitas que você vai amar",
  },
  zh: {
    title: "Culinse – 发现你会爱上的食谱",
  },
  ja: {
    title: "Culinse – きっと好きになるレシピと出会おう",
  },
  id: {
    title: "Culinse – Temukan resep yang akan kamu sukai",
  },
  vi: {
    title: "Culinse – Khám phá công thức bạn sẽ yêu thích",
  },
  bn: {
    title: "Culinse – আপনার ভালো লাগবে এমন রেসিপি খুঁজে নিন",
  },
};

// ─── Homepage metadata (canonical + hreflang + Open Graph) ───────────────────
// These used to live in [locale]/layout.tsx, where every child page without
// its own `alternates` inherited the HOMEPAGE canonical and got deindexed.
// They belong here, on the homepage only.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const url = `https://culinse.com/${locale}`;
  const { title } = HOME_META[locale] ?? HOME_META.en;
  const description = siteDescription(locale);

  return {
    alternates: {
      canonical: url,
      languages: {
        en: "https://culinse.com/en",
        de: "https://culinse.com/de",
        es: "https://culinse.com/es",
        fr: "https://culinse.com/fr",
        it: "https://culinse.com/it",
        pl: "https://culinse.com/pl",
        tr: "https://culinse.com/tr",
        nl: "https://culinse.com/nl",
        cs: "https://culinse.com/cs",
        ru: "https://culinse.com/ru",
        pt: "https://culinse.com/pt",
        zh: "https://culinse.com/zh",
        ja: "https://culinse.com/ja",
        id: "https://culinse.com/id",
        vi: "https://culinse.com/vi",
        bn: "https://culinse.com/bn",
        "x-default": "https://culinse.com/en",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Culinse",
      locale: OG_LOCALES[locale] ?? "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ─── Page (Server Component) ──────────────────────────────────────────────────
// Note: The HomeClient below is a "use client" component — Next.js App Router
// still server-renders it to HTML for the initial page load (SSR). The H1,
// headings and static text inside HomeClient ARE present in the raw HTML that
// Google crawls. This page.tsx adds the WebSite + Organization JSON-LD schema
// on top, which requires a Server Component to inject server-side.
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Pre-load translations server-side so next-intl can SSR HomeClient correctly
  await getTranslations({ locale, namespace: "hero" });

  const websiteSchema = buildWebsiteSchema(locale);

  // Server-gerenderter SEO-/Interlinking-Block (siehe fetchFeatured oben) +
  // erste Discover-Karten (E2) - parallel, beide Antworten aus dem Data Cache.
  const [featured, initialRecipes] = await Promise.all([
    fetchFeatured(locale),
    fetchInitialRecipes(locale),
  ]);

  // Rezept des Tages = erste Discover-Karte, fürs Hero-Foto (3:2, volle
  // Spaltenbreite) in höherer Auflösung als die 640er-Kartenvariante.
  const heroRecipe: Recipe | null = initialRecipes[0]
    ? { ...initialRecipes[0], image: heroImageUrl(initialRecipes[0].image) }
    : null;

  // Die Farbe des Gerichts (DESIGN.md §11): Bühne und Suchzeile tragen den Ton
  // des Tagesfotos, jede Karte einen Streifen in ihrer eigenen Farbe.
  const cardRecipes = heroRecipe ? initialRecipes.slice(1) : initialRecipes;
  const [heroColors, cardAccents] = await Promise.all([
    dishColorsWithin(heroRecipe?.image ?? null),
    Promise.all(cardRecipes.map((r) => dishColorsWithin(r.image, 1200))),
  ]);
  const cards: Recipe[] = cardRecipes.map((r, i) => ({ ...r, accent: cardAccents[i]?.accent ?? null }));

  // LCP-Boost: Das Hero-Foto ist das LCP-Element. Per Preload-Hint startet
  // der Download mit dem HTML-Parsen, statt mit dem JS-Bundle um die
  // Bandbreite zu konkurrieren.
  const isDE = locale === "de";

  // Themenseiten (Küchen, Gänge, Ernährung …) als echte Links auf der Startseite.
  // Vorher führte von hier nur ein Link zur Stöberseite; die Themen lagen zwei
  // Klicks tief und bekamen von der stärksten Seite keinen Verweis.
  const tBrowse = await getTranslations({ locale, namespace: "browse" });
  let topicLinks: { href: string; label: string }[] = [];
  try {
    // Die Trefferzahlen sind in jeder Sprache gleich; das deutsche Verzeichnis
    // nutzt auch die Sitemap.
    const { counts } = await runBrowse("de", emptyState());
    topicLinks = LANDINGS.filter((l) => l.group !== "region" && (counts[`${l.group}:${l.key}`] ?? 0) >= LANDING_MIN).map((l) => ({
      href: `/${locale}${landingPath(locale, l)}`,
      label: tBrowse(`landing.titles.${l.group}.${l.key}`),
    }));
  } catch {
    // Ohne Verzeichnis keine Themenlinks; die Startseite bleibt vollständig.
  }

  const seoSection = (
    <section className="mx-auto max-w-content border-t border-line px-4 py-10 sm:px-6 sm:py-12">
      <div>
        <h2 className="text-h2-sm sm:text-h2 mb-2">
          {isDE ? "Neu im Rezeptkatalog" : "New in the recipe catalog"}
        </h2>
        <p className="mb-6 max-w-prose text-base text-ink-2">
          {isDE
            ? "Frisch redaktionell geprüfte Rezepte – jedes mit Nährwerten, automatischer Einkaufsliste und Preisschätzung auf Discounter-Niveau."
            : "Freshly reviewed recipes — each with nutrition facts, an automatic shopping list and a discount-store price estimate."}
        </p>
        {featured.length > 0 && (
          <ul className="mb-8 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm text-ink-2 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/${locale}/recipe/${r.id}`}
                  className="text-base text-ink transition-colors hover:underline underline-offset-[3px]"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {topicLinks.length > 0 && (
          <>
            <h2 className="text-h3 mb-3">{tBrowse("landing.topics")}</h2>
            <ul className="mb-8 grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {topicLinks.map((topic) => (
                <li key={topic.href}>
                  <Link href={topic.href} className="text-base text-ink transition-colors hover:underline underline-offset-[3px]">
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-base font-semibold">
          <Link href={`/${locale}/grocery-list-calculator`} className="text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]">
            {isDE ? "Einkaufsrechner für Lebensmittel" : "Grocery cost calculator"}
          </Link>
          <Link href={`/${locale}/weekly-meal-planner`} className="text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]">
            {isDE ? "Wochenplaner mit Einkaufsliste" : "Weekly meal planner with shopping list"}
          </Link>
          <Link href={`/${locale}/blog/${isDE ? "meal-prep-fuer-anfaenger" : "meal-prep-for-beginners"}`} className="text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]">
            {isDE ? "Meal Prepping für Anfänger" : "Meal prep for beginners"}
          </Link>
          <Link href={`/${locale}/blog`} className="text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]">
            {isDE ? "Ratgeber: Planung, Budget & Meal Prep" : "Guides: planning, budget & meal prep"}
          </Link>
          <Link href={`/${locale}/collections/explore`} className="text-brand transition-colors hover:text-brand-hover hover:underline underline-offset-[3px]">
            {isDE ? "Rezept-Kollektionen" : "Recipe collections"}
          </Link>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {/* JSON-LD: WebSite schema + Sitelinks Searchbox */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      {/* Full interactive page — Next.js SSRs this to real HTML on first load */}
      <ErrorBoundary>
        <HomeClient seoSection={seoSection} initialRecipes={cards} featured={heroRecipe} heroColors={heroColors} />
      </ErrorBoundary>
    </>
  );
}
