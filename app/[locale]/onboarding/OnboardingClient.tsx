"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import ShoppingListDrawer from "@/components/ShoppingListDrawer";

// Karten-Daten aus /api/similar-recipes (Korpus/Community, sprachgefiltert).
interface SuggestedRecipe {
  id: number | string;
  title: string;
  image: string | null;
  imagePosition?: string | null;
  time?: string | null;
  source?: string | null;
}

interface CreatedPlan {
  id: string;
  name: string;
}

// Auswahl in Schritt 1. `diet` schreibt user_preferences (gleiche Werte wie im
// Profil / ForYou: Spoonacular-Diäten), `tags` filtert die Korpus-Vorschläge
// (deutsche/englische Rezept-Tags aus user_recipes), `maxTime` optional.
const CHOICES: { key: string; emoji: string; diet: string; tags: string[]; maxTime?: number }[] = [
  { key: "all",        emoji: "🍽", diet: "",           tags: [] },
  { key: "vegetarian", emoji: "🥦", diet: "vegetarian", tags: ["vegetarisch", "vegetarian", "vegan"] },
  { key: "vegan",      emoji: "🌱", diet: "vegan",      tags: ["vegan"] },
  { key: "protein",    emoji: "💪", diet: "",           tags: ["proteinreich", "high-protein", "protein"] },
  { key: "quick",      emoji: "⚡", diet: "",           tags: ["schnell", "einfach", "quick", "easy"], maxTime: 30 },
];

