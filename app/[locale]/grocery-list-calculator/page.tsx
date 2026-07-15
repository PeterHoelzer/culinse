import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import GroceryCalculator from "@/components/GroceryCalculator";
import { PRICES_UPDATED_AT } from "@/lib/ingredient-prices";

// Öffentliche SEO-Landingpage: Einkaufslisten-Kostenrechner.
//
// Warum es diese Seite gibt: GSC zeigt echte Nachfrage nach
// „einkaufsrechner lebensmittel" (und der Budget-Cluster bringt die ersten
// Klicks), aber es gab keine Seite, die diese Intention bedient. Diese Seite
// ist ein frei nutzbares Tool (rankt + wird verlinkt) und funnelt in den
// Wochenplaner, dessen Einkaufsliste dieselbe Preisschätzung automatisch macht.

const BASE = "https://culinse.com";
const SLUG = "grocery-list-calculator";

interface Props {
  params: Promise<{ locale: string }>;
}

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isDE = locale === "de";
  const url = `${BASE}/${locale}/${SLUG}`;

  const title = isDE
    ? "Einkaufsrechner für Lebensmittel: Was kostet dein Wocheneinkauf?"
    : "Grocery List Cost Calculator: What Will Your Shopping Cost?";
  const description = isDE
    ? "Kostenloser Einkaufsrechner: Zutaten und Mengen eingeben und sofort sehen, was der Einkauf ungefähr kostet – auf Discounter-Niveau geschätzt. Ohne Anmeldung."
    : "Free grocery cost calculator: enter ingredients and amounts and instantly see what your shopping will roughly cost — estimated at discount-store prices. No sign-up.";

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/en/${SLUG}`,
        de: `${BASE}/de/${SLUG}`,
        "x-default": `${BASE}/en/${SLUG}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Culinse",
      locale: isDE ? "de_DE" : "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

type Copy = {
  badge: string;
  h1: string;
  sub: string;
  howHeading: string;
  how: string;
  methodHeading: string;
  method: string;
  tipsHeading: string;
  tips: string[];
  plannerHeading: string;
  plannerText: string;
  plannerCta: string;
  guidesHeading: string;
  guides: { href: string; title: string; text: string }[];
  faqHeading: string;
  faq: { question: string; answer: string }[];
};

