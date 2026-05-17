import type { Metadata } from "next";
import RecipePageClient from "./RecipePageClient";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BASE_URL}/api/recipe/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("not found");
    const { recipe } = await res.json();

    const title = `${recipe.title} — Culinse`;
    const description = recipe.summary
      ? recipe.summary.replace(/<[^>]+>/g, "").slice(0, 155)
      : `Discover how to make ${recipe.title} on Culinse.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: recipe.image ? [{ url: recipe.image }] : [],
        type: "article",
        url: `${BASE_URL}/recipe/${id}`,
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
      title: "Recipe — Culinse",
      description: "Discover delicious recipes on Culinse.",
    };
  }
}

export default function RecipePage() {
  return <RecipePageClient />;
}
