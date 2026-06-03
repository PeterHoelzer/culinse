"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface ShoppingItem {
  name: string;
  amount: number | null;
  unit: string;
  original: string;
  category: string;
  categoryEmoji: string;
}

interface Grouped {
  [category: string]: {
    emoji: string;
    items: ShoppingItem[];
  };
}

interface ShoppingListDrawerProps {
  recipeIds: string[];
  recipeTitles: string[];
  planName: string;
  onClose: () => void;
}

// Category sort order
const CATEGORY_ORDER = [
  "Produce",
  "Meat & Fish",
  "Dairy",
  "Bread & Bakery",
  "Pasta, Rice & Grains",
  "Canned Goods",
  "Baking & Sweets",
  "Spices & Herbs",
  "Sauces & Oils",
  "Frozen",
  "Beverages",
  "Other",
];

function formatAmount(amount: number | null, unit: string): string {
  if (!amount || amount <= 0) return unit || "";
  // Round nicely
  let display: string;
  if (unit === "g") {
    // Round to nearest 5g for readability
    const rounded = Math.round(amount / 5) * 5;
    display = rounded >= 1000
      ? `${(Math.round(rounded / 100) / 10).toString().replace(".", ",")} kg`
      : `${rounded} g`;
    return display;
  }
  if (unit === "kg") {
    display = amount.toString().replace(".", ",");
    return `${display} kg`;
  }
  if (unit === "ml") {
    const rounded = Math.round(amount / 10) * 10;
    return rounded >= 1000
      ? `${(Math.round(rounded / 100) / 10).toString().replace(".", ",")} L`
      : `${rounded} ml`;
  }
  if (unit === "L") return `${amount.toString().replace(".", ",")} L`;
  const amt = amount % 1 === 0 ? amount.toString() : amount.toFixed(1).replace(/\.0$/, "");
  return unit ? `${amt} ${unit}` : amt;
}

export default function ShoppingListDrawer({
  recipeIds,
  recipeTitles,
  planName,
  onClose,
}: ShoppingListDrawerProps) {
  const t = useTranslations("modals");
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Grouped>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState(false);

  useEffect(() => {
    if (recipeIds.length === 0) { setLoading(false); return; }
    fetch("/api/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds }),
    })
      .then(r => r.json())
      .then(data => { setGrouped(data.grouped || {}); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [recipeIds]);

  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const totalItems = Object.values(grouped).reduce((s, g) => s + g.items.length, 0);
  const checkedCount = checked.size;

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("shoppingTitle")}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{planName} · {t("recipesCount", { count: recipeTitles.length })}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none mt-0.5">×</button>
          </div>

          {/* Progress */}
          {!loading && totalItems > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-green-400 rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${(checkedCount / totalItems) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {checkedCount}/{totalItems} {t("done")}
              </span>
              {checkedCount > 0 && (
                <button
                  onClick={() => setChecked(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  {t("reset")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-5 py-8 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-10 bg-gray-50 rounded-xl animate-pulse mb-2" />
                  ))}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl mb-2">😕</p>
              <p className="text-sm text-gray-500">{t("cantLoad")}</p>
            </div>
          ) : recipeIds.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium text-gray-600">{t("noRecipesInPlan")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("addRecipesFirst")}</p>
            </div>
          ) : totalItems === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-3xl mb-2">🤷</p>
              <p className="text-sm text-gray-500">{t("noIngredients")}</p>
            </div>
          ) : (
            <div className="px-5 py-4 pb-8 space-y-6">
              {sortedCategories.map(category => {
                const group = grouped[category];
                return (
                  <div key={category}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm py-1">
                      <span className="text-lg">{group.emoji}</span>
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{category}</span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {group.items.filter(i => checked.has(`${category}||${i.name}`)).length}/{group.items.length}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {group.items.map(item => {
                        const key = `${category}||${item.name}`;
                        const isDone = checked.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleCheck(key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                              isDone
                                ? "bg-gray-50 opacity-50"
                                : "hover:bg-orange-50"
                            }`}
                          >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isDone
                                ? "bg-green-400 border-green-400"
                                : "border-gray-300"
                            }`}>
                              {isDone && <span className="text-white text-xs">✓</span>}
                            </div>
                            {/* Name */}
                            <span className={`flex-1 text-sm font-medium capitalize transition-all ${
                              isDone ? "line-through text-gray-400" : "text-gray-800"
                            }`}>
                              {item.name}
                            </span>
                            {/* Amount */}
                            {(item.amount || item.unit) && (
                              <span className={`text-xs flex-shrink-0 transition-all ${
                                isDone ? "text-gray-300" : "text-gray-500 font-medium"
                              }`}>
                                {formatAmount(item.amount, item.unit)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Amazon grocery button */}
        {!loading && totalItems > 0 && (
          <div className="px-5 pt-3 pb-1 flex-shrink-0">
            <a
              href={`https://www.amazon.de/s?k=lebensmittel+online&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21"}`}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-all"
            >
              {t("orderGroceries")}
            </a>
            <p className="text-xs text-gray-300 text-center mt-1.5">{t("affiliateNote")}</p>
          </div>
        )}

        {/* Footer */}
        {!loading && totalItems > 0 && checkedCount === totalItems && (
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-sm font-bold text-green-700">{t("allDone")}</p>
                <p className="text-xs text-green-600">{t("boughtAll")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
