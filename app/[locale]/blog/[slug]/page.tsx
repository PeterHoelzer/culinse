import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthorBox from "@/components/AuthorBox";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { blogPostsDe, getBlogPostDe } from "@/lib/blog-posts-de";
import { blogSlugPair, crossLanguageBlogSlug } from "@/lib/blog-slug-map";
import { renderRichText } from "@/lib/renderRichText";
import BlogAffiliateBox from "@/components/BlogAffiliateBox";

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

  // hreflang: link EN ↔ DE versions via the canonical slug map. Localized slugs
  // differ per language, so the matching slug can't be derived — it's looked up.
  // Single-language posts (the 12-week content plan publishes some articles in
  // only one language) must NOT emit an alternate for the missing language —
  // blogSlugPair falls back to the same slug, which would point hreflang at a
  // URL that redirects/404s (the exact class of bug GSC flagged before).
  const { en: enSlug, de: deSlug } = blogSlugPair(slug, locale);
  const enExists = Boolean(getBlogPost(enSlug));
  const deExists = Boolean(getBlogPostDe(deSlug));
  const selfUrl = `https://culinse.com/${locale}/blog/${post.slug}`;
  const languages: Record<string, string> = {
    ...(enExists ? { en: `https://culinse.com/en/blog/${enSlug}` } : {}),
    ...(deExists ? { de: `https://culinse.com/de/blog/${deSlug}` } : {}),
    "x-default": enExists ? `https://culinse.com/en/blog/${enSlug}` : selfUrl,
  };
  const ogImage = post.image ?? "https://culinse.com/culinse-logo.png";

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: selfUrl,
      languages,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://culinse.com/${locale}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      images: [{ url: ogImage }],
      siteName: "Culinse",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = locale === "de" ? getBlogPostDe(slug) : getBlogPost(slug);
  if (!post) {
    // A slug from the other language (legacy hreflang-bug URLs like
    // /de/blog/<en-slug> that Google indexed as 404s). If it maps to a real post
    // in this locale, 308-redirect there so the stale 404 resolves to the right
    // URL; otherwise it's a genuine 404.
    const correctSlug = crossLanguageBlogSlug(slug, locale);
    const target = correctSlug
      ? locale === "de"
        ? getBlogPostDe(correctSlug)
        : getBlogPost(correctSlug)
      : undefined;
    if (correctSlug && target) {
      permanentRedirect(`/${locale}/blog/${correctSlug}`);
    }
    notFound();
  }

  const allPosts = locale === "de" ? blogPostsDe : blogPosts;
  // Themen-Cluster: Artikel derselben Kategorie zuerst, dann der Rest — so
  // fließt die interne Link-Equity zwischen thematisch verwandten Seiten
  // (Google baut daraus Topical Authority) statt sich gleichmäßig über alle
  // Artikel zu verteilen. Auf 6 begrenzt, damit die Links fokussiert bleiben.
  const otherPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      const aSame = a.category === post.category ? 0 : 1;
      const bSame = b.category === post.category ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 6);

  const articleUrl = `https://culinse.com/${locale}/blog/${post.slug}`;
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: locale,
    image: post.image ? [post.image] : ["https://culinse.com/culinse-logo.png"],
    // Person author (E-E-A-T): real, verifiable expertise. Keep in sync with
    // the visible <AuthorBox /> below the article.
    author: {
      "@type": "Person",
      "@id": "https://culinse.com/#peter",
      name: "Peter Hölzer",
      jobTitle:
        locale === "de"
          ? "Küchenchef & Fleischermeister"
          : "Head Chef & German Master Butcher (Fleischermeister)",
      description:
        locale === "de"
          ? "Küchenchef mit Restaurant-Erfahrung in ganz Deutschland, seit 2024 Fleischermeister. Gründer von Culinse."
          : "Head chef with restaurant experience across Germany, certified Fleischermeister (German master butcher) since 2024. Founder of Culinse.",
      url: `https://culinse.com/${locale}/about`,
      worksFor: { "@type": "Organization", "@id": "https://culinse.com/#organization" },
    },
    publisher: {
      "@type": "Organization",
      name: "Culinse",
      url: "https://culinse.com",
      logo: { "@type": "ImageObject", url: "https://culinse.com/culinse-logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
  };

  // FAQPage schema — only emitted when the post defines FAQ Q&A. The same Q&A is
  // rendered visibly via `post.sections`, so the on-page content matches the
  // structured data (Google requires the answers to be visible). Makes the post
  // eligible for FAQ rich results and improves AI-answer citation odds.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Culinse", item: `https://culinse.com/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `https://culinse.com/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  const faqSchema =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: locale,
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />

      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}

      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link
          href={`/${locale}/blog`}
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
            {/* AI-SEO: sichtbares Freshness-Signal (Schema hatte die Daten schon) */}
            <span className="text-xs text-gray-400">
              {(() => {
                const d = new Date(post.updatedAt ?? post.publishedAt);
                const formatted = d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
                  year: "numeric", month: "long", day: "numeric",
                });
                return post.updatedAt
                  ? (locale === "de" ? `Aktualisiert: ${formatted}` : `Updated: ${formatted}`)
                  : (locale === "de" ? `Veröffentlicht: ${formatted}` : `Published: ${formatted}`);
              })()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 leading-relaxed">{post.description}</p>
        </div>

        {/* Header image (FLUX-generiert, eigene Rechte) */}
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-[1.91/1] object-cover rounded-2xl border border-gray-100 shadow-sm mb-8"
          />
        )}

        {/* Article content */}
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          {post.sections.map((section, i) => (
            <div key={i} className="mb-6 last:mb-0">
              {/* CRO: kontextueller Inline-CTA im Lesefluss (nach der 3. Section).
                  Budget-/Einkaufs-Themen -> Rechner, alles andere -> Planer. */}
              {i === 3 && (() => {
                const topicText = `${slug} ${post.title}`.toLowerCase();
                const isBudget = /budget|grocery|einkauf|sparen|zettel|calculator|rechner|was kostet/.test(topicText);
                const href = isBudget
                  ? `/${locale}/grocery-list-calculator`
                  : `/${locale}/weekly-meal-planner`;
                const label = isBudget
                  ? (locale === "de" ? "Was kostet dein Einkauf? Rechne es in 30 Sekunden nach" : "What does your shopping cost? Check it in 30 seconds")
                  : (locale === "de" ? "Plane deine Woche und die Einkaufsliste schreibt sich von selbst" : "Plan your week and the shopping list writes itself");
                const cta = isBudget
                  ? (locale === "de" ? "Zum kostenlosen Einkaufsrechner →" : "Open the free grocery calculator →")
                  : (locale === "de" ? "Wochenplaner kostenlos starten →" : "Start the free meal planner →");
                return (
                  <div className="my-8 rounded-xl border-l-4 border-orange-400 bg-orange-50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-1.5">{label}</p>
                    <Link href={href} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                      {cta}
                    </Link>
                  </div>
                );
              })()}
              {section.heading && (
                <h2 className="text-xl font-bold text-gray-900 mb-3 mt-8 first:mt-0">
                  {section.heading}
                </h2>
              )}
              {section.content && (
                <p className="text-gray-700 leading-relaxed mb-3">{renderRichText(section.content)}</p>
              )}
              {section.list && (
                <ul className="space-y-2 mt-2">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-700">
                      <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="leading-relaxed">{renderRichText(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>

        {/* Affiliate: kontextuelle Produkt-Empfehlungen (source: "blog" in /api/out) */}
        <BlogAffiliateBox
          title={post.title}
          category={post.category}
          headings={post.sections.map((s) => s.heading ?? "").filter(Boolean)}
          locale={locale}
        />

        {/* Author (E-E-A-T) */}
        <AuthorBox locale={locale} />

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
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#f97316" }}
          >
            {locale === "de" ? "Culinse kostenlos ausprobieren →" : "Try Culinse for free →"}
          </Link>
        </div>

        {/* Explore features — passes crawl/link equity from the blog into the
            planner + collections pages (SEO masterplan §3.3) */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {locale === "de" ? "Mehr von Culinse" : "More from Culinse"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href={`/${locale}/weekly-meal-planner`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {locale === "de" ? "Wochenplaner" : "Weekly meal planner"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "de"
                  ? "Woche planen und automatische Einkaufsliste erhalten."
                  : "Plan your week and get an automatic shopping list."}
              </p>
            </Link>
            <Link
              href={`/${locale}/collections/explore`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {locale === "de" ? "Rezept-Collections" : "Recipe collections"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "de"
                  ? "Kuratierte Rezeptsammlungen zum Entdecken."
                  : "Curated recipe collections to explore."}
              </p>
            </Link>
            <Link
              href={`/${locale}/grocery-list-calculator`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {locale === "de" ? "Einkaufsrechner" : "Grocery calculator"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "de"
                  ? "Was kostet dein Wocheneinkauf? Echte Discounter-Preise, kostenlos."
                  : "What does your weekly shop cost? Real discount-store prices, free."}
              </p>
            </Link>
            <Link
              href={`/${locale}/pro`}
              className="block bg-white rounded-xl border border-orange-200 p-4 hover:border-orange-300 hover:bg-orange-50/40 transition-colors group sm:col-span-2"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                {locale === "de" ? "Culinse Pro — 7 Tage gratis testen" : "Culinse Pro — try 7 days free"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {locale === "de"
                  ? "Unbegrenzte Sammlungen, mehrere Wochenpläne und unbegrenzt gespeicherte Rezepte."
                  : "Unlimited collections, multiple meal plans, and unlimited saved recipes."}
              </p>
            </Link>
          </div>
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
                  href={`/${locale}/blog/${related.slug}`}
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
