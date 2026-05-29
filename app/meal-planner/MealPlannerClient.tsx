"use client";
import ProBadge from "@/components/ProBadge";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  const [showProModal, setShowProModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

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

  const handleEntryAdded = (entry: Omit<Entry, "id"> & { id?: string }) => {
    setEntries(prev => {
      const filtered = prev.filter(
        e => !(e.day_index === entry.day_index && e.meal_slot === entry.meal_slot)
      );
      return [...filtered, { ...entry, id: entry.id ?? crypto.randomUUID() }];
    });
  };

  const getEntry = (dayIndex: number, slot: string) =>
    entries.find(e => e.day_index === dayIndex && e.meal_slot === slot);

  const totalEntries = entries.length;
  const shoppingRecipeIds = useMemo(() => entries.map(e => e.recipe_id), [entries]);

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
                      deleting={deletingEntry}
                    />
                  );
                })}
              </div>
            </div>
          ))}
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
          onClose={() => setShowShoppingList(false)}
        />
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

// ── Desktop Slot Cell ──────────────────────────────────────────────────────────
function DesktopSlot({
  entry,
  onOpen,
  onRemove,
  deleting,
}: {
  entry: Entry | null;
  onOpen: () => void;
  onRemove: (id: string) => void;
  deleting: string | null;
}) {
  if (!entry) {
    return (
      <button
        onClick={onOpen}
        className="h-20 w-full rounded-xl border-2 border-dashed hover:border-orange-300 hover:bg-orange-50/50 flex items-center justify-center transition-all group"
        style={{ borderColor: "#e5e7eb" }}
      >
        <span className="text-gray-300 group-hover:text-orange-400 text-xl transition-colors">+</span>
      </button>
    );
  }

  return (
    <div className="h-20 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden relative group">
      {entry.recipe_image ? (
        <Image src={entry.recipe_image} alt="" fill className="object-cover" sizes="300px" />
      ) : (
        <div className="absolute inset-0 bg-orange-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-1.5 left-2 right-8 z-10">
        <Link href={`/recipe/${entry.recipe_id}`}>
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
  );
}
