import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { blogPostsDe, getBlogPostDe } from "@/lib/blog-posts-de";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const enParams = blogPosts.map((post) => ({ locale: "en", slug: post.slug }));
  const deParams = blogPostsDe.map((post) => ({ locale: "de", slug: post.slug }));
  return [...enParams, ...deParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = locale === "de" ? getBlogPostDe(slug) : getBlogPost(slug);
  if (!post) return {};

  // hreflang: link EN ↔ DE versions
  const enSlug = locale === "de" ? (getBlogPost(slug)?.slug ?? slug) : slug;
  const deSlug = locale === "en" ? (getBlogPostDe(slug)?.slug ?? slug) : slug;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://culinse.com/${locale}/blog/${post.slug}`,
      languages: {
        "en": `https://culinse.com/en/blog/${enSlug}`,
        "de": `https://culinse.com/de/blog/${deSlug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://culinse.com/${locale}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      siteName: "Culinse",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = locale === "de" ? getBlogPostDe(slug) : getBlogPost(slug);
  if (!post) notFound();

  const allPosts = locale === "de" ? blogPostsDe : blogPosts;
  const otherPosts = allPosts.filter((p) => p.slug !== post.slug);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "Culinse" },
    publisher: { "@type": "Organization", name: "Culinse", url: "https://culinse.com" },
    url: `https://culinse.com/${locale}/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors mb-6"
        >
          ← Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-gray-400">{post.readingTime}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 leading-relaxed">{post.description}</p>
        </div>

        {/* Article content */}
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          {post.sections.map((section, i) => (
            <div key={i} className="mb-6 last:mb-0">
              {section.heading && (
                <h2 className="text-xl font-bold text-gray-900 mb-3 mt-8 first:mt-0">
                  {section.heading}
                </h2>
              )}
              {section.content && (
                <p className="text-gray-700 leading-relaxed mb-3">{section.content}</p>
              )}
              {section.list && (
                <ul className="space-y-2 mt-2">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-700">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>

        {/* CTA */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-10 text-center">
          <p className="text-lg font-bold text-gray-900 mb-2">
            {locale === "de" ? "Plane deine Woche mit Culinse" : "Plan your week with Culinse"}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {locale === "de"
              ? "Rezepte entdecken, Woche planen und automatische Einkaufsliste erhalten — kostenlos."
              : "Browse recipes, plan your week, and get an automatic shopping list — free."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {locale === "de" ? "Culinse kostenlos ausprobieren →" : "Try Culinse for free →"}
          </Link>
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {locale === "de" ? "Weitere Artikel" : "More articles"}
            </h3>
            <div className="space-y-3">
              {otherPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
                >
                  <div>
                    <span className="text-xs text-orange-500 font-medium">{related.category}</span>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors mt-0.5">
                      {related.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
