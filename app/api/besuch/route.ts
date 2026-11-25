import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CULINSE_OWNER_ID, CULINSE_FAMILY_IDS } from "@/lib/culinse";
import {
  berlinDay, classifyChannel, cleanCountry, cleanUtmSource, isBot, isUncounted,
  newSalt, normalizePath, pageKind, parseUserAgent, referrerHost, splitLocale, visitorHash,
} from "@/lib/visits";

/**
 * Besucherzählung (25.11.2026): nimmt je Seitenaufruf eine kurze Meldung des
 * Browsers entgegen (components/VisitBeacon.tsx) und schreibt eine Zeile in
 * page_views. Die Seiten selbst kommen aus dem Speicher von Cloudflare, der
 * Server sieht die Aufrufe sonst gar nicht; deshalb meldet sie der Browser.
 *
 * Ohne Cookies, ohne Speichern der IP-Adresse (Einzelheiten in
 * supabase/page_views_migration.sql). Nicht gezählt werden Roboter, die
 * Verwaltungsseiten und die eigenen Aufrufe von Peter und der Familie.
 *
 * Antwortet immer mit 204, auch wenn nichts gezählt wurde: die Meldung darf
 * die Seite nie stören und verrät nach außen nichts.
 */

const OWN_HOST = "culinse.com";
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

// Zufallswert des Tages; liegt in der Datenbank, damit er Neustarts übersteht.
let saltCache: { day: string; salt: string } | null = null;

async function dailySalt(day: string): Promise<string> {
  if (saltCache?.day === day) return saltCache.salt;
  let salt = newSalt();
  try {
    const db = createAdminClient();
    await db.from("page_view_salts").upsert({ day, salt }, { onConflict: "day", ignoreDuplicates: true });
    const { data } = await db.from("page_view_salts").select("salt").eq("day", day).single();
    if (data?.salt) salt = data.salt;
    // Ältere Zufallswerte löschen: damit sind die Hashes der Vortage endgültig anonym.
    await db.from("page_view_salts").delete().lt("day", day);
  } catch {
    // Ohne Tabelle gilt der Wert bis zum nächsten Neustart; gezählt wird trotzdem.
  }
  saltCache = { day, salt };
  return salt;
}

// Einfache Bremse gegen Dauerfeuer: höchstens 40 Meldungen je Besucher und Minute.
const recent = new Map<string, { count: number; start: number }>();

function tooMany(visitor: string): boolean {
  const now = Date.now();
  if (recent.size > 5000) recent.clear();
  const entry = recent.get(visitor);
  if (!entry || now - entry.start > 60_000) {
    recent.set(visitor, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  return entry.count > 40;
}

/** Angemeldet? Und falls ja: eines der eigenen Konten, die nicht zählen sollen? */
async function viewer(req: NextRequest): Promise<{ loggedIn: boolean; own: boolean }> {
  // Sitzungs-Cookie des Anmeldedienstes: sb-…-auth-token, bei langen Werten mit .0, .1 dahinter.
  const hasSession = req.cookies.getAll().some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
  if (!hasSession) return { loggedIn: false, own: false };
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const id = session?.user?.id;
    if (!id) return { loggedIn: false, own: false };
    return { loggedIn: true, own: id === CULINSE_OWNER_ID || CULINSE_FAMILY_IDS.includes(id) };
  } catch {
    return { loggedIn: false, own: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Nur Meldungen von der eigenen Seite.
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") return done();
    const origin = req.headers.get("origin");
    if (origin) {
      const host = new URL(origin).hostname;
      const local = host === "localhost" || host === "127.0.0.1";
      if (!local && host !== OWN_HOST && !host.endsWith(`.${OWN_HOST}`)) return done();
      // Die Vorschau auf dem eigenen Rechner arbeitet mit der echten Datenbank.
      // Ihre Aufrufe sind keine Besuche; gezählt werden sie nur, wenn man die
      // Zählung selbst testet (COUNT_LOCAL_VISITS=1 in .env.local).
      if (local && process.env.COUNT_LOCAL_VISITS !== "1") return done();
    }

    const userAgent = req.headers.get("user-agent") ?? "";
    if (isBot(userAgent)) return done();

    const text = await req.text();
    if (!text || text.length > 2000) return done();
    const body = JSON.parse(text) as { p?: unknown; r?: unknown; u?: unknown; e?: unknown };

    const path = normalizePath(body.p);
    if (!path) return done();
    const { locale, rest } = splitLocale(path);
    if (isUncounted(rest)) return done();

    const { loggedIn, own } = await viewer(req);
    if (own) return done();

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";
    const day = berlinDay();
    const visitor = visitorHash(await dailySalt(day), ip, userAgent);
    if (tooMany(visitor)) return done();

    const refHost = referrerHost(body.r, OWN_HOST);
    const utmSource = cleanUtmSource(body.u);
    const { device, browser, os } = parseUserAgent(userAgent);

    const { error } = await createAdminClient().from("page_views").insert({
      day,
      path,
      locale,
      kind: pageKind(rest),
      channel: classifyChannel(refHost, utmSource),
      ref_host: refHost,
      utm_source: utmSource,
      country: cleanCountry(req.headers.get("cf-ipcountry")),
      device,
      browser,
      os,
      visitor,
      is_entry: body.e === 1,
      logged_in: loggedIn,
    });
    if (error) console.error("besuch: Zeile nicht geschrieben:", error.message);
  } catch (e) {
    console.error("besuch: Meldung nicht verarbeitet:", e);
  }
  return done();
}
