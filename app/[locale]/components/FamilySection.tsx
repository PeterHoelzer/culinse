"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui";

interface CommunityRecipe {
  id: string;
  title: string;
  image: string | null;
  imagePosition?: string;
  time?: string;
}

/**
 * Familienrezepte: Peters Stimme als großes Zitat in Fraunces auf Creme,
 * daneben vier echte Fotos. Keine Marketing-Überschrift, ein Satz, der stimmt.
 * Rendert nur, wenn Community-Rezepte mit Bild existieren.
 */
export default function FamilySection() {
  const locale = useLocale();
  const de = locale === "de";
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community-recipes?number=4&lang=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d?.recipes)) setRecipes(d.recipes.filter((r: CommunityRecipe) => r.image).slice(0, 4));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (recipes.length === 0) return null;

  const single = recipes.length === 1;

  return (
    <section className="bg-surface-soft">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[7fr_5fr] md:items-center md:gap-16">
        <blockquote className="m-0 flex flex-col items-start gap-6">
          <p className="max-w-[30ch] font-serif text-h2 font-medium text-ink sm:text-display-sm" style={{ lineHeight: 1.08 }}>
            {de
              ? "„Die ersten Rezepte hier sind die meines Vaters. Senfsauce, Spitzkohl, Hühnersuppe. Seit vierzig Jahren gleich gekocht.“"
              : "“The first recipes here are my father’s. Mustard sauce, pointed cabbage, chicken soup. Cooked the same way for forty years.”"}
          </p>
          <footer className="text-base text-ink-2">
            {de ? "Peter Hölzer, Fleischermeister und Küchenchef" : "Peter Hölzer, master butcher and head chef"}
          </footer>
          <Button variant="quiet" href="/my-recipes">
            {de ? "Eigenes Rezept veröffentlichen" : "Publish your own recipe"}
          </Button>
        </blockquote>

        <div className={single ? "" : "grid grid-cols-2 gap-3 sm:gap-4"}>
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipe/${r.id}`} className="group block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.image ?? ""}
                alt={r.title}
                loading="lazy"
                decoding="async"
                width={single ? 960 : 600}
                height={single ? 960 : 600}
                className="aspect-square w-full rounded-1 object-cover"
                style={{ objectPosition: r.imagePosition ?? "50% 50%" }}
              />
              <p className="mt-2 line-clamp-1 text-sm text-ink group-hover:underline underline-offset-[3px]">{r.title}</p>
              <p className="text-caption text-ink-3">Community</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
