import { createHmac, randomBytes } from "node:crypto";
import { routing } from "@/i18n/routing";

/*
  Besucherzählung: reine Einordnung, ohne Datenbank (25.11.2026).

  /api/besuch bekommt je Seitenaufruf Adresse, Verweis und Browserkennung und
  macht daraus die Spalten der Tabelle page_views. Hier steht, wie eingeordnet
  wird: Seitenart, Herkunft, Gerät, Roboter. Gespeichert werden nur die groben
  Ergebnisse, nie die IP-Adresse und nie die ganze Browserkennung.
*/

export type PageKind =
  | "home" | "recipe" | "topic" | "browse" | "blog" | "collections"
  | "planner" | "library" | "account" | "pro" | "info" | "other";

export type Channel = "direct" | "search" | "social" | "ai" | "mail" | "website" | "campaign";

const LOCALES: readonly string[] = routing.locales;

/** Kalendertag in deutscher Zeit (JJJJ-MM-TT); daran hängen Tagesgrenze und Tages-Hash. */
export function berlinDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Adresse säubern: nur der Pfad, ohne Parameter, ohne Schrägstrich am Ende. */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return null;
  let path = raw.split(/[?#]/)[0].slice(0, 200);
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  return path;
}

/** Sprache aus der Adresse und der Rest dahinter. */
export function splitLocale(path: string): { locale: string | null; rest: string } {
  const first = path.split("/")[1] ?? "";
  if (LOCALES.includes(first)) return { locale: first, rest: path.slice(first.length + 1) || "/" };
  return { locale: null, rest: path };
}

const PLANNER = /^\/(meal-planner|wochenplaner|planner|plan|weekly-meal-planner|grocery-list-calculator)(\/|$)/;
const ACCOUNT = /^\/(login|onboarding|reset-password|update-password|profile)(\/|$)/;
const LIBRARY = /^\/(saved|my-recipes)(\/|$)/;
const INFO = /^\/(about|impressum|datenschutz|agb|widerruf|ki-transparenz)(\/|$)/;

export function pageKind(rest: string): PageKind {
  if (rest === "/") return "home";
  if (rest.startsWith("/recipe/")) return "recipe";
  if (rest === "/recipes") return "browse";
  if (rest.startsWith("/recipes/")) return "topic";
  if (rest === "/blog" || rest.startsWith("/blog/")) return "blog";
  if (rest === "/collections" || rest.startsWith("/collections/")) return "collections";
  if (PLANNER.test(rest)) return "planner";
  if (LIBRARY.test(rest)) return "library";
  if (ACCOUNT.test(rest)) return "account";
  if (rest === "/pro" || rest.startsWith("/pro/")) return "pro";
  if (INFO.test(rest)) return "info";
  return "other";
}

/** Seiten, die nicht gezählt werden: Verwaltung und Statistik selbst. */
export function isUncounted(rest: string): boolean {
  return /^\/(admin|geld)(\/|$)/.test(rest);
}

// ─── Roboter ────────────────────────────────────────────────────────────────
// Die meisten Roboter führen kein JavaScript aus und melden sich deshalb nie.
// Googlebot und Prüfwerkzeuge tun es; sie fallen hier über ihre Kennung heraus.
const BOT =
  /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|scrap|fetch|curl|wget|python|httpclient|axios|okhttp|phantomjs|playwright|puppeteer|selenium|google-inspectiontool|mediapartners|adsbot|facebookexternalhit|bytespider|ahrefs|semrush|yandex(?!browser)/i;

export function isBot(userAgent: string): boolean {
  return userAgent.length < 20 || BOT.test(userAgent);
}

// ─── Gerät, Browser, Betriebssystem ─────────────────────────────────────────
export function parseUserAgent(ua: string): { device: "mobile" | "tablet" | "desktop"; browser: string; os: string } {
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Windows/.test(ua) ? "Windows"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "Sonstige";

  const device = /iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "tablet"
    : /Mobi|iPhone|iPod|Android/.test(ua) ? "mobile"
    : "desktop";

  // Erst die Apps, die Links im eigenen Fenster öffnen: für die Frage, was
  // TikTok, Instagram und Pinterest bringen, ist das die wichtigere Auskunft.
  const browser = /Instagram/.test(ua) ? "Instagram-App"
    : /FBAN|FBAV|FB_IAB/.test(ua) ? "Facebook-App"
    : /musical_ly|Bytedance|TikTok/i.test(ua) ? "TikTok-App"
    : /Pinterest/.test(ua) ? "Pinterest-App"
    : /Edg(e|A|iOS)?\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Firefox|FxiOS/.test(ua) ? "Firefox"
    : /Chrome|CriOS/.test(ua) ? "Chrome"
    : /Safari/.test(ua) ? "Safari"
    : "Sonstige";

  return { device, browser, os };
}

// ─── Herkunft ───────────────────────────────────────────────────────────────
const AI = /(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com|deepseek\.com|mistral\.ai|poe\.com)$/;
const MAIL = /(^|\.)(mail\.google\.com|mail\.yahoo\.com|outlook\.live\.com|outlook\.office\.com|gmx\.net|web\.de|mail\.proton\.me|com\.google\.android\.gm)$/;
const SOCIAL = /(^|\.)(tiktok\.com|pinterest\.[a-z.]+|pin\.it|instagram\.com|facebook\.com|fb\.com|fb\.me|t\.co|x\.com|twitter\.com|youtube\.com|youtu\.be|reddit\.com|linkedin\.com|lnkd\.in|threads\.(net|com)|whatsapp\.com|t\.me|telegram\.org|snapchat\.com|bsky\.app|com\.pinterest|com\.zhiliaoapp\.musically|com\.instagram\.android|com\.facebook\.katana)$/;
const SEARCH = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|ecosia\.org|yandex\.[a-z.]+|baidu\.com|startpage\.com|qwant\.com|naver\.com|seznam\.cz|search\.brave\.com|kagi\.com|com\.google\.android\.googlequicksearchbox)$/;

