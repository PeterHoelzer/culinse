import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

// Public, server-rendered SEO landing page for the meal-planner feature.
//
// Why this exists: Search Console shows the site's #1 demand cluster is
// "weekly meal planner + shopping/grocery list" (hundreds of impressions), but
// the actual planner tool (/meal-planner) is login-gated AND robots-blocked, so
// it can never rank for the very queries it answers. This page is the crawlable,
// content-rich hub for that intent: it ranks, then funnels users into the gated
// app and into the supporting blog articles.

const BASE = "https://culinse.com";
const SLUG = "weekly-meal-planner";

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
    ? "Wochenplaner mit automatischer Einkaufsliste – kostenlos"
    : "Weekly Meal Planner with Free Shopping List Generator";
  const description = isDE
    ? "Plane deine Woche und erhalte automatisch eine fertige Einkaufsliste aus deinen Rezepten – Mengen zusammengefasst, nach Supermarkt-Bereich sortiert. Kostenlos nutzbar, ohne Abo-Zwang."
    : "Plan your week and get a ready-made shopping list generated automatically from your recipes — amounts combined, sorted by store aisle. Free to use, no subscription required.";

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
  ctaPrimary: string;
  ctaSecondary: string;
  introHeading: string;
  intro: string;
  stepsHeading: string;
  steps: { title: string; text: string }[];
  benefitsHeading: string;
  benefits: string[];
  featuresHeading: string;
  features: { title: string; text: string }[];
  guidesHeading: string;
  guides: { href: string; title: string; text: string }[];
  faqHeading: string;
  faq: { question: string; answer: string }[];
  finalHeading: string;
  finalText: string;
  finalCta: string;
};

