import { routing } from "@/i18n/routing";

/*
  Wohin es nach der Anmeldung geht (17.11.2026). Wer sich von einer Seite aus
  anmeldet, landet danach wieder dort statt auf der Startseite.

  - Verweise auf die Anmeldung hängen die aktuelle Seite als ?redirectTo= an
    (loginHref). Die Middleware tut das für geschützte Seiten schon selbst.
  - Bei Google und bei der Bestätigungs-Mail verlässt der Besucher die Seite.
    Das Ziel wartet so lange in einem kurzlebigen Cookie (rememberLoginTarget);
    app/auth/callback/route.ts liest und löscht es. So muss beim Anmeldedienst
    keine weitere Rücksprung-Adresse erlaubt werden.
  - Ziel ist immer nur ein Pfad auf der eigenen Seite (safeLoginTarget), sonst
    könnte ein präparierter Link nach der Anmeldung auf eine fremde Seite führen.
*/

export const LOGIN_TARGET_COOKIE = "culinse_login_target";
/** Eine Stunde: so lange gilt auch der Link in der Bestätigungs-Mail. */
const LOGIN_TARGET_MAX_AGE = 60 * 60;

// Nur zum Zerlegen gedacht; der Name kann nie ein echter Host sein.
const PARSE_BASE = "http://internal.invalid";

const localePattern = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

// Seiten, auf die niemand nach der Anmeldung zurück soll.
const NO_RETURN = /^\/(login|reset-password|update-password|auth|api)(\/|$)/;

/** Trennt die Sprache vom Rest: "/nl/recipe/x?a=1" wird zu { locale: "nl", rest: "/recipe/x?a=1" }. */
export function splitLocale(path: string): { locale: string | null; rest: string } {
  const match = path.match(localePattern);
  if (!match) return { locale: null, rest: path };
  return { locale: match[1], rest: path.slice(match[0].length) || "/" };
}

/**
 * Gibt das Ziel nur zurück, wenn es ein Pfad auf der eigenen Seite ist, sonst null.
 * Abgelehnt werden fremde Adressen ("https://…"), "//host", Rückstriche und
 * Steuerzeichen (Browser lesen "/\host" und "/<Tab>/host" wie "//host").
 */
export function safeLoginTarget(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PARSE_BASE);
  } catch {
    return null;
  }
  if (url.origin !== PARSE_BASE) return null;

  // Nach dem Auflösen von "." und ".." erneut prüfen: "/.//host" wird zu "//host".
  if (url.pathname.startsWith("//")) return null;
  if (NO_RETURN.test(splitLocale(url.pathname).rest)) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

/** Verweis auf die Anmeldung, der die Seite `currentPath` als Ziel mitgibt. Ohne Sprache; die stellt der Link von next-intl voran. */
export function loginHref(currentPath: string | null | undefined): string {
  const target = safeLoginTarget(currentPath);
  return target ? `/login?redirectTo=${encodeURIComponent(target)}` : "/login";
}

/** Merkt sich das Ziel im Browser, bevor es zu Google oder ins Postfach geht. Ohne Ziel wird ein altes gelöscht. */
export function rememberLoginTarget(target: string | null): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const base = `${LOGIN_TARGET_COOKIE}=${target ? encodeURIComponent(target) : ""}; Path=/; SameSite=Lax${secure}`;
  document.cookie = `${base}; Max-Age=${target ? LOGIN_TARGET_MAX_AGE : 0}`;
}