/** Montag der aktuellen Woche (gleiche Anker-Logik wie AddToPlanModal). */
function currentWeekStart(): string {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

export default function OnboardingClient() {
  const t = useTranslations("onboarding");
  const tm = useTranslations("mealPlanner");
  const DAYS_FULL = tm.raw("daysFull") as string[];
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [choiceKey, setChoiceKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [plan, setPlan] = useState<CreatedPlan | null>(null);
  const [planned, setPlanned] = useState<SuggestedRecipe[]>([]);
  const [showList, setShowList] = useState(false);

  // Die Route ist per Middleware geschützt; das hier ist nur der Gürtel zur
  // Hose, falls die Session clientseitig abgelaufen ist.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUser(data.user);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Schritt 1 → 2: Präferenz speichern (markiert zugleich „onboarded") + Vorschläge laden. */
  const pickChoice = async (key: string) => {
    if (!user || loadingSuggestions) return;
    const choice = CHOICES.find((c) => c.key === key);
    if (!choice) return;
    setChoiceKey(key);
    setError(false);
    setLoadingSuggestions(true);

    // user_preferences-Zeile anlegen/aktualisieren — dieselbe Struktur wie im
    // Profil. Die Existenz der Zeile sorgt auch dafür, dass der Auth-Callback
    // diesen Nutzer nicht erneut ins Onboarding schickt.
    const prefs: { user_id: string; diet: string; updated_at: string; max_time?: number } = {
      user_id: user.id,
      diet: choice.diet,
      updated_at: new Date().toISOString(),
    };
    if (choice.maxTime) prefs.max_time = choice.maxTime;
    await supabase.from("user_preferences").upsert(prefs, { onConflict: "user_id" });

    try {
      const params = new URLSearchParams({
        id: `onboarding-${key}`,
        lang: locale === "de" ? "de" : "en",
        number: "5",
      });
      if (choice.tags.length) params.set("tags", choice.tags.join(","));
      const res = await fetch(`/api/similar-recipes?${params.toString()}`);
      const data = await res.json();
      const recipes: SuggestedRecipe[] = Array.isArray(data.recipes) ? data.recipes.slice(0, 5) : [];
      if (recipes.length === 0) { setError(true); return; }
      setSuggestions(recipes);
      setSelected(new Set(recipes.map((r) => String(r.id))));
      setStep(2);
    } catch {
      setError(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleRecipe = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Schritt 2 → 3: Plan sicherstellen und die gewählten Rezepte Mo–Fr als Abendessen eintragen. */
  const addToPlan = async () => {
    if (!user || saving) return;
    const chosen = suggestions.filter((r) => selected.has(String(r.id)));
    if (chosen.length === 0) return;
    setSaving(true);
    setError(false);
    try {
      // Bestehenden Plan verwenden (Free-Limit: 1 Plan) oder den ersten anlegen.
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(1);
      let target: CreatedPlan | null = existing?.[0] ?? null;
      if (!target) {
        const { data: created, error: createError } = await supabase
          .from("meal_plans")
          .insert({ user_id: user.id, name: t("planName"), is_active: true })
          .select("id, name")
          .single();
        if (createError || !created) throw createError ?? new Error("plan");
        target = created;
      }

      const weekStart = currentWeekStart();
      const rows = chosen.slice(0, 5).map((r, i) => ({
        plan_id: target!.id,
        user_id: user.id,
        week_start: weekStart,
        day_index: i, // Mo–Fr
        meal_slot: "dinner",
        recipe_id: String(r.id),
        recipe_title: r.title,
        recipe_image: r.image,
        recipe_time: r.time ? parseInt(r.time, 10) || null : null,
      }));
      const { error: upsertError } = await supabase
        .from("meal_plan_entries")
        .upsert(rows, { onConflict: "plan_id,week_start,day_index,meal_slot" });
      if (upsertError) throw upsertError;

      setPlan(target);
      setPlanned(chosen.slice(0, 5));
      setStep(3);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const stepDots = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={`h-2 rounded-full transition-all duration-300 ${
            s === step ? "w-8 bg-orange-500" : s < step ? "w-2 bg-orange-300" : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {stepDots}

        {/* ── Schritt 1: Ernährungsweise ── */}
        {step === 1 && (
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">{t("title")}</h1>
            <p className="text-sm text-gray-500 text-center mb-8">{t("step1Sub")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHOICES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => pickChoice(c.key)}
                  disabled={loadingSuggestions}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 bg-white text-left transition-all disabled:opacity-60 ${
                    choiceKey === c.key ? "border-orange-400 shadow-md" : "border-gray-100 hover:border-orange-200 hover:shadow-sm"
                  }`}
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{t(`diet_${c.key}`)}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{t(`diet_${c.key}_desc`)}</span>
                  </span>
                  {loadingSuggestions && choiceKey === c.key && (
                    <span className="ml-auto animate-spin text-orange-400">⏳</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Schritt 2: Startwoche ── */}
        {step === 2 && (
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">{t("step2Title")}</h1>
            <p className="text-sm text-gray-500 text-center mb-8">{t("step2Sub")}</p>
            <div className="space-y-3 mb-6">
              {suggestions.map((r, i) => {
                const id = String(r.id);
                const active = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleRecipe(id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border-2 bg-white text-left transition-all ${
                      active ? "border-orange-300" : "border-gray-100 opacity-60"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      active ? "border-orange-400 bg-orange-400" : "border-gray-200"
                    }`}>
                      {active && <span className="text-white text-xs font-bold">✓</span>}
                    </span>
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.title}
                        loading="lazy"
                        style={r.imagePosition ? { objectPosition: r.imagePosition } : undefined}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍳</span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-orange-500 mb-0.5">{DAYS_FULL[i]}</span>
                      <span className="block text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{r.title}</span>
                      {r.time && <span className="block text-xs text-gray-400 mt-0.5">⏱ {r.time}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={addToPlan}
              disabled={saving || selected.size === 0}
              className="w-full py-3.5 rounded-full text-white font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
            >
              {saving ? t("adding") : t("addSelected", { count: selected.size })}
            </button>
          </section>
        )}

        {/* ── Schritt 3: Fertig + Einkaufsliste ── */}
        {step === 3 && (
          <section className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t("step3Title")}</h1>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">{t("step3Sub", { count: planned.length })}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowList(true)}
                className="px-6 py-3.5 rounded-full text-white text-sm font-semibold shadow-lg shadow-orange-500/30"
                style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
              >
                {t("viewList")}
              </button>
              <Link
                href="/meal-planner"
                className="px-6 py-3.5 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-orange-300 transition-all"
              >
                {t("toPlanner")}
              </Link>
            </div>
          </section>
        )}

        {error && (
          <p className="text-center text-sm text-red-500 mt-6">{t("loadError")}</p>
        )}

        {/* Ausstieg jederzeit möglich — kein erzwungenes Onboarding. */}
        {step < 3 && (
          <p className="text-center mt-10">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {t("skip")}
            </Link>
          </p>
        )}
      </main>

      {showList && plan && (
        <ShoppingListDrawer
          recipeIds={planned.map((r) => String(r.id))}
          recipeTitles={planned.map((r) => r.title)}
          planName={plan.name}
          planId={plan.id}
          onClose={() => setShowList(false)}
        />
      )}
    </div>
  );
}
