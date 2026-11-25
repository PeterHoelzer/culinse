/*
  Besucherzählung: Seiten, die nicht gezählt werden (25.11.2026).

  Ohne Abhängigkeiten, damit der Browser (components/VisitBeacon.tsx) und der
  Server (lib/visits.ts, app/api/besuch) dieselbe Regel benutzen.
*/

const UNCOUNTED = /^\/(admin|geld)(\/|$)/;
const LOCALE_PREFIX = /^\/[a-z]{2}(?=\/|$)/;

/** Verwaltung und Statistik selbst. `rest` ist die Adresse ohne Sprache. */
export function isUncounted(rest: string): boolean {
  return UNCOUNTED.test(rest);
}

/*
  Die Anmeldeseite als Vorzimmer der Verwaltung.

  Wer /de/admin/besucher ohne Anmeldung öffnet, landet auf
  /de/login?redirectTo=/de/admin/besucher. In dem Moment ist der Inhaber noch
  nicht angemeldet und würde als Besucher der Anmeldeseite gezählt. Am ersten
  Abend der Zählung stand die Anmeldeseite deshalb ganz oben. Solche Aufrufe
  meldet der Browser gar nicht erst.

  `pathname` ist die Adresse der Seite mit Sprache, `search` der Teil ab dem
  Fragezeichen.
*/
export function isLoginForUncounted(pathname: string, search: string): boolean {
  if (!/^\/login\/?$/.test(pathname.replace(LOCALE_PREFIX, ""))) return false;
  const target = new URLSearchParams(search).get("redirectTo");
  if (!target || !target.startsWith("/") || target.startsWith("//")) return false;
  return isUncounted(target.split(/[?#]/)[0].replace(LOCALE_PREFIX, ""));
}
