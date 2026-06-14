"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { Recipe } from "./home-types";
import { Link } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import RecipeCard from "./RecipeCard";

export default function ForYouSection({ user, onLoaded }: { user: User | null | undefined; onLoaded: (ids: (number | string)[]) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hasContent, setHasContent] = useState(false);
  const [fromActivity, setFromActivity] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) return;
    let cancelled = false;

    (async () => {
      // 1. Behaviour-based: recipes similar to what you've saved and planned.
      try {
        const res = await fetch(`/api/recommendations?lang=${locale}&number=6`);
        const data = await res.json();
        const recs: Recipe[] = data.recipes || [];
        if (!cancelled && recs.length > 0) {
          setRecipes(recs);
          setFromActivity(true);
          setHasContent(true);
          onLoaded(recs.map((r) => r.id));
          return;
        }
      } catch {
        // fall through to preference-based recommendations
      }
      if (cancelled) return;

      // 2. Fallback: explicit dietary preferences from the profile.
      const supabase = createClient();
      const { data: prefs } = await supabase
        .from("user_preferences").select("*").eq("user_id", user.id).single();
      if (cancelled) return;
      if (!prefs || (!prefs.diet && !prefs.intolerances?.length && !prefs.max_time)) return;

      const params = new URLSearchParams();
      if (prefs.diet) params.set("diet", prefs.diet);
      if (prefs.intolerances?.length) params.set("intolerances", prefs.intolerances.join(","));
      if (prefs.max_time) params.set("maxTime", String(prefs.max_time));
      params.set("number", "6");
      params.set("lang", locale);
      const res = await fetch(`/api/recipes?${params}`);
      const data = await res.json();
      const loaded: Recipe[] = data.recipes || [];
      if (cancelled || loaded.length === 0) return;
      setRecipes(loaded);
      setHasContent(true);
      onLoaded(loaded.map((r) => r.id));
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || !hasContent) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {t("forYou.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {fromActivity ? t("forYou.fromActivity") : t("forYou.subtitle")}
          </p>
        </div>
        <Link href="/profile" className="text-sm text-orange-500 hover:text-orange-700 transition-colors">
          {t("forYou.editProfile")}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((r, i) => (
          <RecipeCard key={r.id} recipe={r} index={i} user={user} />
        ))}
      </div>

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

