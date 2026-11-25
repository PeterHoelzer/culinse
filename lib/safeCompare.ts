import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Vergleicht zwei Geheimnisse, ohne über die Laufzeit zu verraten, wie viele
 * Zeichen stimmen. Beide Seiten werden vorher gehasht, damit auch die Länge
 * nichts verrät. Leere oder fehlende Werte sind nie gleich.
 */
export function safeEqual(given: string | null | undefined, expected: string | null | undefined): boolean {
  if (!given || !expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
