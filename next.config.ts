import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Hero-Fotos laufen durch den Next-Bildoptimierer (CDN-Cache, WebP/AVIF, gleiche Origin)
      { protocol: "https", hostname: "ztfhnzslyztxfmvkyrrn.supabase.co" },
      { protocol: "https", hostname: "img.spoonacular.com" },
      { protocol: "https", hostname: "spoonacular.com" },
      { protocol: "https", hostname: "images.spoonacular.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
  // www.culinse.com zeigte die ganze Seite ein zweites Mal (200 statt
  // Weiterleitung). Eine Adresse je Seite: dauerhaft auf culinse.com.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.culinse.com" }],
        destination: "https://culinse.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
