// Alle Sitemap-Dateien der Seite, für robots.txt und den Sitemap-Index.
import { SEARCH_LOCALES } from "@/lib/searchLocales";

const baseUrl = "https://culinse.com";

/*
  Sprachen, die in den Sitemaps stehen (Entscheidung Peter, 17.11.2026).

  Die Website gibt es in 16 Sprachen; in die Sitemaps kommen vorerst nur Deutsch
  und Englisch. Mit allen 16 Sprachen standen über 72.000 Adressen in den
  Sitemaps, mit zweien sind es rund 9.000.

  Seit 22.11.2026 ist das derselbe Schalter wie für hreflang und robots.txt:
  SEARCH_LOCALES in lib/searchLocales.ts, dort stehen Grund und Rückweg.
  Hauptdatei, Rezept-Sitemaps, Sitemap-Index und robots.txt folgen der Liste.
*/
export const SITEMAP_LOCALES = SEARCH_LOCALES;

export const SITEMAP_URLS: string[] = [
  `${baseUrl}/sitemap.xml`,
  ...SITEMAP_LOCALES.map((locale) => `${baseUrl}/recipe-sitemap/sitemap/${locale}.xml`),
];
