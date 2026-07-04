import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";
import { EN_TO_DE_BLOG_SLUGS, DE_TO_EN_BLOG_SLUGS } from "@/lib/blog-slug-map";
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

  // Blog entries — linked via slug map, real publish dates as lastmod.
  // Some posts exist in only ONE language (12-week content plan): those emit a
  // single entry WITHOUT a cross-language alternate — never an alternate URL
  // that doesn't exist.
  const deSlugSet = new Set(blogPostsDe.map((p) => p.slug));
  const enSlugSet = new Set(blogPosts.map((p) => p.slug));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.flatMap((post) => {
    const deSlug = EN_TO_DE_BLOG_SLUGS[post.slug];
    const hasDe = deSlug !== undefined && deSlugSet.has(deSlug);
    const enUrl = `${baseUrl}/en/blog/${post.slug}`;
    const lastModified = new Date(post.publishedAt);
    if (!hasDe) {
      return [
        {
          url: enUrl,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: { languages: { en: enUrl, "x-default": enUrl } },
        },
      ];
    }
    const deUrl = `${baseUrl}/de/blog/${deSlug}`;
    return [
      { url: enUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.7, alternates: langs(enUrl, deUrl) },
      { url: deUrl, lastModified, changeFrequency: "monthly" as const, priority: 0.7, alternates: langs(enUrl, deUrl) },
    ];
  });

  // DE-only posts (no EN counterpart) — otherwise they'd be missing from the
  // sitemap entirely, since the loop above iterates the EN list.
  const deOnlyBlogEntries: MetadataRoute.Sitemap = blogPostsDe
    .filter((post) => {
      const enSlug = DE_TO_EN_BLOG_SLUGS[post.slug];
      return enSlug === undefined || !enSlugSet.has(enSlug);
    })
    .map((post) => {
      const deUrl = `${baseUrl}/de/blog/${post.slug}`;
      return {
        url: deUrl,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: { de: deUrl, "x-default": deUrl } },
      };
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
      .select("id, created_at, language, translation_group")
      .eq("is_public", true)
      .limit(5000);

    // Group DE/EN versions of the same recipe (via translation_group) so each
    // localized recipe is listed ONLY under its own locale, with hreflang
    // pointing to its sibling. A German recipe never appears as an /en URL and
    // vice versa. Legacy rows without a language fall back to both locales.
    type Row = { id: string; created_at?: string; language?: string | null; translation_group?: string | null };
    const groups = new Map<string, { de?: Row; en?: Row; legacy?: Row }>();
    for (const r of (urs ?? []) as Row[]) {
      const key = r.translation_group || `__${r.id}`;
      const g = groups.get(key) ?? {};
      if (r.language === "de") g.de = r;
      else if (r.language === "en") g.en = r;
      else g.legacy = r;
      groups.set(key, g);
    }

    const modOf = (r: Row) => (r.created_at ? new Date(r.created_at) : STATIC_LAST_MODIFIED);
    for (const g of groups.values()) {
      if (g.legacy && !g.de && !g.en) {
        const r = g.legacy;
        const enUrl = `${baseUrl}/en/recipe/user_${r.id}`;
        const deUrl = `${baseUrl}/de/recipe/user_${r.id}`;
        userRecipeEntries.push(
          { url: enUrl, lastModified: modOf(r), changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
          { url: deUrl, lastModified: modOf(r), changeFrequency: "monthly" as const, priority: 0.6, alternates: langs(enUrl, deUrl) },
        );
        continue;
      }
      const enUrl = g.en ? `${baseUrl}/en/recipe/user_${g.en.id}` : undefined;
      const deUrl = g.de ? `${baseUrl}/de/recipe/user_${g.de.id}` : undefined;
      const languages: Record<string, string> = {};
      if (enUrl) languages.en = enUrl;
      if (deUrl) languages.de = deUrl;
      languages["x-default"] = enUrl ?? deUrl!;
      const alternates = { languages };
      if (g.en) userRecipeEntries.push({ url: enUrl!, lastModified: modOf(g.en), changeFrequency: "monthly" as const, priority: 0.6, alternates });
      if (g.de) userRecipeEntries.push({ url: deUrl!, lastModified: modOf(g.de), changeFrequency: "monthly" as const, priority: 0.6, alternates });
    }
  } catch {
    // Silently fail — community recipes are a bonus, never break the sitemap.
  }

  return [...staticEntries, ...blogEntries, ...deOnlyBlogEntries, ...recipeEntries, ...collectionEntries, ...userRecipeEntries];
}
