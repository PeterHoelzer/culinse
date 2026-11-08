"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button, Chip, Input } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

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
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch" },
  { value: "dinner",    label: "Dinner" },
];

export default function AddToPlanModal({ recipe, onClose }: AddToPlanModalProps) {
  const t = useTranslations("modals");
  const tm = useTranslations("mealPlanner");
  const de = useLocale() === "de";
  const text = (key: string, deStr: string, enStr: string) => (t.has(key) ? t(key) : de ? deStr : enStr);
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

    // Adding from a recipe page targets the current calendar week (Monday). The
    // planner stores a week anchor per entry; "this week" is the sensible default.
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow);
    const weekStart = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;

    const { error } = await supabase.from("meal_plan_entries").upsert({
      plan_id: selectedPlan,
      user_id: user.id,
      week_start: weekStart,
      day_index: selectedDay,
      meal_slot: selectedSlot,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      recipe_image: recipe.image ?? null,
      recipe_time: recipe.readyInMinutes ?? null,
    }, { onConflict: "plan_id,week_start,day_index,meal_slot" });

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

  const optionBase = "rounded-1 border text-sm font-semibold transition-colors";
  const optionState = (active: boolean) =>
    active
      ? "border-brand bg-brand text-white hover:bg-brand-hover"
      : "border-line-strong bg-surface text-ink hover:bg-surface-soft";

  return (
    <Dialog open onClose={onClose} title={t("addToPlanHeader")}>
      <div className="mb-5 flex items-center gap-3">
        {recipe.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image} alt="" className="h-12 w-12 shrink-0 rounded-1 object-cover" />
        )}
        <p className="line-clamp-2 min-w-0 text-base font-semibold text-ink">{recipe.title}</p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-base text-ink-3" role="status">{t("loading")}</p>
      ) : (
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-base font-semibold">{t("plan")}</legend>
            <div className="flex flex-wrap items-end gap-2">
              {plans.map(p => (
                <Chip key={p.id} active={selectedPlan === p.id} onClick={() => setSelectedPlan(p.id)}>
                  {p.name}
                </Chip>
              ))}
              {isPro ? (
                creatingPlan ? (
                  <div className="flex w-full items-end gap-2">
                    <Input
                      autoFocus
                      label={text("planName", "Name des Plans", "Plan name")}
                      value={newPlanName}
                      onChange={e => setNewPlanName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreatePlan()}
                      placeholder={t("planNamePlaceholder")}
                      className="min-w-0 flex-1"
                    />
                    <Button variant="icon" icon="check" aria-label={t("create")} onClick={handleCreatePlan} disabled={!newPlanName.trim()} />
                    <Button variant="icon" icon="x" aria-label={t("cancel")} onClick={() => setCreatingPlan(false)} />
                  </div>
                ) : (
                  <Chip icon="plus" onClick={() => setCreatingPlan(true)}>
                    {text("newPlan", "Neuer Plan", "New plan")}
                  </Chip>
                )
              ) : plans.length >= 1 && (
                <Chip icon="lock" onClick={() => { window.location.assign("/pro"); }}>
                  {t("proMorePlans")}
                </Chip>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-base font-semibold">{t("day")}</legend>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_T.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDay(i)}
                  aria-pressed={selectedDay === i}
                  aria-label={DAYS_FULL_T[i]}
                  className={`h-11 ${optionBase} ${optionState(selectedDay === i)}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-base font-semibold">{t("meal")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((s, i) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSelectedSlot(s.value)}
                  aria-pressed={selectedSlot === s.value}
                  className={`h-11 px-2 ${optionBase} ${optionState(selectedSlot === s.value)}`}
                >
                  {MEAL_LABELS[i]}
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            onClick={handleSave}
            disabled={!selectedPlan}
            loading={saving}
            icon={saved ? "check" : undefined}
            fullWidth
          >
            {saved
              ? `${DAYS_FULL_T[selectedDay]}, ${MEAL_LABELS[SLOTS.findIndex(s => s.value === selectedSlot)]}`
              : t("addToPlanButton")}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
