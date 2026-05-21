import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticEntries, ...enBlogEntries, ...deBlogEntries];
}
