"use client";

import { useMemo, useState } from "react";
import { Link } from "@/lib/navigation";

// Leichtgewichtige Post-Daten für den Index — die vollen BlogPost-Objekte
// (mit sections) bleiben auf dem Server.
export interface LitePost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  image?: string;
}

// Dezente visuelle Anker pro Kategorie (DE + EN)
const CATEGORY_EMOJI: Record<string, string> = {
  "Meal Prep": "🍱",
  "Wochenplanung": "📅",
  "Meal Planning": "📅",
  "Mahlzeitenplanung": "📋",
  "Ernährung": "💪",
  "Nutrition": "💪",
  "Gesunde Ernährung": "🥗",
  "Healthy Eating": "🥗",
  "Budgetküche": "💶",
  "Budget Cooking": "💶",
  "Abendessen-Ideen": "🍽️",
  "Dinner Ideas": "🍽️",
  "Vegetarisch": "🥦",
  "Vegetarian": "🥦",
  "Saisonale Küche": "🌽",
  "Tools & Apps": "🛠️",
};

export default function BlogIndexList({ posts, locale }: { posts: LitePost[]; locale: string }) {
  const [active, setActive] = useState<string | null>(null);

  // Kategorien nach Häufigkeit sortiert — die wichtigsten Chips zuerst
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [posts]);

  const visible = active ? posts.filter((p) => p.category === active) : posts;

  return (
    <>
      {/* Kategorie-Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActive(null)}
          className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
            active === null
              ? "text-white border-orange-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-orange-200"
          }`}
          style={active === null ? { background: "#f97316" } : {}}
        >
          {locale === "de" ? "Alle" : "All"} ({posts.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(active === cat ? null : cat)}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
              active === cat
                ? "text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-200"
            }`}
            style={active === cat ? { background: "#f97316" } : {}}
          >
            {CATEGORY_EMOJI[cat] ?? "📄"} {cat}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {visible.map((post) => (
          <Link
            key={post.slug}
            // Explicit locale — siehe hreflang-Bug-Historie im alten Index:
            // ohne locale löste SSR die Links gegen "en" auf.
            locale={locale as "en" | "de"}
            href={`/blog/${post.slug}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-orange-200 hover:shadow-md transition-all group"
          >
            {post.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image}
                alt=""
                loading="lazy"
                className="w-full aspect-[1.91/1] object-cover rounded-xl mb-4"
              />
            )}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
                {CATEGORY_EMOJI[post.category] ?? "📄"} {post.category}
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
    </>
  );
}
