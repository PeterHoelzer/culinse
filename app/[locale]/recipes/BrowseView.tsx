import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import { chipClasses } from "@/components/ui/styles";
import { Link } from "@/lib/navigation";
import { routing } from "@/i18n/routing";
import {
  FACET_GROUPS,
  LANDINGS,
  LANDING_MIN,
  PAGE_SIZE,
  browseHref,
  emptyState,
  isFiltered,
  landingOf,
  type BrowseState,
  type GroupId,
  type Landing,
} from "@/lib/browse/facets";
import { runBrowse } from "@/lib/browse";
import HomeFooter from "../components/HomeFooter";
import BrowseClient from "./BrowseClient";

/*
  Gemeinsame Ansicht für die Stöberseite (/recipes) und ihre Themenseiten
  (/recipes/<slug>, z. B. /recipes/japanese). Eine Themenseite ist dieselbe
  Liste mit einem vorgewählten Filter, eigener Überschrift und fester Adresse,
  damit Suchmaschinen sie als eigene Seite führen können.
*/

const BASE_URL = "https://culinse.com";
const TOPIC_GROUPS: GroupId[] = ["cuisine", "course", "dish", "diet", "occasion", "method"];

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function landingTitle(t: Translate, landing: Landing): string {
  return landing.group === "region" ? t("landing.region", { name: landing.name ?? landing.key }) : t(`landing.titles.${landing.group}.${landing.key}`);
}

const pageSuffix = (state: BrowseState) => (state.page > 1 ? `?page=${state.page}` : "");

export async function browseMetadata(locale: string, state: BrowseState, landing: Landing | null): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "browse" });
  // Ein einzelner Filter über Parameter (/recipes?cuisine=japanese) ist dieselbe
  // Seite wie die Themenseite; die Themenseite ist die maßgebliche Adresse.
  const target = landing ?? landingOf(state);
  const languages = (path: string) => ({
    ...Object.fromEntries(routing.locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
    "x-default": `${BASE_URL}/en${path}`,
  });

  if (target) {
    const { total } = await runBrowse(locale, state);
    const path = `/recipes/${target.slug}`;
    const title = landingTitle(t, target);
    const description = `${t("results", { count: total })}. ${t("landing.metaDescription")}`;
    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/${locale}${path}${pageSuffix(state)}`, languages: languages(path) },
      // Dünne Themen und umsortierte Fassungen bleiben aus dem Index.
      robots: total < LANDING_MIN || state.sort !== "mix" ? { index: false, follow: true } : undefined,
      openGraph: { title: `${title} | Culinse`, description, url: `${BASE_URL}/${locale}${path}` },
    };
  }

  const filtered = isFiltered(state) || state.sort !== "mix";
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `${BASE_URL}/${locale}/recipes${filtered ? "" : pageSuffix(state)}`, languages: languages("/recipes") },
    // Frei kombinierte Filter sollen den Index nicht fluten; die ungefilterte
    // Liste mit ihren Seiten bleibt indexierbar.
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: `${t("metaTitle")} | Culinse`, description: t("metaDescription"), url: `${BASE_URL}/${locale}/recipes` },
  };
}

export default async function BrowseView({ locale, state, landing }: { locale: string; state: BrowseState; landing: Landing | null }) {
  const [result, base, t] = await Promise.all([
    runBrowse(locale, state),
    runBrowse(locale, emptyState()),
    getTranslations({ locale, namespace: "browse" }),
  ]);
  // Seitenzahl über dem Ende wird auf die letzte Seite gekürzt.
  const shown = { ...state, page: result.page };
  const title = landing ? landingTitle(t, landing) : t("title");

  // Themen mit genug Rezepten, als echte Links: so erreichen Besucher und
  // Suchmaschinen jede Themenseite ohne JavaScript.
  const big = (l: Landing) => (base.counts[`${l.group}:${l.key}`] ?? 0) >= LANDING_MIN;
  const cuisineHere = landing?.group === "cuisine" ? landing.key : landing?.parent;
  const topics = [
    ...(cuisineHere
      ? [{ id: "region" as GroupId, items: LANDINGS.filter((l) => l.group === "region" && l.parent === cuisineHere && big(l)) }]
      : []),
    ...TOPIC_GROUPS.map((id) => ({ id, items: LANDINGS.filter((l) => l.group === id && big(l)) })),
  ].filter((group) => group.items.length > 0);
  const order = new Map(FACET_GROUPS.map((g, i) => [g.id, i]));
  topics.sort((a, b) => (a.id === "region" ? -1 : b.id === "region" ? 1 : order.get(a.id)! - order.get(b.id)!));

  const jsonLd = landing && {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Culinse", item: `${BASE_URL}/${locale}` },
          { "@type": "ListItem", position: 2, name: t("title"), item: `${BASE_URL}/${locale}/recipes` },
          { "@type": "ListItem", position: 3, name: title, item: `${BASE_URL}/${locale}/recipes/${landing.slug}` },
        ],
      },
      {
        "@type": "ItemList",
        name: title,
        numberOfItems: result.total,
        itemListElement: result.items.map((item, i) => ({
          "@type": "ListItem",
          position: (result.page - 1) * PAGE_SIZE + i + 1,
          url: `${BASE_URL}/${locale}/recipe/${item.id}`,
          name: item.title,
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Navbar />
      <main className="flex-1">
        <BrowseClient
          state={shown}
          result={result}
          title={title}
          subtitle={landing ? t("landing.intro") : t("subtitle")}
          backLabel={landing ? t("landing.all") : undefined}
          onLanding={Boolean(landing)}
        >
          <section aria-labelledby="browse-topics" className="mt-14 border-t border-line pt-10">
            <h2 id="browse-topics" className="text-h2-sm sm:text-h2">
              {t("landing.topics")}
            </h2>
            <div className="mt-6 flex flex-col gap-6">
              {topics.map((group) => (
                <div key={group.id}>
                  <p className="mb-3 text-base font-semibold text-ink">{t(`groups.${group.id}`)}</p>
                  <ul className="flex flex-wrap gap-2">
                    {group.items.map((l) => {
                      const current = landing?.slug === l.slug;
                      return (
                        <li key={l.slug}>
                          <Link href={browseHref({ ...emptyState(), sel: { ...emptyState().sel, [l.group]: [l.key] } }) as "/"} aria-current={current ? "page" : undefined} className={chipClasses(current, "sm")}>
                            {l.name ?? t(`options.${l.group}.${l.key}`)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </BrowseClient>
      </main>
      <HomeFooter />
    </div>
  );
}
