import { getTranslations } from "next-intl/server";
import HomeClient from "./HomeClient";

// ─── WebSite + Organization JSON-LD ──────────────────────────────────────────
function buildWebsiteSchema(locale: string) {
  const isDE = locale === "de";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://culinse.com/#website",
        url: "https://culinse.com",
        name: "Culinse",
        description: isDE
          ? "Rezepte entdecken, Woche planen, Einkaufsliste erstellen — kostenlos."
          : "Discover recipes, plan your week, build your shopping list — free.",
        inLanguage: isDE ? "de-DE" : "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `https://culinse.com/${locale}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://culinse.com/#organization",
        name: "Culinse",
        url: "https://culinse.com",
        logo: {
          "@type": "ImageObject",
          url: "https://culinse.com/icon",
        },
      },
    ],
  };
}

// ─── Page (Server Component) ──────────────────────────────────────────────────
// Note: The HomeClient below is a "use client" component — Next.js App Router
// still server-renders it to HTML for the initial page load (SSR). The H1,
// headings and static text inside HomeClient ARE present in the raw HTML that
// Google crawls. This page.tsx adds the WebSite + Organization JSON-LD schema
// on top, which requires a Server Component to inject server-side.
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Pre-load translations server-side so next-intl can SSR HomeClient correctly
  await getTranslations({ locale, namespace: "hero" });

  const websiteSchema = buildWebsiteSchema(locale);

  return (
    <>
      {/* JSON-LD: WebSite schema + Sitelinks Searchbox */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      {/* Full interactive page — Next.js SSRs this to real HTML on first load */}
      <HomeClient />
    </>
  );
}
