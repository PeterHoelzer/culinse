"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { formatEstPrice, PRICES_UPDATED_AT } from "@/lib/ingredient-prices";
import { getIngredientAffiliateUrl, trackedUrl } from "@/lib/affiliateProducts";
import { Button, buttonClasses, Checkbox, EmptyState, Icon, Input, Notice, Skeleton } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

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
      { id: crypto.randomUUID(), name, amount: null, unit: newQty.trim(), category: "Other", categoryEmoji: "\u{1F6D2}" },
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

  const dateLabel = new Date(PRICES_UPDATED_AT).toLocaleDateString(de ? "de-DE" : "en-US", { month: "long", year: "numeric" });
  const iconLink = buttonClasses({ variant: "icon", size: "sm" });

  return (
    <Dialog open onClose={onClose} title={t("shoppingTitle")} side>
      <p className="-mt-2 text-sm text-ink-3">
        {planName} · {t("recipesCount", { count: recipeTitles.length })}
      </p>

      {/* Fortschritt */}
      {!loading && totalItems > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalItems}
            aria-valuenow={checkedCount}
            aria-label={`${checkedCount}/${totalItems} ${t("done")}`}
            className="h-1.5 flex-1 rounded-pill bg-line"
          >
            <div className="h-1.5 rounded-pill bg-green" style={{ width: `${(checkedCount / totalItems) * 100}%` }} />
          </div>
          <span className="tabular shrink-0 text-sm text-ink-2">
            {checkedCount}/{totalItems} {t("done")}
          </span>
          {checkedCount > 0 && (
            <Button variant="quiet" onClick={() => setChecked(new Set())} className="shrink-0 text-sm">
              {t("reset")}
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex flex-col gap-4" role="status" aria-label={t("loading")}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState tone="error" icon="alert" title={t("cantLoad")} className="mt-6" />
      ) : (
        <>
          {/* Eigenen Artikel hinzufügen */}
          <form
            className="mt-6 flex items-end gap-2"
            onSubmit={e => { e.preventDefault(); addManual(); }}
          >
            <Input
              label={tr("Own item", "Eigener Artikel")}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={tr("Add your own item…", "Eigenen Artikel hinzufügen…")}
              className="min-w-0 flex-1"
            />
            <Input
              label={tr("Quantity", "Menge")}
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              placeholder={tr("Qty", "Menge")}
              className="w-24 shrink-0"
            />
            <Button
              type="submit"
              variant="icon"
              icon="plus"
              disabled={!newName.trim()}
              aria-label={tr("Add item", "Artikel hinzufügen")}
              className="shrink-0"
            />
          </form>

          {totalItems === 0 && pantryItems.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon="cart"
              title={recipeIds.length === 0 ? t("noRecipesInPlan") : t("noIngredients")}
              text={recipeIds.length === 0 ? tr("…or just add your own items above.", "…oder füge oben einfach eigene Artikel hinzu.") : undefined}
            />
          ) : (
            <>
              {sortedCategories.map(category => {
                const group = displayGrouped[category];
                const visible = group.items.filter(i => !inPantry(i.name));
                if (visible.length === 0) return null;
                return (
                  <section key={category}>
                    <h3 className="mt-6 flex items-baseline justify-between gap-3 text-h3">
                      {group.label ?? category}
                      <span className="tabular text-sm font-normal text-ink-3">
                        {visible.filter(i => checked.has(i.key)).length}/{visible.length}
                      </span>
                    </h3>
                    <ul className="mt-2 flex flex-col">
                      {visible.map(item => {
                        const isDone = checked.has(item.key);
                        const shopUrl = !isDone ? getIngredientAffiliateUrl(item.name) : null;
                        return (
                          <li key={item.key} className="flex items-center gap-1 py-1">
                            <Checkbox
                              className="min-w-0 flex-1 py-1.5"
                              checked={isDone}
                              onChange={() => toggleCheck(item.key)}
                              label={
                                <span className={isDone ? "text-ink-3 line-through" : ""}>
                                  <span className="capitalize">{item.name}</span>
                                  {(item.amount || item.unit) && (
                                    <span className={`tabular ml-2 text-sm ${isDone ? "" : "text-ink-2"}`}>
                                      {formatAmount(item.amount, item.unit)}
                                    </span>
                                  )}
                                  {typeof item.estPrice === "number" && (
                                    <span className="tabular ml-2 text-caption text-ink-3">
                                      {formatEstPrice(item.estPrice, locale)}
                                    </span>
                                  )}
                                </span>
                              }
                            />
                            {shopUrl && (
                              <a
                                href={trackedUrl(shopUrl, "shopping_list")}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                aria-label={tr("Buy on Amazon (ad)", "Bei Amazon kaufen (Werbung)")}
                                title={tr("Buy on Amazon (ad)", "Bei Amazon kaufen (Werbung)")}
                                className={iconLink}
                              >
                                <Icon name="cart" size={20} />
                              </a>
                            )}
                            <Button
                              variant="icon"
                              size="sm"
                              icon="eyeOff"
                              onClick={() => addToPantry(item.name)}
                              aria-label={`${tr("I already have this", "Hab ich zuhause")}: ${item.name}`}
                              title={tr("I already have this", "Hab ich zuhause")}
                            />
                            {item.manualId && (
                              <Button
                                variant="icon"
                                size="sm"
                                icon="trash"
                                onClick={() => removeManual(item.manualId!)}
                                aria-label={`${tr("Remove", "Entfernen")}: ${item.name}`}
                                title={tr("Remove", "Entfernen")}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              {pantryItems.length > 0 && (
                <section>
                  <h3 className="mt-6 text-h3">
                    {tr("Already have", "Schon zuhause")} <span className="tabular font-normal text-ink-3">({pantryItems.length})</span>
                  </h3>
                  <ul className="mt-2 flex flex-col">
                    {pantryItems.map(item => (
                      <li key={item.key} className="flex items-center gap-1 py-1">
                        <span className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-base text-ink-3 line-through">
                          <Icon name="check" size={20} className="shrink-0 text-green" />
                          <span className="capitalize">{item.name}</span>
                        </span>
                        <Button
                          variant="icon"
                          size="sm"
                          icon="eye"
                          onClick={() => removeFromPantry(item.name)}
                          aria-label={`${tr("Need to buy after all", "Doch kaufen")}: ${item.name}`}
                          title={tr("Need to buy after all", "Doch kaufen")}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {pricedCount > 0 && (
                <div className="mt-6 border-t border-line pt-3">
                  <p className="tabular flex items-baseline justify-between gap-3 font-semibold">
                    <span>{tr("Estimated cost", "Geschätzte Kosten")}</span>
                    <span>{formatEstPrice(estTotal, locale)}</span>
                  </p>
                  <p className="mt-1 text-caption text-ink-3">
                    {tr("Discount-store estimate", "Discounter-Schätzung")}, {dateLabel}
                    {unpricedCount > 0 && ` · ${tr(`+ ${unpricedCount} unpriced`, `+ ${unpricedCount} ohne Schätzung`)}`}
                  </p>
                </div>
              )}

              {totalItems > 0 && checkedCount === totalItems && (
                <Notice tone="success" className="mt-6">
                  <p className="font-semibold">{t("allDone")}</p>
                  <p>{t("boughtAll")}</p>
                </Notice>
              )}

              {totalItems > 0 && (
                <div className="mt-6">
                  <a
                    href={trackedUrl(`https://www.amazon.de/s?k=lebensmittel+online&tag=${process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "culinse-21"}`, "shopping_list_all")}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={buttonClasses({ variant: "secondary", fullWidth: true })}
                  >
                    {t("orderGroceries")}
                    <Icon name="externalLink" size={18} />
                  </a>
                  <p className="mt-2 text-caption text-ink-3">{t("affiliateNote")}</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
