"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  dayIndex,
  slot,
  dayLabel,
  slotLabel,
  onClose,
  onAdded,
}: PlanRecipePickerModalProps) {
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
          label: "My Recipes",
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
    if (!user) return;

    const timeNum = typeof recipe.time === "number"
      ? recipe.time
      : typeof recipe.time === "string"
        ? parseInt(recipe.time) || null
        : null;

    const { data } = await supabase
      .from("meal_plan_entries")
      .upsert({
        plan_id: planId,
        user_id: user.id,
        day_index: dayIndex,
        meal_slot: slot,
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        recipe_image: recipe.image ?? null,
        recipe_time: timeNum,
      }, { onConflict: "plan_id,day_index,meal_slot" })
      .select()
      .single();

    setSaving(null);
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Rezept auswählen für</p>
              <p className="text-sm font-bold text-gray-900">{dayLabel} · {slotLabel}</p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Tabs — folder style */}
        {!loading && tabs.length > 0 && (
          <div className="flex gap-1 px-4 pt-3 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-t-xl text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-orange-50 border-orange-400 text-orange-600"
                    : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.id === "saved" ? "📌 " : "📚 "}
                {tab.label}
                <span className="ml-1.5 text-xs opacity-60">({tab.recipes.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !currentTab || currentTab.recipes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3">{activeTab === "saved" ? "💔" : "📭"}</p>
              <p className="text-sm text-gray-500 font-medium">
                {activeTab === "saved"
                  ? "Noch keine gespeicherten Rezepte"
                  : "Diese Sammlung ist leer"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTab === "saved"
                  ? "Speichere Rezepte mit ♡ auf der Startseite."
                  : "Füge Rezepte mit 📚 zur Sammlung hinzu."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {currentTab.recipes.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => handlePick(recipe)}
                  disabled={saving === recipe.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all text-left disabled:opacity-60"
                >
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-xl">
                      🍽
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                      {recipe.title}
                    </p>
                    {recipe.time && (
                      <p className="text-xs text-gray-400 mt-0.5">⏱ {recipe.time} min</p>
                    )}
                  </div>
                  {saving === recipe.id ? (
                    <span className="text-orange-400 text-sm flex-shrink-0">…</span>
                  ) : (
                    <span className="text-gray-300 text-lg flex-shrink-0">+</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
