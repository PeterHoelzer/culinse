/*
  Sitemap-Index: eine Adresse für die Search Console, die auf alle Teil-Sitemaps
  zeigt (Hauptdatei und je Sprache eine Rezept-Sitemap). robots.txt nennt
  dieselben Dateien einzeln.
*/
import { SITEMAP_URLS } from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    SITEMAP_URLS.map((url) => `<sitemap><loc>${url}</loc></sitemap>`).join("\n") +
    `\n</sitemapindex>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
