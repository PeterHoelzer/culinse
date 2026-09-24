import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { preconnect } from "react-dom";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sharedMeta = {
  authors: [{ name: "Culinse" }],
  creator: "Culinse",
  metadataBase: new URL("https://culinse.com"),
  // Pinterest-Website-Verifizierung (Settings → Link zu Pinterest, 19.07.2026)
  other: { "p:domain_verify": "72c938fb4034ca5bad89019932a07840" },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    shortcut: "/icon",
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1 as const,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
};

// Default-Title/Description/Keywords je Sprache (14.09.2026). de/en sind
// BYTE-IDENTISCH zu vorher (Ranking-Schutz), die fuenf neuen lokalisiert.
const LOCALE_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  de: {
    title: "Culinse – Rezepte entdecken, die du lieben wirst",
    description:
      "Culinse bündelt Millionen Rezepte von den besten Food-Seiten — gefiltert nach Ernährung und Allergenen, kostenlos nutzbar und ohne Abo-Zwang.",
    keywords: [
      "Rezepte", "Rezepte entdecken", "personalisierte Rezepte", "Kochen", "Essen",
      "Rezeptsuche", "gesunde Rezepte", "schnelle Rezepte", "Wochenplan", "Einkaufsliste",
    ],
  },
  en: {
    title: "Culinse – Discover Recipes You'll Love",
    description:
      "Culinse aggregates millions of recipes from the web's best food sites — filtered to your diet and allergies. Free to use, no subscription required.",
    keywords: [
      "recipes", "recipe discovery", "personalized recipes", "cooking", "food",
      "recipe search", "healthy recipes", "easy recipes", "meal planner", "shopping list",
    ],
  },
  es: {
    title: "Culinse – Descubre recetas que te encantarán",
    description:
      "Culinse reúne recetas de las mejores fuentes — filtradas según tu dieta y tus alergias. Gratis y sin suscripción.",
    keywords: [
      "recetas", "descubrir recetas", "recetas personalizadas", "cocina", "comida",
      "buscador de recetas", "recetas saludables", "recetas fáciles", "planificador semanal", "lista de la compra",
    ],
  },
  fr: {
    title: "Culinse – Découvre des recettes que tu vas adorer",
    description:
      "Culinse rassemble les recettes des meilleures sources — filtrées selon ton alimentation et tes allergies. Gratuit, sans abonnement.",
    keywords: [
      "recettes", "découverte de recettes", "recettes personnalisées", "cuisine", "repas",
      "recherche de recettes", "recettes saines", "recettes faciles", "planning de repas", "liste de courses",
    ],
  },
  it: {
    title: "Culinse – Scopri ricette che amerai",
    description:
      "Culinse raccoglie le ricette dalle fonti migliori — filtrate in base alla tua alimentazione e alle tue allergie. Gratis, senza abbonamento.",
    keywords: [
      "ricette", "scoprire ricette", "ricette personalizzate", "cucina", "cibo",
      "ricerca ricette", "ricette sane", "ricette facili", "planner settimanale", "lista della spesa",
    ],
  },
  pl: {
    title: "Culinse – Odkrywaj przepisy, które pokochasz",
    description:
      "Culinse łączy przepisy z najlepszych źródeł — filtrowane według Twojej diety i alergii. Za darmo, bez abonamentu.",
    keywords: [
      "przepisy", "odkrywanie przepisów", "spersonalizowane przepisy", "gotowanie", "jedzenie",
      "wyszukiwarka przepisów", "zdrowe przepisy", "szybkie przepisy", "planer tygodnia", "lista zakupów",
    ],
  },
  tr: {
    title: "Culinse – Seveceğin tarifleri keşfet",
    description:
      "Culinse, en iyi kaynaklardaki tarifleri bir araya getirir — beslenmene ve alerjilerine göre filtrelenmiş. Ücretsiz, aboneliksiz.",
    keywords: [
      "tarifler", "tarif keşfi", "kişiselleştirilmiş tarifler", "yemek pişirme", "yemek",
      "tarif arama", "sağlıklı tarifler", "kolay tarifler", "haftalık plan", "alışveriş listesi",
    ],
  },
  nl: {
    title: "Culinse – Ontdek recepten waar je van houdt",
    description:
      "Culinse bundelt recepten uit de beste bronnen — gefilterd op jouw dieet en allergieën. Gratis, zonder abonnement.",
    keywords: [
      "recepten", "recepten ontdekken", "gepersonaliseerde recepten", "koken", "eten",
      "recepten zoeken", "gezonde recepten", "snelle recepten", "weekplanner", "boodschappenlijst",
    ],
  },
  cs: {
    title: "Culinse – Objevuj recepty, které si zamiluješ",
    description:
      "Culinse spojuje recepty z nejlepších zdrojů — filtrované podle tvé stravy a alergií. Zdarma, bez předplatného.",
    keywords: [
      "recepty", "objevování receptů", "recepty na míru", "vaření", "jídlo",
      "hledání receptů", "zdravé recepty", "rychlé recepty", "týdenní plán", "nákupní seznam",
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  // NOTE: No `alternates` here! Canonical + hreflang MUST be set per page
  // (see each page's generateMetadata). A layout-level canonical is inherited
  // by every child page that doesn't define its own — which told Google that
  // /about, /blog, /pro etc. were duplicates of the homepage and got them
  // deindexed ("Alternative Seite mit richtigem kanonischen Tag" in GSC).
  const meta = LOCALE_META[locale] ?? LOCALE_META.en;
  return {
    ...sharedMeta,
    title: {
      default: meta.title,
      template: "%s | Culinse",
    },
    description: meta.description,
    keywords: meta.keywords,
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // Pin the request locale for server components in this subtree. Without this,
  // next-intl's requestLocale can fall back to "en" (e.g. during static
  // rendering), which made locale-aware <Link>s on /de pages point to /en/…
  setRequestLocale(locale);

  // Bild-CDNs frueh verbinden -- verkuerzt den LCP-Pfad (CWV-Runde C13).
  preconnect("https://img.spoonacular.com");
  preconnect("https://ztfhnzslyztxfmvkyrrn.supabase.co");

  // Load messages directly from JSON — do NOT use getMessages() which relies on
  // middleware request context and may fall back to the default locale ("en").
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <head />
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
