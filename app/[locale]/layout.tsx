import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
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

  if (locale === "de") {
    return {
      ...sharedMeta,
      alternates: {
        canonical: "https://culinse.com/de",
        languages: { en: "https://culinse.com/en", de: "https://culinse.com/de" },
      },
      title: {
        default: "Culinse – Rezepte entdecken, die du lieben wirst",
        template: "%s | Culinse",
      },
      description:
        "Culinse bündelt Millionen Rezepte von den besten Food-Seiten — gefiltert nach Ernährung und Allergenen, kostenlos und ohne Abo.",
      keywords: [
        "Rezepte", "Rezepte entdecken", "personalisierte Rezepte", "Kochen", "Essen",
        "Rezeptaggregator", "Chefkoch", "gesunde Rezepte", "schnelle Rezepte",
      ],
      openGraph: {
        title: "Culinse – Rezepte entdecken, die du lieben wirst",
        description: "Millionen Rezepte von den besten Food-Seiten der Welt. Personalisiert für dich.",
        url: "https://culinse.com/de",
        siteName: "Culinse",
        locale: "de_DE",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Culinse – Rezepte entdecken, die du lieben wirst",
        description: "Millionen Rezepte von den besten Food-Seiten der Welt. Personalisiert für dich.",
      },
    };
  }

  return {
    ...sharedMeta,
    alternates: {
      canonical: "https://culinse.com/en",
      languages: { en: "https://culinse.com/en", de: "https://culinse.com/de" },
    },
    title: {
      default: "Culinse – Discover Recipes You'll Love",
      template: "%s | Culinse",
    },
    description:
      "Culinse aggregates millions of recipes from BBC Good Food, Bon Appétit, Chefkoch and more. Get a personalized recipe feed — free, no subscription.",
    keywords: [
      "recipes", "recipe discovery", "personalized recipes", "cooking", "food",
      "recipe aggregator", "BBC Good Food", "Chefkoch", "healthy recipes", "easy recipes",
    ],
    openGraph: {
      title: "Culinse – Discover Recipes You'll Love",
      description: "Millions of recipes from the world's best food sites. Personalized for you.",
      url: "https://culinse.com/en",
      siteName: "Culinse",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Culinse – Discover Recipes You'll Love",
      description: "Millions of recipes from the world's best food sites. Personalized for you.",
    },
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