function getCopy(locale: string, priceDate: string): Copy {
  if (locale === "de") {
    return {
      badge: "Kostenloser Einkaufsrechner",
      h1: "Was kostet dein Wocheneinkauf? Der Lebensmittel-Rechner",
      sub: "Zutaten und Mengen eingeben – der Rechner schätzt sofort, was dein Einkauf kostet. Auf Discounter-Niveau, ohne Anmeldung.",
      howHeading: "So funktioniert der Einkaufsrechner",
      how: "Gib eine Zutat ein (z. B. Hähnchenbrust), wähle Menge und Einheit und füge sie deiner Liste hinzu. Der Rechner multipliziert die Menge mit einem aktuellen Durchschnittspreis auf Discounter-Niveau (Aldi/Lidl, Eigenmarken) und zeigt dir die geschätzten Kosten pro Position und die Gesamtsumme. So siehst du vor dem Einkauf, ob dein Plan ins Budget passt – und welche Zutaten die Kostentreiber sind.",
      methodHeading: "Woher kommen die Preise?",
      method: `Die Preisdatenbank umfasst über 150 gängige Zutaten und wird regelmäßig gegen aktuelle deutsche Supermarkt- und Discounterpreise geprüft (letzter Stand: ${priceDate}). Die Werte sind bewusst als Verbrauchskosten gerechnet: 300 g Mehl kosten anteilig ein paar Cent, auch wenn die Packung 1 kg hat. Das beantwortet die eigentliche Frage – „was kostet mich diese Woche Kochen?" – ehrlicher als Packungspreise. Tatsächliche Preise variieren je nach Region, Markt und Marke; rechne bei Markenprodukten oder Vollsortimentern (Rewe, Edeka) mit 20–40 % Aufschlag.`,
      tipsHeading: "5 schnelle Hebel für einen günstigeren Einkauf",
      tips: [
        "Plane die Woche im Voraus und kaufe einmal gezielt ein – Spontankäufe sind der größte Kostentreiber.",
        "Setze auf günstige Proteinquellen wie Linsen, Bohnen, Eier und Quark statt täglich Fleisch.",
        "Nutze Zutaten-Überlappung: Dieselbe Zutat in mehreren Gerichten senkt die Kosten pro Mahlzeit.",
        "Tiefkühlgemüse ist so nährstoffreich wie frisches, oft günstiger und verursacht keinen Abfall.",
        "Eigenmarken statt Markenprodukte: gleiche Qualität, häufig 30–50 % günstiger.",
      ],
      plannerHeading: "Automatisch statt von Hand: der Wochenplaner",
      plannerText:
        "Diesen Rechner brauchst du nur für schnelle Überschläge. Im Culinse-Wochenplaner passiert das Ganze automatisch: Du wählst Rezepte für die Woche, Culinse erstellt die Einkaufsliste mit zusammengerechneten Mengen – inklusive Preisschätzung für die ganze Woche. Kostenlos.",
      plannerCta: "Woche kostenlos planen →",
      guidesHeading: "Passende Guides",
      guides: [
        {
          href: "/de/blog/guenstig-einkaufen-mit-wochenplan",
          title: "Günstig einkaufen mit Wochenplan",
          text: "Wie ein Plan deine Lebensmittelkosten strukturell senkt.",
        },
        {
          href: "/de/blog/guenstige-mahlzeiten-unter-5-euro",
          title: "Günstige Mahlzeiten unter 5 Euro",
          text: "Konkrete Gerichte, die wenig kosten und satt machen.",
        },
        {
          href: "/de/blog/rezepte-fuer-studenten",
          title: "Rezepte für Studenten",
          text: "Günstig, schnell und mit 30-Euro-Wocheneinkauf.",
        },
      ],
      faqHeading: "Häufige Fragen",
      faq: [
        {
          question: "Wie genau ist die Preisschätzung?",
          answer:
            "Die Preise entsprechen dem Discounter-Niveau (Eigenmarken) und werden regelmäßig geprüft. Als Orientierung für die Wochenplanung sind sie realistisch; je nach Region, Markt und Marke können tatsächliche Preise um 10–40 % abweichen.",
        },
        {
          question: "Warum rechnet der Rechner mit Verbrauchsmengen statt Packungen?",
          answer:
            "Weil das die eigentliche Frage beantwortet: Was kostet mich das Kochen dieser Woche? 300 g Mehl aus einer 1-kg-Packung kosten anteilig rund 25 Cent – der Rest der Packung bleibt ja für die nächsten Wochen. Wer den ersten Großeinkauf plant, sollte für Vorratsartikel einmalig mehr einrechnen.",
        },
        {
          question: "Was kostet ein durchschnittlicher Wocheneinkauf für eine Person?",
          answer:
            "Wer plant und selbst kocht, kommt in Deutschland realistisch mit 30–50 € pro Woche aus – mit Budget-Rezepten auch darunter. Ohne Plan, mit Spontankäufen und Lieferdiensten, liegt der Betrag schnell beim Doppelten.",
        },
        {
          question: "Ist der Einkaufsrechner kostenlos?",
          answer:
            "Ja, komplett – ohne Anmeldung und ohne Limit. Wenn du die Rechnung nicht von Hand machen willst: Der Culinse-Wochenplaner erstellt die Einkaufsliste samt Preisschätzung automatisch aus deinen Rezepten, ebenfalls kostenlos.",
        },
      ],
    };
  }

  return {
    badge: "Free grocery cost calculator",
    h1: "What Will Your Weekly Shop Cost? The Grocery Calculator",
    sub: "Enter ingredients and amounts — the calculator instantly estimates what your shopping will cost. Discount-store prices, no sign-up.",
    howHeading: "How the grocery calculator works",
    how: "Type an ingredient (e.g. chicken breast), pick the amount and unit, and add it to your list. The calculator multiplies the amount by a current average discount-store price (own brands) and shows the estimated cost per item plus the total. You'll see before you shop whether your plan fits your budget — and which ingredients drive the cost.",
    methodHeading: "Where do the prices come from?",
    method: `The price database covers 150+ common ingredients and is checked regularly against current German supermarket and discounter prices (last updated: ${priceDate}). Values are calculated as consumption costs: 300 g of flour costs a few cents proportionally, even if the bag holds 1 kg. That answers the real question — "what does cooking this week cost me?" — more honestly than package prices. Actual prices vary by region, store, and brand; expect a 20–40% premium for brand products or full-range supermarkets.`,
    tipsHeading: "5 quick levers for a cheaper shop",
    tips: [
      "Plan the week ahead and shop once with a list — impulse buys are the biggest cost driver.",
      "Lean on cheap proteins like lentils, beans, eggs, and quark instead of daily meat.",
      "Use ingredient overlap: the same ingredient across several dishes lowers cost per meal.",
      "Frozen vegetables are as nutritious as fresh, often cheaper, and produce zero waste.",
      "Own brands over brand names: same quality, often 30–50% cheaper.",
    ],
    plannerHeading: "Automatic instead of by hand: the weekly planner",
    plannerText:
      "This calculator is for quick estimates. In the Culinse weekly planner it all happens automatically: you pick recipes for the week, Culinse builds the shopping list with combined amounts — including a price estimate for the whole week. Free.",
    plannerCta: "Plan your week free →",
    guidesHeading: "Related guides",
    guides: [
      {
        href: "/en/blog/meal-planning-on-a-budget",
        title: "Meal planning on a budget",
        text: "How a plan structurally lowers your food costs.",
      },
      {
        href: "/en/blog/cheap-healthy-meals",
        title: "Cheap healthy meals under $3 a serving",
        text: "Budget staples that stretch and 25 low-cost recipes.",
      },
      {
        href: "/en/blog/budget-meals-under-5-euros",
        title: "Budget meals under 5 euros",
        text: "Filling dishes that cost very little.",
      },
    ],
    faqHeading: "Frequently asked questions",
    faq: [
      {
        question: "How accurate is the price estimate?",
        answer:
          "Prices reflect discount-store level (own brands) and are checked regularly. As guidance for weekly planning they're realistic; actual prices can differ by 10–40% depending on region, store, and brand.",
      },
      {
        question: "Why does the calculator use consumption amounts instead of packages?",
        answer:
          "Because that answers the real question: what does cooking this week cost? 300 g of flour from a 1 kg bag costs about 25 cents proportionally — the rest of the bag is still there for the following weeks. If you're planning a first big stock-up shop, budget extra for pantry staples once.",
      },
      {
        question: "What does an average weekly grocery shop cost for one person?",
        answer:
          "If you plan and cook yourself, €30–50 per week is realistic in Germany — with budget recipes even less. Without a plan, with impulse buys and delivery, the amount quickly doubles.",
      },
      {
        question: "Is the grocery calculator free?",
        answer:
          "Yes, completely — no sign-up, no limit. And if you don't want to do the math by hand: the Culinse weekly planner builds the shopping list with a price estimate automatically from your recipes, also free.",
      },
    ],
  };
}

