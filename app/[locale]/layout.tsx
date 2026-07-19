import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  // NOTE: No `alternates` here! Canonical + hreflang MUST be set per page
  // (see each page's generateMetadata). A layout-level canonical is inherited
  // by every child page that doesn't define its own — which told Google that
  // /about, /blog, /pro etc. were duplicates of the homepage and got them
  // deindexed ("Alternative Seite mit richtigem kanonischen Tag" in GSC).
  if (locale === "de") {
    return {
      ...sharedMeta,
      title: {
        default: "Culinse – Rezepte entdecken, die du lieben wirst",
        template: "%s | Culinse",
      },
      description:
        "Culinse bündelt Millionen Rezepte von den besten Food-Seiten — gefiltert nach Ernährung und Allergenen, kostenlos nutzbar und ohne Abo-Zwang.",
      keywords: [
        "Rezepte", "Rezepte entdecken", "personalisierte Rezepte", "Kochen", "Essen",
        "Rezeptsuche", "gesunde Rezepte", "schnelle Rezepte", "Wochenplan", "Einkaufsliste",
      ],
    };
  }

  return {
    ...sharedMeta,
    title: {
      default: "Culinse – Discover Recipes You'll Love",
      template: "%s | Culinse",
    },
    description:
      "Culinse aggregates millions of recipes from the web's best food sites — filtered to your diet and allergies. Free to use, no subscription required.",
    keywords: [
      "recipes", "recipe discovery", "personalized recipes", "cooking", "food",
      "recipe search", "healthy recipes", "easy recipes", "meal planner", "shopping list",
    ],
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as "en" | "de")) {
    notFound();
  }

  // Pin the request locale for server components in this subtree. Without this,
  // next-intl's requestLocale can fall back to "en" (e.g. during static
  // rendering), which made locale-aware <Link>s on /de pages point to /en/…
  setRequestLocale(locale);

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
