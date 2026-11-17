import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Bildspeicher: die Adresse aus NEXT_PUBLIC_SUPABASE_URL und das bisherige
// Supabase-Projekt (ältere Rezeptzeilen zeigen noch dorthin). Bewusst ohne Import
// aus lib/: diese Datei wird vor dem Bau ohne Pfad-Aliasse geladen.
const LEGACY_SUPABASE_HOST = "ztfhnzslyztxfmvkyrrn.supabase.co";
function supabaseHosts(): string[] {
  const hosts = new Set([LEGACY_SUPABASE_HOST]);
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) hosts.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
  } catch {
    // ungültige Adresse: es bleibt beim bisherigen Projekt
  }
  return [...hosts];
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Vercel hat diesen Kopf selbst gesetzt; auf dem eigenen Server muss ihn die
  // Website mitgeben. Gleicher Wert wie bisher (zwei Jahre, ohne Unteradressen).
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  // Kein "X-Powered-By: Next.js" in den Antworten (Vercel hat den Kopf entfernt).
  poweredByHeader: false,
  experimental: {
    // Cloudflare speichert die fertigen Seiten und unterscheidet dabei nur nach
    // der Adresse, nicht nach den Kopfzeilen, mit denen der Browser beim
    // Seitenwechsel statt der Seite deren Daten anfordert (rsc, next-router-…).
    // Next hängt dafür einen Prüfwert an die Adresse (?_rsc=…). Mit diesem
    // Schalter besteht der Server darauf, dass Prüfwert und Kopfzeilen
    // zusammenpassen, und leitet sonst auf die richtige Adresse um. Ohne ihn
    // könnte jemand unter der Adresse einer Seite deren Daten einlagern lassen;
    // Besucher bekämen dann Zeichensalat statt der Seite.
    // Siehe node_modules/next/dist/docs/01-app/02-guides/cdn-caching.md.
    validateRSCRequestHeaders: true,
  },
  images: {
    remotePatterns: [
      // Hero-Fotos laufen durch den Next-Bildoptimierer (CDN-Cache, WebP/AVIF, gleiche Origin)
      ...supabaseHosts().map((hostname) => ({ protocol: "https" as const, hostname })),
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
