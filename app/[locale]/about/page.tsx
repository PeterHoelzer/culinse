import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";

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
  const alternates = {
    canonical: `https://culinse.com/${locale}/about`,
    languages: {
      en: "https://culinse.com/en/about",
      de: "https://culinse.com/de/about",
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
    <div className="min-h-screen bg-gray-50">
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

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pt-14 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-200 mb-4 block">
            {t("ourStory")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            {t("heroTitle1")}<br />{t("heroTitle2")}
          </h1>
          <p className="text-orange-100 text-lg leading-relaxed max-w-xl">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-24">

        {/* Story card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: "#f97316" }}>
              P
            </div>
            <div>
              <p className="font-bold text-gray-900">{t("name")}</p>
              <p className="text-sm text-gray-400">{t("founderRole")}</p>
            </div>
          </div>

          <div className="space-y-5 text-gray-700 leading-relaxed text-base">
            <p>{t("story1")}</p>
            <p>{t("story2")}</p>
            <p>{t("story3")}</p>
            <p className="font-medium text-gray-900">{t("story4")}</p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {values.map((v) => (
            <div key={v.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Vision */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4 block">
            {t("whereWeGoing")}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">{t("visionTitle")}</h2>
          <div className="space-y-4">
            {visionItems.map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {t("discoverCta")}
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            {t("feedbackLabel")}{" "}
            <a href="mailto:peter@hoelzer.xyz" className="text-orange-500 hover:text-orange-700 transition-colors">
              peter@hoelzer.xyz
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/impressum" className="hover:text-gray-900 transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-gray-900 transition-colors">Datenschutz</Link>
          <a href="mailto:peter@hoelzer.xyz" className="hover:text-gray-900 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
