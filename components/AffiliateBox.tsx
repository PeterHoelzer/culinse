"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getAffiliateUrl, getToolsForRecipe, trackedUrl } from "@/lib/affiliateProducts";
import { Icon } from "@/components/ui";

interface Props {
  dishTypes: string[];
  ingredientNames: string[];
  recipeTitle?: string;
  toolsOnly?: boolean;
  recipeId?: string | number;
}

/**
 * Küchenwerkzeuge zum Rezept (Amazon-Partnerlinks). Gestaltung nach DESIGN.md:
 * weiße Fläche mit Linie, Serifen-Titel, Produktkachel mit festem Quadrat
 * (die Produkte haben keine Bilder, deshalb ein Strich-Icon statt Emoji),
 * Links ohne Pfeil.
 */
export function AffiliateBox({ dishTypes, ingredientNames, recipeTitle, toolsOnly, recipeId }: Props) {
  const t = useTranslations("modals");
  const products = useMemo(
    () => getToolsForRecipe(dishTypes, ingredientNames, recipeTitle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipeTitle, dishTypes.join(","), ingredientNames.slice(0, 10).join(",")]
  );

  if (products.length === 0) return null;

  const title = toolsOnly ? t("kitchenTools") : t("shop");

  return (
    <aside className="rounded-2 border border-line p-6" aria-label={title}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-h3">{title}</h3>
        <span className="text-caption text-ink-3">{t("ad")}</span>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {products.map((p) => (
          <li key={p.search}>
            <a
              href={trackedUrl(getAffiliateUrl(p), "recipe_tools", recipeId)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center gap-4 py-3"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2 bg-surface-soft text-ink-3"
                aria-hidden="true"
              >
                <Icon name="utensils" size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-ink underline-offset-[3px] group-hover:underline">{p.name}</span>
                <span className="block text-sm text-ink-3 tabular">{p.price} · Amazon</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-caption text-ink-3">{t("affiliateLinks")}</p>
    </aside>
  );
}
