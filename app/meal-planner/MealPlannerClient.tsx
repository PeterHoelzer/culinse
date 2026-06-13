"use client";
import ProBadge from "@/components/ProBadge";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import PlanRecipePickerModal from "@/components/PlanRecipePickerModal";
import ShoppingListDrawer from "@/components/ShoppingListDrawer";

interface Plan {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface Entry {
  id: string;
  day_index: number;
  meal_slot: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image: string | null;
  recipe_time: number | null;
  servings: number | null;
}

interface Nut {
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

interface PickerTarget {
  dayIndex: number;
  slot: "breakfast" | "lunch" | "dinner";
}

const FREE_PLAN_LIMIT = 1;

export default function MealPlannerPage() {
  const t = useTranslations("mealPlanner");
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [renamingPlan, setRenamingPlan] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<{ day: number; slot: string } | null>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [nutritionByRecipe, setNutritionByRecipe] = useState<Record<string, Nut>>({});
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planCalories, setPlanCalories] = useState("2000");
  const [planDiet, setPlanDiet] = useState("");
  const [generateError, setGenerateError] = useState(false);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const locale = useLocale();

  const DAYS_FULL = t.raw("daysFull") as string[];
  const MEAL_LABELS = t.raw("meals") as string[];
  const SLOTS = [
    { value: "breakfast" as const, label: MEAL_LABELS[0], emoji: "🌅" },
    { value: "lunch"     as const, label: MEAL_LABELS[1], emoji: "☀️" },
    { value: "dinner"    as const, label: MEAL_LABELS[2], emoji: "🌙" },
  ];

  const loadEntries = useCallback(async (planId: string) => {
    if (!planId) return;
    const { data } = await supabase
      .from("meal_plan_entries")
      .select("*")
      .eq("plan_id", planId);
    setEntries(data || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const [{ data: plansData }, { data: profile }] = await Promise.all([
        supabase.from("meal_plans").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("profiles").select("is_pro").eq("id", user.id).single(),
      ]);

      const pro = profile?.is_pro ?? false;
      setIsPro(pro);

      let list: Plan[] = plansData || [];

      if (list.length === 0) {
        const { data: created } = await supabase
          .from("meal_plans")
          .insert({ user_id: user.id, name: t("planName"), is_active: true })
          .select()
          .single();
        if (created) list = [created];
      }

      setPlans(list);
      const active = list.find(p => p.is_active) ?? list[0];
      setActivePlanId(active?.id ?? "");
      if (active?.id) await loadEntries(active.id);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchPlan = async (planId: string) => {
    setActivePlanId(planId);
    await loadEntries(planId);
  };

  const handleCreatePlan = async () => {
    if (!isPro && plans.length >= FREE_PLAN_LIMIT) { setShowProModal(true); return; }
    if (!newPlanName.trim()) return;

    const res = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlanName.trim(), is_active: false }),
    });

    if (res.status === 403) { setShowProModal(true); setCreatingPlan(false); setNewPlanName(""); return; }
    if (!res.ok) return;

    const { plan } = await res.json();
    if (plan) { setPlans(prev => [...prev, plan]); setActivePlanId(plan.id); setEntries([]); }
    setCreatingPlan(false);
    setNewPlanName("");
  };

