"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getAffiliateUrl, getToolsForRecipe, trackedUrl } from "@/lib/affiliateProducts";

interface Props {
  dishTypes: string[];
  ingredientNames: string[];
  recipeTitle?: string;
  toolsOnly?: boolean;
  recipeId?: string | number;
}

export function AffiliateBox({ dishTypes, ingredientNames, recipeTitle, toolsOnly, recipeId }: Props) {
  const t = useTranslations("modals");
  const products = useMemo(
    () => getToolsForRecipe(dishTypes, ingredientNames, recipeTitle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipeTitle, dishTypes.join(","), ingredientNames.slice(0, 10).join(",")]
  );

  if (products.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {toolsOnly ? t("kitchenTools") : t("shop")}
        </p>
        <span className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5">{t("ad")}</span>
      </div>

      <div className="space-y-1.5">
        {products.map((p) => (
          <a
            key={p.search}
            href={trackedUrl(getAffiliateUrl(p), "recipe_tools", recipeId)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-orange-50 transition-colors group"
          >
            <span className="text-xl flex-shrink-0 w-8 text-center">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 line-clamp-1 group-hover:text-orange-600 transition-colors">
                {p.name}
              </p>
              <p className="text-xs text-gray-400">{p.price} · Amazon</p>
            </div>
            <span className="text-gray-300 group-hover:text-orange-400 text-sm flex-shrink-0">→</span>
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-3 text-center">{t("affiliateLinks")}</p>
    </div>
  );
}
