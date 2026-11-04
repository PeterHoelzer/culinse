import type { CopperCityLocale, CopperCityLocaleCode } from "./types";
import de from "./locales/de";
import en from "./locales/en";
import fr from "./locales/fr";
import es from "./locales/es";
import it from "./locales/it";
import ptBR from "./locales/pt-BR";
import ja from "./locales/ja";
import zhHant from "./locales/zh-Hant";
import zhHans from "./locales/zh-Hans";
import ko from "./locales/ko";
import nl from "./locales/nl";
import sv from "./locales/sv";
import da from "./locales/da";
import nb from "./locales/no";
import tr from "./locales/tr";
import pl from "./locales/pl";
import ru from "./locales/ru";

export const SUPPORT_MAIL = "peter@hoelzer.xyz";

/** Reihenfolge = Reihenfolge in der Sprachübersicht */
export const copperCityLocales: CopperCityLocale[] = [
  de,
  en,
  fr,
  es,
  it,
  ptBR,
  nl,
  sv,
  da,
  nb,
  pl,
  tr,
  ru,
  ja,
  ko,
  zhHant,
  zhHans,
];

export const copperCityLocaleCodes = copperCityLocales.map((l) => l.code);

export function getCopperCityLocale(code: string): CopperCityLocale | undefined {
  return copperCityLocales.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

/** URL der Support-Seite einer Sprache (de/en bleiben auf den bestehenden Adressen) */
export function supportPath(code: CopperCityLocaleCode): string {
  return code === "de" || code === "en" ? "/copper-city" : `/copper-city/${code}`;
}

/** URL der Datenschutzerklärung einer Sprache */
export function privacyPath(code: CopperCityLocaleCode): string {
  return code === "de" || code === "en" ? "/copper-city/datenschutz" : `/copper-city/${code}/privacy`;
}

export type { CopperCityLocale, CopperCityLocaleCode } from "./types";
