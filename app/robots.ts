import type { MetadataRoute } from "next";

// Single source of truth for robots rules. NOTE: there must be NO public/robots.txt
// — a static file would shadow/conflict with this route and the two disagreed.
//
// We block user-specific / utility pages (no SEO value, and most redirect to
// login anyway) but deliberately keep public content crawlable:
//   - /<locale>/recipe/<id>        public recipes (singular)  → allowed
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
          "/*/recipes", // user recipe management (public recipes live at /recipe/<id>, singular)
          "/*/collections$", // user's own collections index only — explore + /collections/<id> stay crawlable
          "/*/pro/success",
          "/*/reset-password",
          "/*/update-password",
          "/update-password",
        ],
      },
    ],
    sitemap: "https://culinse.com/sitemap.xml",
  };
}
