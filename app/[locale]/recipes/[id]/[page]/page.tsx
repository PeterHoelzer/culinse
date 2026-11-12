import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { landingState, type BrowseState, type Landing } from "@/lib/browse/facets";
import { runBrowse } from "@/lib/browse";
import { landingSlug, resolveLanding } from "@/lib/browse/slugs";
import BrowseView, { browseMetadata } from "../../BrowseView";

/*
  Folgeseiten einer Themenseite: /recipes/<slug>/<seite>, ab Seite 2. Die
  Seitenzahl steht im Pfad statt in ?page=, damit auch diese Seiten aus dem
  Cache kommen (siehe ../page.tsx).
*/
export const revalidate = 3600;

export function generateStaticParams(): Array<{ locale: string; id: string; page: string }> {
  return [];
}

interface Props {
  params: Promise<{ locale: string; id: string; page: string }>;
}

type Found = { notFound: true } | { redirectTo: string } | { landing: Landing; state: BrowseState };

async function resolve(locale: string, slug: string, rawPage: string): Promise<Found> {
  const landing = resolveLanding(slug);
  if (!landing || !/^[1-9]\d{0,3}$/.test(rawPage)) return { notFound: true };
  const base = `/${locale}/recipes/${landingSlug(locale, landing)}`;
  const page = Number(rawPage);
  // Seite 1 ist die Themenseite selbst.
  if (page === 1) return { redirectTo: base };
  const state: BrowseState = { ...landingState(landing), page };
  // Eine Seitenzahl über dem Ende führt auf die letzte Seite, statt deren Inhalt
  // unter einer zweiten Adresse zu zeigen.
  const { pages } = await runBrowse(locale, state);
  if (page > pages) return { redirectTo: pages > 1 ? `${base}/${pages}` : base };
  if (landingSlug(locale, landing) !== slug) return { redirectTo: `${base}/${page}` };
  return { landing, state };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id, page } = await params;
  const found = await resolve(locale, id, page);
  return "landing" in found ? browseMetadata(locale, found.state, found.landing) : {};
}

export default async function TopicFollowPage({ params }: Props) {
  const { locale, id, page } = await params;
  setRequestLocale(locale);
  const found = await resolve(locale, id, page);
  if ("notFound" in found) notFound();
  if ("redirectTo" in found) permanentRedirect(found.redirectTo);
  return <BrowseView locale={locale} state={found.state} landing={found.landing} />;
}
