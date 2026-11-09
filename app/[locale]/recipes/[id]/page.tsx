import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { LANDING_BY_SLUG, landingState, parseState, type BrowseState, type Landing } from "@/lib/browse/facets";
import BrowseView, { browseMetadata } from "../BrowseView";

/*
  Themenseite: /recipes/<slug>, zum Beispiel /recipes/japanese, /recipes/soups
  oder /recipes/bayern. Der Abschnitt heißt [id], weil daneben schon
  /recipes/<id>/edit liegt und Next je Ebene nur einen Namen zulässt; hier ist
  er der Slug eines Filters aus lib/browse/facets.ts. Unbekanntes ergibt 404.
*/

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Auf Themenseiten gelten aus der Adresse nur Sortierung und Seitenzahl.
function resolve(slug: string, raw: Record<string, string | string[] | undefined>): { landing: Landing; state: BrowseState } | null {
  const landing = LANDING_BY_SLUG.get(slug);
  if (!landing) return null;
  const { sort, page } = parseState(raw);
  return { landing, state: { ...landingState(landing), sort, page } };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const found = resolve(id, await searchParams);
  return found ? browseMetadata(locale, found.state, found.landing) : {};
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const found = resolve(id, await searchParams);
  if (!found) notFound();
  return <BrowseView locale={locale} state={found.state} landing={found.landing} />;
}
