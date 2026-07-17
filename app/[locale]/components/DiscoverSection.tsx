"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/lib/navigation";
import { Recipe, TREND_FILTER_DEFS } from "./home-types";
import CategoryChips from "./CategoryChips";
import RecipeCard from "./RecipeCard";

// Merge keys into the URL query string without navigating, so the user's filter
// selection survives navigating to a recipe and pressing "back".
function updateUrlParams(updates: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

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
  const locale = useLocale();

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
  const [hasMore, setHasMore] = useState(true);
  const [count, setCount] = useState(6);
  const [maxTime, setMaxTime] = useState("");
  const [diet, setDiet] = useState("");
  const [trend, setTrend] = useState("");
  const [forYouActive, setForYouActive] = useState(false);
  const [userPrefs, setUserPrefs] = useState<{ diet: string; intolerances: string[]; max_time: number } | null>(null);
  const [community, setCommunity] = useState<Recipe[]>([]);

  // Load a couple of public, user-created recipes once, to sprinkle into the
  // default discover view. Failure is silent — they're a bonus, not required.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community-recipes?number=4&lang=${locale}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCommunity(d.recipes ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

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

  const fetchRecipes = useCallback(async (num = 6, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      params.set("lang", locale);
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
      const fetched: Recipe[] = data.recipes || [];
      setRecipes(fetched);
      setHasMore(!!data.hasMore);
      setQuotaExceeded(!!data.quota_exceeded);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, maxTime, diet, trend, forYouActive, userPrefs]);

  // Keep the loaded count in a ref so the fetch effect can read the latest
  // value without re-running on every Load More. applyCount syncs state, ref
  // and the URL, so the count survives a back navigation.
  const countRef = useRef(6);
  const applyCount = (n: number) => {
    countRef.current = n;
    setCount(n);
    updateUrlParams({ n: n > 6 ? String(n) : undefined });
  };

  const handleLoadMore = () => {
    const newCount = count + 6;
    applyCount(newCount);
    fetchRecipes(newCount, true);
  };

  // Restore filters + loaded count from the URL on mount (e.g. after the
  // browser back button). Declared before the fetch effect so the first fetch
  // already uses the restored count. Intentional one-time setState on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const time = params.get("time");
    const dietParam = params.get("diet");
    const trendParam = params.get("trend");
    const n = parseInt(params.get("n") || "", 10);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (time) setMaxTime(time);
    if (dietParam) setDiet(dietParam);
    if (trendParam) setTrend(trendParam);
    if (n && n > 6) { countRef.current = n; setCount(n); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMore(true);
    fetchRecipes(countRef.current);
  }, [fetchRecipes]);

  // After results load, scroll the previously-clicked recipe card back into
  // view. Re-checks on each load (deps include recipes) so it still works once
  // the restored count brings the card in. The marker is cleared when consumed
  // and ignored after 60s, so it never fires on an unrelated fresh visit.
  useEffect(() => {
    if (loading) return;
    let raw: string | null = null;
    try { raw = sessionStorage.getItem("culinse:returnTo"); } catch {}
    if (!raw) return;
    let data: { id?: string; y?: number; t?: number } = {};
    try { data = JSON.parse(raw); }
    catch { try { sessionStorage.removeItem("culinse:returnTo"); } catch {} return; }
    if (data.t && Date.now() - data.t > 60000) {
      try { sessionStorage.removeItem("culinse:returnTo"); } catch {}
      return;
    }
    const el = data.id ? document.getElementById(`recipe-${data.id}`) : null;
    if (el) {
      try { sessionStorage.removeItem("culinse:returnTo"); } catch {}
      requestAnimationFrame(() => el.scrollIntoView({ block: "center", behavior: "auto" }));
    }
  }, [loading, recipes]);

  const selectMaxTime = (v: string) => { setMaxTime(v); applyCount(6); updateUrlParams({ time: v || undefined }); };
  const selectDiet = (v: string) => { setDiet(v); applyCount(6); updateUrlParams({ diet: v || undefined }); };
  const selectTrend = (v: string) => { setTrend(v); applyCount(6); updateUrlParams({ trend: v || undefined }); };

  // Only sprinkle community recipes into the unfiltered default view, where
  // relevance doesn't matter; on a real search/filter we show pure results.
  const isDefaultView =
    !search && (!category || category === "All") && !maxTime && !diet && !trend && !forYouActive;

  const displayedRecipes = useMemo(() => {
    if (!isDefaultView || community.length === 0 || recipes.length === 0) return recipes;
    // Feste Regel (Peters Vorgabe): Jedes 6. Bild gehört der Community/dem
    // eigenen Korpus — Index 5, 11, 17, … Die Gesamtzahl bleibt unverändert;
    // Provider-Rezepte füllen die übrigen Slots. So sind die eigenen Rezepte
    // verlässlich in jedem Sechser-Block sichtbar statt an Zufallspositionen.
    const target = recipes.length;
    const communityIds = new Set(community.map((c) => String(c.id)));
    const providers = recipes.filter((r) => !communityIds.has(String(r.id)));
    const out: Recipe[] = [];
    let pi = 0;
    let ci = 0;
    for (let i = 0; i < target; i++) {
      const isCommunitySlot = (i + 1) % 6 === 0 && ci < community.length;
      if (isCommunitySlot) out.push(community[ci++]);
      else if (pi < providers.length) out.push(providers[pi++]);
      else if (ci < community.length) out.push(community[ci++]);
      else break;
    }
    return out;
  }, [recipes, community, isDefaultView]);

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

      <div className="discover-anchor flex items-center justify-between mb-6 scroll-mt-24">
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
            onClick={() => { setForYouActive(v => !v); applyCount(6); }}
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
            onClick={() => selectTrend(f.value)}
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
              onClick={() => selectMaxTime(f.value)}
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
              onClick={() => selectDiet(f.value)}
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
            {displayedRecipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} index={i} user={user} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? t("discover.loadingMore") : t("discover.loadMore")}
              </button>
            </div>
          )}
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
