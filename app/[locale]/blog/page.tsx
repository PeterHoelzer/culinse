import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Link } from "@/lib/navigation";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";
import BlogIndexList, { type LitePost } from "./BlogIndexList";

interface Props {
  params: Promise<{ locale: string }>;
}

const blogAlternates = (locale: string) => ({
  canonical: `https://culinse.com/${locale}/blog`,
  languages: {
    en: "https://culinse.com/en/blog",
    de: "https://culinse.com/de/blog",
    "x-default": "https://culinse.com/en/blog",
  },
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "de") {
    return {
      title: "Blog – Meal Planning Tipps & Ratgeber",
      description:
        "Praktische Ratgeber zu Meal Prep, Wochenplanung und Einkaufslisten. Spare Zeit und Geld jede Woche.",
      alternates: blogAlternates(locale),
      openGraph: {
        title: "Culinse Blog – Meal Planning Tipps & Ratgeber",
        description: "Praktische Ratgeber zu Meal Prep, Wochenplanung und Einkaufslisten.",
        url: "https://culinse.com/de/blog",
      },
    };
  }
  return {
    title: "Blog – Meal Planning Tips & Guides",
    description:
      "Practical guides on meal prepping, meal planning, and building a shopping list that actually works. Save time and money every week.",
    alternates: blogAlternates(locale),
    openGraph: {
      title: "Culinse Blog – Meal Planning Tips & Guides",
      description:
        "Practical guides on meal prepping, meal planning, and building a shopping list that actually works.",
      url: "https://culinse.com/en/blog",
    },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const posts = [...(locale === "de" ? blogPostsDe : blogPosts)].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Blog</h1>
          <p className="text-gray-500">
            {locale === "de"
              ? "Praktische Ratgeber zu Meal Planning, Meal Prep und einem einfacheren Küchenalltag."
              : "Practical guides on meal planning, meal prep, and making your kitchen life easier."}
          </p>
        </div>

        <BlogIndexList
          locale={locale}
          posts={posts.map((p): LitePost => ({
            slug: p.slug,
            title: p.title,
            description: p.description,
            category: p.category,
            readingTime: p.readingTime,
          }))}
        />
      </main>
    </div>
  );
}
