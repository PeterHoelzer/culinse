"use client";

import { useMemo } from "react";
import {
  AffiliateProduct,
  getAffiliateUrl,
  getProductsForRecipe,
} from "@/lib/affiliateProducts";

interface Props {
  dishTypes: string[];
  ingredientNames: string[];
  recipeTitle?: string;
}

export function AffiliateBox({ dishTypes, ingredientNames, recipeTitle }: Props) {
  const products = useMemo(
    () => getProductsForRecipe(dishTypes, ingredientNames, recipeTitle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipeTitle]
  );

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900">🛒 Kitchen Essentials</h3>
        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 leading-tight">
          Ad
        </span>
      </div>

      <div className="space-y-2">
        {products.map((p) => (
          <ProductRow key={p.asin ?? p.ninjaUrl} product={p} />
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center leading-relaxed">
        Affiliate links — we may earn a small commission at no extra cost to you.
      </p>
    </div>
  );
}

function ProductRow({ product }: { product: AffiliateProduct }) {
  const url = getAffiliateUrl(product);
  const isNinja = product.network === "ninja";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition-colors group"
    >
      {/* Product image */}
      <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 font-semibold">{product.price}</span>
          {isNinja && (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Ninja
            </span>
          )}
          {!isNinja && (
            <span className="text-xs text-gray-400">via Amazon</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <span className="text-gray-300 group-hover:text-orange-400 transition-colors text-lg flex-shrink-0">
        →
      </span>
    </a>
  );
}
