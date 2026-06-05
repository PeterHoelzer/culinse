import type { Metadata } from "next";
import RecipePageClient from "./RecipePageClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

interface RecipeData {
  title: string;
  image: string | null;
  summary: string | null;
  time: string | null;
  servings: number | null;
  ingredients: Array<{ original: string }>;
  instructions: Array<{ step: string }>;
  diets: string[];
}

async function fetchRecipe(id: string): Promise<RecipeData | null> {
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

  // Build Recipe JSON-LD for Google Rich Results
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
          name: "Culinse",
          url: "https://culinse.com",
        },
        publisher: {
          "@type": "Organization",
          name: "Culinse",
          url: "https://culinse.com",
        },
        url: `${BASE_URL}/${locale}/recipe/${id}`,
        ...(recipe.time && !isNaN(parseInt(recipe.time))
          ? { totalTime: `PT${parseInt(recipe.time)}M` }
          : {}),
        ...(recipe.servings
          ? { recipeYield: `${recipe.servings} serving${recipe.servings > 1 ? "s" : ""}` }
          : {}),
        recipeIngredient: recipe.ingredients?.map((i) => i.original) ?? [],
        recipeInstructions:
          recipe.instructions?.map((s) => ({
            "@type": "HowToStep",
            text: s.step,
          })) ?? [],
        suitableForDiet: (recipe.diets ?? [])
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
      <RecipePageClient />
    </>
  );
}
