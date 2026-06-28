import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { EN_TO_DE_BLOG_SLUGS } from "@/lib/blog-slug-map";
import { CURATED_RECIPE_IDS } from "@/lib/curated-recipe-ids";
import { createAdminClient } from "@/lib/supabase/admin";

const baseUrl = "https://culinse.com";

// hreflang alternates incl. x-default (points to the EN/default version) so
// Google knows which version to show when no language matches.
function langs(en: string, de: string) {
  return { languages: { en, de, "x-default": en } };
}

// Stable lastmod for non-dated pages. Using `new Date()` on every build tells
// Google "everything changed today" on each deploy, which makes lastmod
// untrustworthy and gets ignored. Bump this when static pages actually change.
const STATIC_LAST_MODIFIED = new Date("2026-06-06");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/weekly-meal-planner", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/pro", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/impressum", changeFrequency: "yearly" as const, priority: 0.1 },
    { path: "/datenschutz", changeFrequency: "yearly" as const, priority: 0.1 },
    { path: "/collections/explore", changeFrequency: "daily" as const, priority: 0.6 },
  ];
  // NOTE: /login intentionally excluded — utility page, no SEO value.

  // Static pages — one entry per locale with cross-locale alternates
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(({ path, changeFrequency, priority }) => {
    const enUrl = `${baseUrl}/en${path}`;
    const deUrl = `${baseUrl}/de${path}`;
    return [
      { url: enUrl, lastModified: STATIC_LAST_MODIFIED, changeFrequency, priority, alternates: langs(enUrl, deUrl) },
      { url: deUrl, lastModified: STATIC_LAST_MODIFIED, changeFrequency, priority, alternates: langs(enUrl, deUrl) },
    ];
  });

  // Blog entries — linked via slug map, real publish dates as lastmod
  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) => {
    const deSlug = EN_TO_DE_BLOG_SLUGS[post.slug] ?? post.slug;
    const enUrl = `${baseUrl}/en/blog/${post.slug}`;
    const deUrl = `${baseUrl}/de/blog/${deSlug}`;
    const lastModified = new Date(post.publishedAt);
    return [
      { url: enUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.7, alternates: langs(enUrl, deUrl) },
      { url: deUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.7, alternates: langs(enUrl, deUrl) },
    ];
  });

  // Recipe URLs — a STABLE, hand-curated list (see lib/curated-recipe-ids.ts).
  // Replaces the old dynamic Spoonacular popularity query, whose URL set churned
  // between builds (136 → 134 in a week) and signalled "low value" to Google.
  // Empty by default: aggregated provider recipes are duplicate content and won't
  // index in bulk — curate your best/most-unique IDs in that file to include them.
  const recipeEntries: MetadataRoute.Sitemap = CURATED_RECIPE_IDS.flatMap((id) => {
    const enUrl = `${baseUrl}/en/recipe/${id}`;
    const deUrl = `${baseUrl}/de/recipe/${id}`;
    return [
      { url: enUrl, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
      { url: deUrl, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
    ];
  });

  // Public collections — SEO landing pages (unique curated content).
  let collectionEntries: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: cols } = await admin
      .from("collections")
      .select("id, created_at")
      .eq("is_public", true)
      .limit(2000);
    collectionEntries = (cols ?? []).flatMap((col: { id: string; created_at?: string }) => {
      const enUrl = `${baseUrl}/en/collections/${col.id}`;
      const deUrl = `${baseUrl}/de/collections/${col.id}`;
      const lastModified = col.created_at ? new Date(col.created_at) : STATIC_LAST_MODIFIED;
      return [
        { url: enUrl, lastModified, changeFrequency: "weekly" as const, priority: 0.5, alternates: langs(enUrl, deUrl) },
        { url: deUrl, lastModified, changeFrequency: "weekly" as const, priority: 0.5, alternates: langs(enUrl, deUrl) },
      ];
    });
  } catch {
    // Silently fail — collections are a bonus, never break the sitemap.
  }

  // Public community recipes — unique, user-created content that's genuinely
  // worth indexing (unlike aggregated provider recipes, which are duplicate
  // content). Imported recipes are force-private, so only original posts appear.
  let userRecipeEntries: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: urs } = await admin
      .from("user_recipes")
      .select("id, created_at")
      .eq("is_public", true)
      .limit(5000);
    userRecipeEntries = (urs ?? []).flatMap((r: { id: string; created_at?: string }) => {
      const enUrl = `${baseUrl}/en/recipe/user_${r.id}`;
      const deUrl = `${baseUrl}/de/recipe/user_${r.id}`;
      const lastModified = r.created_at ? new Date(r.created_at) : STATIC_LAST_MODIFIED;
      return [
        { url: enUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
        { url: deUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
      ];
    });
  } catch {
    // Silently fail — community recipes are a bonus, never break the sitemap.
  }

  return [...staticEntries, ...blogEntries, ...recipeEntries, ...collectionEntries, ...userRecipeEntries];
}
