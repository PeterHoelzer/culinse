import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/update-password"],
      },
    ],
    sitemap: "https://culinse.com/sitemap.xml",
  };
}
