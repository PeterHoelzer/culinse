import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Button from "@/components/ui/Button";

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
  return ["en", "de", "es", "fr", "it", "pl", "tr", "nl", "cs", "ru", "pt", "zh", "ja", "id", "vi", "bn"].map((locale) => ({ locale }));
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
      canonical: ["en", "de"].includes(locale) ? url : `${BASE}/en/${SLUG}`,
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
      ctaPrimary: "Woche kostenlos planen",
      ctaSecondary: "Erst Rezepte entdecken",
      introHeading: "Schluss mit Listen von Hand",
      intro:
        "Der mühsamste Teil der Wochenplanung ist nicht das Kochen – es ist das Zusammenschreiben der Einkaufsliste. Fünf Rezepte durchgehen, Zutaten notieren, Mengen addieren, prüfen, was noch da ist, und trotzdem etwas vergessen. Ein Meal Planner mit automatischer Einkaufsliste nimmt dir genau diesen Schritt ab: Du wählst deine Rezepte für die Woche, der Rest passiert von selbst.",
      stepsHeading: "So funktioniert's",
      steps: [
        {
          title: "1. Rezepte für die Woche wählen",
          text: "Stöbere durch unsere Rezepte aus Küche, Community und Familie, gefiltert nach Ernährung, Allergenen und Zeit, und lege deine Gerichte für die Woche in den Wochenplan.",
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
        { title: "Rezepte, die wirklich gekocht werden", text: "Aus unserer Küche, aus der Community und aus der Familie, an einem Ort durchsuchbar." },
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
      finalCta: "Jetzt kostenlos starten",
    };
  }

  return {
    badge: "Meal planner + shopping list",
    h1: "Weekly Meal Planner with an Automatic Shopping List",
    sub: "Plan your week in minutes and let Culinse build the shopping list from your recipes — amounts combined, sorted by store aisle. Free to use, no subscription required.",
    ctaPrimary: "Plan your week free",
    ctaSecondary: "Browse recipes first",
    introHeading: "Stop writing shopping lists by hand",
    intro:
      "The most tedious part of meal planning isn't the cooking — it's compiling the shopping list. Going through five recipes, writing down ingredients, adding up amounts, checking what you already have, and still forgetting something. A meal planner with an automatic shopping list removes that step entirely: you pick your recipes for the week, and the rest happens on its own.",
    stepsHeading: "How it works",
    steps: [
      {
        title: "1. Pick your recipes for the week",
        text: "Browse our recipes from the kitchen, the community and the family, filtered by diet, allergens and time, and drop the dishes you want into your weekly plan.",
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
      { title: "Recipes people actually cook", text: "From our kitchen, our community and our families, searchable in one place." },
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
    finalCta: "Get started free",
  };
}

export default async function WeeklyMealPlannerPage({ params }: Props) {
  const { locale } = await params;
  const c = getCopy(locale);
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
    <div className="min-h-screen bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(faqSchema) }} />

      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-16 pb-24">
        {/* Hero */}
        <header className="max-w-prose">
          <p className="text-sm text-ink-3 mb-3">{c.badge}</p>
          <h1 className="text-display-sm md:text-display mb-5">{c.h1}</h1>
          <p className="text-body-lg text-ink-2 max-w-prose mb-8">{c.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Button href="/meal-planner">{c.ctaPrimary}</Button>
            <Button href="/" variant="secondary">{c.ctaSecondary}</Button>
          </div>
        </header>

        <div className="max-w-prose">
          {/* Intro */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.introHeading}</h2>
          <p className="text-body-lg">{c.intro}</p>

          {/* Steps */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.stepsHeading}</h2>
          <ol className="space-y-6">
            {c.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span aria-hidden="true" className="font-serif text-h3 text-ink-3 tabular w-6 shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-h3 mb-1">{s.title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="text-body-lg text-ink-2">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Benefits */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.benefitsHeading}</h2>
          <ul className="list-disc pl-5 space-y-2 text-body-lg">
            {c.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          {/* Features */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.featuresHeading}</h2>
          <ul className="space-y-5">
            {c.features.map((f) => (
              <li key={f.title}>
                <h3 className="text-h3 mb-1">{f.title}</h3>
                <p className="text-body-lg text-ink-2">{f.text}</p>
              </li>
            ))}
          </ul>

          {/* Guides (internal links to the cluster's star posts) */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.guidesHeading}</h2>
          <ul className="border-b border-line">
            {c.guides.map((g) => (
              <li key={g.href} className="border-t border-line py-4">
                <Link href={g.href} className="font-serif text-h3 text-ink hover:underline underline-offset-[3px]">
                  {g.title}
                </Link>
                <p className="text-base text-ink-2 mt-1">{g.text}</p>
              </li>
            ))}
            <li className="border-t border-line py-4">
              <Link
                href={`/${locale}/collections/explore`}
                className="font-serif text-h3 text-ink hover:underline underline-offset-[3px]"
              >
                {locale === "de" ? "Rezept-Collections entdecken" : "Explore recipe collections"}
              </Link>
              <p className="text-base text-ink-2 mt-1">
                {locale === "de"
                  ? "Kuratierte Sammlungen als Ausgangspunkt für deinen Plan."
                  : "Curated collections to kick-start your plan."}
              </p>
            </li>
          </ul>

          {/* FAQ (visible — matches FAQPage JSON-LD) */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.faqHeading}</h2>
          <div className="border-b border-line">
            {c.faq.map((f) => (
              <details key={f.question} className="border-t border-line py-4">
                <summary className="cursor-pointer font-serif text-h3 text-ink">{f.question}</summary>
                <p className="text-body-lg text-ink-2 mt-3">{f.answer}</p>
              </details>
            ))}
          </div>

          {/* Final CTA */}
          <h2 className="text-h2-sm sm:text-h2 mt-12 mb-4">{c.finalHeading}</h2>
          <p className="text-body-lg text-ink-2 mb-6">{c.finalText}</p>
          <Button href="/meal-planner">{c.finalCta}</Button>
        </div>
      </main>
    </div>
  );
}
