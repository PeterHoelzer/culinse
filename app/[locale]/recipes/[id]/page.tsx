import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { landingState, type Landing } from "@/lib/browse/facets";
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

  Seit 12.11.2026 liest die Seite keine Adress-Parameter mehr. Solange sie
  ?page und ?sort auswertete, rechnete Next sie bei jedem Abruf neu (rund eine
  Sekunde, ohne Cache). Jetzt wird sie wie die Rezeptseite einmal gerendert und
  eine Stunde aus dem Cache geliefert. Folgeseiten liegen unter
  /recipes/<slug>/<seite> ([page]/page.tsx); Sortierung und freie Filter laufen
  über /recipes?… und sind ohnehin nicht im Index. Alte Adressen mit ?page oder
  ?sort leitet middleware.ts um.
*/
export const revalidate = 3600;

// Leer: nichts wird beim Build gerendert, jede Themenseite entsteht beim ersten
// Abruf und bleibt dann im Cache.
export function generateStaticParams(): Array<{ locale: string; id: string }> {
  return [];
}

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

function resolve(locale: string, slug: string) {
  const landing: Landing | null = resolveLanding(slug);
  if (!landing) return null;
  const own = landingSlug(locale, landing);
  return { landing, state: landingState(landing), redirectTo: own === slug ? null : `/${locale}/recipes/${own}` };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const found = resolve(locale, id);
  return found && !found.redirectTo ? browseMetadata(locale, found.state, found.landing) : {};
}

export default async function TopicPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const found = resolve(locale, id);
  if (!found) notFound();
  if (found.redirectTo) permanentRedirect(found.redirectTo);
  return <BrowseView locale={locale} state={found.state} landing={found.landing} />;
}