  const handleRenamePlan = async (planId: string) => {
    if (!renameValue.trim()) return;
    await supabase.from("meal_plans").update({ name: renameValue.trim() }).eq("id", planId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, name: renameValue.trim() } : p));
    setRenamingPlan(null);
  };

  const handleDeletePlan = async (planId: string) => {
    if (plans.length <= 1) return;
    if (!confirm(t("deletePlanConfirm"))) return;
    await supabase.from("meal_plans").delete().eq("id", planId);
    const remaining = plans.filter(p => p.id !== planId);
    setPlans(remaining);
    if (activePlanId === planId) {
      setActivePlanId(remaining[0]?.id ?? "");
      await loadEntries(remaining[0]?.id ?? "");
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    setDeletingEntry(entryId);
    await supabase.from("meal_plan_entries").delete().eq("id", entryId);
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setDeletingEntry(null);
  };

  const handleEntryAdded = (entry: Omit<Entry, "id" | "servings"> & { id?: string }) => {
    setEntries(prev => {
      const filtered = prev.filter(
        e => !(e.day_index === entry.day_index && e.meal_slot === entry.meal_slot)
      );
      return [...filtered, { ...entry, id: entry.id ?? crypto.randomUUID(), servings: null }];
    });
  };

  const handleSetServings = async (entry: Entry, value: number | null) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, servings: value } : e));
    await supabase.from("meal_plan_entries").update({ servings: value }).eq("id", entry.id);
  };

  // Move/swap a meal via drag & drop. Swapping two occupied cells exchanges only
  // their recipe *contents* — each row keeps its id/day_index/meal_slot — so the
  // (plan_id, day_index, meal_slot) unique constraint is never violated. Dropping
  // onto an empty cell just repoints the dragged row's day/slot.
  const handleMove = async (
    from: { day: number; slot: string },
    to: { day: number; slot: string }
  ) => {
    if (from.day === to.day && from.slot === to.slot) return;
    const a = entries.find(e => e.day_index === from.day && e.meal_slot === from.slot);
    if (!a) return;
    const b = entries.find(e => e.day_index === to.day && e.meal_slot === to.slot);

    if (!b) {
      setEntries(prev => prev.map(e =>
        e.id === a.id ? { ...e, day_index: to.day, meal_slot: to.slot } : e
      ));
      await supabase
        .from("meal_plan_entries")
        .update({ day_index: to.day, meal_slot: to.slot })
        .eq("id", a.id);
      return;
    }

    const aData = { recipe_id: a.recipe_id, recipe_title: a.recipe_title, recipe_image: a.recipe_image, recipe_time: a.recipe_time, servings: a.servings };
    const bData = { recipe_id: b.recipe_id, recipe_title: b.recipe_title, recipe_image: b.recipe_image, recipe_time: b.recipe_time, servings: b.servings };
    setEntries(prev => prev.map(e => {
      if (e.id === a.id) return { ...e, ...bData };
      if (e.id === b.id) return { ...e, ...aData };
      return e;
    }));
    await Promise.all([
      supabase.from("meal_plan_entries").update(bData).eq("id", a.id),
      supabase.from("meal_plan_entries").update(aData).eq("id", b.id),
    ]);
  };

  // Auto-fill empty slots with recipes from the user's OWN recipes + saved
  // recipes, topped up with trending so it works even for brand-new users.
  // No duplicates by default; `allowRepeats` lets a dish span several days.
  const handleAutoFill = async (allowRepeats = false) => {
    if (autoFilling || !activePlanId) return;
    setAutoFilling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const occupied = new Set(entries.map(e => `${e.day_index}|${e.meal_slot}`));
      const emptySlots: { day: number; slot: "breakfast" | "lunch" | "dinner" }[] = [];
      for (let d = 0; d < 7; d++) {
        for (const s of SLOTS) {
          if (!occupied.has(`${d}|${s.value}`)) emptySlots.push({ day: d, slot: s.value });
        }
      }
      if (emptySlots.length === 0) return;

      type Cand = { recipe_id: string; title: string; image: string | null; time: number | null };
      const toTime = (v: unknown): number | null => (v ? (parseInt(String(v)) || null) : null);

      // Candidate pool — deduped by recipe_id.
      const pool: Cand[] = [];
      const seen = new Set<string>();
      const add = (c: Cand) => {
        if (c.recipe_id && c.title && !seen.has(c.recipe_id)) { seen.add(c.recipe_id); pool.push(c); }
      };

      // 1. The user's own created/imported recipes.
      const { data: own } = await supabase
        .from("user_recipes")
        .select("id, title, image_url, cook_time")
        .eq("user_id", user.id);
      (own ?? []).forEach(r => add({ recipe_id: `user_${r.id}`, title: r.title, image: r.image_url ?? null, time: toTime(r.cook_time) }));

      // 2. Saved recipes.
      const { data: saved } = await supabase
        .from("saved_recipes")
        .select("recipe_id, title, image, time")
        .eq("user_id", user.id);
      (saved ?? []).forEach(r => add({ recipe_id: String(r.recipe_id), title: r.title, image: r.image ?? null, time: toTime(r.time) }));

      // Without repeats, never reuse a recipe that's already in the plan.
      const plannedIds = new Set(entries.map(e => e.recipe_id));
      const usable: Cand[] = allowRepeats ? [...pool] : pool.filter(c => !plannedIds.has(c.recipe_id));

      // 3. Top up from trending if we still need more (unique) recipes.
      if (usable.length < emptySlots.length) {
        try {
          const res = await fetch(`/api/recipes?number=24&lang=${locale}`);
          const data = await res.json();
          for (const r of (data.recipes ?? [])) {
            const id = String(r.id);
            if (!r.title || seen.has(id) || (!allowRepeats && plannedIds.has(id))) continue;
            seen.add(id);
            usable.push({ recipe_id: id, title: r.title, image: r.image ?? null, time: toTime(r.time) });
          }
        } catch { /* ignore — own/saved recipes alone are fine */ }
      }
      if (usable.length === 0) return;

      const shuffled = [...usable].sort(() => Math.random() - 0.5);
      const rows: { plan_id: string; user_id: string; day_index: number; meal_slot: string; recipe_id: string; recipe_title: string; recipe_image: string | null; recipe_time: number | null }[] = [];
      emptySlots.forEach((slot, i) => {
        // No repeats → unique recipe per slot (stop when the pool runs out);
        // repeats allowed → wrap around so a dish can span several days.
        const r = allowRepeats ? shuffled[i % shuffled.length] : shuffled[i];
        if (!r) return;
        rows.push({
          plan_id: activePlanId,
          user_id: user.id,
          day_index: slot.day,
          meal_slot: slot.slot,
          recipe_id: r.recipe_id,
          recipe_title: r.title,
          recipe_image: r.image,
          recipe_time: r.time,
        });
      });
      if (rows.length === 0) return;

      const { data: inserted } = await supabase
        .from("meal_plan_entries")
        .upsert(rows, { onConflict: "plan_id,day_index,meal_slot" })
        .select();

      if (inserted && inserted.length) {
        setEntries(prev => {
          const keep = prev.filter(e => !inserted.some((n: Entry) => n.day_index === e.day_index && n.meal_slot === e.meal_slot));
          return [...keep, ...(inserted as Entry[])];
        });
      }
    } finally {
      setAutoFilling(false);
    }
  };

  // Generate a full week targeting a daily calorie goal (Spoonacular) and
  // replace the active plan with it.
  const handleGeneratePlan = async () => {
    if (generating || !activePlanId) return;
    if (entries.length > 0 && !confirm(locale === "de" ? "Das ersetzt den aktuellen Plan. Fortfahren?" : "This replaces your current plan. Continue?")) return;
    setGenerating(true);
    setGenerateError(false);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCalories: Number(planCalories) || 2000, diet: planDiet }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.entries) || data.entries.length === 0) {
        setGenerateError(true);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("meal_plan_entries").delete().eq("plan_id", activePlanId);
      const rows = (data.entries as Omit<Entry, "id" | "servings">[]).map(e => ({ ...e, plan_id: activePlanId, user_id: user.id }));
      const { data: inserted } = await supabase
        .from("meal_plan_entries")
        .upsert(rows, { onConflict: "plan_id,day_index,meal_slot" })
        .select();
      setEntries((inserted as Entry[]) ?? []);
      setShowAutoPlan(false);
    } catch {
      setGenerateError(true);
    } finally {
      setGenerating(false);
    }
  };

  const getEntry = (dayIndex: number, slot: string) =>
    entries.find(e => e.day_index === dayIndex && e.meal_slot === slot);

  const totalEntries = entries.length;
  const shoppingRecipeIds = useMemo(() => entries.map(e => e.recipe_id), [entries]);
  const shoppingTargets = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) {
      if (e.servings && e.servings > 0) m[e.recipe_id] = (m[e.recipe_id] ?? 0) + e.servings;
    }
    return m;
  }, [entries]);

  // ── Nutrition (per serving) → day/week macro totals ──
  const uniqueRecipeIds = useMemo(() => Array.from(new Set(entries.map(e => e.recipe_id))), [entries]);

  useEffect(() => {
    const missing = uniqueRecipeIds.filter(id => !(id in nutritionByRecipe));
    if (missing.length === 0) return;
    let cancelled = false;
    fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeIds: missing }),
    })
      .then(r => r.json())
      .then(data => { if (!cancelled && data.nutrition) setNutritionByRecipe(prev => ({ ...prev, ...data.nutrition })); })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueRecipeIds]);

  const dayTotals = useMemo(() => {
    const days: ({ calories: number; protein: number; fat: number; carbs: number; partial: boolean } | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const dayEntries = entries.filter(e => e.day_index === d);
      let cal = 0, p = 0, f = 0, c = 0, counted = 0;
      for (const e of dayEntries) {
        const n = nutritionByRecipe[e.recipe_id];
        if (n) { cal += n.calories; p += n.protein ?? 0; f += n.fat ?? 0; c += n.carbs ?? 0; counted++; }
      }
      days.push(counted > 0 ? { calories: cal, protein: p, fat: f, carbs: c, partial: counted < dayEntries.length } : null);
    }
    return days;
  }, [entries, nutritionByRecipe]);

  const weekTotal = useMemo(() => {
    let cal = 0, p = 0, f = 0, c = 0, daysWith = 0;
    for (const d of dayTotals) {
      if (d) { cal += d.calories; p += d.protein; f += d.fat; c += d.carbs; daysWith++; }
    }
    return { calories: cal, protein: p, fat: f, carbs: c, daysWith };
  }, [dayTotals]);

  const openPicker = (dayIndex: number, slot: "breakfast" | "lunch" | "dinner") => {
    setPickerTarget({ dayIndex, slot });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="pb-14 pt-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">📅 {t("title")}</h1>
          <p className="text-orange-100 text-sm mb-4">{t("tapToAdd")}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full h-1.5 w-36">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${(totalEntries / 21) * 100}%` }}
                />
              </div>
              <p className="text-orange-100 text-xs">{t("mealsPlanned", { n: totalEntries })}</p>
            </div>
            {weekTotal.daysWith > 0 && (
              <span className="px-4 py-2 rounded-full bg-white/15 text-white text-sm font-medium">
                Ø {Math.round(weekTotal.calories / weekTotal.daysWith)} kcal/{locale === "de" ? "Tag" : "day"}
              </span>
            )}
            <button
              onClick={() => setShowAutoPlan(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-all"
            >
              ✨ {locale === "de" ? "Auto-Plan" : "Auto-plan"}
            </button>
            {totalEntries > 0 && (
              <button
                onClick={() => setShowShoppingList(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-orange-600 text-sm font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                {t("shoppingList")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6 pb-24">

        {/* Plan tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center gap-1">
                {renamingPlan === plan.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleRenamePlan(plan.id); if (e.key === "Escape") setRenamingPlan(null); }}
                      className="text-sm border border-orange-300 rounded-full px-3 py-1.5 outline-none w-36"
                    />
                    <button onClick={() => handleRenamePlan(plan.id)} className="text-orange-500 text-sm font-semibold">✓</button>
                    <button onClick={() => setRenamingPlan(null)} className="text-gray-400 text-sm">×</button>
                  </div>
                ) : (
                  <button
                    onClick={() => switchPlan(plan.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      activePlanId === plan.id
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                    }`}
                  >
                    {plan.name}
                  </button>
                )}
                {activePlanId === plan.id && renamingPlan !== plan.id && (
                  <div className="flex items-center gap-0.5 ml-0.5">
                    <button
                      onClick={() => { setRenamingPlan(plan.id); setRenameValue(plan.name); }}
                      className="text-white/70 hover:text-white text-xs px-1"
                    >✏️</button>
                    {plans.length > 1 && (
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-white/60 hover:text-white text-xs px-1"
                      >🗑</button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {creatingPlan ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreatePlan(); if (e.key === "Escape") setCreatingPlan(false); }}
                  placeholder={t("namePlanPlaceholder")}
                  className="text-sm border border-orange-300 rounded-full px-3 py-1.5 outline-none w-36"
                />
                <button onClick={handleCreatePlan} className="text-orange-500 font-semibold text-sm">✓</button>
                <button onClick={() => setCreatingPlan(false)} className="text-gray-400 text-sm">×</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!isPro && plans.length >= FREE_PLAN_LIMIT) { setShowProModal(true); return; }
                  setCreatingPlan(true);
                }}
                className="px-4 py-2 rounded-full text-sm border border-dashed border-gray-300 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-all whitespace-nowrap flex items-center gap-2"
              >
                {!isPro && plans.length >= FREE_PLAN_LIMIT
                  ? <><ProBadge feature="Multiple meal plans" />{t("proMorePlans")}</>
                  : t("newPlan")}
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop Grid ── */}
        <div className="hidden md:block">
          <p className="text-[11px] text-gray-400 mb-2">{t("dragHint")}</p>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-3 mb-1 px-0">
            {DAYS_FULL.map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wide py-1">{d}</div>
            ))}
          </div>
          {SLOTS.map(slot => (
            <div key={slot.value} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{slot.emoji}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{slot.label}</span>
              </div>
              <div className="grid grid-cols-7 gap-3">
                {DAYS_FULL.map((_, dayIdx) => {
                  const entry = getEntry(dayIdx, slot.value);
                  return (
                    <DesktopSlot
                      key={dayIdx}
                      entry={entry ?? null}
                      onOpen={() => openPicker(dayIdx, slot.value)}
                      onRemove={handleRemoveEntry}
                      onSetServings={handleSetServings}
                      deleting={deletingEntry}
                      isDragging={dragFrom?.day === dayIdx && dragFrom?.slot === slot.value}
                      isDropTarget={!!dragFrom && !(dragFrom.day === dayIdx && dragFrom.slot === slot.value)}
                      onDragStart={() => setDragFrom({ day: dayIdx, slot: slot.value })}
                      onDragEnd={() => setDragFrom(null)}
                      onDropHere={() => {
                        if (dragFrom) handleMove(dragFrom, { day: dayIdx, slot: slot.value });
                        setDragFrom(null);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {weekTotal.daysWith > 0 && (
            <div className="grid grid-cols-7 gap-3 mt-1 pt-2 border-t border-gray-100">
              {dayTotals.map((dn, i) => (
                <div key={i} className="text-center">
                  {dn
                    ? <p className="text-xs font-semibold text-gray-500">≈ {dn.calories}<span className="font-normal text-gray-400"> kcal</span></p>
                    : <p className="text-xs text-gray-300">–</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Mobile: day-by-day ── */}
        <div className="md:hidden space-y-4">
          {DAYS_FULL.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <span className="text-sm font-bold text-gray-800">{day}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {SLOTS.map(slot => {
                  const entry = getEntry(dayIdx, slot.value);
                  return (
                    <div key={slot.value} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 text-center flex-shrink-0">
                        <span className="text-lg">{slot.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {entry ? (
                          <div className="flex items-center gap-2">
                            {entry.recipe_image && (
                              <Image src={entry.recipe_image} alt="" width={40} height={40} className="rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <Link href={`/recipe/${entry.recipe_id}`} className="text-sm font-semibold text-gray-800 line-clamp-1 hover:text-orange-500 transition-colors">
                                {entry.recipe_title}
                              </Link>
                              {entry.recipe_time && <p className="text-xs text-gray-400">⏱ {entry.recipe_time} min</p>}
                              <div className="mt-1"><ServingsControl value={entry.servings} onChange={(v) => handleSetServings(entry, v)} /></div>
                            </div>
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              disabled={deletingEntry === entry.id}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0 text-lg"
                            >×</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openPicker(dayIdx, slot.value)}
                            className="flex items-center gap-2 text-sm text-gray-300 hover:text-orange-400 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 hover:border-orange-300 flex items-center justify-center text-xs transition-colors">+</span>
                            <span className="italic">{t("addRecipe")}</span>
                          </button>
                        )}
                      </div>
                      {entry && (
                        <button
                          onClick={() => openPicker(dayIdx, slot.value)}
                          className="text-xs text-gray-300 hover:text-orange-400 flex-shrink-0 transition-colors"
                          title="Replace"
                        >↻</button>
                      )}
                    </div>
                  );
                })}
              </div>
              {dayTotals[dayIdx] && (
                <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{locale === "de" ? "Tag gesamt" : "Day total"}</span>
                  <span className="text-xs font-medium text-gray-600">
                    ≈ {dayTotals[dayIdx]!.calories} kcal
                    <span className="text-gray-400 font-normal"> · {dayTotals[dayIdx]!.protein}P · {dayTotals[dayIdx]!.fat}F · {dayTotals[dayIdx]!.carbs}{locale === "de" ? "KH" : "C"}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {totalEntries === 0 && (
          <div className="mt-8 text-center py-10">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-600 font-semibold mb-1">{t("emptyTitle")}</p>
            <p className="text-sm text-gray-400 mb-4">{t("emptySub")}</p>
            <div className="flex justify-center gap-3">
              <Link href="/saved" className="text-sm font-semibold text-orange-500 hover:text-orange-600 border border-orange-200 px-4 py-2 rounded-full hover:bg-orange-50 transition-all">
                {t("myRecipes")}
              </Link>
              <Link href="/collections" className="text-sm font-semibold text-orange-500 hover:text-orange-600 border border-orange-200 px-4 py-2 rounded-full hover:bg-orange-50 transition-all">
                {t("collections")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Picker Modal */}
      {pickerTarget && activePlanId && (
        <PlanRecipePickerModal
          planId={activePlanId}
          dayIndex={pickerTarget.dayIndex}
          slot={pickerTarget.slot}
          dayLabel={DAYS_FULL[pickerTarget.dayIndex]}
          slotLabel={SLOTS.find(s => s.value === pickerTarget.slot)?.label ?? ""}
          onClose={() => setPickerTarget(null)}
          onAdded={handleEntryAdded}
        />
      )}

      {/* Shopping List Drawer */}
      {showShoppingList && (
        <ShoppingListDrawer
          recipeIds={shoppingRecipeIds}
          recipeTitles={entries.map(e => e.recipe_title)}
          planName={plans.find(p => p.id === activePlanId)?.name ?? t("planName")}
          planId={activePlanId}
          targets={shoppingTargets}
          onClose={() => setShowShoppingList(false)}
        />
      )}

      {/* Auto-plan modal */}
      {showAutoPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !generating && setShowAutoPlan(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{locale === "de" ? "Auto-Wochenplan" : "Auto meal plan"}</h2>
              <p className="text-sm text-gray-500">{locale === "de" ? "Wir füllen die Woche nach deinem Kalorienziel." : "We fill the week to your calorie goal."}</p>
            </div>

            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">{locale === "de" ? "Kalorien pro Tag" : "Calories per day"}</label>
            <input
              type="number" value={planCalories} min={800} max={5000} step={50}
              onChange={e => setPlanCalories(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">{locale === "de" ? "Ernährung (optional)" : "Diet (optional)"}</label>
            <select
              value={planDiet} onChange={e => setPlanDiet(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm mb-5 bg-white focus:outline-none focus:border-orange-400"
            >
              <option value="">{locale === "de" ? "Keine" : "None"}</option>
              <option value="vegetarian">{locale === "de" ? "Vegetarisch" : "Vegetarian"}</option>
              <option value="vegan">Vegan</option>
              <option value="gluten free">{locale === "de" ? "Glutenfrei" : "Gluten free"}</option>
              <option value="ketogenic">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="pescetarian">{locale === "de" ? "Pescetarisch" : "Pescetarian"}</option>
            </select>

            <button
              onClick={handleGeneratePlan} disabled={generating}
              className="w-full py-3.5 rounded-full text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              {generating ? (locale === "de" ? "Generiere…" : "Generating…") : (locale === "de" ? "Woche generieren" : "Generate week")}
            </button>

            {generateError && (
              <p className="text-xs text-red-500 text-center mt-2">{locale === "de" ? "Konnte keinen Plan erzeugen — versuch andere Werte." : "Couldn't generate a plan — try different values."}</p>
            )}

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300">{locale === "de" ? "oder" : "or"}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <label className="flex items-center gap-2 mb-3 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowRepeats}
                onChange={e => setAllowRepeats(e.target.checked)}
                className="accent-orange-500 w-4 h-4"
              />
              {locale === "de" ? "Gerichte über mehrere Tage erlauben (Wiederholungen)" : "Allow a dish across multiple days (repeats)"}
            </label>
            <button
              onClick={() => { setShowAutoPlan(false); handleAutoFill(allowRepeats); }}
              disabled={generating}
              className="w-full py-3 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {locale === "de" ? "Leere Slots aus meinen Rezepten füllen" : "Fill empty slots from my recipes"}
            </button>

            <button onClick={() => setShowAutoPlan(false)} disabled={generating} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600">
              {locale === "de" ? "Abbrechen" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Pro modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowProModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✦</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t("proModalTitle")}</h2>
              <p className="text-sm text-gray-500">{t("proModalSub")}</p>
            </div>
            <Link
              href="/pro"
              className="block w-full py-3.5 rounded-full text-white font-semibold text-center text-sm"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              {t("proModalButton")}
            </Link>
            <button onClick={() => setShowProModal(false)} className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600">{t("cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Servings stepper ───────────────────────────────────────────────────────────
function ServingsControl({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const locale = useLocale();
  if (value == null) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onChange(2); }}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
        title={locale === "de" ? "Portionen einstellen" : "Set servings"}
      >
        🍽 <span>{locale === "de" ? "Portionen" : "Servings"}</span>
      </button>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 text-xs text-gray-600" onClick={(e) => e.stopPropagation()}>
      <span>🍽</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(value <= 1 ? null : value - 1); }}
        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 flex items-center justify-center leading-none"
      >−</button>
      <span className="w-4 text-center font-semibold tabular-nums">{value}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onChange(Math.min(value + 1, 20)); }}
        className="w-5 h-5 rounded-full bg-gray-100 hover:bg-orange-100 text-gray-600 flex items-center justify-center leading-none"
      >+</button>
    </div>
  );
}

// ── Desktop Slot Cell ──────────────────────────────────────────────────────────
function DesktopSlot({
  entry,
  onOpen,
  onRemove,
  onSetServings,
  deleting,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDropHere,
}: {
  entry: Entry | null;
  onOpen: () => void;
  onRemove: (id: string) => void;
  onSetServings: (entry: Entry, value: number | null) => void;
  deleting: string | null;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDropHere?: () => void;
}) {
  if (!entry) {
    return (
      <button
        onClick={onOpen}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDropHere?.(); }}
        className={`h-20 w-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all group ${isDropTarget ? "border-orange-400 bg-orange-50" : "hover:border-orange-300 hover:bg-orange-50/50"}`}
        style={isDropTarget ? undefined : { borderColor: "#e5e7eb" }}
      >
        <span className="text-gray-300 group-hover:text-orange-400 text-xl transition-colors">+</span>
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDropHere?.(); }}
        className={`h-20 rounded-xl border bg-white shadow-sm overflow-hidden relative group cursor-grab active:cursor-grabbing transition-all ${
          isDragging
            ? "opacity-40 ring-2 ring-orange-400 border-orange-300"
            : isDropTarget
            ? "ring-2 ring-orange-400 border-orange-300"
            : "border-gray-100"
        }`}
      >
        {entry.recipe_image ? (
          <Image src={entry.recipe_image} alt="" fill draggable={false} className="object-cover pointer-events-none" sizes="300px" />
        ) : (
          <div className="absolute inset-0 bg-orange-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-1.5 left-2 right-8 z-10">
          <Link href={`/recipe/${entry.recipe_id}`} draggable={false}>
            <p className="text-white text-xs font-semibold line-clamp-2 leading-tight hover:text-orange-200 transition-colors">
              {entry.recipe_title}
            </p>
          </Link>
        </div>
        <button
          onClick={onOpen}
          className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-black/40 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-500"
          title="Replace"
        >↻</button>
        <button
          onClick={() => onRemove(entry.id)}
          disabled={deleting === entry.id}
          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black/40 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        >×</button>
      </div>
      <div className="flex justify-center">
        <ServingsControl value={entry.servings} onChange={(v) => onSetServings(entry, v)} />
      </div>
    </div>
  );
}
