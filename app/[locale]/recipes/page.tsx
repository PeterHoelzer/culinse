import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import HomeFooter from "../components/HomeFooter";
import { routing } from "@/i18n/routing";
import { isFiltered, parseState } from "@/lib/browse/facets";
import { runBrowse } from "@/lib/browse";
import BrowseClient from "./BrowseClient";

/*
  Stöberseite: alle Rezepte mit ankreuzbaren Filtern, Suche und Trefferzahlen.
  Der Filterzustand steht vollständig in der Adresse, die Seite rendert das
  Ergebnis auf dem Server. Dadurch sind gefilterte Ansichten teilbar, der
  Zurück-Knopf funktioniert, und Suchmaschinen erreichen über die Seitenzahlen
  jedes Rezept.
*/

const BASE_URL = "https://culinse.com";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const state = parseState(await searchParams);
  const t = await getTranslations({ locale, namespace: "browse" });
  const filtered = isFiltered(state) || state.sort !== "mix";
  const pageQuery = !filtered && state.page > 1 ? `?page=${state.page}` : "";
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/recipes${pageQuery}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `${BASE_URL}/${l}/recipes`])),
        "x-default": `${BASE_URL}/en/recipes`,
      },
    },
    // Gefilterte Ansichten sind beliebig kombinierbar und sollen den Index nicht
    // fluten; die ungefilterte Liste mit ihren Seiten bleibt indexierbar.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: `${t("metaTitle")} | Culinse`, description: t("metaDescription"), url: `${BASE_URL}/${locale}/recipes` },
  };
}

export default async function RecipesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const state = parseState(await searchParams);
  const result = await runBrowse(locale, state);
  // Seitenzahl über dem Ende wird auf die letzte Seite gekürzt.
  const shown = { ...state, page: result.page };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">
        <BrowseClient state={shown} result={result} />
      </main>
      <HomeFooter />
    </div>
  );
}