function channelOfHost(host: string): Channel {
  if (AI.test(host)) return "ai";
  if (MAIL.test(host)) return "mail";
  if (SOCIAL.test(host)) return "social";
  if (SEARCH.test(host)) return "search";
  return "website";
}

const UTM_CHANNEL: Record<string, Channel> = {
  tiktok: "social", pinterest: "social", instagram: "social", facebook: "social",
  youtube: "social", reddit: "social", twitter: "social", x: "social", threads: "social",
  whatsapp: "social", telegram: "social", linkedin: "social",
  newsletter: "mail", email: "mail", mail: "mail",
  google: "search", bing: "search",
  chatgpt: "ai", perplexity: "ai",
};

/** Rechnername der verweisenden Seite; eigene Seiten und Unlesbares ergeben null. */
export function referrerHost(raw: unknown, ownHost: string): string | null {
  if (typeof raw !== "string" || !raw) return null;
  let host: string;
  try {
    host = new URL(raw.slice(0, 500)).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, "");
  if (!host || host === ownHost.replace(/^www\./, "") || host === "localhost") return null;
  return host.slice(0, 100);
}

export function cleanUtmSource(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  return value || null;
}

/** Ein Kampagnen-Link (?utm_source=) sagt mehr als der Verweis und geht deshalb vor. */
export function classifyChannel(refHost: string | null, utmSource: string | null): Channel {
  if (utmSource) return UTM_CHANNEL[utmSource] ?? "campaign";
  if (refHost) return channelOfHost(refHost);
  return "direct";
}

export function cleanCountry(raw: string | null): string | null {
  if (!raw || !/^[A-Z]{2}$/.test(raw) || raw === "XX" || raw === "T1") return null;
  return raw;
}

// ─── Tages-Hash ─────────────────────────────────────────────────────────────
export function newSalt(): string {
  return randomBytes(24).toString("hex");
}

/** Erkennt denselben Besucher am selben Tag wieder, ohne IP oder Kennung zu speichern. */
export function visitorHash(salt: string, ip: string, userAgent: string): string {
  return createHmac("sha256", salt).update(`${ip}|${userAgent}`).digest("hex").slice(0, 16);
}
