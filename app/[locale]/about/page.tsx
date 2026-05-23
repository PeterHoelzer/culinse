import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "de") {
    return {
      title: "Über uns – Von einem Küchenchef gebaut",
      description: "Culinse wurde von einem Fleischermeister und Küchenchef entwickelt, der es satt hatte, für jedes Rezept dutzende Seiten besuchen zu müssen.",
    };
  }
  return {
    title: "About – Built by a Chef",
    description: "Culinse was built by a head chef and Fleischermeister who was tired of searching a hundred sites for the perfect recipe.",
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const values = t.raw("values") as { icon: string; title: string; desc: string }[];
  const visionItems = t.raw("visionItems") as { icon: string; title: string; desc: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
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
