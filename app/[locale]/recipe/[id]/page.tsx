import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import RecipePageClient, { type Recipe, type SimilarRecipe } from "./RecipePageClient";
import { dishColorsWithin } from "@/lib/dishColor";
import { getTranslations } from "next-intl/server";
import { clipDescription, recipeSeoTitle } from "@/lib/siteMeta";
import { splitTitle } from "@/lib/recipeTitle";
import { LANDINGS, keysForTags, type GroupId, type Landing } from "@/lib/browse/facets";
import { landingPath } from "@/lib/browse/slugs";

// CPU-Bremse (30.08.): Rezeptseiten sind Bot-Crawl-Ziel Nr. 1 (~1.300 Server-
// Renders in 12 h) und standen fuer ~90 % der Vercel-Fluid-CPU (89 % des
// Hobby-Limits, Limit-Warnung). ISR statt SSR pro Hit: einmal rendern, 24 h
// aus dem Full-Route-Cache. Datenfrische unveraendert -- die API-Fetches unten
// cachen ohnehin schon 12-24 h im Data Cache. Das leere generateStaticParams
// aktiviert statisches Routing unter [locale]/[id] (on-demand, kein Prerender).
export const revalidate = 86400;

export function generateStaticParams(): Array<{ locale: string; id: string }> {
  return [];
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

// Die API liefert zu jedem Rezept seine Sprache und die IDs der übrigen
// Sprachfassungen (jede Sprache ist eine eigene Zeile mit eigener ID).
type LoadedRecipe = Recipe & {
  language?: string | null;
  translations?: Record<string, string>;
  topicTags?: string[];
  family?: boolean;
  editorial?: boolean;
  rating?: { count: number; average: number | null } | null;
};

/*
  Themen eines Rezepts (Küche, Region, Gang, Ernährung) aus seinen Schlagworten.
  Die Rezeptseite verlinkt damit auf die Themenseiten der Stöberseite; vorher
  standen dort nur die rohen Schlagworte als Text.
*/
const TOPIC_LIMITS: [GroupId, number][] = [["cuisine", 2], ["region", 1], ["course", 2], ["diet", 2]];

function recipeTopics(tags: readonly string[] | undefined): Landing[] {
  const ids = keysForTags((tags ?? []).map((tag) => String(tag).toLowerCase().trim()));
  const out: Landing[] = [];
  for (const [group, max] of TOPIC_LIMITS) {
    out.push(...LANDINGS.filter((l) => l.group === group && ids.has(`${group}:${l.key}`)).slice(0, max));
  }
  return out;
}

/*
  Adresse und Sprachverweise eines Rezepts (10.11.2026).

  Vorher nannte jede Rezeptseite als andere Sprachfassung dieselbe ID unter
  /en und /de. Dort stand dann das deutsche Rezept mit englischer Oberfläche,
  mit eigener kanonischer Adresse. Google hatte 61 Rezepte doppelt im Index.

  Jetzt gilt:
  - Passt die Sprache der Adresse nicht zum Rezept und gibt es die Fassung in
    dieser Sprache, leitet die Seite dauerhaft dorthin um.
  - Gibt es sie nicht, bleibt die Seite erreichbar, nennt aber die Adresse in
    der Sprache des Rezepts als kanonisch.
  - hreflang nennt je Sprache die ID der echten Fassung.
  - Rezepte ohne Sprache (alte Community-Rezepte) bleiben wie bisher unter
    /en und /de mit derselben ID, so stehen sie auch in der Sitemap.
*/
function recipeAddresses(
  recipe: LoadedRecipe | null,
  locale: string,
  id: string
): { redirectTo: string | null; canonical: string; languages: Record<string, string> } {
  const self = `${BASE_URL}/${locale}/recipe/${id}`;
  const language = recipe?.language ?? null;
  if (!recipe || !language) {
    return {
      redirectTo: null,
      canonical: self,
      languages: {
        en: `${BASE_URL}/en/recipe/${id}`,
        de: `${BASE_URL}/de/recipe/${id}`,
        "x-default": `${BASE_URL}/en/recipe/${id}`,
      },
    };
  }

  const translations: Record<string, string> = { ...(recipe.translations ?? {}), [language]: id };
  const languages: Record<string, string> = {};
  for (const [lang, recipeId] of Object.entries(translations)) {
    languages[lang] = `${BASE_URL}/${lang}/recipe/${recipeId}`;
  }
  languages["x-default"] = languages.en ?? languages[language];

  const sibling = translations[locale];
  return {
    redirectTo: locale !== language && sibling && sibling !== id ? `/${locale}/recipe/${sibling}` : null,
    canonical: languages[language],
    languages,
  };
}

async function fetchRecipe(id: string): Promise<LoadedRecipe | "missing" | null> {
  let res: Response;
  try {
    // v=8 (12.11.26, dateModified): Cache-Buster — der Vercel Data Cache ueberlebt Deploys (bis zu 24 h).
    // Bei jeder Aenderung am API-Response-Shape (z. B. neue Felder wie aiAssisted)
    // MUSS diese Versionsnummer hochgezaehlt werden, sonst servieren Rezeptseiten
    // bis zu einem Tag lang alte Daten ohne die neuen Felder.
    res = await fetch(`${BASE_URL}/api/recipe/${id}?v=8`, {
      next: { revalidate: 86400, tags: [`recipe-${id}`] },
    });
  } catch (cause) {
    throw new Error(`Rezept ${id} nicht ladbar`, { cause });
  }
  // 404 der API = Rezept existiert nicht -> echtes 404 der Seite (Soft-404-Fix,
  // SEO-Runde 17.08).
  if (res.status === 404) return "missing";
  // Andere Fehler: werfen statt eine leere Seite mit Status 200 zu rendern. Die
  // leere Fassung blieb sonst bis zu 24 Stunden im Cache (ohne Titel, Text und
  // strukturierte Daten); mit dem Fehler behaelt der Cache die letzte gute.
  if (!res.ok) throw new Error(`Rezept ${id}: API antwortet mit ${res.status}`);
  const { recipe } = await res.json();
  return recipe ?? null;
}

// Related recipes for the "Ähnliche Rezepte" section — fetched server-side so
// the internal links are part of the crawlable HTML (SEO: recipe pages as
// landing pages, Review-Paket C10).
async function fetchSimilar(id: string, locale: string, recipe: Recipe): Promise<SimilarRecipe[]> {
  const params = new URLSearchParams({
    id,
    lang: locale === "de" ? "de" : locale === "es" ? "es" : locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "pl" ? "pl" : locale === "tr" ? "tr" : locale === "nl" ? "nl" : locale === "cs" ? "cs" : locale === "ru" ? "ru" : locale === "pt" ? "pt" : locale === "zh" ? "zh" : locale === "ja" ? "ja" : locale === "id" ? "id" : locale === "vi" ? "vi" : locale === "bn" ? "bn" : "en",
    number: "8",
    // v=2 (12.11.26): neue Auswahl nach Küche und Region; ohne den Zusatz lieferte
    // der Data Cache bis zu 12 Stunden die alte Liste.
    v: "2",
  });
  const tags = Array.from(
    new Set(
      [...(recipe.diets ?? []), ...(recipe.dishTypes ?? []), ...(recipe.cuisine ? [recipe.cuisine] : [])]
        .map((t) => String(t).toLowerCase().trim())
        .filter(Boolean)
    )
  ).slice(0, 10);
  if (tags.length) params.set("tags", tags.join(","));
  if (recipe.title) params.set("title", recipe.title);

  try {
    const res = await fetch(`${BASE_URL}/api/similar-recipes?${params.toString()}`, {
      next: { revalidate: 43200 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; id: string }> }
): Promise<Metadata> {
  const { locale, id } = await params;

  // Canonical and hreflang must point to the recipe URL regardless of whether
  // the recipe data loaded — the layout sets homepage URLs as defaults, so we
  // must always override them here.
  const recipe = await fetchRecipe(id);
  const addresses = recipeAddresses(recipe === "missing" ? null : recipe, locale, id);
  const canonicalUrl = addresses.canonical;
  const sharedAlternates = {
    canonical: canonicalUrl,
    languages: addresses.languages,
  };

  if (!recipe || recipe === "missing") {
    return {
      title: (await getTranslations({ locale, namespace: "browse" }))("suggestRecipes"),
      description: "Discover delicious recipes on Culinse.",
      alternates: sharedAlternates,
    };
  }

  // Das Layout hängt " | Culinse" an. Lange Titel verzichten darauf oder auf die
  // Erklärung hinter dem Gedankenstrich (lib/siteMeta.ts).
  const seoTitle = recipeSeoTitle(locale, recipe.title, splitTitle(recipe.title).main);
  const title = seoTitle.text;
  // Der Text des Rezepts ist schon in der Sprache der Seite (eigene Zeile je
  // Sprache). Die frühere Prüfung per Wortliste stammt aus der Zeit der
  // englischen Fremdrezepte.
  const description = recipe.summary
    ? clipDescription(recipe.summary)
    : locale === "de"
      ? `${recipe.title}: Zutaten, Schritt-für-Schritt-Anleitung und Nährwerte auf Culinse.`
      : `${recipe.title}: ingredients, step-by-step instructions and nutrition facts on Culinse.`;

  return {
    title: seoTitle.absolute ? { absolute: title } : title,
    description,
    alternates: sharedAlternates,
    openGraph: {
      title,
      description,
      images: recipe.image ? [{ url: recipe.image }] : [],
      type: "article",
      url: canonicalUrl,
      siteName: "Culinse",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: recipe.image ? [recipe.image] : [],
    },
  };
}

// Ernährungsform für die strukturierten Daten, nach den Themenschlüsseln der
// Stöberseite. Vorher kannte die Zuordnung nur englische Wörter, die Schlagworte
// sind aber deutsch: das Feld blieb bei fast allen Rezepten leer.
const DIET_SCHEMA_MAP: Record<string, string> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  glutenfree: "https://schema.org/GlutenFreeDiet",
  lactosefree: "https://schema.org/LowLactoseDiet",
};

export default async function RecipePage(
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  const { locale, id } = await params;
  const fetched = await fetchRecipe(id);
  if (fetched === "missing") notFound();
  const recipe = fetched;
  const addresses = recipeAddresses(recipe, locale, id);
  if (addresses.redirectTo) permanentRedirect(addresses.redirectTo);
  const [similarRecipes, colors] = await Promise.all([
    recipe ? fetchSimilar(id, locale, recipe) : Promise.resolve([] as SimilarRecipe[]),
    recipe ? dishColorsWithin(recipe.image ?? null) : Promise.resolve(null),
  ]);

  // "Rezepte" in der Sprache der Seite; die erste Stufe führt zur Stöberseite,
  // danach Küche und Region, wenn das Rezept eine hat.
  const tBrowse = recipe ? await getTranslations({ locale, namespace: "browse" }) : null;
  const recipesLabel = tBrowse ? tBrowse("suggestRecipes") : "";
  const topics = (recipe && tBrowse ? recipeTopics(recipe.topicTags ?? recipe.diets) : []).map((l) => ({
    group: l.group,
    key: l.key,
    label: l.name ?? tBrowse!(`options.${l.group}.${l.key}`),
    href: landingPath(locale, l),
    green: l.group === "diet" && (l.key === "vegetarian" || l.key === "vegan"),
  }));
  // Küche und Gang für die strukturierten Daten kommen aus denselben Themen wie
  // die Links der Seite, in der Sprache der Seite. Die Rezepte aus dem eigenen
  // Bestand tragen weder cuisine noch dishTypes, die Felder blieben bisher leer.
  const topicLabel = (group: string) => topics.find((t) => t.group === group)?.label;
  const topicKeys = recipe ? keysForTags((recipe.topicTags ?? recipe.diets ?? []).map((tag) => String(tag).toLowerCase().trim())) : new Set<string>();
  const suitableForDiet = Object.entries(DIET_SCHEMA_MAP)
    .filter(([key]) => topicKeys.has(`diet:${key}`))
    .map(([, url]) => url);

  // Build Recipe JSON-LD for Google Rich Results — single source of truth,
  // rendered server-side so it's in the crawlable HTML.
  const dishTypes = recipe?.dishTypes ?? [];
  const hasSource = !!recipe?.sourceUrl && recipe.sourceUrl !== "#";

  const jsonLd = recipe
    ? {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: recipe.title,
        description: recipe.summary
          ? recipe.summary.replace(/<[^>]+>/g, "").slice(0, 300)
          : `Learn how to make ${recipe.title}.`,
        image: (recipe.images?.length ? recipe.images : recipe.image ? [recipe.image] : []).map((u: string) =>
          recipe.aiAssisted ? { "@type": "ImageObject", url: u, creditText: "KI-generiert / AI-generated" } : u
        ),
        author: {
          "@type": "Organization",
          name: recipe.editorial ? "Culinse" : recipe.source || "Culinse",
          ...(hasSource ? { url: recipe.sourceUrl } : {}),
        },
        // Redaktion: dieselbe Person wie auf der Über-uns-Seite und in den Blogartikeln.
        ...(recipe.editorial
          ? {
              editor: {
                "@type": "Person",
                "@id": "https://culinse.com/#peter",
                name: "Peter Hölzer",
                jobTitle: locale === "de" ? "Küchenchef & Fleischermeister" : "Head Chef & German Master Butcher (Fleischermeister)",
                url: `${BASE_URL}/${locale}/about`,
              },
            }
          : {}),
        publisher: {
          "@type": "Organization",
          name: "Culinse",
          url: "https://culinse.com",
          logo: {
            "@type": "ImageObject",
            url: "https://culinse.com/culinse-logo.png",
          },
        },
        url: addresses.canonical,
        ...(recipe.language ? { inLanguage: recipe.language } : {}),
        // Aggregated recipes link back to the original source for attribution.
        ...(hasSource ? { isBasedOn: recipe.sourceUrl } : {}),
        // prepTime + cookTime must be emitted together (Google requires the pair).
        ...(recipe.prepTime && recipe.prepTime > 0 && recipe.cookTime && recipe.cookTime > 0
          ? { prepTime: `PT${recipe.prepTime}M`, cookTime: `PT${recipe.cookTime}M` }
          : {}),
        ...(recipe.time && !isNaN(parseInt(recipe.time))
          ? { totalTime: `PT${parseInt(recipe.time)}M` }
          : {}),
        ...(recipe.datePublished ? { datePublished: recipe.datePublished } : {}),
        ...(recipe.dateModified ? { dateModified: recipe.dateModified } : {}),
        // Sterne nur mit echten Bewertungen von angemeldeten Nutzern.
        ...(recipe.rating && recipe.rating.count > 0 && recipe.rating.average
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: recipe.rating.average,
                ratingCount: recipe.rating.count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
        ...(recipe.cuisine || topicLabel("cuisine") ? { recipeCuisine: recipe.cuisine || topicLabel("cuisine") } : {}),
        // Nur die Zahl: "servings" wäre auf 15 von 16 Sprachen englisch.
        ...(recipe.servings ? { recipeYield: String(recipe.servings) } : {}),
        ...(dishTypes.length || topicLabel("course") ? { recipeCategory: dishTypes[0] ?? topicLabel("course") } : {}),
        // Nur übersetzte Themen: die rohen Schlagworte sind in jeder Sprache deutsch.
        ...(dishTypes.length || topics.length
          ? { keywords: Array.from(new Set([...topics.map((t) => t.label), ...dishTypes])).join(", ") }
          : {}),
        ...(recipe.nutrition
          ? {
              nutrition: {
                "@type": "NutritionInformation",
                ...(recipe.nutrition.calories != null ? { calories: `${recipe.nutrition.calories} kcal` } : {}),
                ...(recipe.nutrition.protein != null ? { proteinContent: `${recipe.nutrition.protein} g` } : {}),
                ...(recipe.nutrition.fat != null ? { fatContent: `${recipe.nutrition.fat} g` } : {}),
                ...(recipe.nutrition.carbs != null ? { carbohydrateContent: `${recipe.nutrition.carbs} g` } : {}),
              },
            }
          : {}),
        recipeIngredient: recipe.ingredients?.map((i) => i.original) ?? [],
        recipeInstructions:
          recipe.instructions?.map((s) => ({
            "@type": "HowToStep",
            text: s.step,
          })) ?? [],
        ...(suitableForDiet.length ? { suitableForDiet } : {}),
      }
    : null;

  const trail = topics.filter((x) => x.group === "cuisine").slice(0, 1).concat(topics.filter((x) => x.group === "region"));
  const breadcrumbLd = recipe
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: recipesLabel, item: `${BASE_URL}/${locale}/recipes` },
          ...trail.map((x, i) => ({ "@type": "ListItem", position: i + 2, name: x.label, item: `${BASE_URL}/${locale}${x.href}` })),
          { "@type": "ListItem", position: trail.length + 2, name: recipe.title, item: addresses.canonical },
        ],
      }
    : null;

  return (
    <>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbLd)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}
      {/* Pass the server-fetched recipe so ingredients + instructions are in the
          SSR HTML from the first byte — Googlebot sees the full recipe without
          executing JavaScript. The client component takes over for interactivity
          (save, print, DE translation) using this as its initial data. */}
      <RecipePageClient
        key={`${locale}-${id}`}
        serverTitle={recipe?.title ?? null}
        initialRecipe={recipe}
        similarRecipes={similarRecipes}
        colors={colors}
        topics={topics}
      />
    </>
  );
}
