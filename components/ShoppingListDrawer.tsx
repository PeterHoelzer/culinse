"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { formatEstPrice, PRICES_UPDATED_AT } from "@/lib/ingredient-prices";
import { getIngredientAffiliateUrl, trackedUrl } from "@/lib/affiliateProducts";

interface ShoppingItem {
  name: string;
  amount: number | null;
  unit: string;
  original: string;
  category: string;
  categoryEmoji: string;
  estPrice?: number | null;
}

interface ManualItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  category: string;
  categoryEmoji: string;
}

interface DisplayItem extends ShoppingItem {
  key: string;
  manualId?: string;
}

interface Grouped {
  [category: string]: {
    emoji: string;
    label?: string;
    items: ShoppingItem[];
  };
}

interface ShoppingListDrawerProps {
  recipeIds: string[];
  recipeTitles: string[];
  planName: string;
  planId?: string; // when provided, checked state + manual items persist per plan
  targets?: Record<string, number>; // recipeId → target servings (scales amounts)
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
  planId,
  targets,
  onClose,
}: ShoppingListDrawerProps) {
  const t = useTranslations("modals");
  const locale = useLocale();
  const de = locale === "de";
  const tr = (en: string, deStr: string) => (de ? deStr : en);
  const supabase = createClient();

  const [loading, setLoading] = useState(recipeIds.length > 0);
  const [autoGrouped, setAutoGrouped] = useState<Grouped>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [manual, setManual] = useState<ManualItem[]>([]);
  const [error, setError] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [pantry, setPantry] = useState<{ id: string; name: string }[]>([]);
  const loadedRef = useRef(false);

  // Auto items from the recipes in the plan
  useEffect(() => {
    if (recipeIds.length === 0) return; // loading already starts false in this case
    fetch("/api/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds, targets: targets ?? {}, lang: locale }),
    })
      .then(r => r.json())
      .then(data => { setAutoGrouped(data.grouped || {}); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeIds, targets]);

  // Load persisted state (checked + manual) for this plan
  useEffect(() => {
    if (!planId) { loadedRef.current = true; return; }
    let cancelled = false;
    supabase
      .from("shopping_lists")
      .select("checked, manual")
      .eq("plan_id", planId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          if (Array.isArray(data.checked)) setChecked(new Set(data.checked as string[]));
          if (Array.isArray(data.manual)) setManual(data.manual as ManualItem[]);
        }
        loadedRef.current = true;
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // Persist (debounced) whenever checked/manual change — only after initial load
  useEffect(() => {
    if (!planId || !loadedRef.current) return;
    const handle = setTimeout(() => {
      supabase
        .from("shopping_lists")
        .upsert(
          { plan_id: planId, checked: Array.from(checked), manual, updated_at: new Date().toISOString() },
          { onConflict: "plan_id" },
        )
        .then(() => {});
    }, 700);
    return () => clearTimeout(handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, manual, planId]);

  // Load the user's pantry — RLS scopes the query to the current user.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("pantry_items")
      .select("id, name")
      .then(({ data }) => {
        if (!cancelled && Array.isArray(data)) setPantry(data as { id: string; name: string }[]);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    setManual(prev => [
      ...prev,
      { id: crypto.randomUUID(), name, amount: null, unit: newQty.trim(), category: "Other", categoryEmoji: "🛒" },
    ]);
    setNewName("");
    setNewQty("");
  };

  const removeManual = (id: string) => {
    setManual(prev => prev.filter(m => m.id !== id));
    setChecked(prev => {
      const next = new Set(prev);
      next.delete(`m||${id}`);
      return next;
    });
  };

  // ── Pantry ("what I already have") ──
  const pantrySet = useMemo(() => new Set(pantry.map(p => p.name.toLowerCase().trim())), [pantry]);
  const inPantry = (name: string) => pantrySet.has(name.toLowerCase().trim());

  const addToPantry = async (name: string) => {
    const clean = name.trim();
    if (!clean || pantrySet.has(clean.toLowerCase())) return;
    const tempId = crypto.randomUUID();
    setPantry(prev => [...prev, { id: tempId, name: clean }]);
    const { data } = await supabase.from("pantry_items").insert({ name: clean }).select("id").single();
    if (data?.id) setPantry(prev => prev.map(p => (p.id === tempId ? { ...p, id: data.id as string } : p)));
  };

  const removeFromPantry = async (name: string) => {
    const target = pantry.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (!target) return;
    setPantry(prev => prev.filter(p => p.id !== target.id));
    await supabase.from("pantry_items").delete().eq("id", target.id);
  };

  // Merge auto items + manual items into one grouped structure
  const displayGrouped = useMemo(() => {
    const g: Record<string, { emoji: string; label: string; items: DisplayItem[] }> = {};
    for (const [cat, group] of Object.entries(autoGrouped)) {
      for (const item of group.items) {
        (g[cat] ||= { emoji: group.emoji, label: group.label ?? cat, items: [] }).items.push({ ...item, key: `${cat}||${item.name}` });
      }
    }
    for (const m of manual) {
      (g[m.category] ||= { emoji: m.categoryEmoji, label: de ? "Sonstiges" : m.category, items: [] }).items.push({
        name: m.name,
        amount: m.amount,
        unit: m.unit,
        original: m.name,
        category: m.category,
        categoryEmoji: m.categoryEmoji,
        key: `m||${m.id}`,
        manualId: m.id,
      });
    }
    return g;
  }, [autoGrouped, manual, de]);

  const buyKeys = useMemo(
    () => Object.values(displayGrouped).flatMap(g => g.items).filter(i => !pantrySet.has(i.name.toLowerCase().trim())).map(i => i.key),
    [displayGrouped, pantrySet],
  );
  const pantryItems = useMemo(
    () => Object.values(displayGrouped).flatMap(g => g.items).filter(i => pantrySet.has(i.name.toLowerCase().trim())),
    [displayGrouped, pantrySet],
  );
  const totalItems = buyKeys.length;
  const checkedCount = buyKeys.filter(k => checked.has(k)).length;

  // Geschätzte Wochenkosten über alle Kauf-Positionen (ohne Vorrat)
  const { estTotal, pricedCount, unpricedCount } = useMemo(() => {
    const buyItems = Object.values(displayGrouped)
      .flatMap(g => g.items)
      .filter(i => !pantrySet.has(i.name.toLowerCase().trim()));
    const priced = buyItems.filter(i => typeof i.estPrice === "number");
    return {
      estTotal: priced.reduce((sum, i) => sum + (i.estPrice as number), 0),
      pricedCount: priced.length,
      unpricedCount: buyItems.length - priced.length,
    };
  }, [displayGrouped, pantrySet]);

  const sortedCategories = Object.keys(displayGrouped).sort((a, b) => {
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

          {/* Geschätzte Kosten */}
          {!loading && pricedCount > 0 && (
            <div className="mt-3 flex items-baseline justify-between gap-3 bg-orange-50 border border-orange-100 rounded-xl px-3.5 py-2.5">
              <div>
                <span className="text-sm font-bold text-gray-900">
                  {tr("Estimated cost:", "Geschätzte Kosten:")}{" "}
                  <span className="text-orange-600">{formatEstPrice(estTotal, locale)}</span>
                </span>
                {unpricedCount > 0 && (
                  <span className="text-xs text-gray-400 ml-1.5">
                    {tr(`+ ${unpricedCount} unpriced`, `+ ${unpricedCount} ohne Schätzung`)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {tr("Discount-store estimate", "Discounter-Schätzung")} ·{" "}
                {new Date(PRICES_UPDATED_AT).toLocaleDateString(de ? "de-DE" : "en-US", { month: "long", year: "numeric" })}
              </span>
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
          ) : (
            <div className="px-5 py-4 pb-8 space-y-5">
              {/* Add your own item */}
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addManual(); }}
                  placeholder={tr("Add your own item…", "Eigenen Artikel hinzufügen…")}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
                <input
                  value={newQty}
                  onChange={e => setNewQty(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addManual(); }}
                  placeholder={tr("Qty", "Menge")}
                  className="w-20 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300"
                />
                <button
                  onClick={addManual}
                  disabled={!newName.trim()}
                  className="w-10 h-10 flex-shrink-0 rounded-xl text-white text-xl font-semibold flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#f97316" }}
                  title={tr("Add item", "Artikel hinzufügen")}
                >
                  +
                </button>
              </div>

              {totalItems === 0 && pantryItems.length === 0 ? (
                <div className="py-10 text-center">
                  {recipeIds.length === 0 ? (
                    <>
                      <p className="text-3xl mb-2">📭</p>
                      <p className="text-sm font-medium text-gray-600">{t("noRecipesInPlan")}</p>
                      <p className="text-xs text-gray-400 mt-1">{tr("…or just add your own items above.", "…oder füge oben einfach eigene Artikel hinzu.")}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl mb-2">🤷</p>
                      <p className="text-sm text-gray-500">{t("noIngredients")}</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                {sortedCategories.map(category => {
                  const group = displayGrouped[category];
                  const visible = group.items.filter(i => !inPantry(i.name));
                  if (visible.length === 0) return null;
                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm py-1">
                        <span className="text-lg">{group.emoji}</span>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{group.label ?? category}</span>
                        <span className="text-xs text-gray-300 ml-auto">
                          {visible.filter(i => checked.has(i.key)).length}/{visible.length}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {visible.map(item => {
                          const isDone = checked.has(item.key);
                          return (
                            <div key={item.key} className="flex items-center gap-1">
                              <button
                                onClick={() => toggleCheck(item.key)}
                                className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                  isDone ? "bg-gray-50 opacity-50" : "hover:bg-orange-50"
                                }`}
                              >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isDone ? "bg-green-400 border-green-400" : "border-gray-300"
                                }`}>
                                  {isDone && <span className="text-white text-xs">✓</span>}
                                </div>
                                {/* Name */}
                                <span className={`flex-1 text-sm font-medium capitalize transition-all ${
                                  isDone ? "line-through text-gray-400" : "text-gray-800"
                                }`}>
                                  {item.name}
                                  {item.manualId && <span className="ml-1.5 text-xs text-gray-300 normal-case">✍️</span>}
                                </span>
                                {/* Amount */}
                                {(item.amount || item.unit) && (
                                  <span className={`text-xs flex-shrink-0 transition-all ${
                                    isDone ? "text-gray-300" : "text-gray-500 font-medium"
                                  }`}>
                                    {formatAmount(item.amount, item.unit)}
                                  </span>
                                )}
                                {typeof item.estPrice === "number" && (
                                  <span className={`text-[10px] flex-shrink-0 w-14 text-right tabular-nums ${
                                    isDone ? "text-gray-200" : "text-gray-400"
                                  }`}>
                                    {formatEstPrice(item.estPrice, locale)}
                                  </span>
                                )}
                              </button>
                              {!isDone && (() => {
                                const shopUrl = getIngredientAffiliateUrl(item.name);
                                return shopUrl ? (
                                  <a
                                    href={trackedUrl(shopUrl, "shopping_list")}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    title={tr("Buy on Amazon (ad)", "Bei Amazon kaufen (Werbung)")}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                  >
                                    🛒
                                  </a>
                                ) : null;
                              })()}
                              <button
                                onClick={() => addToPantry(item.name)}
                                className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                title={tr("I already have this", "Hab ich zuhause")}
                              >
                                🏠
                              </button>
                              {item.manualId && (
                                <button
                                  onClick={() => removeManual(item.manualId!)}
                                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                                  title={tr("Remove", "Entfernen")}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {pantryItems.length > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🏠</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {tr("Already have", "Schon zuhause")} ({pantryItems.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {pantryItems.map(item => (
                        <div key={item.key} className="flex items-center gap-1">
                          <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/60">
                            <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                            <span className="flex-1 text-sm font-medium capitalize text-gray-400 line-through">{item.name}</span>
                          </div>
                          <button
                            onClick={() => removeFromPantry(item.name)}
                            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                            title={tr("Need to buy after all", "Doch kaufen")}
                          >
                            ↩
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Amazon grocery button */}
        {!loading && totalItems > 0 && (
          <div className="px-5 pt-3 pb-1 flex-shrink-0">
            <a
              href={trackedUrl(`https://www.amazon.de/s?k=lebensmittel+online&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21"}`, "shopping_list_all")}
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
