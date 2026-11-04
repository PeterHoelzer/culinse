import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedSupport from "@/components/copper-city/LocalizedSupport";
import { copperCityLocales, getCopperCityLocale, supportPath } from "@/lib/copper-city";

// Support-Seite je Sprache: /copper-city/fr, /copper-city/ja, … (de/en bleiben auf /copper-city).
// Nur die bekannten Sprachcodes werden gebaut; alles andere ist 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return copperCityLocales.filter((l) => l.code !== "de" && l.code !== "en").map((l) => ({ lang: l.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = getCopperCityLocale(lang);
  if (!locale) return {};
  return {
    title: locale.support.metaTitle,
    description: locale.support.metaDescription,
    alternates: {
      canonical: `https://culinse.com${supportPath(locale.code)}`,
      languages: Object.fromEntries(copperCityLocales.map((l) => [l.htmlLang, `https://culinse.com${supportPath(l.code)}`])),
    },
  };
}

export default async function CopperCityLocalizedSupport({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = getCopperCityLocale(lang);
  if (!locale || locale.code === "de" || locale.code === "en") notFound();
  return <LocalizedSupport locale={locale} />;
}
