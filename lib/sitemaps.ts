// Alle Sitemap-Dateien der Seite, für robots.txt und den Sitemap-Index.
const baseUrl = "https://culinse.com";
const LOCALES = ["en", "de", "es", "fr", "it", "pl", "tr", "nl", "cs", "ru", "pt", "zh", "ja", "id", "vi", "bn"];

export const SITEMAP_URLS: string[] = [
  `${baseUrl}/sitemap.xml`,
  ...LOCALES.map((locale) => `${baseUrl}/recipe-sitemap/sitemap/${locale}.xml`),
];
