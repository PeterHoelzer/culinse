import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import { Button, Icon, type IconName } from "@/components/ui";

// Feste Icon-Zuordnung (die Emoji-Felder in messages werden ignoriert, DESIGN.md §6)
const VALUE_ICONS: IconName[] = ["utensils", "heart", "star"];
const VISION_ICONS: IconName[] = ["calendar", "cart", "book", "globe"];

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
  const alternates = {
    canonical: `https://culinse.com/${locale}/about`,
    languages: {
      en: "https://culinse.com/en/about",
      de: "https://culinse.com/de/about",
      es: "https://culinse.com/es/about",
      fr: "https://culinse.com/fr/about",
      it: "https://culinse.com/it/about",
      pl: "https://culinse.com/pl/about",
      tr: "https://culinse.com/tr/about",
      nl: "https://culinse.com/nl/about",
      cs: "https://culinse.com/cs/about",
      ru: "https://culinse.com/ru/about",
      pt: "https://culinse.com/pt/about",
      zh: "https://culinse.com/zh/about",
      ja: "https://culinse.com/ja/about",
      id: "https://culinse.com/id/about",
      vi: "https://culinse.com/vi/about",
      bn: "https://culinse.com/bn/about",
      "x-default": "https://culinse.com/en/about",
    },
  };
  if (locale === "de") {
    return {
      title: "Über uns – Von einem Küchenchef gebaut",
      description: "Culinse wurde von einem Küchenchef und Fleischermeister entwickelt, der es satt hatte, für jedes Rezept dutzende Seiten besuchen zu müssen.",
      alternates,
      openGraph: {
        title: "Über uns – Von einem Küchenchef gebaut | Culinse",
        description: "Culinse wurde von einem Küchenchef und Fleischermeister entwickelt.",
        url: "https://culinse.com/de/about",
      },
    };
  }
  return {
    title: "About – Built by a Chef",
    description: "Culinse was built by a head chef and Fleischermeister who was tired of searching a hundred sites for the perfect recipe.",
    alternates,
    openGraph: {
      title: "About – Built by a Chef | Culinse",
      description: "Culinse was built by a head chef and German master butcher.",
      url: "https://culinse.com/en/about",
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const values = t.raw("values") as { icon: string; title: string; desc: string }[];
  const visionItems = t.raw("visionItems") as { icon: string; title: string; desc: string }[];

  // Person schema (E-E-A-T): the same @id is referenced as `author` in every
  // blog article's Article JSON-LD, so Google can connect articles → author →
  // credentials on this page.
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://culinse.com/#peter",
    name: "Peter Hölzer",
    jobTitle:
      locale === "de"
        ? "Küchenchef & Fleischermeister"
        : "Head Chef & German Master Butcher (Fleischermeister)",
    description:
      locale === "de"
        ? "Küchenchef mit Restaurant-Erfahrung in ganz Deutschland, seit 2024 Fleischermeister — die höchste Qualifikation des Fleischerhandwerks. Gründer von Culinse."
        : "Head chef with restaurant experience across Germany, certified Fleischermeister (German master butcher, the trade's highest qualification) in 2024. Founder of Culinse.",
    url: `https://culinse.com/${locale}/about`,
    knowsAbout: ["Cooking", "Butchery", "Meal planning", "Recipes"],
    worksFor: { "@type": "Organization", "@id": "https://culinse.com/#organization" },
  };

  return (
    <div className="min-h-screen bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <Navbar />

      <main className="max-w-prose mx-auto px-4 pt-12 sm:pt-16 pb-24">
        {/* Kopf */}
        <header>
          <p className="text-sm text-ink-3 mb-3">{t("ourStory")}</p>
          <h1 className="text-h1-sm sm:text-h1 mb-5">
            {t("heroTitle1")}<br />{t("heroTitle2")}
          </h1>
          <p className="text-body-lg text-ink-2">{t("heroSubtitle")}</p>
        </header>

        {/* Geschichte */}
        <p className="text-sm text-ink-3 mt-10 mb-4">
          <span className="font-semibold text-ink">{t("name")}</span> · {t("founderRole")}
        </p>
        <div className="space-y-5 text-body-lg">
          <p>{t("story1")}</p>
          <p>{t("story2")}</p>
          <p>{t("story3")}</p>
          <p className="font-semibold">{t("story4")}</p>
        </div>

        {/* Werte */}
        <ul className="mt-12 space-y-6">
          {values.map((v, idx) => (
            <li key={v.title} className="flex gap-4">
              <Icon name={VALUE_ICONS[idx] ?? "star"} size={24} className="text-ink-3 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-h3 mb-1">{v.title}</h3>
                <p className="text-base text-ink-2">{v.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Vision */}
        <p className="text-sm text-ink-3 mt-12 mb-2">{t("whereWeGoing")}</p>
        <h2 className="text-h2-sm sm:text-h2 mb-6">{t("visionTitle")}</h2>
        <ul className="space-y-6">
          {visionItems.map((item, idx) => (
            <li key={item.title} className="flex gap-4">
              <Icon name={VISION_ICONS[idx] ?? "star"} size={24} className="text-ink-3 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-h3 mb-1">{item.title}</h3>
                <p className="text-base text-ink-2">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-12">
          <Button href="/">{t("discoverCta")}</Button>
          <p className="text-base text-ink-2 mt-5">
            {t("feedbackLabel")}{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">
              peter@hoelzer.xyz
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-line py-8 px-4">
        <div className="max-w-prose mx-auto flex flex-wrap gap-6 text-sm text-ink-3">
          <Link href="/impressum" className="hover:text-ink hover:underline underline-offset-[3px]">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-ink hover:underline underline-offset-[3px]">Datenschutz</Link>
          <a href="mailto:peter@hoelzer.xyz" className="hover:text-ink hover:underline underline-offset-[3px]">Contact</a>
        </div>
      </footer>
    </div>
  );
}
