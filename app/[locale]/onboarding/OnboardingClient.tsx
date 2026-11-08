"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import ShoppingListDrawer from "@/components/ShoppingListDrawer";
import { Button, Icon, Notice, SectionHeader } from "@/components/ui";

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
const CHOICES: { key: string; diet: string; tags: string[]; maxTime?: number }[] = [
  { key: "all",        diet: "",           tags: [] },
  { key: "vegetarian", diet: "vegetarian", tags: ["vegetarisch", "vegetarian", "vegan"] },
  { key: "vegan",      diet: "vegan",      tags: ["vegan"] },
  { key: "protein",    diet: "",           tags: ["proteinreich", "high-protein", "protein"] },
  { key: "quick",      diet: "",           tags: ["schnell", "einfach", "quick", "easy"], maxTime: 30 },
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
        lang: locale === "de" ? "de" : locale === "es" ? "es" : locale === "fr" ? "fr" : locale === "it" ? "it" : locale === "pl" ? "pl" : locale === "tr" ? "tr" : locale === "nl" ? "nl" : locale === "cs" ? "cs" : locale === "ru" ? "ru" : locale === "pt" ? "pt" : locale === "zh" ? "zh" : locale === "ja" ? "ja" : locale === "id" ? "id" : locale === "vi" ? "vi" : locale === "bn" ? "bn" : "en",
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

  const loadErrorText = t("loadError");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-prose">
          <p className="mb-2 text-sm font-semibold text-ink-3 tabular" aria-label={`${step} / 3`}>
            {step} / 3
          </p>

          {/* Schritt 1: Ernährungsweise */}
          {step === 1 && (
            <section>
              <SectionHeader as="h1" title={t("title")} subtitle={t("step1Sub")} />
              <ul className="divide-y divide-line border-y border-line">
                {CHOICES.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => pickChoice(c.key)}
                      disabled={loadingSuggestions}
                      aria-pressed={choiceKey === c.key}
                      className={`flex w-full items-center gap-4 px-2 py-4 text-left transition-colors hover:bg-surface-soft disabled:cursor-not-allowed ${
                        choiceKey === c.key ? "bg-brand-soft hover:bg-brand-soft" : ""
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold text-ink">{t(`diet_${c.key}`)}</span>
                        <span className="block text-sm text-ink-3">{t(`diet_${c.key}_desc`)}</span>
                      </span>
                      {loadingSuggestions && choiceKey === c.key ? (
                        <span className="text-sm text-ink-3" role="status">{t.has("loading") ? t("loading") : "Lädt…"}</span>
                      ) : (
                        <Icon name="chevronRight" size={20} className="text-ink-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Schritt 2: Startwoche */}
          {step === 2 && (
            <section>
              <SectionHeader as="h1" title={t("step2Title")} subtitle={t("step2Sub")} />
              <ul className="mb-6 divide-y divide-line border-y border-line">
                {suggestions.map((r, i) => {
                  const id = String(r.id);
                  const active = selected.has(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggleRecipe(id)}
                        aria-pressed={active}
                        className="flex w-full items-center gap-4 px-2 py-3 text-left transition-colors hover:bg-surface-soft"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-1 border ${
                            active ? "border-green bg-green text-white" : "border-line-strong bg-surface"
                          }`}
                        >
                          {active && <Icon name="check" size={16} />}
                        </span>
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2 bg-surface-soft">
                          {r.image ? (
                            <img
                              src={r.image}
                              alt=""
                              loading="lazy"
                              style={r.imagePosition ? { objectPosition: r.imagePosition } : undefined}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Icon name="utensils" size={24} className="text-line-strong" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-ink-3">
                            {DAYS_FULL[i]}
                            {r.time ? ` · ${r.time}` : ""}
                          </span>
                          <span className="block line-clamp-2 text-base font-semibold text-ink">{r.title}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button onClick={addToPlan} loading={saving} disabled={saving || selected.size === 0}>
                {saving ? t("adding") : t("addSelected", { count: selected.size })}
              </Button>
            </section>
          )}

          {/* Schritt 3: Fertig + Einkaufsliste */}
          {step === 3 && (
            <section>
              <SectionHeader as="h1" title={t("step3Title")} subtitle={t("step3Sub", { count: planned.length })} />
              <div className="flex flex-wrap gap-3">
                <Button icon="cart" onClick={() => setShowList(true)}>{t("viewList")}</Button>
                <Button href="/meal-planner" variant="secondary" icon="calendar">{t("toPlanner")}</Button>
              </div>
            </section>
          )}

          {error && <Notice tone="error" className="mt-6">{loadErrorText}</Notice>}

          {/* Ausstieg jederzeit möglich, kein erzwungenes Onboarding. */}
          {step < 3 && (
            <p className="mt-10">
              <Link href="/" className="text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
                {t("skip")}
              </Link>
            </p>
          )}
        </div>
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
