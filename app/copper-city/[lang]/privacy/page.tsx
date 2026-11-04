import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalizedPrivacy from "@/components/copper-city/LocalizedPrivacy";
import { copperCityLocales, getCopperCityLocale, privacyPath } from "@/lib/copper-city";

// Datenschutzerklärung je Sprache: /copper-city/fr/privacy, … (de/en: /copper-city/datenschutz).
export const dynamicParams = false;

export function generateStaticParams() {
  return copperCityLocales.filter((l) => l.code !== "de" && l.code !== "en").map((l) => ({ lang: l.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = getCopperCityLocale(lang);
  if (!locale) return {};
  return {
    title: locale.privacy.metaTitle,
    description: locale.privacy.metaDescription,
    alternates: {
      canonical: `https://culinse.com${privacyPath(locale.code)}`,
      languages: Object.fromEntries(copperCityLocales.map((l) => [l.htmlLang, `https://culinse.com${privacyPath(l.code)}`])),
    },
  };
}

export default async function CopperCityLocalizedPrivacy({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = getCopperCityLocale(lang);
  if (!locale || locale.code === "de" || locale.code === "en") notFound();
  return <LocalizedPrivacy locale={locale} />;
}
