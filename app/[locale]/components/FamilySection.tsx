"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface CommunityRecipe {
  id: string;
  title: string;
  image: string | null;
  imagePosition?: string;
  time?: string;
}

/**
 * Familienrezepte & Community — das emotionale Differenzierungsmerkmal:
 * echte Rezepte von echten Menschen (allen voran Gerds Familienrezepte),
 * keine anonyme Datenbank. Rendert nur, wenn Community-Rezepte existieren.
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
    return () => { cancelled = true; };
  }, [locale]);

  if (recipes.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 sm:p-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Story */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3 block">
              {de ? "👨‍👦 Familienrezepte & Community" : "👨‍👦 Family Recipes & Community"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-snug">
              {de
                ? "Echte Rezepte von echten Menschen — nicht aus der Datenbank."
                : "Real recipes from real people — not from a database."}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              {de
                ? "Culinse wird von Küchenchef und Fleischermeister Peter gebaut — und die ersten Community-Rezepte kommen von seinem Vater Gerd: Familienklassiker, seit Jahrzehnten gekocht und für dich aufgeschrieben. Jedes Mitglied kann eigene Rezepte veröffentlichen und landet damit hier auf der Startseite."
                : "Culinse is built by head chef and master butcher Peter — and the first community recipes come from his father Gerd: family classics, cooked for decades and written down for you. Every member can publish their own recipes and land right here on the homepage."}
            </p>
            <Link
              href={`/${locale}/my-recipes`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#f97316" }}
            >
              {de ? "Eigenes Rezept veröffentlichen →" : "Publish your own recipe →"}
            </Link>
          </div>

          {/* Rezept-Karten */}
          <div className="grid grid-cols-3 gap-3">
            {recipes.map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/recipe/${r.id}`}
                className="group block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image ?? ""}
                  alt={r.title}
                  loading="lazy"
                  className="w-full aspect-square object-cover rounded-2xl border border-gray-100 group-hover:border-orange-200 transition-colors"
                  style={{ objectPosition: r.imagePosition ?? "50% 50%" }}
                />
                <p className="mt-2 text-xs font-semibold text-gray-800 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">
                  {r.title}
                </p>
                <span className="text-[10px] text-orange-500 font-medium">
                  👩‍🍳 {de ? "Community" : "Community"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
