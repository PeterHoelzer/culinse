import localized from "./slugs.json";
import { LANDINGS, LANDING_BY_SLUG, landingState, parseState, stateToQuery, type Landing } from "./facets";

/*
  Adressen der Themenseiten je Sprache. lib/browse/slugs.json entsteht aus den
  Überschriften (scripts/generate-browse-slugs.mjs) und enthält die Sprachen mit
  lateinischer Schrift außer Englisch. Alles andere, auch jede Region, nutzt
  den neutralen Slug aus facets.ts (/en/recipes/japanese, /ja/recipes/japanese).
  Nur auf dem Server verwenden, damit die Liste nicht im Browser landet.
*/

const LOCALIZED = localized as Record<string, Record<string, string>>;
const LANDING_BY_ID = new Map(LANDINGS.map((l) => [`${l.group}:${l.key}`, l]));

// Jeder Slug jeder Sprache → Thema. Der Generator stellt sicher, dass ein Slug
// in keiner Sprache zwei verschiedene Themen meint.
const ANY_SLUG = new Map<string, Landing>(LANDING_BY_SLUG);
for (const map of Object.values(LOCALIZED)) {
  for (const [id, slug] of Object.entries(map)) {
    const landing = LANDING_BY_ID.get(id);
    if (landing) ANY_SLUG.set(slug, landing);
  }
}

/** Slug eines Themas in einer Sprache. */
export function landingSlug(locale: string, landing: Landing): string {
  return LOCALIZED[locale]?.[`${landing.group}:${landing.key}`] ?? landing.slug;
}

/** Pfad ohne Sprachpräfix, z. B. /recipes/japanische-rezepte. */
export function landingPath(locale: string, landing: Landing): string {
  return `/recipes/${landingSlug(locale, landing)}`;
}

/*
  Findet das Thema zu einem Slug, egal aus welcher Sprache er stammt. So führt
  auch der Sprachwechsel auf einer Themenseite und jede alte englische Adresse
  ans Ziel; die Seite leitet dann auf den Slug der eigenen Sprache weiter.
*/
export function resolveLanding(slug: string): Landing | null {
  return ANY_SLUG.get(slug.toLowerCase()) ?? null;
}

/*
  Alte Adressen einer Themenseite mit ?page= oder ?sort= (bis 12.11.2026). Die
  Themenseiten lesen keine Parameter mehr, damit sie aus dem Cache kommen:
  Folgeseiten liegen unter /recipes/<slug>/<seite>, sortierte Ansichten unter
  /recipes?…. Liefert die neue Adresse oder null, wenn der Slug kein Thema ist.
*/
export function legacyTopicTarget(locale: string, slug: string, params: URLSearchParams): string | null {
  const landing = resolveLanding(slug);
  if (!landing) return null;
  const { sort, page } = parseState({ sort: params.get("sort") ?? undefined, page: params.get("page") ?? undefined });
  if (sort !== "mix") return `/${locale}/recipes${stateToQuery({ ...landingState(landing), sort, page })}`;
  const base = `/${locale}${landingPath(locale, landing)}`;
  return page > 1 ? `${base}/${page}` : base;
}

