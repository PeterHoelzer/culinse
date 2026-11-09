import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { parseState } from "@/lib/browse/facets";
import BrowseView, { browseMetadata } from "./BrowseView";

/*
  Stöberseite: alle Rezepte mit ankreuzbaren Filtern, Suche und Trefferzahlen.
  Der Filterzustand steht vollständig in der Adresse, die Seite rendert das
  Ergebnis auf dem Server. Dadurch sind gefilterte Ansichten teilbar, der
  Zurück-Knopf funktioniert, und Suchmaschinen erreichen über die Seitenzahlen
  jedes Rezept.
*/

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  return browseMetadata(locale, parseState(await searchParams), null);
}

export default async function RecipesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BrowseView locale={locale} state={parseState(await searchParams)} landing={null} />;
}
