import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Button, Icon } from "@/components/ui";
import AuthorBox from "@/components/AuthorBox";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { blogPostsDe, getBlogPostDe } from "@/lib/blog-posts-de";
import { blogSlugPair, crossLanguageBlogSlug } from "@/lib/blog-slug-map";
import { renderRichText } from "@/lib/renderRichText";
import BlogAffiliateBox from "@/components/BlogAffiliateBox";
import { getVideoBySlug } from "@/lib/videos";

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

  // Eigenes Koch-Video zum Artikel (12.10.2026) — ersetzt das Hero-Bild.
  const video = post.video ? getVideoBySlug(post.video) : undefined;

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

  // VideoObject-JSON-LD (12.10.2026): macht den Artikel fuer Video-Rich-
  // Results und KI-Zitate auffindbar; Daten aus lib/videos.ts.
  const videoSchema = video
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: locale === "de" ? video.title.de : video.title.en,
        description: locale === "de" ? video.description.de : video.description.en,
        thumbnailUrl: [`https://culinse.com${video.poster}`],
        contentUrl: video.src,
        uploadDate: video.uploadDate,
        duration: video.durationIso,
        publisher: {
          "@type": "Organization",
          name: "Culinse",
          logo: { "@type": "ImageObject", url: "https://culinse.com/culinse-logo.png" },
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-surface">
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

      {videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(videoSchema)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}

      <Navbar />

      <main className="mx-auto max-w-prose px-4 py-12">
        {/* Brotkrume */}
        <Link
          href={`/${locale}/blog`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink hover:underline underline-offset-[3px]"
        >
          <Icon name="arrowLeft" size={16} />
          Blog
        </Link>

        {/* Kopf */}
        <header className="mb-8">
          <p className="mb-3 text-sm text-ink-3">
            {post.category} · {post.readingTime} ·{" "}
            {/* AI-SEO: sichtbares Freshness-Signal (Schema hatte die Daten schon) */}
            {(() => {
              const d = new Date(post.updatedAt ?? post.publishedAt);
              const formatted = d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
                year: "numeric", month: "long", day: "numeric",
              });
              return post.updatedAt
                ? (locale === "de" ? `Aktualisiert: ${formatted}` : `Updated: ${formatted}`)
                : (locale === "de" ? `Veröffentlicht: ${formatted}` : `Published: ${formatted}`);
            })()}
          </p>
          <h1 className="text-h1-sm sm:text-h1 text-ink">{post.title}</h1>
          <p className="mt-4 text-body-lg text-ink-2">{post.description}</p>
        </header>

        {/* Eigenes Koch-Video: ersetzt das Hero-Bild durch den Player
            (Untertitel de/en, Poster lokal, MP4 aus Supabase Storage). Kein Autoplay. */}
        {video && (
          <video
            controls
            preload="metadata"
            playsInline
            poster={video.poster}
            className="mb-10 aspect-video w-full rounded-2 bg-dark"
          >
            <source src={video.src} type="video/mp4" />
            {video.subtitles.map((s) => (
              <track
                key={s.lang}
                kind="subtitles"
                srcLang={s.lang}
                label={s.label}
                src={s.src}
                default={locale === "de" ? s.lang === "de" : s.lang === "en"}
              />
            ))}
          </video>
        )}

        {/* Header image (FLUX-generiert, eigene Rechte) */}
        {!video && post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            width={1200}
            height={628}
            fetchPriority="high"
            className="mb-10 aspect-[1.91/1] w-full rounded-2 object-cover"
          />
        )}

        {/* Artikeltext, ohne Karte */}
        <article>
          {post.sections.map((section, i) => (
            <div key={i}>
              {/* CRO: kontextueller Inline-CTA im Lesefluss (nach der 3. Section).
                  Budget-/Einkaufs-Themen -> Rechner, alles andere -> Planer. */}
              {i === 3 && (() => {
                const topicText = `${slug} ${post.title}`.toLowerCase();
                const isBudget = /budget|grocery|einkauf|sparen|zettel|calculator|rechner|was kostet/.test(topicText);
                const href = isBudget ? "/grocery-list-calculator" : "/weekly-meal-planner";
                const label = isBudget
                  ? (locale === "de" ? "Was kostet dein Einkauf? Rechne es in 30 Sekunden nach" : "What does your shopping cost? Check it in 30 seconds")
                  : (locale === "de" ? "Plane deine Woche und die Einkaufsliste schreibt sich von selbst" : "Plan your week and the shopping list writes itself");
                const cta = isBudget
                  ? (locale === "de" ? "Zum Einkaufsrechner" : "Open the grocery calculator")
                  : (locale === "de" ? "Wochenplaner starten" : "Start the meal planner");
                return (
                  <div className="my-10 rounded-2 bg-surface-soft p-6">
                    <p className="mb-4 font-semibold text-ink">{label}</p>
                    <Button href={href}>{cta}</Button>
                  </div>
                );
              })()}
              {section.heading && (
                <h2 className="mb-4 mt-12 text-h2-sm text-ink first:mt-0">{section.heading}</h2>
              )}
              {section.content && (
                <p className="mb-4 text-body-lg text-ink">{renderRichText(section.content)}</p>
              )}
              {section.list && (
                <ul className="mb-4 list-disc space-y-2 pl-6 text-body-lg text-ink marker:text-ink-3">
                  {section.list.map((item, j) => (
                    <li key={j}>{renderRichText(item)}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>

        {/* Affiliate: kontextuelle Produkt-Empfehlungen (source: "blog" in /api/out) */}
        <div className="mt-12">
          <BlogAffiliateBox
            title={post.title}
            category={post.category}
            headings={post.sections.map((s) => s.heading ?? "").filter(Boolean)}
            productNames={post.affiliateNames}
            locale={locale}
          />
        </div>

        {/* Author (E-E-A-T) */}
        <AuthorBox locale={locale} />

        {/* CTA */}
        <div className="mb-14 rounded-2 bg-surface-soft p-6">
          <p className="mb-2 text-h3 text-ink">
            {locale === "de" ? "Plane deine Woche mit Culinse" : "Plan your week with Culinse"}
          </p>
          <p className="mb-5 text-ink-2">
            {locale === "de"
              ? "Rezepte entdecken, Woche planen und automatische Einkaufsliste erhalten, kostenlos."
              : "Browse recipes, plan your week, and get an automatic shopping list, free."}
          </p>
          <Button href="/weekly-meal-planner">
            {locale === "de" ? "Wochenplaner starten" : "Start the meal planner"}
          </Button>
        </div>

        {/* Explore features — passes crawl/link equity from the blog into the
            planner + collections pages (SEO masterplan §3.3) */}
        <section className="mb-14">
          <h2 className="mb-2 text-h3 text-ink">
            {locale === "de" ? "Mehr von Culinse" : "More from Culinse"}
          </h2>
          <ul>
            {[
              {
                href: "weekly-meal-planner",
                title: locale === "de" ? "Wochenplaner" : "Weekly meal planner",
                text: locale === "de"
                  ? "Woche planen und automatische Einkaufsliste erhalten."
                  : "Plan your week and get an automatic shopping list.",
              },
              {
                href: "collections/explore",
                title: locale === "de" ? "Rezept-Collections" : "Recipe collections",
                text: locale === "de"
                  ? "Kuratierte Rezeptsammlungen zum Entdecken."
                  : "Curated recipe collections to explore.",
              },
              {
                href: "grocery-list-calculator",
                title: locale === "de" ? "Einkaufsrechner" : "Grocery calculator",
                text: locale === "de"
                  ? "Was kostet dein Wocheneinkauf? Echte Discounter-Preise, kostenlos."
                  : "What does your weekly shop cost? Real discount-store prices, free.",
              },
              {
                href: "pro",
                title: locale === "de" ? "Culinse Pro, 7 Tage gratis testen" : "Culinse Pro, try 7 days free",
                text: locale === "de"
                  ? "Unbegrenzte Sammlungen, mehrere Wochenpläne und unbegrenzt gespeicherte Rezepte."
                  : "Unlimited collections, multiple meal plans, and unlimited saved recipes.",
              },
            ].map((item) => (
              <li key={item.href} className="border-t border-line">
                <Link href={`/${locale}/${item.href}`} className="group block py-4">
                  <p className="font-semibold text-ink group-hover:underline underline-offset-[3px]">{item.title}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{item.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <section>
            <h2 className="mb-2 text-h3 text-ink">
              {locale === "de" ? "Weitere Artikel" : "More articles"}
            </h2>
            <ul>
              {otherPosts.map((related) => (
                <li key={related.slug} className="border-t border-line">
                  <Link href={`/${locale}/blog/${related.slug}`} className="group block py-4">
                    <p className="text-sm text-ink-3">{related.category}</p>
                    <p className="mt-0.5 font-semibold text-ink group-hover:underline underline-offset-[3px]">
                      {related.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
