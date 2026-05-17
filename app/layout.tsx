import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  authors: [{ name: "Culinse" }],
  creator: "Culinse",
  metadataBase: new URL("https://culinse.com"),
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/icon",
    apple: [
      { url: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Culinse – Discover Recipes You'll Love",
    description: "Millions of recipes from the world's best food sites. Personalized for you.",
    url: "https://culinse.com",
    siteName: "Culinse",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinse – Discover Recipes You'll Love",
    description: "Millions of recipes from the world's best food sites. Personalized for you.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
