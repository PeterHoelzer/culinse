/*
  Einfache Bremse für Schnittstellen (25.11.2026, Sicherheitsprüfung).

  Zählt Aufrufe je Schlüssel (Besucher-Adresse oder Konto) in einem festen
  Zeitfenster. Die Zähler liegen im Arbeitsspeicher des einen Website-Containers.
  Das genügt, solange die Website in einem Container läuft; nach einem Neustart
  beginnen die Zähler neu.

  Die Bremse schützt vor Dauerfeuer aus einer Quelle (Kosten bei DeepL, volle
  Tabellen, Massenmails). Gegen verteilte Angriffe hilft sie nicht; dafür sind
  die Regeln bei Cloudflare da.
*/

type Window = { count: number; start: number };

const buckets = new Map<string, Map<string, Window>>();
const MAX_KEYS = 20_000;

function prune(bucket: Map<string, Window>, now: number, windowMs: number) {
  for (const [key, entry] of bucket) {
    if (now - entry.start > windowMs) bucket.delete(key);
  }
  // Immer noch voll: die ältesten Einträge zuerst entfernen (Map behält die Reihenfolge).
  for (const key of bucket.keys()) {
    if (bucket.size <= MAX_KEYS / 2) break;
    bucket.delete(key);
  }
}

/**
 * True, wenn der Aufruf noch erlaubt ist. `name` trennt die Zähler der
 * Schnittstellen, `key` ist die Quelle, `cost` das Gewicht des Aufrufs
 * (z. B. Zeichenzahl statt 1).
 */
export function allowRequest(name: string, key: string, limit: number, windowMs: number, cost = 1): boolean {
  const now = Date.now();
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }
  if (bucket.size > MAX_KEYS) prune(bucket, now, windowMs);

  const entry = bucket.get(key);
  if (!entry || now - entry.start > windowMs) {
    bucket.set(key, { count: cost, start: now });
    return cost <= limit;
  }
  entry.count += cost;
  return entry.count <= limit;
}

/**
 * Adresse des Besuchers. Cloudflare setzt cf-connecting-ip; ohne Cloudflare
 * (lokal, direkter Zugriff) gilt der erste Eintrag von x-forwarded-for.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unbekannt"
  );
}

export const tooManyRequests = () =>
  new Response(JSON.stringify({ error: "too_many_requests" }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "60", "Cache-Control": "no-store" },
  });
