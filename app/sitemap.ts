import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";

// Maps EN blog slug → DE blog slug
const blogSlugMap: Record<string, string> = {
  "how-to-meal-prep-for-the-week": "meal-prep-fuer-die-woche",
  "best-free-meal-planner-apps-2026": "beste-kostenlose-meal-planner-apps-2026",
  "weekly-meal-plan-with-shopping-list": "wochenmenuplan-mit-einkaufsliste",
  "easy-dinner-ideas-for-busy-weeknights": "schnelle-abendessen-ideen-unter-30-minuten",
  "quick-dinner-recipes-under-30-minutes": "was-koche-ich-heute-abend-ideen-fuer-die-woche",
  "high-protein-meals-for-muscle-building": "proteinreiche-mahlzeiten-muskelaufbau",
  "vegetarian-dinner-ideas-easy-recipes": "vegetarische-abendessen-ideen",
  "mediterranean-diet-recipes-beginners": "mediterrane-diaet-rezepte-anfaenger",
  "budget-meals-under-5-euros": "guenstige-mahlzeiten-unter-5-euro",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://culinse.com";

  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/pro", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/impressum", changeFrequency: "yearly" as const, priority: 0.1 },
    { path: "/datenschutz", changeFrequency: "yearly" as const, priority: 0.1 },
    { path: "/collections/explore", changeFrequency: "daily" as const, priority: 0.6 },
  ];

  // Static pages — one entry per locale with cross-locale alternates
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(({ path, changeFrequency, priority }) => [
    {
      url: `${baseUrl}/en${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: { en: `${baseUrl}/en${path}`, de: `${baseUrl}/de${path}` } },
    },
    {
      url: `${baseUrl}/de${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: { en: `${baseUrl}/en${path}`, de: `${baseUrl}/de${path}` } },
    },
  ]);

  // Blog entries — linked via slug map
  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) => {
    const deSlug = blogSlugMap[post.slug] ?? post.slug;
    return [
      {
        url: `${baseUrl}/en/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en/blog/${post.slug}`,
            de: `${baseUrl}/de/blog/${deSlug}`,
          },
        },
      },
      {
        url: `${baseUrl}/de/blog/${deSlug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en/blog/${post.slug}`,
            de: `${baseUrl}/de/blog/${deSlug}`,
          },
        },
      },
    ];
  });

  // Fetch top-50 popular recipe IDs from Spoonacular for sitemap
  let recipeEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?number=50&sort=popularity&minPopularity=50&instructionsRequired=true&apiKey=${process.env.SPOONACULAR_API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) {
      const data = await res.json();
      const ids: number[] = (data.results ?? []).map((r: { id: number }) => r.id);
      recipeEntries = ids.flatMap((id) => [
        {
          url: `${baseUrl}/en/recipe/${id}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: { languages: { en: `${baseUrl}/en/recipe/${id}`, de: `${baseUrl}/de/recipe/${id}` } },
        },
        {
          url: `${baseUrl}/de/recipe/${id}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
          alternates: { languages: { en: `${baseUrl}/en/recipe/${id}`, de: `${baseUrl}/de/recipe/${id}` } },
        },
      ]);
    }
  } catch {
    // Silently fail — don't break the build if Spoonacular is unavailable
  }

  return [...staticEntries, ...blogEntries, ...recipeEntries];
}
