import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { preconnect } from "react-dom";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { siteDescription } from "@/lib/siteMeta";

// Schriftpaar laut DESIGN.md §11: Source Sans 3 (Text/UI) und Fraunces
// (Überschriften; weiche Serife nach alten Handwerker-Schildern, mit optischer Größe). Beide variabel, selbst gehostet über
// next/font. Bengali/CJK fallen auf Systemschriften zurück (siehe globals.css).
//
// `subsets` bestimmt nur, welche Dateien vorgeladen werden; alle Teilmengen
// (latin-ext, kyrillisch, vietnamesisch) bleiben per unicode-range im CSS und
// laden bei Bedarf. Vorgeladen wird allein Latin: vorher zogen sieben Dateien
// (378 KB) mit hoher Priorität am Hero-Foto vorbei, auf /de waren fünf davon
// (228 KB) ungenutzt.
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
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

// Default-Title/Keywords je Sprache (14.09.2026). Die Beschreibung steht seit
// 10.11.2026 in lib/siteMeta.ts. Der fruehere Ranking-Schutz fuer de/en (Text
// byte-identisch lassen) ist entfallen: die Startseiten waren nicht im Index,
// und die alte Aussage "Millionen Rezepte" stimmte nicht mehr.
const LOCALE_META: Record<string, { title: string; keywords: string[] }> = {
  de: {
    title: "Culinse – Rezepte entdecken, die du lieben wirst",
    keywords: [
      "Rezepte", "Rezepte entdecken", "personalisierte Rezepte", "Kochen", "Essen",
      "Rezeptsuche", "gesunde Rezepte", "schnelle Rezepte", "Wochenplan", "Einkaufsliste",
    ],
  },
  en: {
    title: "Culinse – Discover Recipes You'll Love",
    keywords: [
      "recipes", "recipe discovery", "personalized recipes", "cooking", "food",
      "recipe search", "healthy recipes", "easy recipes", "meal planner", "shopping list",
    ],
  },
  es: {
    title: "Culinse – Descubre recetas que te encantarán",
    keywords: [
      "recetas", "descubrir recetas", "recetas personalizadas", "cocina", "comida",
      "buscador de recetas", "recetas saludables", "recetas fáciles", "planificador semanal", "lista de la compra",
    ],
  },
  fr: {
    title: "Culinse – Découvre des recettes que tu vas adorer",
    keywords: [
      "recettes", "découverte de recettes", "recettes personnalisées", "cuisine", "repas",
      "recherche de recettes", "recettes saines", "recettes faciles", "planning de repas", "liste de courses",
    ],
  },
  it: {
    title: "Culinse – Scopri ricette che amerai",
    keywords: [
      "ricette", "scoprire ricette", "ricette personalizzate", "cucina", "cibo",
      "ricerca ricette", "ricette sane", "ricette facili", "planner settimanale", "lista della spesa",
    ],
  },
  pl: {
    title: "Culinse – Odkrywaj przepisy, które pokochasz",
    keywords: [
      "przepisy", "odkrywanie przepisów", "spersonalizowane przepisy", "gotowanie", "jedzenie",
      "wyszukiwarka przepisów", "zdrowe przepisy", "szybkie przepisy", "planer tygodnia", "lista zakupów",
    ],
  },
  tr: {
    title: "Culinse – Seveceğin tarifleri keşfet",
    keywords: [
      "tarifler", "tarif keşfi", "kişiselleştirilmiş tarifler", "yemek pişirme", "yemek",
      "tarif arama", "sağlıklı tarifler", "kolay tarifler", "haftalık plan", "alışveriş listesi",
    ],
  },
  nl: {
    title: "Culinse – Ontdek recepten waar je van houdt",
    keywords: [
      "recepten", "recepten ontdekken", "gepersonaliseerde recepten", "koken", "eten",
      "recepten zoeken", "gezonde recepten", "snelle recepten", "weekplanner", "boodschappenlijst",
    ],
  },
  cs: {
    title: "Culinse – Objevuj recepty, které si zamiluješ",
    keywords: [
      "recepty", "objevování receptů", "recepty na míru", "vaření", "jídlo",
      "hledání receptů", "zdravé recepty", "rychlé recepty", "týdenní plán", "nákupní seznam",
    ],
  },
  ru: {
    title: "Culinse – Открой рецепты, которые полюбишь",
    keywords: [
      "рецепты", "поиск рецептов", "персональные рецепты", "готовка", "еда",
      "здоровые рецепты", "быстрые рецепты", "план на неделю", "список покупок", "аэрогриль",
    ],
  },
  pt: {
    title: "Culinse – Descubra receitas que você vai amar",
    keywords: [
      "receitas", "descoberta de receitas", "receitas personalizadas", "cozinhar", "comida",
      "busca de receitas", "receitas saudáveis", "receitas rápidas", "plano semanal", "lista de compras", "airfryer",
    ],
  },
  zh: {
    title: "Culinse – 发现你会爱上的食谱",
    keywords: [
      "食谱", "菜谱", "个性化食谱", "做饭", "美食",
      "食谱搜索", "健康食谱", "快手菜", "每周计划", "购物清单", "空气炸锅",
    ],
  },
  ja: {
    title: "Culinse – きっと好きになるレシピと出会おう",
    keywords: [
      "レシピ", "料理", "レシピ検索", "献立", "時短レシピ",
      "ヘルシーレシピ", "週間プラン", "買い物リスト", "エアフライヤー", "ドイツ料理",
    ],
  },
  id: {
    title: "Culinse – Temukan resep yang akan kamu sukai",
    keywords: [
      "resep", "resep masakan", "resep personal", "memasak", "makanan",
      "cari resep", "resep sehat", "resep cepat", "rencana menu mingguan", "daftar belanja", "air fryer",
    ],
  },
  vi: {
    title: "Culinse – Khám phá công thức bạn sẽ yêu thích",
    keywords: [
      "công thức nấu ăn", "nấu ăn", "món ăn", "tìm công thức", "công thức lành mạnh",
      "món ăn nhanh", "thực đơn tuần", "danh sách mua sắm", "nồi chiên không dầu", "ẩm thực Đức",
    ],
  },
  bn: {
    title: "Culinse – আপনার ভালো লাগবে এমন রেসিপি খুঁজে নিন",
    keywords: [
      "রেসিপি", "রান্নার রেসিপি", "রান্না", "খাবার", "রেসিপি খোঁজা", "স্বাস্থ্যকর রেসিপি",
      "ঝটপট রান্না", "সাপ্তাহিক খাবারের প্ল্যান", "কেনাকাটার তালিকা", "এয়ার ফ্রায়ার", "জার্মান রান্না",
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
    description: siteDescription(locale),
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
  preconnect("https://ztfhnzslyztxfmvkyrrn.supabase.co");

  // Load messages directly from JSON — do NOT use getMessages() which relies on
  // middleware request context and may fall back to the default locale ("en").
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <head />
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
