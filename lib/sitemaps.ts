// Alle Sitemap-Dateien der Seite, für robots.txt und den Sitemap-Index.
const baseUrl = "https://culinse.com";

/*
  Sprachen, die in den Sitemaps stehen (Entscheidung Peter, 17.11.2026).

  Die Website gibt es in 16 Sprachen; in die Sitemaps kommen vorerst nur Deutsch
  und Englisch. Grund: Google ruft die Website kaum ab (Search Console am
  17.11.2026: 999 Abrufe in 90 Tagen, 230 aufgenommene Seiten, kein fremder Link).
  Mit allen 16 Sprachen standen über 72.000 Adressen in den Sitemaps, mit zweien
  sind es rund 9.000; so verteilt sich das wenige Abruf-Interesse nicht auf alles.

  Die anderen 14 Sprachen bleiben erreichbar und verlinkt: Jede Seite nennt ihre
  Sprachfassungen im <head> (hreflang). Zum Erweitern genügt es, hier Sprachen
  zu ergänzen; Hauptdatei, Rezept-Sitemaps, Sitemap-Index und robots.txt folgen.
*/
export const SITEMAP_LOCALES = ["en", "de"] as const;

export const SITEMAP_URLS: string[] = [
  `${baseUrl}/sitemap.xml`,
  ...SITEMAP_LOCALES.map((locale) => `${baseUrl}/recipe-sitemap/sitemap/${locale}.xml`),
];
