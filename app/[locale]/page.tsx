"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import SharedNavbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string;
  servings: number | null;
  rating: number | null;
}

// ─── Static constants (not translated) ───────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  "linear-gradient(135deg, #84cc16 0%, #15803d 100%)",
  "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #78350f 0%, #1c1917 100%)",
];
const EMOJIS = ["🍝", "🍛", "🥑", "🐟", "🍕", "🍫", "🥗", "🍜", "🥘", "🍲"];

// English category values for API calls (order must match messages json)
const EN_CATEGORIES = ["All", "Pasta", "Asian", "Korean", "Breakfast", "Seafood", "Pizza", "Dessert", "Salad", "Soup"];

// Trend filter definitions (values are for API, keys are for t())
const TREND_FILTER_DEFS = [
  { key: "trending",     value: "",              type: "none" },
  { key: "highProtein",  value: "30",            type: "minProtein" },
  { key: "lowCarb",      value: "20",            type: "maxCarbs" },
  { key: "keto",         value: "ketogenic",     type: "diet" },
  { key: "dairyFree",    value: "dairy",         type: "intolerances" },
  { key: "mediterranean",value: "mediterranean", type: "cuisine" },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ search, setSearch, onSearch }: { search: string; setSearch: (v: string) => void; onSearch: () => void }) {
  const t = useTranslations();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    }, 250);
  };

  const handleSelect = (s: string) => {
    setSearch(s);
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch();
  };

  const quickPicks = t.raw("hero.quickPicks") as string[];

  return (
    <section className="hero-gradient py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto text-center">

        {/* Credibility badge */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-orange-700 bg-white/70 border border-orange-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span>👨‍🍳</span>
          <span>{t("hero.badge")}</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-5">
          {t("hero.headline1")}<br />
          <span style={{ color: "#f97316" }}>{t("hero.headline2")}</span>
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
          {t("hero.subline")}
        </p>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto">
          <div className="flex items-center gap-2 bg-white rounded-2xl shadow-lg p-2 border border-orange-100">
            <span className="pl-1 text-gray-400 text-xl flex-shrink-0">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); onSearch(); } }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={t("hero.searchPlaceholder")}
              className="search-input flex-1 min-w-0 text-sm sm:text-base text-gray-700 bg-transparent py-2 px-1 placeholder-gray-400"
            />
            <button
              onClick={() => { setShowSuggestions(false); onSearch(); }}
              className="flex-shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: "#f97316" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
            >
              {t("hero.searchButton")}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(s)}
                  className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                >
                  <span className="text-gray-300">🔍</span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-gray-500">
          <span>{t("hero.tryLabel")}</span>
          {quickPicks.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="text-orange-500 hover:text-orange-700 hover:underline transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Source trust row */}
        <div className="mt-8 text-xs text-gray-400">
          {/* Mobile: compact version */}
          <div className="sm:hidden flex flex-wrap justify-center items-center gap-2">
            <span>{t("hero.sourcesMobile")}</span>
            <span className="text-gray-300">·</span>
            <span>{t("hero.freeLabel")}</span>
          </div>
          {/* Desktop: badge version */}
          <div className="hidden sm:flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
            <span>{t("hero.sourcesDesktop")}</span>
            {["Spoonacular", "MealDB", "Edamam", "Tasty"].map((src) => (
              <span key={src} className="font-medium text-gray-500 bg-white/60 border border-gray-200 px-2.5 py-1 rounded-full">{src}</span>
            ))}
            <span className="text-gray-300">·</span>
            <span>{t("hero.freeLabel")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Category Chips ───────────────────────────────────────────────────────────
function CategoryChips({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  const t = useTranslations();
  const categories = t.raw("categories") as string[];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((cat, i) => {
        const enVal = EN_CATEGORIES[i] ?? cat;
        return (
          <button
            key={enVal}
            onClick={() => setActive(enVal)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              active === enVal
                ? "text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
            }`}
            style={active === enVal ? { background: "#f97316", borderColor: "#f97316" } : {}}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe, index, user }: { recipe: Recipe; index: number; user: User | null | undefined }) {
  const t = useTranslations();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = EMOJIS[index % EMOJIS.length];
  const supabase = createClient();

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/login"; return; }
    if (saved) {
      await supabase.from("saved_recipes").delete().eq("recipe_id", recipe.id).eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase.from("saved_recipes").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        source: recipe.source,
        source_url: recipe.sourceUrl,
        time: recipe.time,
      });
      setSaved(true);
    }
  };

  const handleCollectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/login"; return; }
    setShowCollectionModal(true);
  };

  return (
    <Fragment>
      <a
        href={`/recipe/${recipe.id}`}
        className="recipe-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
      >
        <div className="relative h-44">
          {recipe.image && !imgError ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
              <span className="text-6xl drop-shadow-lg">{emoji}</span>
            </div>
          )}

          {/* Action buttons — top right */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={handleCollectionClick}
              title={t("recipeCard.addToCollection")}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-orange-500 flex items-center justify-center text-sm transition-all shadow-sm"
            >
              📚
            </button>
            <button
              onClick={handleSave}
              title={user ? (saved ? t("recipeCard.removeSave") : t("recipeCard.save")) : t("recipeCard.loginToSave")}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-sm ${
                saved ? "bg-white text-orange-500" : "bg-white/80 text-gray-400 hover:text-orange-400 hover:bg-white"
              }`}
            >
              {saved ? "♥" : "♡"}
            </button>
          </div>

          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
            {recipe.source}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{recipe.title}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
            {recipe.time !== "—" && <span>⏱ {recipe.time}</span>}
            {recipe.servings && <span>🍽 {t("recipeCard.servings", { count: recipe.servings })}</span>}
            {recipe.rating && <span>⭐ {recipe.rating}</span>}
            <span className="ml-auto text-orange-500 font-medium">{t("recipeCard.details")}</span>
          </div>
        </div>
      </a>

      {showCollectionModal && (
        <AddToCollectionModal
          recipe={{
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            source: recipe.source,
            sourceUrl: recipe.sourceUrl,
            time: recipe.time,
          }}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </Fragment>
  );
}

// ─── Discover Section ─────────────────────────────────────────────────────────
function DiscoverSection({
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
        <a
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
        </a>
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
function ForYouSection({ user, onLoaded }: { user: User | null | undefined; onLoaded: (ids: (number | string)[]) => void }) {
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
        <a href="/profile" className="text-sm text-orange-500 hover:text-orange-700 transition-colors">
          {t("forYou.editProfile")}
        </a>
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

function VideoSection() {
  const t = useTranslations();
  const [allVideos, setAllVideos] = useState<VideoRecipe[]>([]);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 6;

  useEffect(() => {
    fetch("/api/videos?size=40&from=0")
      .then(r => r.json())
      .then(d => {
        const videos: VideoRecipe[] = d.videos || [];
        const today = new Date();
        let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const seededRandom = () => {
          seed = (seed * 1664525 + 1013904223) & 0xffffffff;
          return (seed >>> 0) / 0xffffffff;
        };
        const shuffled = [...videos];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setAllVideos(shuffled);
      });
  }, []);

  const videos = allVideos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const loadMore = () => {
    setLoadingMore(true);
    setPlaying(null);
    const next = page + 1;
    const maxPage = Math.floor((allVideos.length - 1) / PAGE_SIZE);
    setPage(next > maxPage ? 0 : next);
    setTimeout(() => setLoadingMore(false), 200);
  };

  if (videos.length === 0) return null;

  return (
    <section className="pb-12" style={{ background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          {t("videoSection.title")}
        </h2>
        <p className="text-sm text-gray-400 mb-6">{t("videoSection.subtitle")}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {videos.map((v) => (
            <div
              key={v.id}
              className="flex-shrink-0 w-44 sm:w-auto relative rounded-2xl overflow-hidden cursor-pointer group"
              style={{ aspectRatio: "9/16" }}
              onClick={() => setPlaying(playing === v.id ? null : v.id)}
            >
              {playing === v.id ? (
                <video
                  src={v.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  controls
                  playsInline
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <img
                    src={v.image}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-lg ml-0.5">▶</span>
                    </div>
                  </div>
                  {v.time && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
                      ⏱ {v.time}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold leading-snug line-clamp-2 mb-2">{v.title}</p>
                    <a
                      href={`/recipe/${v.id}`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      {t("videoSection.fullRecipe")}
                    </a>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {loadingMore ? t("videoSection.loading") : t("videoSection.loadMore")}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const t = useTranslations();
  const steps = t.raw("howItWorks.steps") as Array<{ icon: string; title: string; desc: string }>;

  return (
    <section id="how-it-works" className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("howItWorks.title")}</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 bg-orange-50">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  const t = useTranslations();

  return (
    <section
      className="py-20 px-4 text-white text-center"
      style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          {t("cta.title")}
        </h2>
        <p className="text-orange-100 text-lg mb-8 max-w-lg mx-auto">
          {t("cta.subtitle")}
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3.5 rounded-full text-base transition-opacity hover:opacity-90"
          style={{ color: "#f97316" }}
        >
          {t("cta.button")}
        </a>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-gray-900 text-gray-400 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span className="text-white font-bold text-lg">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="/about" className="hover:text-white transition-colors">{t("footer.about")}</a>
            <a href="/impressum" className="hover:text-white transition-colors">{t("footer.impressum")}</a>
            <a href="/datenschutz" className="hover:text-white transition-colors">{t("footer.datenschutz")}</a>
            <a href="mailto:peter@hoelzer.xyz" className="hover:text-white transition-colors">{t("footer.contact")}</a>
          </div>

          <p className="text-xs text-gray-600">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = () => {
    setActiveSearch(search);
    setCategory("All");
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleForYouLoaded = (_ids: (number | string)[]) => {};

  return (
    <>
      <SharedNavbar />
      <main className="flex-1">
        <Hero search={search} setSearch={setSearch} onSearch={handleSearch} />
        <ForYouSection user={user} onLoaded={handleForYouLoaded} />
        <DiscoverSection search={activeSearch} category={category} setCategory={setCategory} user={user} />
        <VideoSection />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
