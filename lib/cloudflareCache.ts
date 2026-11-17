import { after } from "next/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/siteUrls";

/*
  Zwischenspeicher von Cloudflare (17.11.2026).

  Cloudflare speichert die fertigen Seiten in seinem Netz, so lange, wie die
  Website es vorgibt (s-maxage; Rezeptseiten 30 Tage). revalidateTag erneuert
  nur den Speicher der Website selbst. Damit Besucher nach einer Rezept-Änderung
  nicht bis zu 30 Tage die alte Seite von Cloudflare bekommen, werden die
  Adressen dieses Rezepts dort gezielt geleert.

  Geleert wird nach Adress-Anfang (/de/recipe/<id>, in allen Sprachen). Das
  trifft die Seite selbst und alle ihre Fassungen mit ?_rsc=…, die der Browser
  beim Wechsel zwischen Seiten abruft.

  Schlüssel und Zonen-Kennung kommen zur Laufzeit aus CLOUDFLARE_PURGE_TOKEN
  und CLOUDFLARE_ZONE_ID (in Coolify eingetragen von
  deploy/cloudflare-leeren.sh --schluessel-an-website). Ohne die beiden
  Variablen passiert nichts: lokal, und bei Vercel als Rückweg. Nach einer
  Auslieferung leert der Server alles (deploy/cloudflare-leeren.sh).
*/

const API = "https://api.cloudflare.com/client/v4";
/** Cloudflare nimmt höchstens 100 Einträge je Anfrage. */
const PER_REQUEST = 100;
/** Kostenloser Tarif: 5 Anfragen je Minute, 25 auf Vorrat. Ab dieser Menge wird stattdessen ein Mal alles geleert. */
const EVERYTHING_ABOVE = 1000;
/**
  Zweiter Durchgang: Eine Antwort mit dem alten Stand, die beim ersten Leeren
  noch unterwegs war, landet sonst danach im Speicher und bliebe 30 Tage.
*/
const REPEAT_MS = 20_000;
const RETRY_MS = 30_000;
const MAX_ATTEMPTS = 3;

type Access = { token: string; zone: string };

function access(): Access | null {
  const token = process.env.CLOUDFLARE_PURGE_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  return token && zone ? { token, zone } : null;
}

/** Adress-Anfänge, die auf das nächste Leeren warten. Mehrere Änderungen in einer Anfrage gehen zusammen hinaus. */
const waiting = new Set<string>();

/** Leert die Seite eines Rezepts in allen Sprachen bei Cloudflare; `pageId` ist die ID aus der Adresse (user_<uuid>). */
export function purgeRecipeAtCloudflare(pageId: string): void {
  if (!access()) return;
  const host = new URL(SITE_URL).host;
  for (const locale of routing.locales) waiting.add(`${host}/${locale}/recipe/${pageId}`);
  try {
    // Erst nach der Antwort: Dann hat die Website ihren eigenen Speicher schon
    // erneuert, und Cloudflare holt sich beim nächsten Abruf den neuen Stand.
    after(flush);
  } catch {
    // Außerhalb einer Anfrage gibt es kein "danach".
    void flush();
  }
}

async function flush(): Promise<void> {
  if (!waiting.size) return;
  const prefixes = [...waiting];
  waiting.clear();
  await purge(prefixes, 1);
  setTimeout(() => void purge(prefixes, 1), REPEAT_MS).unref();
}

async function purge(prefixes: string[], attempt: number): Promise<void> {
  const failed: string[] = [];
  if (prefixes.length > EVERYTHING_ABOVE) {
    if (!(await send({ purge_everything: true }))) failed.push(...prefixes);
  } else {
    for (let i = 0; i < prefixes.length; i += PER_REQUEST) {
      const part = prefixes.slice(i, i + PER_REQUEST);
      if (!(await send({ prefixes: part }))) failed.push(...part);
    }
  }
  if (!failed.length) return;
  if (attempt >= MAX_ATTEMPTS) {
    console.error(`Cloudflare-Speicher: ${failed.length} Adressen nicht geleert, zum Beispiel ${failed[0]}`);
    return;
  }
  setTimeout(() => void purge(failed, attempt + 1), RETRY_MS).unref();
}

async function send(body: { prefixes: string[] } | { purge_everything: true }): Promise<boolean> {
  const cf = access();
  if (!cf) return true;
  try {
    const res = await fetch(`${API}/zones/${cf.zone}/purge_cache`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cf.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return true;
    // Den Schlüssel nie mitschreiben: nur Status und Cloudflares Fehlertext.
    console.error(`Cloudflare-Speicher: Leeren abgelehnt (${res.status}) ${(await res.text()).slice(0, 200)}`);
  } catch (error) {
    console.error("Cloudflare-Speicher: nicht erreichbar", error);
  }
  return false;
}
