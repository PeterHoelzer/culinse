"use client";

import { useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { Button, Chip, ChipRow } from "@/components/ui";

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

const PAGE_SIZE = 12;

// Emojis (Piktogramme, Variationsselektoren, Joiner) aus Kategorienamen entfernen.
const EMOJI_RE = /[\p{Extended_Pictographic}‍️]/gu;
const plain = (s: string) => s.replace(EMOJI_RE, "").replace(/\s+/g, " ").trim();

export default function BlogIndexList({ posts, locale }: { posts: LitePost[]; locale: string }) {
  const de = locale === "de";
  const [active, setActive] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Kategorien nach Häufigkeit sortiert — die wichtigsten Chips zuerst
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [posts]);

  const visible = active ? posts.filter((p) => p.category === active) : posts;
  const remaining = Math.max(0, visible.length - limit);

  const select = (cat: string | null) => {
    setActive(cat);
    setLimit(PAGE_SIZE);
  };

  return (
    <>
      <ChipRow className="mb-10" >
        <Chip active={active === null} onClick={() => select(null)}>
          {de ? "Alle" : "All"} ({posts.length})
        </Chip>
        {categories.map((cat) => (
          <Chip key={cat} active={active === cat} onClick={() => select(active === cat ? null : cat)}>
            {plain(cat)}
          </Chip>
        ))}
      </ChipRow>

      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((post, i) => (
          // Alle Karten bleiben im HTML (interne Links für Crawler); jenseits
          // des Limits nur ausgeblendet.
          <li key={post.slug} hidden={i >= limit}>
            <Link
              // Explicit locale — siehe hreflang-Bug-Historie im alten Index:
              // ohne locale löste SSR die Links gegen "en" auf.
              locale={locale as "en" | "de"}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              {post.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt=""
                  width={1200}
                  height={628}
                  loading={i < 3 ? "eager" : "lazy"}
                  className="mb-4 aspect-[1.91/1] w-full rounded-2 object-cover"
                />
              )}
              <p className="text-sm text-ink-3">
                {plain(post.category)} · {post.readingTime}
              </p>
              <h2 className="mt-1 text-h3 text-ink group-hover:underline underline-offset-[3px]">{post.title}</h2>
              <p className="mt-2 line-clamp-2 text-ink-2">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <div className="mt-12">
          <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            {de ? "Mehr anzeigen" : "Show more"} ({remaining})
          </Button>
        </div>
      )}
    </>
  );
}
