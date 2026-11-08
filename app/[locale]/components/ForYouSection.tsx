"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import type { Recipe } from "./home-types";
import { createClient } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/ui";
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
    <section aria-labelledby="for-you-title" className="mx-auto max-w-content px-4 pb-12 sm:px-6 lg:px-10">
      <SectionHeader
        id="for-you-title"
        title={t("forYou.title")}
        subtitle={fromActivity ? t("forYou.fromActivity") : t("forYou.subtitle")}
        linkHref="/profile"
        linkLabel={t("forYou.editProfile")}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r, i) => (
          <RecipeCard key={r.id} recipe={r} index={i} user={user} />
        ))}
      </div>
    </section>
  );
}