export default async function GroceryCalculatorPage({ params }: Props) {
  const { locale } = await params;
  const isDE = locale === "de";
  const priceDate = new Date(PRICES_UPDATED_AT).toLocaleDateString(
    isDE ? "de-DE" : "en-US",
    { month: "long", year: "numeric" }
  );
  const c = getCopy(locale, priceDate);
  const url = `${BASE}/${locale}/${SLUG}`;
  const plannerHref = `/${locale}/weekly-meal-planner`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: isDE ? "Culinse Einkaufsrechner" : "Culinse Grocery Cost Calculator",
    url,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: isDE
      ? "Kostenloser Rechner, der die Kosten einer Einkaufsliste auf Basis aktueller Discounter-Preise schätzt."
      : "Free calculator that estimates the cost of a grocery list based on current discount-store prices.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: {
      "@type": "Organization",
      name: "Culinse",
      url: BASE,
      logo: { "@type": "ImageObject", url: `${BASE}/culinse-logo.png` },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: c.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const ld = (obj: object) =>
    JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(faqSchema) }} />

      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pt-14 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-200 mb-4 block">
            {c.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">{c.h1}</h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-xl">{c.sub}</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-10 pb-24">
        {/* Rechner */}
        <div className="mb-5">
          <GroceryCalculator locale={locale} />
        </div>

        {/* So funktioniert's */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.howHeading}</h2>
          <p className="text-gray-700 leading-relaxed">{c.how}</p>
        </div>

        {/* Methodik */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.methodHeading}</h2>
          <p className="text-gray-700 leading-relaxed">{c.method}</p>
        </div>

        {/* Spar-Tipps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">{c.tipsHeading}</h2>
          <ul className="space-y-2.5">
            {c.tips.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-gray-700">
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Planer-Funnel */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 mb-5 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{c.plannerHeading}</h2>
          <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto leading-relaxed">{c.plannerText}</p>
          <Link
            href={plannerHref}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {c.plannerCta}
          </Link>
        </div>

        {/* Guides */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{c.guidesHeading}</h2>
          <div className="space-y-3">
            {c.guides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="block bg-gray-50 rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
              >
                <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                  {g.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{g.text}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ (sichtbar — deckt sich mit FAQPage JSON-LD) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">{c.faqHeading}</h2>
          <div className="space-y-5">
            {c.faq.map((f) => (
              <div key={f.question}>
                <h3 className="font-semibold text-gray-900 mb-1">{f.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
