import type { Metadata } from "next";
import RecipePageClient, { type Recipe } from "./RecipePageClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

async function fetchRecipe(id: string): Promise<Recipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/recipe/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const { recipe } = await res.json();
    return recipe ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; id: string }> }
): Promise<Metadata> {
  const { locale, id } = await params;

  // Canonical and hreflang must point to the recipe URL regardless of whether
  // the recipe data loaded — the layout sets homepage URLs as defaults, so we
  // must always override them here.
  const canonicalUrl = `${BASE_URL}/${locale}/recipe/${id}`;
  const sharedAlternates = {
    canonical: canonicalUrl,
    languages: {
      en: `${BASE_URL}/en/recipe/${id}`,
      de: `${BASE_URL}/de/recipe/${id}`,
      "x-default": `${BASE_URL}/en/recipe/${id}`,
    },
  };

  const recipe = await fetchRecipe(id);
  if (!recipe) {
    return {
      title: locale === "de" ? "Rezept" : "Recipe",
      description: "Discover delicious recipes on Culinse.",
      alternates: sharedAlternates,
    };
  }

  // The layout title template is "%s | Culinse", so we must NOT include
  // "Culinse" here — that would produce "Title | Culinse | Culinse".
  const recipeSuffix = locale === "de" ? "Rezept" : "Recipe";
  const title = `${recipe.title} ${recipeSuffix}`;
  const description = recipe.summary
    ? recipe.summary.replace(/<[^>]+>/g, "").slice(0, 155)
    : locale === "de"
    ? `So wird ${recipe.title} gemacht – auf Culinse.`
    : `Discover how to make ${recipe.title} on Culinse.`;

  return {
    title,
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

const DIET_SCHEMA_MAP: Record<string, string> = {
  "vegetarian": "https://schema.org/VegetarianDiet",
  "vegan": "https://schema.org/VeganDiet",
  "gluten free": "https://schema.org/GlutenFreeDiet",
  "dairy free": "https://schema.org/DairyFreeDiet",
  "ketogenic": "https://schema.org/LowCalorieDiet",
  "low fodmap": "https://schema.org/LowLactoseDiet",
};

export default async function RecipePage(
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  const { locale, id } = await params;
  const recipe = await fetchRecipe(id);

  // Build Recipe JSON-LD for Google Rich Results — single source of truth,
  // rendered server-side so it's in the crawlable HTML.
  const dishTypes = recipe?.dishTypes ?? [];
  const diets = recipe?.diets ?? [];
  const hasSource = !!recipe?.sourceUrl && recipe.sourceUrl !== "#";

  const jsonLd = recipe
    ? {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: recipe.title,
        description: recipe.summary
          ? recipe.summary.replace(/<[^>]+>/g, "").slice(0, 300)
          : `Learn how to make ${recipe.title}.`,
        image: recipe.image ? [recipe.image] : [],
        author: {
          "@type": "Organization",
          name: recipe.source || "Culinse",
          ...(hasSource ? { url: recipe.sourceUrl } : {}),
        },
        publisher: {
          "@type": "Organization",
          name: "Culinse",
          url: "https://culinse.com",
          logo: {
            "@type": "ImageObject",
            url: "https://culinse.com/culinse-logo.png",
          },
        },
        url: `${BASE_URL}/${locale}/recipe/${id}`,
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
        ...(recipe.cuisine ? { recipeCuisine: recipe.cuisine } : {}),
        ...(recipe.servings
          ? { recipeYield: `${recipe.servings} serving${recipe.servings > 1 ? "s" : ""}` }
          : {}),
        ...(dishTypes.length ? { recipeCategory: dishTypes[0] } : {}),
        ...(dishTypes.length || diets.length
          ? { keywords: [...dishTypes, ...diets].join(", ") }
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
        suitableForDiet: diets
          .map((d) => DIET_SCHEMA_MAP[d.toLowerCase()])
          .filter(Boolean),
      }
    : null;

  return (
    <>
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
      <RecipePageClient key={`${locale}-${id}`} serverTitle={recipe?.title ?? null} initialRecipe={recipe} />
    </>
  );
}
