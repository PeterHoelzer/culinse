import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://culinse.com";
  const locales = ["en", "de"] as const;

  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/pro", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/impressum", changeFrequency: "yearly" as const, priority: 0.1 },
    { path: "/datenschutz", changeFrequency: "yearly" as const, priority: 0.1 },
  ];

  const staticEntries = locales.flatMap((locale) =>
    staticPages.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))
  );

  const enBlogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/en/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const deBlogEntries = blogPostsDe.map((post) => ({
    url: `${baseUrl}/de/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

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
        { url: `${baseUrl}/en/recipe/${id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
        { url: `${baseUrl}/de/recipe/${id}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
      ]);
    }
  } catch {
    // Silently fail — don't break the build if Spoonacular is unavailable
  }

  return [...staticEntries, ...enBlogEntries, ...deBlogEntries, ...recipeEntries];
}
