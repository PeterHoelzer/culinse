import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Link } from "@/lib/navigation";
import { blogPosts } from "@/lib/blog-posts";
import { blogPostsDe } from "@/lib/blog-posts-de";

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
  const posts = locale === "de" ? blogPostsDe : blogPosts;

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

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              // Explicit locale: without it, server rendering resolved the
              // locale-aware Link against the fallback locale ("en"), so the
              // German blog index linked every article to /en/… (redirect chain
              // onto the ENGLISH article — 5 "Seite mit Weiterleitung" in GSC).
              locale={locale as "en" | "de"}
              href={`/blog/${post.slug}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-orange-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-gray-400">{post.readingTime}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {post.description}
              </p>
              <span className="inline-block mt-3 text-sm font-medium text-orange-500 group-hover:underline">
                {locale === "de" ? "Artikel lesen →" : "Read article →"}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
