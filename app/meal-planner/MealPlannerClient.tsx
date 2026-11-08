"use client";
import ProBadge from "@/components/ProBadge";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import { Link } from "@/lib/navigation";
import { Button, Chip, ChipRow, EmptyState, Icon, Input, Checkbox, Notice, SectionHeader, Select, Skeleton } from "@/components/ui";
import PlanRecipePickerModal from "@/components/PlanRecipePickerModal";
import ShoppingListDrawer from "@/components/ShoppingListDrawer";
import { FREE_FOR_ALL } from "@/lib/freeMode";

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

const stripPlus = (label: string) => label.replace(/^\+\s*/, "");

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
  const [moveFrom, setMoveFrom] = useState<{ day: number; slot: string } | null>(null);
  const [copyingWeek, setCopyingWeek] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("");
  const [showProModal, setShowProModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [nutritionByRecipe, setNutritionByRecipe] = useState<Record<string, Nut>>({});
  // Protein-Tagesziel (g) — lokal je Gerät gespeichert, kein Account-Feld nötig
  const [proteinTarget, setProteinTarget] = useState<number | null>(null);
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
    { value: "breakfast" as const, label: MEAL_LABELS[0] },
    { value: "lunch"     as const, label: MEAL_LABELS[1] },
    { value: "dinner"    as const, label: MEAL_LABELS[2] },
  ];

  // Week navigation is anchored to the Monday of the displayed week, kept as an
  // ISO date string (YYYY-MM-DD). currentWeekStart is set on mount in the loader
  // effect below (client-side) to avoid SSR hydration mismatches.
  const isoMonday = (d: Date) => {
    const dow = (d.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
    const m = new Date(d);
    m.setDate(d.getDate() - dow);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(m.getDate()).padStart(2, "0")}`;
  };
  const todayMonday = () => isoMonday(new Date());
  const shiftISO = (iso: string, days: number) => {
    const [y, mo, da] = iso.split("-").map(Number);
    const d = new Date(y, mo - 1, da);
    d.setDate(d.getDate() + days);
    return isoMonday(d); // days is a multiple of 7, so the result stays a Monday
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { day: "numeric", month: "numeric" });

  // The 7 dates of the displayed week + which column is "today" (only when the
  // displayed week actually is the current week).
  const weekInfo = useMemo(() => {
    if (!currentWeekStart) return null;
    const [y, mo, da] = currentWeekStart.split("-").map(Number);
    const monday = new Date(y, mo - 1, da);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const todayIdx = currentWeekStart === todayMonday() ? (new Date().getDay() + 6) % 7 : -1;
    return { dates, todayIdx };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  const loadEntries = useCallback(async (planId: string, weekStart: string) => {
    if (!planId || !weekStart) return;
    const { data } = await supabase
      .from("meal_plan_entries")
      .select("*")
      .eq("plan_id", planId)
      .eq("week_start", weekStart);
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

      const pro = FREE_FOR_ALL || (profile?.is_pro ?? false);
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
      const wk = todayMonday();
      setCurrentWeekStart(wk);
      const rawTarget = localStorage.getItem("culinse-protein-target");
      const target = rawTarget ? parseInt(rawTarget, 10) : 0;
      if (target > 0) setProteinTarget(target);
      if (active?.id) await loadEntries(active.id, wk);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchPlan = async (planId: string) => {
    setActivePlanId(planId);
    await loadEntries(planId, currentWeekStart);
  };

  // Jump to a different calendar week of the active plan.
  // C11: aktuelle Woche als oeffentlichen Snapshot teilen (Share-Sheet/Link).
  const handleShareWeek = async () => {
    if (sharing || !activePlanId || !currentWeekStart) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: activePlanId, weekStart: currentWeekStart, locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.path) throw new Error(data.error || "share_failed");
      const url = `${window.location.origin}${data.path}`;
      if (navigator.share) {
        await navigator.share({ title: "Culinse", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  const goToWeek = async (weekStart: string) => {
    setCurrentWeekStart(weekStart);
    setMoveFrom(null);
    if (activePlanId) await loadEntries(activePlanId, weekStart);
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
      await loadEntries(remaining[0]?.id ?? "", currentWeekStart);
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

  // Duplicate the current plan (incl. all meals) into a fresh plan, then switch
  // to it — handy for reusing a week as a template or starting the next week.
  const handleCopyWeek = async () => {
    if (copyingWeek) return;
    if (!isPro && plans.length >= FREE_PLAN_LIMIT) { setShowProModal(true); return; }
    if (entries.length === 0) return;
    setCopyingWeek(true);
    try {
      const current = plans.find(p => p.id === activePlanId);
      const baseName = current?.name ?? t("planName");
      const copyName = locale === "de" ? `${baseName} (Kopie)` : `${baseName} (Copy)`;
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: copyName, is_active: false }),
      });
      if (res.status === 403) { setShowProModal(true); return; }
      if (!res.ok) return;
      const { plan } = await res.json();
      if (!plan) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = entries.map(e => ({
        plan_id: plan.id,
        user_id: user.id,
        week_start: currentWeekStart,
        day_index: e.day_index,
        meal_slot: e.meal_slot,
        recipe_id: e.recipe_id,
        recipe_title: e.recipe_title,
        recipe_image: e.recipe_image,
        recipe_time: e.recipe_time,
        servings: e.servings,
      }));
      const { data: inserted } = await supabase
        .from("meal_plan_entries")
        .upsert(rows, { onConflict: "plan_id,week_start,day_index,meal_slot" })
        .select();
      setPlans(prev => [...prev, plan]);
      setActivePlanId(plan.id);
      setEntries((inserted as Entry[]) ?? []);
    } finally {
      setCopyingWeek(false);
    }
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
      const rows: { plan_id: string; user_id: string; week_start: string; day_index: number; meal_slot: string; recipe_id: string; recipe_title: string; recipe_image: string | null; recipe_time: number | null }[] = [];
      emptySlots.forEach((slot, i) => {
        // No repeats → unique recipe per slot (stop when the pool runs out);
        // repeats allowed → wrap around so a dish can span several days.
        const r = allowRepeats ? shuffled[i % shuffled.length] : shuffled[i];
        if (!r) return;
        rows.push({
          plan_id: activePlanId,
          user_id: user.id,
          week_start: currentWeekStart,
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
        .upsert(rows, { onConflict: "plan_id,week_start,day_index,meal_slot" })
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
      await supabase.from("meal_plan_entries").delete().eq("plan_id", activePlanId).eq("week_start", currentWeekStart);
      const rows = (data.entries as Omit<Entry, "id" | "servings">[]).map(e => ({ ...e, plan_id: activePlanId, user_id: user.id, week_start: currentWeekStart }));
      const { data: inserted } = await supabase
        .from("meal_plan_entries")
        .upsert(rows, { onConflict: "plan_id,week_start,day_index,meal_slot" })
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

  const saveProteinTarget = (v: number | null) => {
    setProteinTarget(v);
    if (v && v > 0) localStorage.setItem("culinse-protein-target", String(v));
    else localStorage.removeItem("culinse-protein-target");
  };

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

  const de = locale === "de";
  const atPlanLimit = !isPro && plans.length >= FREE_PLAN_LIMIT;
  const isCurrentWeek = currentWeekStart === todayMonday();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 space-y-4" aria-busy="true">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader as="h1" className="mb-0!" title={t("title")} subtitle={t("tapToAdd")} />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" icon="sliders" onClick={() => setShowAutoPlan(true)}>
              {de ? "Auto-Plan" : "Auto-plan"}
            </Button>
            {totalEntries > 0 && (
              <Button variant="secondary" icon={shareCopied ? "check" : "share"} onClick={handleShareWeek} loading={sharing}>
                {shareCopied ? t("shareCopied") : t("shareWeek")}
              </Button>
            )}
            {totalEntries > 0 && (
              <Button icon="cart" onClick={() => setShowShoppingList(true)}>{t("shoppingList")}</Button>
            )}
          </div>
        </div>

        {/* Kennzahlen als Text */}
        <div className="mb-6 flex flex-wrap items-end gap-x-8 gap-y-3">
          <p className="text-base text-ink-2 tabular" role="status">{t("mealsPlanned", { n: totalEntries })}</p>
          {weekTotal.daysWith > 0 && (
            <p className="text-base text-ink-2 tabular">
              Ø {Math.round(weekTotal.calories / weekTotal.daysWith)} kcal · {Math.round(weekTotal.protein / weekTotal.daysWith)} g {de ? "Protein/Tag" : "protein/day"}
            </p>
          )}
          <Input
            className="w-36"
            label={de ? "Protein-Ziel (g/Tag)" : "Protein goal (g/day)"}
            type="number"
            inputMode="numeric"
            min={0}
            max={400}
            value={proteinTarget ?? ""}
            placeholder="–"
            onChange={e => saveProteinTarget(e.target.value ? parseInt(e.target.value, 10) : null)}
          />
        </div>

        {/* Pläne */}
        <div className="mb-3">
          <ChipRow>
            {plans.map(plan =>
              renamingPlan === plan.id ? (
                <div key={plan.id} className="flex shrink-0 items-center gap-2">
                  <Input
                    className="w-44"
                    label={de ? "Planname" : "Plan name"}
                    hideLabel
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleRenamePlan(plan.id); if (e.key === "Escape") setRenamingPlan(null); }}
                  />
                  <Button variant="icon" size="sm" icon="check" aria-label={de ? "Name speichern" : "Save name"} onClick={() => handleRenamePlan(plan.id)} />
                  <Button variant="icon" size="sm" icon="x" aria-label={t("cancel")} onClick={() => setRenamingPlan(null)} />
                </div>
              ) : (
                <div key={plan.id} className="flex shrink-0 items-center gap-2">
                  <Chip active={activePlanId === plan.id} onClick={() => switchPlan(plan.id)}>{plan.name}</Chip>
                  {activePlanId === plan.id && (
                    <>
                      <Button variant="icon" size="sm" icon="pencil" aria-label={de ? "Plan umbenennen" : "Rename plan"} title={de ? "Plan umbenennen" : "Rename plan"}
                        onClick={() => { setRenamingPlan(plan.id); setRenameValue(plan.name); }} />
                      {plans.length > 1 && (
                        <Button variant="icon" size="sm" icon="trash" aria-label={de ? "Plan löschen" : "Delete plan"} title={de ? "Plan löschen" : "Delete plan"}
                          onClick={() => handleDeletePlan(plan.id)} />
                      )}
                    </>
                  )}
                </div>
              )
            )}

            {creatingPlan ? (
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  className="w-44"
                  label={t("namePlanPlaceholder")}
                  hideLabel
                  autoFocus
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleCreatePlan(); if (e.key === "Escape") setCreatingPlan(false); }}
                  placeholder={t("namePlanPlaceholder")}
                />
                <Button variant="icon" size="sm" icon="check" aria-label={de ? "Plan anlegen" : "Create plan"} onClick={handleCreatePlan} />
                <Button variant="icon" size="sm" icon="x" aria-label={t("cancel")} onClick={() => setCreatingPlan(false)} />
              </div>
            ) : (
              !atPlanLimit && (
                <Button variant="secondary" size="sm" icon="plus" className="shrink-0" onClick={() => setCreatingPlan(true)}>
                  {stripPlus(t("newPlan"))}
                </Button>
              )
            )}

            {totalEntries > 0 && !creatingPlan && (
              <Button variant="secondary" size="sm" icon="copy" className="shrink-0" onClick={handleCopyWeek} loading={copyingWeek} title={t("copyWeek")}>
                {t("copyWeek")}
              </Button>
            )}
          </ChipRow>
        </div>

        {atPlanLimit && (
          <Notice tone="info" className="mb-4">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <ProBadge feature="Multiple meal plans" />
              <span>{t("proMorePlans")}</span>
              <button type="button" onClick={() => setShowProModal(true)} className="font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
                {t("proModalTitle")}
              </button>
            </span>
          </Notice>
        )}

        {/* Wochennavigation */}
        {weekInfo && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="icon" size="sm" icon="chevronLeft" aria-label={t("prevWeek")} title={t("prevWeek")} onClick={() => goToWeek(shiftISO(currentWeekStart, -7))} />
            <p className="min-w-[8rem] text-base font-semibold text-ink tabular">
              {fmtDate(weekInfo.dates[0])} – {fmtDate(weekInfo.dates[6])}
            </p>
            <Button variant="icon" size="sm" icon="chevronRight" aria-label={t("nextWeek")} title={t("nextWeek")} onClick={() => goToWeek(shiftISO(currentWeekStart, 7))} />
            {isCurrentWeek ? (
              <span className="text-sm text-ink-3">{t("thisWeek")}</span>
            ) : (
              <Button variant="quiet" onClick={() => goToWeek(todayMonday())}>{t("thisWeek")}</Button>
            )}
          </div>
        )}

        {moveFrom && (
          <div className="sticky top-0 z-20 mb-4">
            <Notice tone="info">
              <span className="flex flex-wrap items-center justify-between gap-3">
                <span>{t("moveHint")}</span>
                <button type="button" onClick={() => setMoveFrom(null)} className="font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">{t("cancel")}</button>
              </span>
            </Notice>
          </div>
        )}

        {totalEntries > 0 && <p className="mb-3 hidden text-caption text-ink-3 md:block">{t("dragHint")}</p>}

        {/* Tagesraster */}
        <div className="grid gap-4 md:grid-cols-7">
          {DAYS_FULL.map((day, dayIdx) => {
            const isToday = weekInfo?.todayIdx === dayIdx;
            const totals = dayTotals[dayIdx];
            return (
              <section key={dayIdx} aria-labelledby={`day-${dayIdx}`} className="min-w-0">
                <div className={`mb-3 border-b pb-2 ${isToday ? "border-brand" : "border-line"}`}>
                  <h2 id={`day-${dayIdx}`} className="font-sans text-sm font-semibold text-ink">{day}</h2>
                  {weekInfo && (
                    <p className="text-sm text-ink-3 tabular">
                      {fmtDate(weekInfo.dates[dayIdx])}{isToday ? ` · ${t("today")}` : ""}
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  {SLOTS.map(slot => {
                    const entry = getEntry(dayIdx, slot.value);
                    const isSource = moveFrom?.day === dayIdx && moveFrom?.slot === slot.value;
                    return (
                      <div key={slot.value}>
                        <p className="mb-1 text-caption text-ink-3">{slot.label}</p>
                        {moveFrom ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSource) { setMoveFrom(null); return; }
                              handleMove(moveFrom, { day: dayIdx, slot: slot.value });
                              setMoveFrom(null);
                            }}
                            className={`flex min-h-20 w-full items-center justify-center rounded-2 border border-dashed px-2 py-3 text-left text-sm font-semibold transition-colors ${
                              isSource ? "border-brand bg-brand-soft text-brand" : "border-line-strong text-ink hover:bg-surface-soft"
                            }`}
                          >
                            {isSource ? t("moving") : entry ? `${t("swapHere")}: ${entry.recipe_title}` : t("moveHere")}
                          </button>
                        ) : (
                          <PlanSlot
                            entry={entry ?? null}
                            addLabel={`${stripPlus(t("addRecipe"))}: ${day}, ${slot.label}`}
                            onOpen={() => openPicker(dayIdx, slot.value)}
                            onMove={() => setMoveFrom({ day: dayIdx, slot: slot.value })}
                            moveLabel={t("move")}
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
                        )}
                      </div>
                    );
                  })}
                </div>
                {totals && (
                  <p className="mt-3 border-t border-line pt-2 text-sm text-ink-2 tabular">
                    <span className="block">≈ {totals.calories} kcal</span>
                    <span className={`block ${proteinTarget && totals.protein >= proteinTarget ? "font-semibold text-green" : "text-ink-3"}`}>
                      {Math.round(totals.protein)} g {de ? "Protein" : "protein"}{proteinTarget ? ` / ${proteinTarget} g` : ""}
                    </span>
                    <span className="block text-ink-3">{totals.fat} g {de ? "Fett" : "fat"} · {totals.carbs} g {de ? "KH" : "carbs"}</span>
                  </p>
                )}
              </section>
            );
          })}
        </div>

        {totalEntries === 0 && (
          <EmptyState
            className="mt-8"
            icon="calendar"
            title={t("emptyTitle")}
            text={t("emptySub")}
            action={
              <div className="flex flex-wrap gap-3">
                <Button href="/saved" variant="secondary">{t("myRecipes")}</Button>
                <Button href="/collections" variant="secondary">{t("collections")}</Button>
              </div>
            }
          />
        )}
      </main>

      {/* Recipe Picker Modal */}
      {pickerTarget && activePlanId && (
        <PlanRecipePickerModal
          planId={activePlanId}
          weekStart={currentWeekStart}
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
        <PlannerDialog titleId="auto-plan-title" onClose={() => !generating && setShowAutoPlan(false)}>
          <h2 id="auto-plan-title" className="text-h2-sm">{de ? "Auto-Wochenplan" : "Auto meal plan"}</h2>
          <p className="mt-1 mb-5 text-base text-ink-2">{de ? "Wir füllen die Woche nach deinem Kalorienziel." : "We fill the week to your calorie goal."}</p>

          <div className="space-y-4">
            <Input
              label={de ? "Kalorien pro Tag" : "Calories per day"}
              type="number" inputMode="numeric" value={planCalories} min={800} max={5000} step={50}
              onChange={e => setPlanCalories(e.target.value)}
            />
            <Select label={de ? "Ernährung (optional)" : "Diet (optional)"} value={planDiet} onChange={e => setPlanDiet(e.target.value)}>
              <option value="">{de ? "Keine" : "None"}</option>
              <option value="vegetarian">{de ? "Vegetarisch" : "Vegetarian"}</option>
              <option value="vegan">Vegan</option>
              <option value="gluten free">{de ? "Glutenfrei" : "Gluten free"}</option>
              <option value="ketogenic">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="pescetarian">{de ? "Pescetarisch" : "Pescetarian"}</option>
            </Select>
          </div>

          <Button className="mt-5" fullWidth onClick={handleGeneratePlan} loading={generating}>
            {generating ? (de ? "Generiere…" : "Generating…") : (de ? "Woche generieren" : "Generate week")}
          </Button>

          {generateError && (
            <Notice tone="error" className="mt-3">{de ? "Konnte keinen Plan erzeugen. Versuch andere Werte." : "Couldn't generate a plan. Try different values."}</Notice>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <Checkbox
              className="mb-3 text-sm"
              checked={allowRepeats}
              onChange={e => setAllowRepeats(e.target.checked)}
              label={de ? "Gerichte über mehrere Tage erlauben (Wiederholungen)" : "Allow a dish across multiple days (repeats)"}
            />
            <Button variant="secondary" fullWidth disabled={generating} onClick={() => { setShowAutoPlan(false); handleAutoFill(allowRepeats); }}>
              {de ? "Leere Slots aus meinen Rezepten füllen" : "Fill empty slots from my recipes"}
            </Button>
          </div>

          <div className="mt-3">
            <Button variant="quiet" disabled={generating} onClick={() => setShowAutoPlan(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
          </div>
        </PlannerDialog>
      )}

      {/* Pro modal */}
      {showProModal && (
        <PlannerDialog titleId="pro-plan-title" onClose={() => setShowProModal(false)}>
          <ProBadge className="mb-3" />
          <h2 id="pro-plan-title" className="text-h2-sm">{t("proModalTitle")}</h2>
          <p className="mt-1 mb-5 text-base text-ink-2">{t("proModalSub")}</p>
          <div className="flex flex-wrap gap-3">
            <Button href="/pro">{t("proModalButton")}</Button>
            <Button variant="secondary" onClick={() => setShowProModal(false)}>{t("cancel")}</Button>
          </div>
        </PlannerDialog>
      )}
    </div>
  );
}

// ── Dialog-Hülle (Escape und Klick auf den Hintergrund schließen) ──────────────
function PlannerDialog({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2 border border-line bg-surface p-6"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Servings stepper ───────────────────────────────────────────────────────────
function ServingsControl({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const locale = useLocale();
  const de = locale === "de";
  if (value == null) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(2); }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]"
      >
        <Icon name="users" size={16} />
        {de ? "Portionen" : "Servings"}
      </button>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 text-sm text-ink-2" onClick={(e) => e.stopPropagation()}>
      <Icon name="users" size={16} />
      <Button
        variant="icon" size="sm" icon="minus" className="h-8! w-8!"
        aria-label={de ? "Portionen verringern" : "Decrease servings"}
        onClick={() => onChange(value <= 1 ? null : value - 1)}
      />
      <span className="w-6 font-semibold text-ink tabular">{value}</span>
      <Button
        variant="icon" size="sm" icon="plus" className="h-8! w-8!"
        aria-label={de ? "Portionen erhöhen" : "Increase servings"}
        onClick={() => onChange(Math.min(value + 1, 20))}
      />
    </div>
  );
}

// ── Slot (leer = Plus-Feld, belegt = Karte) ────────────────────────────────────
function PlanSlot({
  entry,
  addLabel,
  moveLabel,
  onOpen,
  onMove,
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
  addLabel: string;
  moveLabel: string;
  onOpen: () => void;
  onMove: () => void;
  onRemove: (id: string) => void;
  onSetServings: (entry: Entry, value: number | null) => void;
  deleting: string | null;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDropHere?: () => void;
}) {
  const locale = useLocale();
  const de = locale === "de";

  if (!entry) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={addLabel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDropHere?.(); }}
        className={`flex h-20 w-full items-center justify-center rounded-2 border border-dashed text-ink-2 transition-colors ${
          isDropTarget ? "border-brand bg-brand-soft" : "border-line-strong hover:bg-surface-soft"
        }`}
      >
        <Icon name="plus" size={24} />
      </button>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropHere?.(); }}
      className={`cursor-grab rounded-2 active:cursor-grabbing ${isDragging ? "opacity-40" : ""} ${isDropTarget ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
        {entry.recipe_image ? (
          <Image src={entry.recipe_image} alt="" fill draggable={false} className="pointer-events-none object-cover" sizes="300px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name="utensils" size={28} className="text-line-strong" />
          </div>
        )}
      </div>
      <Link href={`/recipe/${entry.recipe_id}` as "/"} draggable={false} className="mt-2 block">
        <p className="line-clamp-2 text-sm font-semibold text-ink hover:underline underline-offset-[3px]">{entry.recipe_title}</p>
      </Link>
      {entry.recipe_time && <p className="text-sm text-ink-3 tabular">{entry.recipe_time} min</p>}
      <div className="mt-1"><ServingsControl value={entry.servings} onChange={(v) => onSetServings(entry, v)} /></div>
      <div className="mt-2 flex gap-1.5">
        <Button variant="icon" size="sm" icon="pencil" className="h-9! w-9!" aria-label={`${de ? "Ersetzen" : "Replace"}: ${entry.recipe_title}`} title={de ? "Ersetzen" : "Replace"} onClick={onOpen} />
        <Button variant="icon" size="sm" icon="sliders" className="h-9! w-9!" aria-label={`${moveLabel}: ${entry.recipe_title}`} title={moveLabel} onClick={onMove} />
        <Button variant="icon" size="sm" icon="trash" className="h-9! w-9!" aria-label={`${de ? "Entfernen" : "Remove"}: ${entry.recipe_title}`} title={de ? "Entfernen" : "Remove"} disabled={deleting === entry.id} onClick={() => onRemove(entry.id)} />
      </div>
    </div>
  );
}
