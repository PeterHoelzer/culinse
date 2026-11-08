"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Chip, ChipRow, EmptyState, Icon, Skeleton } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

interface PickerRecipe {
  id: string;
  title: string;
  image: string | null;
  time?: string | number | null;
}

interface Tab {
  id: string;           // "saved" | collection uuid
  label: string;
  recipes: PickerRecipe[];
}

interface PlanRecipePickerModalProps {
  planId: string;
  weekStart: string;
  dayIndex: number;
  slot: "breakfast" | "lunch" | "dinner";
  dayLabel: string;
  slotLabel: string;
  onClose: () => void;
  onAdded: (entry: {
    id?: string;
    day_index: number;
    meal_slot: string;
    recipe_id: string;
    recipe_title: string;
    recipe_image: string | null;
    recipe_time: number | null;
  }) => void;
}

export default function PlanRecipePickerModal({
  planId,
  weekStart,
  dayIndex,
  slot,
  dayLabel,
  slotLabel,
  onClose,
  onAdded,
}: PlanRecipePickerModalProps) {
  const t = useTranslations("modals");
  const supabase = createClient();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("saved");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: saved }, { data: collections }] = await Promise.all([
        supabase.from("saved_recipes").select("recipe_id, title, image, time").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("collections").select("id, name").eq("user_id", user.id).order("created_at"),
      ]);

      const builtTabs: Tab[] = [
        {
          id: "saved",
          label: t("myRecipesTab"),
          recipes: (saved || []).map(r => ({
            id: String(r.recipe_id),
            title: r.title,
            image: r.image,
            time: r.time,
          })),
        },
      ];

      if (collections && collections.length > 0) {
        const recipeResults = await Promise.all(
          collections.map(col =>
            supabase
              .from("collection_recipes")
              .select("recipe_id, title, image, time_label")
              .eq("collection_id", col.id)
              .order("added_at", { ascending: false })
          )
        );

        collections.forEach((col, i) => {
          builtTabs.push({
            id: col.id,
            label: col.name,
            recipes: (recipeResults[i].data || []).map((r: { recipe_id: string; title: string; image: string | null; time_label?: string | null }) => ({
              id: String(r.recipe_id),
              title: r.title,
              image: r.image,
              time: r.time_label ?? null,
            })),
          });
        });
      }

      setTabs(builtTabs);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePick = async (recipe: PickerRecipe) => {
    setSaving(recipe.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(null); return; }

    const timeNum = typeof recipe.time === "number"
      ? recipe.time
      : typeof recipe.time === "string"
        ? parseInt(recipe.time) || null
        : null;

    const { data, error } = await supabase
      .from("meal_plan_entries")
      .upsert({
        plan_id: planId,
        user_id: user.id,
        week_start: weekStart,
        day_index: dayIndex,
        meal_slot: slot,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_image: recipe.image ?? null,
        recipe_time: timeNum,
      }, { onConflict: "plan_id,week_start,day_index,meal_slot" })
      .select()
      .single();

    setSaving(null);
    if (error) { console.error("Plan entry save failed:", error); return; }
    onAdded({
      id: data?.id,
      day_index: dayIndex,
      meal_slot: slot,
      recipe_id: recipe.id,
      recipe_title: recipe.title,
      recipe_image: recipe.image ?? null,
      recipe_time: timeNum,
    });
    onClose();
  };

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <Dialog open onClose={onClose} title={`${dayLabel}, ${slotLabel}`} size="lg">
      <p className="-mt-2 mb-4 text-sm text-ink-3">{t("chooseRecipeFor")}</p>

      {!loading && tabs.length > 0 && (
        <ChipRow className="mb-4">
          {tabs.map(tab => (
            <Chip
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.id === "saved" ? "bookmark" : "book"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="tabular opacity-80">({tab.recipes.length})</span>
            </Chip>
          ))}
        </ChipRow>
      )}

      <div>
        {loading ? (
          <div className="flex flex-col gap-3" role="status" aria-label={t("loading")}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !currentTab || currentTab.recipes.length === 0 ? (
          <EmptyState
            icon={activeTab === "saved" ? "heart" : "book"}
            title={activeTab === "saved" ? t("noSavedRecipes") : t("emptyCollection")}
            text={activeTab === "saved" ? t("saveHint") : t("addHint")}
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {currentTab.recipes.map(recipe => (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => handlePick(recipe)}
                  disabled={saving === recipe.id}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2 p-2 text-left transition-colors hover:bg-surface-soft disabled:text-ink-3"
                >
                  {recipe.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={recipe.image} alt="" className="h-12 w-12 shrink-0 rounded-1 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-1 bg-surface-soft">
                      <Icon name="utensils" size={20} className="text-line-strong" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-base font-semibold leading-snug text-ink">{recipe.title}</span>
                    {recipe.time && (
                      <span className="tabular mt-0.5 flex items-center gap-1 text-sm text-ink-3">
                        <Icon name="clock" size={16} />
                        {recipe.time} min
                      </span>
                    )}
                  </span>
                  <Icon name={saving === recipe.id ? "clock" : "plus"} size={20} className="shrink-0 text-ink-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