function getCopy(locale: string): Copy {
  if (locale === "de") {
    return {
      badge: "Wochenplaner + Einkaufsliste",
      h1: "Wochenplaner mit automatischer Einkaufsliste",
      sub: "Plane deine Woche in Minuten und lass Culinse die Einkaufsliste aus deinen Rezepten erstellen – Mengen zusammengefasst, nach Supermarkt-Bereich sortiert. Kostenlos nutzbar, ohne Abo-Zwang.",
      ctaPrimary: "Woche kostenlos planen →",
      ctaSecondary: "Erst Rezepte entdecken",
      introHeading: "Schluss mit Listen von Hand",
      intro:
        "Der mühsamste Teil der Wochenplanung ist nicht das Kochen – es ist das Zusammenschreiben der Einkaufsliste. Fünf Rezepte durchgehen, Zutaten notieren, Mengen addieren, prüfen, was noch da ist, und trotzdem etwas vergessen. Ein Meal Planner mit automatischer Einkaufsliste nimmt dir genau diesen Schritt ab: Du wählst deine Rezepte für die Woche, der Rest passiert von selbst.",
      stepsHeading: "So funktioniert's",
      steps: [
        {
          title: "1. Rezepte für die Woche wählen",
          text: "Stöbere durch Millionen Rezepte – gefiltert nach Ernährung, Allergenen und Zeit – und lege deine Gerichte für die Woche in den Wochenplan.",
        },
        {
          title: "2. Einkaufsliste wird automatisch erstellt",
          text: "Culinse zieht alle Zutaten aus deinen geplanten Rezepten, fasst gleiche Posten mit den richtigen Gesamtmengen zusammen und sortiert sie nach Supermarkt-Bereich.",
        },
        {
          title: "3. Einkaufen und kochen",
          text: "Du hakst beim Einkauf ab, was im Wagen liegt, und kochst die Woche entspannt durch – ohne tägliches „Was koche ich heute?“ und ohne vergessene Zutaten.",
        },
      ],
      benefitsHeading: "Warum ein Planer mit Einkaufsliste",
      benefits: [
        "Spart jede Woche die 20 Minuten, die das Listen-Schreiben sonst kostet.",
        "Keine doppelt gekauften oder vergessenen Zutaten mehr.",
        "Mengen werden über alle Rezepte korrekt zusammengerechnet.",
        "Nach Bereich sortiert – kein Zickzack mehr durch den Supermarkt.",
        "Weniger Lebensmittelverschwendung, weil du nur kaufst, was der Plan braucht.",
      ],
      featuresHeading: "Was du mit Culinse machen kannst",
      features: [
        { title: "Millionen Rezepte", text: "Aggregiert von den besten Food-Seiten – an einem Ort durchsuchbar." },
        { title: "Filter nach Ernährung", text: "Vegetarisch, vegan, glutenfrei, proteinreich, allergenfrei und mehr." },
        { title: "Automatische Einkaufsliste", text: "Aus deinem Wochenplan generiert, zusammengefasst und sortiert." },
        { title: "Collections speichern", text: "Lieblingsrezepte sammeln und für die nächste Woche wiederverwenden." },
      ],
      guidesHeading: "Tiefer einsteigen",
      guides: [
        {
          href: "/de/blog/wochenmenuplan-mit-einkaufsliste",
          title: "Wochenmenüplan mit automatischer Einkaufsliste erstellen",
          text: "Schritt-für-Schritt-Anleitung für den kompletten Ablauf.",
        },
        {
          href: "/de/blog/einkaufsliste-fuer-die-woche-erstellen",
          title: "Einkaufsliste für die Woche erstellen",
          text: "So vergisst du beim Einkaufen nie wieder etwas.",
        },
      ],
      faqHeading: "Häufige Fragen",
      faq: [
        {
          question: "Ist der Wochenplaner mit Einkaufsliste kostenlos?",
          answer:
            "Ja. Rezepte entdecken, die Woche planen und die automatische Einkaufsliste erstellen sind bei Culinse kostenlos und ohne Abo nutzbar.",
        },
        {
          question: "Wie wird die Einkaufsliste erstellt?",
          answer:
            "Culinse nimmt alle Zutaten aus den Rezepten in deinem Wochenplan, fasst identische Zutaten mit den richtigen Gesamtmengen zusammen und sortiert die Liste nach Supermarkt-Bereich – fertig zum Abhaken.",
        },
        {
          question: "Kann ich nach Ernährungsform oder Allergenen filtern?",
          answer:
            "Ja. Du kannst Rezepte nach vegetarisch, vegan, glutenfrei, proteinreich und weiteren Kriterien filtern und Allergene ausschließen, bevor du sie in den Plan legst.",
        },
        {
          question: "Für wie viele Personen funktioniert die Planung?",
          answer:
            "Die Planung skaliert mit deiner Haushaltsgröße: Skaliere die Rezepte auf die gewünschte Portionszahl, und die Einkaufsliste passt die Mengen automatisch an.",
        },
      ],
      finalHeading: "Plane deine erste Woche",
      finalText:
        "Rezepte entdecken, Wochenplan füllen und automatische Einkaufsliste erhalten – in wenigen Minuten, kostenlos.",
      finalCta: "Jetzt kostenlos starten →",
    };
  }

  return {
    badge: "Meal planner + shopping list",
    h1: "Weekly Meal Planner with an Automatic Shopping List",
    sub: "Plan your week in minutes and let Culinse build the shopping list from your recipes — amounts combined, sorted by store aisle. Free to use, no subscription required.",
    ctaPrimary: "Plan your week free →",
    ctaSecondary: "Browse recipes first",
    introHeading: "Stop writing shopping lists by hand",
    intro:
      "The most tedious part of meal planning isn't the cooking — it's compiling the shopping list. Going through five recipes, writing down ingredients, adding up amounts, checking what you already have, and still forgetting something. A meal planner with an automatic shopping list removes that step entirely: you pick your recipes for the week, and the rest happens on its own.",
    stepsHeading: "How it works",
    steps: [
      {
        title: "1. Pick your recipes for the week",
        text: "Browse millions of recipes — filtered by diet, allergens, and time — and drop the dishes you want into your weekly plan.",
      },
      {
        title: "2. Your shopping list builds itself",
        text: "Culinse pulls every ingredient from your planned recipes, combines duplicates with the correct total amounts, and sorts everything by store aisle.",
      },
      {
        title: "3. Shop and cook",
        text: "Check items off as you shop and cook through the week without the daily 'what do I make tonight?' — and without forgetting ingredients.",
      },
    ],
    benefitsHeading: "Why a planner with a shopping list",
    benefits: [
      "Saves the 20 minutes that writing the list costs you every week.",
      "No more duplicate buys or forgotten ingredients.",
      "Amounts are combined correctly across every recipe.",
      "Sorted by aisle — no more zigzagging through the store.",
      "Less food waste, because you only buy what the plan needs.",
    ],
    featuresHeading: "What you can do with Culinse",
    features: [
      { title: "Millions of recipes", text: "Aggregated from the best food sites — searchable in one place." },
      { title: "Filter by diet", text: "Vegetarian, vegan, gluten-free, high-protein, allergen-free, and more." },
      { title: "Automatic shopping list", text: "Generated from your weekly plan, combined and sorted for you." },
      { title: "Save collections", text: "Collect favorite recipes and reuse them for next week's plan." },
    ],
    guidesHeading: "Go deeper",
    guides: [
      {
        href: "/en/blog/weekly-meal-plan-with-shopping-list",
        title: "How to create a weekly meal plan with an automatic shopping list",
        text: "A step-by-step walkthrough of the whole workflow.",
      },
      {
        href: "/en/blog/weekly-grocery-list-from-meal-plan",
        title: "How to make a weekly grocery list from your meal plan",
        text: "Turn any plan into one smart list you'll actually use.",
      },
    ],
    faqHeading: "Frequently asked questions",
    faq: [
      {
        question: "Is the weekly meal planner with shopping list free?",
        answer:
          "Yes. Discovering recipes, planning your week, and generating the automatic shopping list are all free on Culinse, with no subscription required.",
      },
      {
        question: "How is the shopping list generated?",
        answer:
          "Culinse takes every ingredient from the recipes in your weekly plan, combines identical items with the correct total amounts, and sorts the list by store aisle — ready to check off as you shop.",
      },
      {
        question: "Can I filter by diet or allergens?",
        answer:
          "Yes. You can filter recipes by vegetarian, vegan, gluten-free, high-protein, and other criteria, and exclude allergens before adding dishes to your plan.",
      },
      {
        question: "How many people does the planner work for?",
        answer:
          "Planning scales with your household: scale each recipe to the number of servings you need, and the shopping list adjusts the amounts automatically.",
      },
    ],
    finalHeading: "Plan your first week",
    finalText:
      "Discover recipes, fill your weekly plan, and get an automatic shopping list — in minutes, free.",
    finalCta: "Get started free →",
  };
}

