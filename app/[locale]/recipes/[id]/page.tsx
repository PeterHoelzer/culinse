import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { landingState, parseState, stateToQuery, emptyState, type BrowseState, type Landing } from "@/lib/browse/facets";
import { landingSlug, resolveLanding } from "@/lib/browse/slugs";
import BrowseView, { browseMetadata } from "../BrowseView";

/*
  Themenseite: /recipes/<slug>, zum Beispiel /de/recipes/japanische-rezepte,
  /en/recipes/soups oder /de/recipes/bayern. Der Abschnitt heißt [id], weil
  daneben schon /recipes/<id>/edit liegt und Next je Ebene nur einen Namen
  zulässt; hier ist er der Slug eines Themas (lib/browse/slugs.ts).

  Jede Sprache hat ihren eigenen Slug. Kommt ein Slug einer anderen Sprache an
  (Sprachwechsel, alte englische Adresse), leitet die Seite dauerhaft auf den
  eigenen weiter. Unbekanntes ergibt 404.
*/

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Auf Themenseiten gelten aus der Adresse nur Sortierung und Seitenzahl.
function resolve(locale: string, slug: string, raw: Record<string, string | string[] | undefined>) {
  const landing: Landing | null = resolveLanding(slug);
  if (!landing) return null;
  const { sort, page } = parseState(raw);
  const state: BrowseState = { ...landingState(landing), sort, page };
  const own = landingSlug(locale, landing);
  const redirectTo = own === slug ? null : `/${locale}/recipes/${own}${stateToQuery({ ...emptyState(), sort, page })}`;
  return { landing, state, redirectTo };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const found = resolve(locale, id, await searchParams);
  return found && !found.redirectTo ? browseMetadata(locale, found.state, found.landing) : {};
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const found = resolve(locale, id, await searchParams);
  if (!found) notFound();
  if (found.redirectTo) permanentRedirect(found.redirectTo);
  return <BrowseView locale={locale} state={found.state} landing={found.landing} />;
}
