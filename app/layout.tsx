import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://culinse.com"),
};

// Root layout provides EN as fallback so Navbar (useTranslations) works
// even on non-locale pages (e.g. app/about, app/collections).
// The [locale]/layout.tsx wraps with a locale-specific provider that overrides this.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