export default async function WeeklyMealPlannerPage({ params }: Props) {
  const { locale } = await params;
  const c = getCopy(locale);
  const plannerHref = `/${locale}/meal-planner`;
  const url = `${BASE}/${locale}/${SLUG}`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Culinse Weekly Meal Planner",
    url,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description:
      locale === "de"
        ? "Wochenplaner, der aus deinen Rezepten automatisch eine zusammengefasste, nach Bereich sortierte Einkaufsliste erstellt."
        : "Weekly meal planner that automatically turns your recipes into a combined, aisle-sorted shopping list.",
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
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pt-14 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-200 mb-4 block">
            {c.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">{c.h1}</h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-xl mb-8">{c.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={plannerHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-orange-600 font-semibold transition-opacity hover:opacity-90"
            >
              {c.ctaPrimary}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-orange-200 text-white font-semibold transition-colors hover:bg-white/10"
            >
              {c.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-24">
        {/* Intro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{c.introHeading}</h2>
          <p className="text-gray-700 leading-relaxed">{c.intro}</p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{c.stepsHeading}</h2>
          <div className="space-y-5">
            {c.steps.map((s) => (
              <div key={s.title}>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">{c.benefitsHeading}</h2>
          <ul className="space-y-2.5">
            {c.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-gray-700">
                <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {c.features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Guides (internal links to the cluster's star posts) */}
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
            <Link
              href={`/${locale}/collections/explore`}
              className="block bg-gray-50 rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {locale === "de" ? "Rezept-Collections entdecken" : "Explore recipe collections"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "de"
                  ? "Kuratierte Sammlungen als Ausgangspunkt für deinen Plan."
                  : "Curated collections to kick-start your plan."}
              </p>
            </Link>
          </div>
        </div>

        {/* FAQ (visible — matches FAQPage JSON-LD) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
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

        {/* Final CTA */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{c.finalHeading}</h2>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">{c.finalText}</p>
          <Link
            href={plannerHref}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {c.finalCta}
          </Link>
        </div>
      </main>
    </div>
  );
}
