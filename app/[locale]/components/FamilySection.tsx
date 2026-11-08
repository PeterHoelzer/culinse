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
 * Familienrezepte & Community (DESIGN.md §3, §5): zweispaltig, links die
 * Community-Fotos als 1:1-Kacheln, rechts Titel in Serife, ein Absatz und
 * ein leiser Button. Kein Eyebrow, keine Karte mit Rahmen, kein Emoji.
 * Rendert nur, wenn Community-Rezepte mit Bild existieren.
 */
export default function FamilySection() {
  const locale = useLocale();
  const de = locale === "de";
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community-recipes?number=3&lang=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d?.recipes)) setRecipes(d.recipes.filter((r: CommunityRecipe) => r.image));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (recipes.length === 0) return null;

  const single = recipes.length === 1;

  return (
    <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
        {/* Fotos */}
        <div className={single ? "" : "grid grid-cols-3 gap-3"}>
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipe/${r.id}`} className="group block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.image ?? ""}
                alt={r.title}
                loading="lazy"
                decoding="async"
                width={single ? 960 : 400}
                height={single ? 960 : 400}
                className="aspect-square w-full rounded-2 object-cover"
                style={{ objectPosition: r.imagePosition ?? "50% 50%" }}
              />
              <p className="mt-2 line-clamp-2 text-sm text-ink group-hover:underline underline-offset-[3px]">{r.title}</p>
              <p className="text-caption text-ink-3">Community</p>
            </Link>
          ))}
        </div>

        {/* Text */}
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-h2-sm sm:text-h2">
            {de ? "Echte Rezepte von echten Menschen, nicht aus der Datenbank." : "Real recipes from real people, not from a database."}
          </h2>
          <p className="max-w-prose text-body-lg text-ink-2">
            {de
              ? "Culinse wird von Küchenchef und Fleischermeister Peter gebaut. Die ersten Community-Rezepte kommen von seinem Vater: Familienklassiker, seit Jahrzehnten gekocht und für dich aufgeschrieben. Jedes Mitglied kann eigene Rezepte veröffentlichen und landet damit hier auf der Startseite."
              : "Culinse is built by head chef and master butcher Peter. The first community recipes come from his father: family classics, cooked for decades and written down for you. Every member can publish their own recipes and land right here on the homepage."}
          </p>
          <Button variant="quiet" href="/my-recipes">
            {de ? "Eigenes Rezept veröffentlichen" : "Publish your own recipe"}
          </Button>
        </div>
      </div>
    </section>
  );
}
