"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { Recipe } from "./home-types";
import RecipeCard from "./RecipeCard";

export default function ForYouSection({ user, onLoaded }: { user: User | null | undefined; onLoaded: (ids: (number | string)[]) => void }) {
  const t = useTranslations();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPrefs, setHasPrefs] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data: prefs }) => {
        if (!prefs || (!prefs.diet && !prefs.intolerances?.length && !prefs.max_time)) {
          setLoading(false);
          return;
        }
        setHasPrefs(true);
        const params = new URLSearchParams();
        if (prefs.diet) params.set("diet", prefs.diet);
        if (prefs.intolerances?.length) params.set("intolerances", prefs.intolerances.join(","));
        if (prefs.max_time) params.set("maxTime", String(prefs.max_time));
        params.set("number", "6");
        const res = await fetch(`/api/recipes?${params}`);
        const data = await res.json();
        const loaded = data.recipes || [];
        setRecipes(loaded);
        onLoaded(loaded.map((r: Recipe) => r.id));
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || !hasPrefs) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {t("forYou.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t("forYou.subtitle")}</p>
        </div>
        <Link href="/profile" className="text-sm text-orange-500 hover:text-orange-700 transition-colors">
          {t("forYou.editProfile")}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} user={user} />
          ))}
        </div>
      ) : null}

      <div className="border-b border-gray-100 mt-10" />
    </section>
  );
}

// ─── Video Section ────────────────────────────────────────────────────────────
interface VideoRecipe {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  time: string | null;
  servings: string | null;
}

