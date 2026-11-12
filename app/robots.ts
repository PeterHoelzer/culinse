import type { MetadataRoute } from "next";
import { SITEMAP_URLS } from "@/lib/sitemaps";

// Single source of truth for robots rules. NOTE: there must be NO public/robots.txt
// — a static file would shadow/conflict with this route and the two disagreed.
//
// We block user-specific / utility pages (no SEO value, and most redirect to
// login anyway) but deliberately keep public content crawlable:
//   - /<locale>/recipe/<id>        public recipes (singular)  → allowed
//   - /<locale>/recipes            Stöberseite, and /<locale>/recipes/<slug>, its
//                                  topic pages (in the sitemap)             → allowed
//   - /<locale>/collections/explore + /<locale>/collections/<id>  → allowed
//   - /<locale>/blog/...           → allowed
//
// "/*/collections$" uses the end-anchor so ONLY the user's own collections index
// (/en/collections) is blocked, while /collections/explore and /collections/<id>
// (the indexable SEO landing pages listed in the sitemap) stay crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/*/login",
          "/*/profile",
          "/*/saved",
          "/*/meal-planner$", // $-anchored so it never collides with /weekly-meal-planner (public landing page)
          "/*/wochenplaner$",
          "/*/planner$",
          "/*/my-recipes",
          // Rezept-Editor. Bis 10.11.2026 stand hier "/*/recipes" und sperrte damit
          // auch die Stöberseite und alle Themenseiten für Suchmaschinen.
          "/*/recipes/create",
          "/*/recipes/import",
          "/*/recipes/*/edit",
          "/*/collections$", // user's own collections index only — explore + /collections/<id> stay crawlable
          "/*/pro/success",
          "/*/reset-password",
          "/*/update-password",
          "/update-password",
        ],
      },
    ],
    sitemap: ["https://culinse.com/sitemap-index.xml", ...SITEMAP_URLS],
  };
}
