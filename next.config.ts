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

/*
  Inhalts-Sicherheitsrichtlinie (CSP), seit 25.11.2026.

  Sie legt fest, von wo die Seite etwas laden und wohin sie Daten schicken darf.
  Erhoben am 25.11.2026: Der Browser spricht nur mit culinse.com selbst und mit
  dem Datenserver (Anmeldung, Datenbank, Bilder, Videos). Es gibt keine fremden
  Skripte, Schriften, Rahmen oder Messdienste.

  Was die Richtlinie hier leistet:
  - Skripte, Schriften und Rahmen nur von der eigenen Adresse. Ein eingeschleuster
    Verweis auf ein fremdes Skript läuft nicht.
  - Daten gehen nur an die eigene Adresse und den Datenserver (connect-src).
    Eingeschleuster Code kann sie nicht an einen fremden Server melden.
  - Die Seite lässt sich nirgends einbetten, Formulare schicken nur an die
    eigene Adresse, <base> lässt sich nicht umbiegen.

  Was sie hier nicht leistet: 'unsafe-inline' bei Skripten bleibt nötig. Die
  Seiten liegen fertig bei Cloudflare im Speicher, deshalb gibt es keinen
  Einmalwert je Abruf (Nonce), und Next schreibt seine Startdaten als Skript in
  die Seite. Gegen ein eingeschleustes Skript im Seitentext schützt weiter nur,
  dass alle Ausgaben maskiert sind.
  Siehe node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.

  Bilder und Videos dürfen von jeder https-Adresse kommen: Rezepte von Nutzern
  und importierte Rezepte tragen Bildadressen fremder Websites.

  Wer einen fremden Dienst einbaut (Werbung, Zahlung im Rahmen, Messung), muss
  seine Adressen hier eintragen, sonst blockiert der Browser ihn stumm. Die
  Meldungen stehen in der Browser-Konsole.
*/
function contentSecurityPolicy(): string {
  const dev = process.env.NODE_ENV !== "production";
  let data = "https://daten.culinse.com";
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) data = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    // ungültige Adresse: es bleibt beim Datenserver
  }
  const directives = [
    "default-src 'self'",
    // 'unsafe-eval' und WebSocket nur für den Entwicklungsmodus (Neuladen bei Änderungen).
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${data} ${data.replace(/^http/, "ws")}${dev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];
  if (!dev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
  },
  // Fremde Fenster, die diese Seite öffnen, bekommen keinen Zugriff auf sie.
  // "allow-popups" lässt die Anmeldung über Google unberührt.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Vercel hat diesen Kopf selbst gesetzt; auf dem eigenen Server muss ihn die
  // Website mitgeben. Gleicher Wert wie bisher (zwei Jahre, ohne Unteradressen).
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const PERSONAL_API = [
  "/api/user-recipes/:path*",
  "/api/saved-recipes",
  "/api/meal-plans",
  "/api/share-plan",
  "/api/shopping-list",
  "/api/nutrition",
  "/api/generate-plan",
  "/api/import-recipe",
  "/api/stripe/:path*",
  "/api/admin/:path*",
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
      // Bis 25.11.2026 standen hier *.cloudfront.net und *.s3.amazonaws.com. Damit
      // verkleinerte und speicherte der eigene Server Bilder aus jeder fremden
      // Ablage bei Amazon (Rechenzeit, Bandbreite, Platte). Geblieben ist die eine
      // Ablage, aus der alte Wochenplan-Einträge von Edamam ihre Bilder haben.
      { protocol: "https", hostname: "edamam-product-images.s3.amazonaws.com" },
    ],
  },
  // www.culinse.com zeigte die ganze Seite ein zweites Mal (200 statt
  // Weiterleitung). Eine Adresse je Seite: dauerhaft auf culinse.com.
  // Darunter: die Adressen der früheren Pro-Seite.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.culinse.com" }],
        destination: "https://culinse.com/:path*",
        permanent: true,
      },
      // Die Pro-Seite gibt es seit 25.11.2026 nicht mehr: Alle Funktionen sind
      // kostenlos. Ihre Adresse steht bei Google im Index, deshalb kein 404,
      // sondern dauerhaft weiter: auf Deutsch und Englisch zur Seite über den
      // Wochenplaner (dasselbe Thema, nur in diesen beiden Sprachen übersetzt),
      // in den übrigen Sprachen zur Startseite.
      { source: "/:locale(de|en)/pro", destination: "/:locale/weekly-meal-planner", permanent: true },
      { source: "/:locale([a-z]{2})/pro", destination: "/:locale", permanent: true },
      { source: "/:locale([a-z]{2})/pro/:rest+", destination: "/:locale", permanent: true },
      { source: "/pro", destination: "/", permanent: true },
      { source: "/pro/:rest+", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Antworten mit persönlichen Daten: nie zwischenspeichern, weder im
      // Browser noch bei Cloudflare. Diese Schnittstellen setzen selbst keine
      // Angabe dazu.
      ...PERSONAL_API.map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      })),
      // Bilder und Schrift der Mails (public/mail). Mailprogramme laden die
      // Schrift von einer fremden Herkunft; ohne diese Freigabe bleibt es bei
      // der Ersatzschrift. Siehe mail/LIESMICH.md.
      {
        source: "/mail/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
