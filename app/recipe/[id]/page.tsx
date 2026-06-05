import type { Metadata } from "next";
import RecipePageClient from "./RecipePageClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const canonicalUrl = `${BASE_URL}/en/recipe/${id}`;
  const sharedAlternates = {
    canonical: canonicalUrl,
    languages: {
      en: `${BASE_URL}/en/recipe/${id}`,
      de: `${BASE_URL}/de/recipe/${id}`,
    },
  };

  try {
    const res = await fetch(`${BASE_URL}/api/recipe/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("not found");
    const { recipe } = await res.json();

    const title = `${recipe.title} Recipe`;
    const description = recipe.summary
      ? recipe.summary.replace(/<[^>]+>/g, "").slice(0, 155)
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
  } catch {
    return {
      title: "Recipe",
      description: "Discover delicious recipes on Culinse.",
      alternates: sharedAlternates,
    };
  }
}

export default function RecipePage() {
  return <RecipePageClient />;
}
