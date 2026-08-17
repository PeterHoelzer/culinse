import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HomeClient from "./HomeClient";
import ErrorBoundary from "@/components/ErrorBoundary";
import Link from "next/link";
import type { Recipe } from "./components/home-types";
import { preload } from "react-dom";

// Prevent Vercel from serving a cached HTML snapshot that shows the
// loading skeleton permanently (the recipe grid is loaded client-side).
export const dynamic = "force-dynamic";

// ─── WebSite + Organization JSON-LD ──────────────────────────────────────────
function buildWebsiteSchema(locale: string) {
  const isDE = locale === "de";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://culinse.com/#website",
        url: "https://culinse.com",
        name: "Culinse",
        description: isDE
          ? "Rezepte entdecken, Woche planen, Einkaufsliste erstellen — kostenlos."
          : "Discover recipes, plan your week, build your shopping list — free.",
        inLanguage: isDE ? "de-DE" : "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `https://culinse.com/${locale}?q={search_term_string}`,
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
          url: "https://culinse.com/icon",
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
      `${BASE_URL}/api/featured-recipes?lang=${locale === "de" ? "de" : "en"}&number=12`,
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
      `${BASE_URL}/api/recipes?lang=${locale === "de" ? "de" : "en"}&number=6`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch {
    return [];
  }
}

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
  const isDE = locale === "de";
  const url = `https://culinse.com/${locale}`;
  const title = isDE
    ? "Culinse – Rezepte entdecken, die du lieben wirst"
    : "Culinse – Discover Recipes You'll Love";
  const description = isDE
    ? "Millionen Rezepte von den besten Food-Seiten der Welt. Personalisiert für dich."
    : "Millions of recipes from the world's best food sites. Personalized for you.";

  return {
    alternates: {
      canonical: url,
      languages: {
        en: "https://culinse.com/en",
        de: "https://culinse.com/de",
        "x-default": "https://culinse.com/en",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Culinse",
      locale: isDE ? "de_DE" : "en_US",
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

  // Pre-load translations server-side so next-intl can SSR HomeClient correctly
  await getTranslations({ locale, namespace: "hero" });

  const websiteSchema = buildWebsiteSchema(locale);

  // Server-gerenderter SEO-/Interlinking-Block (siehe fetchFeatured oben) +
  // erste Discover-Karten (E2) - parallel, beide Antworten aus dem Data Cache.
  const [featured, initialRecipes] = await Promise.all([
    fetchFeatured(locale),
    fetchInitialRecipes(locale),
  ]);

  // LCP-Boost (E2): Das erste Kartenbild ist auf Mobil das LCP-Element.
  // Per Preload-Hint startet der Download mit dem HTML-Parsen, statt mit
  // dem JS-Bundle um die Bandbreite zu konkurrieren.
  if (initialRecipes[0]?.image) {
    preload(initialRecipes[0].image, { as: "image", fetchPriority: "high" });
  }
  const isDE = locale === "de";
  const seoSection = (
    <section className="bg-white border-t border-gray-100 py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isDE ? "Neu im Rezeptkatalog" : "New in the recipe catalog"}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-2xl">
          {isDE
            ? "Frisch redaktionell geprüfte Rezepte – jedes mit Nährwerten, automatischer Einkaufsliste und Preisschätzung auf Discounter-Niveau."
            : "Freshly reviewed recipes — each with nutrition facts, an automatic shopping list and a discount-store price estimate."}
        </p>
        {featured.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2.5 mb-8">
            {featured.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/${locale}/recipe/${r.id}`}
                  className="text-sm text-gray-700 hover:text-orange-600 transition-colors"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href={`/${locale}/grocery-list-calculator`} className="text-orange-600 hover:text-orange-700">
            {isDE ? "Einkaufsrechner für Lebensmittel" : "Grocery cost calculator"}
          </Link>
          <Link href={`/${locale}/weekly-meal-planner`} className="text-orange-600 hover:text-orange-700">
            {isDE ? "Wochenplaner mit Einkaufsliste" : "Weekly meal planner with shopping list"}
          </Link>
          <Link href={`/${locale}/blog/${isDE ? "meal-prep-fuer-anfaenger" : "meal-prep-for-beginners"}`} className="text-orange-600 hover:text-orange-700">
            {isDE ? "Meal Prepping für Anfänger" : "Meal prep for beginners"}
          </Link>
          <Link href={`/${locale}/blog`} className="text-orange-600 hover:text-orange-700">
            {isDE ? "Ratgeber: Planung, Budget & Meal Prep" : "Guides: planning, budget & meal prep"}
          </Link>
          <Link href={`/${locale}/collections/explore`} className="text-orange-600 hover:text-orange-700">
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
        <HomeClient seoSection={seoSection} initialRecipes={initialRecipes} />
      </ErrorBoundary>
    </>
  );
}
