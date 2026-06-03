"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

interface Recipe {
  id: string;
  title: string;
  image?: string;
  readyInMinutes?: number;
}

interface Plan {
  id: string;
  name: string;
  is_active: boolean;
}

interface AddToPlanModalProps {
  recipe: Recipe;
  onClose: () => void;
}

const SLOTS = [
  { value: "breakfast", label: "Breakfast", emoji: "🌅" },
  { value: "lunch",     label: "Lunch",     emoji: "☀️" },
  { value: "dinner",    label: "Dinner",    emoji: "🌙" },
];

export default function AddToPlanModal({ recipe, onClose }: AddToPlanModalProps) {
  const t = useTranslations("modals");
  const tm = useTranslations("mealPlanner");
  const DAYS_T = tm.raw("days") as string[];
  const DAYS_FULL_T = tm.raw("daysFull") as string[];
  const MEAL_LABELS = tm.raw("meals") as string[];
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string>("dinner");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: plansData }, { data: profile }] = await Promise.all([
        supabase.from("meal_plans").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("profiles").select("is_pro").eq("id", user.id).single(),
      ]);

      const list = plansData || [];
      setPlans(list);
      setIsPro(profile?.is_pro ?? false);

      // Select active plan or first
      const active = list.find((p: Plan) => p.is_active);
      setSelectedPlan(active?.id ?? list[0]?.id ?? "");
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!selectedPlan) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from("meal_plan_entries").upsert({
      plan_id: selectedPlan,
      user_id: user.id,
      day_index: selectedDay,
      meal_slot: selectedSlot,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      recipe_image: recipe.image ?? null,
      recipe_time: recipe.readyInMinutes ?? null,
    }, { onConflict: "plan_id,day_index,meal_slot" });

    setSaving(false);
    if (error) { console.error("Plan save failed:", error); return; }
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meal_plans")
      .insert({ user_id: user.id, name: newPlanName.trim(), is_active: false })
      .select()
      .single();

    if (data) {
      setPlans(prev => [...prev, data]);
      setSelectedPlan(data.id);
    }
    setCreatingPlan(false);
    setNewPlanName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {recipe.image && (
              <img src={recipe.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{t("addToPlanHeader")}</p>
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">{recipe.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 flex-shrink-0 text-xl leading-none">×</button>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">{t("loading")}</div>
        ) : (
          <div className="px-5 py-4 space-y-4">

            {/* Plan selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("plan")}</p>

              <div className="flex flex-wrap gap-2">
                {plans.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selectedPlan === p.id
                        ? "border-orange-400 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                {/* New plan button */}
                {isPro ? (
                  creatingPlan ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={newPlanName}
                        onChange={e => setNewPlanName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCreatePlan()}
                        placeholder={t("planNamePlaceholder")}
                        className="text-sm border border-orange-300 rounded-full px-3 py-1.5 outline-none w-32"
                      />
                      <button onClick={handleCreatePlan} className="text-orange-500 text-sm font-semibold px-2">✓</button>
                      <button onClick={() => setCreatingPlan(false)} className="text-gray-400 text-sm px-1">×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingPlan(true)}
                      className="px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-all"
                    >
                      + New Plan
                    </button>
                  )
                ) : plans.length >= 1 && (
                  <button
                    onClick={() => window.location.href = "/pro"}
                    className="px-3 py-1.5 rounded-full text-sm border border-dashed border-orange-200 text-orange-400"
                  >
                    {t("proMorePlans")}
                  </button>
                )}
              </div>
            </div>

            {/* Day selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("day")}</p>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_T.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedDay === i
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-orange-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("meal")}</p>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s, i) => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSlot(s.value)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                      selectedSlot === s.value
                        ? "border-orange-400 bg-orange-50 text-orange-600"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    {MEAL_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleSave}
              disabled={saving || !selectedPlan}
              className="w-full py-3.5 rounded-full text-white font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: saved ? "#22c55e" : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              {saving ? t("saving") : saved
                ? `✓ ${DAYS_FULL_T[selectedDay]} — ${MEAL_LABELS[SLOTS.findIndex(s => s.value === selectedSlot)]}`
                : t("addToPlanButton")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
