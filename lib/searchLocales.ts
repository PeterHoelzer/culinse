import { routing } from "@/i18n/routing";

/*
  Sprachen, die Suchmaschinen sehen (Entscheidung Peter, 22.11.2026).

  Die Website gibt es für Besucher weiter in allen 16 Sprachen. Für
  Suchmaschinen zählen vorerst nur die Sprachen in dieser Liste. Grund: Google
  ruft die Website kaum ab (Search Console am 22.11.2026: rund 220 Seitenabrufe
  in 90 Tagen, kein fremder Link, 213 Seiten im Index, alle auf Deutsch oder
  Englisch) und kennt über 60.000 Seiten der anderen 14 Sprachen, ohne je eine
  davon aufgenommen zu haben. Das wenige Abruf-Interesse soll auf die Seiten
  gehen, die eine Chance haben.

  An dieser einen Liste hängen:
  - die Sitemaps (lib/sitemaps.ts): nur diese Sprachen stehen darin,
  - die Sprachverweise im <head> (hreflang): nur diese Sprachen werden genannt,
  - robots.txt (app/robots.ts): alle anderen Sprachen sind für Crawler gesperrt,
  - das robots-Feld im <head> (app/[locale]/layout.tsx): alle anderen Sprachen
    tragen "noindex", falls ein Crawler die Sperre nicht beachtet.

  Zurückholen: Sprache hier ergänzen und ausliefern, mehr nicht. Danach den
  Seitenspeicher bei Cloudflare leeren, sonst liefert er noch die alte Fassung.
*/
export const SEARCH_LOCALES: readonly string[] = ["en", "de"];

/** Sprachen, die es für Besucher gibt, die Suchmaschinen aber nicht sehen. */
export const HIDDEN_LOCALES: readonly string[] = routing.locales.filter((locale) => !SEARCH_LOCALES.includes(locale));

export function isSearchLocale(locale: string): boolean {
  return SEARCH_LOCALES.includes(locale);
}

/**
 * hreflang-Angaben einer Seite: je Suchsprache eine Adresse, dazu x-default.
 * `urlFor` liefert die volle Adresse der Seite in der genannten Sprache.
 */
export function searchLanguages(urlFor: (locale: string) => string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SEARCH_LOCALES) languages[locale] = urlFor(locale);
  const fallback = isSearchLocale(routing.defaultLocale) ? routing.defaultLocale : SEARCH_LOCALES[0];
  if (fallback) languages["x-default"] = urlFor(fallback);
  return languages;
}
