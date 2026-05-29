"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { Recipe, TREND_FILTER_DEFS } from "./home-types";
import CategoryChips from "./CategoryChips";
import RecipeCard from "./RecipeCard";

export default function DiscoverSection({
  search,
  category,
  setCategory,
  user,
}: {
  search: string;
  category: string;
  setCategory: (v: string) => void;
  user: User | null | undefined;
}) {
  const t = useTranslations();

  const TIME_FILTERS = [
    { label: t("timeFilters.any"), value: "" },
    { label: t("timeFilters.15"),  value: "15" },
    { label: t("timeFilters.30"),  value: "30" },
    { label: t("timeFilters.60"),  value: "60" },
  ];

  const DIET_FILTERS = [
    { label: t("dietFilters.all"),         value: "" },
    { label: t("dietFilters.vegetarian"),  value: "vegetarian" },
    { label: t("dietFilters.vegan"),       value: "vegan" },
    { label: t("dietFilters.glutenFree"),  value: "gluten free" },
  ];

  const TREND_FILTERS = TREND_FILTER_DEFS.map((d) => ({
    ...d,
    label: t(`trendFilters.${d.key}` as Parameters<typeof t>[0]),
  }));

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [count, setCount] = useState(6);
  const [maxTime, setMaxTime] = useState("");
  const [diet, setDiet] = useState("");
  const [trend, setTrend] = useState("");
  const [forYouActive, setForYouActive] = useState(false);
  const [userPrefs, setUserPrefs] = useState<{ diet: string; intolerances: string[]; max_time: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => { if (data) setUserPrefs(data); });
  }, [user]);

  const fetchRecipes = useCallback(async (num = 6) => {
    if (num === 6) setLoading(true);
    else setLoadingMore(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      if (category && category !== "All") params.set("category", category);
      if (maxTime) params.set("maxTime", maxTime);
      if (diet) params.set("diet", diet);
      if (forYouActive && userPrefs) {
        if (!diet && userPrefs.diet) params.set("diet", userPrefs.diet);
        if (!maxTime && userPrefs.max_time) params.set("maxTime", String(userPrefs.max_time));
        if (userPrefs.intolerances?.length) params.set("intolerances", userPrefs.intolerances.join(","));
      }
      const activeTrend = TREND_FILTER_DEFS.find(f => f.value === trend && f.value !== "");
      if (activeTrend) {
        if (activeTrend.type === "minProtein") params.set("minProtein", activeTrend.value);
        if (activeTrend.type === "maxCarbs") params.set("maxCarbs", activeTrend.value);
        if (activeTrend.type === "diet") params.set("diet", activeTrend.value);
        if (activeTrend.type === "intolerances") params.set("intolerances", activeTrend.value);
        if (activeTrend.type === "cuisine") params.set("cuisine", activeTrend.value);
      }
      params.set("number", String(num));
      const res = await fetch(`/api/recipes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecipes(data.recipes || []);
      setQuotaExceeded(!!data.quota_exceeded);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, maxTime, diet, trend, forYouActive, userPrefs]);

  const handleLoadMore = () => {
    const newCount = count + 6;
    setCount(newCount);
    fetchRecipes(newCount);
  };

  useEffect(() => {
    setCount(6);
    fetchRecipes(6);
  }, [fetchRecipes]);

  return (
    <section id="discover" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

      {user && !userPrefs && (
        <Link
          href="/profile"
          className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-2xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">{t("discover.profileCta")}</p>
              <p className="text-xs text-orange-600">{t("discover.profileCtaSub")}</p>
            </div>
          </div>
          <span className="text-orange-400 group-hover:translate-x-1 transition-transform text-sm">→</span>
        </Link>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {search ? t("discover.resultsFor", { query: search }) : t("discover.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? t("discover.loading")
              : t("discover.recipesFound", { count: recipes.length })}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {user && userPrefs && (userPrefs.diet || (userPrefs.intolerances?.length ?? 0) > 0 || userPrefs.max_time) && (
          <button
            onClick={() => { setForYouActive(v => !v); setCount(6); }}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
              forYouActive
                ? "text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
            }`}
            style={forYouActive ? { background: "#f97316", borderColor: "#f97316" } : {}}
          >
            {t("trendFilters.forYou")}
          </button>
        )}
        {TREND_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setTrend(f.value); setCount(6); }}
            className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
              trend === f.value
                ? "text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
            }`}
            style={trend === f.value ? { background: "#f97316", borderColor: "#f97316" } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <CategoryChips active={category} setActive={setCategory} />
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <div className="flex-shrink-0 flex items-center gap-1 bg-gray-50 rounded-full px-1 py-1 border border-gray-100">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setMaxTime(f.value); setCount(6); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                maxTime === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-shrink-0 flex items-center gap-1 bg-gray-50 rounded-full px-1 py-1 border border-gray-100">
          {DIET_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setDiet(f.value); setCount(6); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                diet === f.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
              {userPrefs?.diet === f.value && f.value !== "" && (
                <span className="ml-1 text-orange-400">●</span>
              )}
            </button>
          ))}
        </div>

        {forYouActive && (userPrefs?.intolerances?.length ?? 0) > 0 && (
          <a
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            🚫 {(userPrefs?.intolerances?.length ?? 0) === 1
              ? t("discover.allergenFiltered", { count: userPrefs?.intolerances?.length ?? 0 })
              : t("discover.allergensFiltered", { count: userPrefs?.intolerances?.length ?? 0 })}
          </a>
        )}
      </div>

      {quotaExceeded && !loading && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          <span>⏳</span>
          <span>{t("discover.quotaWarning")}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-lg font-medium">{t("discover.error")}</p>
          <button onClick={() => fetchRecipes(count)} className="text-sm text-orange-500 mt-2 hover:underline">
            {t("discover.tryAgain")}
          </button>
        </div>
      ) : recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} index={i} user={user} />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? t("discover.loadingMore") : t("discover.loadMore")}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🍳</div>
          <p className="text-lg font-medium">{t("discover.noRecipes")}</p>
          <p className="text-sm mt-1">{t("discover.noRecipesSub")}</p>
        </div>
      )}
    </section>
  );
}

// ─── For You Section ──────────────────────────────────────────────────────────
