"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/lib/navigation";

interface CommunityRecipe {
  id: string;
  title: string;
  image: string | null;
  imagePosition?: string;
  time?: string;
}

/**
 * Familienrezepte & Community: ein dunkles, warmes Band über die volle Breite.
 * Links die Geschichte (Serife, weiß), rechts vier echte Fotos als 1:1-Kacheln.
 * Das Band gibt der Startseite Rhythmus (hell, dunkel, hell) und lässt die
 * Fotos leuchten. Kein Verlauf, kein Emoji. Rendert nur mit Bildern.
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
    <section className="bg-dark text-white">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[5fr_7fr] md:items-center md:gap-16">
        {/* Text */}
        <div className="flex flex-col items-start gap-5">
          <p className="text-sm text-dark-text">{de ? "Familienrezepte und Community" : "Family recipes and community"}</p>
          <h2 className="text-h2 text-white sm:text-display-sm">
            {de ? "Echte Rezepte von echten Menschen, nicht aus der Datenbank." : "Real recipes from real people, not from a database."}
          </h2>
          <p className="max-w-prose text-body-lg text-dark-text">
            {de
              ? "Culinse wird von Küchenchef und Fleischermeister Peter gebaut. Die ersten Community-Rezepte kommen von seinem Vater: Familienklassiker, seit Jahrzehnten gekocht und für dich aufgeschrieben. Jedes Mitglied kann eigene Rezepte veröffentlichen und landet damit hier auf der Startseite."
              : "Culinse is built by head chef and master butcher Peter. The first community recipes come from his father: family classics, cooked for decades and written down for you. Every member can publish their own recipes and land right here on the homepage."}
          </p>
          <Link
            href="/my-recipes"
            className="inline-flex h-11 items-center rounded-1 border border-dark-text px-5 text-base font-semibold text-white transition-colors hover:bg-surface hover:text-ink"
          >
            {de ? "Eigenes Rezept veröffentlichen" : "Publish your own recipe"}
          </Link>
        </div>

        {/* Fotos */}
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
                className="aspect-square w-full rounded-2 object-cover"
                style={{ objectPosition: r.imagePosition ?? "50% 50%" }}
              />
              <p className="mt-2 line-clamp-1 text-sm text-white group-hover:underline underline-offset-[3px]">{r.title}</p>
              <p className="text-caption text-dark-text">Community</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
