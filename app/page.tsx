"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import AddToPlanModal from "@/components/AddToPlanModal";

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

// ─── Fallback gradients for cards without images ──────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  "linear-gradient(135deg, #84cc16 0%, #15803d 100%)",
  "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #78350f 0%, #1c1917 100%)",
];
const EMOJIS = ["🍝", "🍛", "🥑", "🐟", "🍕", "🍫", "🥗", "🍜", "🥘", "🍲"];

const CATEGORIES = ["All", "Pasta", "Asian", "Korean", "Breakfast", "Seafood", "Pizza", "Dessert", "Salad", "Soup"];

const HOW_IT_WORKS = [
  {
    icon: "🔍",
    title: "Search & Discover",
    desc: "Search millions of recipes from top food sites worldwide — all in one place.",
  },
  {
    icon: "❤️",
    title: "Save & Personalize",
    desc: "Save recipes you love. Culinse learns your taste and shows you more of what you like.",
  },
  {
    icon: "🛒",
    title: "Shop Instantly",
    desc: "Add all ingredients to your cart with one click. Delivered to your door.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Navbar({ user }: { user: User | null | undefined }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-gray-900">
            culi<span style={{ color: "#f97316" }}>nse</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#discover" className="hover:text-orange-500 transition-colors">Discover</a>
          <a href="#how-it-works" className="hover:text-orange-500 transition-colors">How it Works</a>
          {user && <a href="/saved" className="hover:text-orange-500 transition-colors">♥ My Recipes</a>}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <a href="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-opacity hover:opacity-80" style={{ background: "#f97316" }} title="My Profile">
                {user.email?.[0]?.toUpperCase() ?? "👤"}
              </a>
              <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</a>
              <a href="/login" className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#f97316" }}>
                Get Started →
              </a>
            </>
          )}
        </div>

        {/* Mobile: right side */}
        <div className="flex md:hidden items-center gap-2">
          {!user && (
            <a href="/login" className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#f97316" }}>
              Join
            </a>
          )}
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <a href="#discover" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">🔍 Discover</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">⚙️ How it Works</a>
          {user && <a href="/saved" className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">♥ My Recipes</a>}
          {user && <a href="/profile" className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">👤 My Profile</a>}
          <div className="h-px bg-gray-100" />
          {user ? (
            <button onClick={handleLogout} className="text-sm font-medium text-gray-500 py-2 text-left hover:text-gray-900 transition-colors">
              Log out
            </button>
          ) : (
            <a href="/login" className="text-sm font-medium text-gray-700 py-2 hover:text-orange-500 transition-colors">Log in</a>
          )}
        </div>
      )}
    </nav>
  );
}

function Hero({ search, setSearch, onSearch }: { search: string; setSearch: (v: string) => void; onSearch: () => void }) {
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

  return (
    <section className="hero-gradient py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto text-center">

        {/* Credibility badge */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-orange-700 bg-white/70 border border-orange-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span>👨‍🍳</span>
          <span>Built by a Master Butcher &amp; Head Chef</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-5">
          One place for every<br />
          <span style={{ color: "#f97316" }}>recipe you&apos;ll love.</span>
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
          Culinse aggregates recipes from multiple top sources — filtered to your diet and allergies, with no ads and no paywalls.
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
              placeholder="Pasta, curry, steak…"
              className="search-input flex-1 min-w-0 text-sm sm:text-base text-gray-700 bg-transparent py-2 px-1 placeholder-gray-400"
            />
            <button
              onClick={() => { setShowSuggestions(false); onSearch(); }}
              className="flex-shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: "#f97316" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
            >
              Search
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
          <span>Try:</span>
          {["Pasta carbonara", "Beef steak", "Thai curry", "Chocolate cake"].map((s) => (
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
            <span>From Spoonacular, MealDB, Edamam &amp; Tasty</span>
            <span className="text-gray-300">·</span>
            <span>Free · No ads</span>
          </div>
          {/* Desktop: badge version */}
          <div className="hidden sm:flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
            <span>Sources:</span>
            {["Spoonacular", "MealDB", "Edamam", "Tasty"].map((src) => (
              <span key={src} className="font-medium text-gray-500 bg-white/60 border border-gray-200 px-2.5 py-1 rounded-full">{src}</span>
            ))}
            <span className="text-gray-300">·</span>
            <span>Free forever · No ads</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryChips({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            active === cat
              ? "text-white border-transparent"
              : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500"
          }`}
          style={active === cat ? { background: "#f97316", borderColor: "#f97316" } : {}}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

function RecipeCard({ recipe, index, user }: { recipe: Recipe; index: number; user: User | null | undefined }) {
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
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

  const handlePlanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { window.location.href = "/login"; return; }
    setShowPlanModal(true);
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
            {/* Add to plan */}
            <button
              onClick={handlePlanClick}
              title="Zum Wochenplan"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-orange-500 flex items-center justify-center text-sm transition-all shadow-sm"
            >
              📅
            </button>
            {/* Add to collection */}
            <button
              onClick={handleCollectionClick}
              title="Add to collection"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-orange-500 flex items-center justify-center text-sm transition-all shadow-sm"
            >
              📚
            </button>
            {/* Save / Heart */}
            <button
              onClick={handleSave}
              title={user ? (saved ? "Remove from saved" : "Save recipe") : "Log in to save"}
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
            {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
            {recipe.rating && <span>⭐ {recipe.rating}</span>}
            <span className="ml-auto text-orange-500 font-medium">Details →</span>
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
      {showPlanModal && (
        <AddToPlanModal
          recipe={{
            id: String(recipe.id),
            title: recipe.title,
            image: recipe.image ?? undefined,
          }}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </Fragment>
  );
}

const TIME_FILTERS = [
  { label: "Any time", value: "" },
  { label: "≤ 15 min", value: "15" },
  { label: "≤ 30 min", value: "30" },
  { label: "≤ 60 min", value: "60" },
];

const DIET_FILTERS = [
  { label: "All diets", value: "" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Gluten-free", value: "gluten free" },
];

const TREND_FILTERS = [
  { label: "🔥 Trending", value: "", type: "none" },
  { label: "💪 High Protein", value: "30", type: "minProtein" },
  { label: "⚡ Low Carb", value: "20", type: "maxCarbs" },
  { label: "🥑 Keto", value: "ketogenic", type: "diet" },
  { label: "🥛 Dairy-free", value: "dairy", type: "intolerances" },
  { label: "🫒 Mediterranean", value: "mediterranean", type: "cuisine" },
];

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

  // Load user preferences (for "For You" button — not auto-applied)
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
      // Apply manual filters
      if (maxTime) params.set("maxTime", maxTime);
      if (diet) params.set("diet", diet);
      // Apply "For You" prefs on top
      if (forYouActive && userPrefs) {
        if (!diet && userPrefs.diet) params.set("diet", userPrefs.diet);
        if (!maxTime && userPrefs.max_time) params.set("maxTime", String(userPrefs.max_time));
        if (userPrefs.intolerances?.length) params.set("intolerances", userPrefs.intolerances.join(","));
      }
      // Apply trend filter
      const activeTrend = TREND_FILTERS.find(f => f.value === trend && f.value !== "");
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

      {/* Profile CTA — shown when logged in but no preferences set */}
      {user && !userPrefs && (
        <a
          href="/profile"
          className="flex items-center justify-between gap-4 mb-6 px-5 py-4 rounded-2xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Set up your food profile</p>
              <p className="text-xs text-orange-600">Tell us your diet & allergens — get a personalized feed.</p>
            </div>
          </div>
          <span className="text-orange-400 group-hover:translate-x-1 transition-transform text-sm">→</span>
        </a>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : "Trending Today"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading recipes…" : `${recipes.length} recipes from the world's best food sites`}
          </p>
        </div>
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors hidden sm:block disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more →"}
        </button>
      </div>

      {/* Trend filters — horizontal scroll on mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {/* For You button — only for users with a profile */}
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
            ✨ For You
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

      {/* Filters — horizontal scroll on mobile */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {/* Time filter */}
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

        {/* Diet filter */}
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

        {/* Allergen indicator — only when For You is active */}
        {forYouActive && (userPrefs?.intolerances?.length ?? 0) > 0 && (
          <a
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            🚫 {userPrefs?.intolerances?.length} allergen{(userPrefs?.intolerances?.length ?? 0) > 1 ? "s" : ""} filtered
          </a>
        )}
      </div>

      {quotaExceeded && !loading && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          <span>⏳</span>
          <span>We&apos;re refreshing our recipe catalog — full results back shortly.</span>
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
          <p className="text-lg font-medium">Could not load recipes</p>
          <button onClick={() => fetchRecipes(count)} className="text-sm text-orange-500 mt-2 hover:underline">Try again</button>
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🍳</div>
          <p className="text-lg font-medium">No recipes found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </section>
  );
}

function ForYouSection({ user, onLoaded }: { user: User | null | undefined; onLoaded: (ids: (number | string)[]) => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPrefs, setHasPrefs] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // auth not resolved yet
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
  }, [user]);

  if (!user || !hasPrefs) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            ✨ For You
          </h2>
          <p className="text-sm text-gray-500 mt-1">Personalized based on your food profile</p>
        </div>
        <a href="/profile" className="text-sm text-orange-500 hover:text-orange-700 transition-colors">
          Edit profile →
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

interface VideoRecipe {
  id: string;
  title: string;
  image: string;
  videoUrl: string;
  time: string | null;
  servings: string | null;
}

function VideoSection() {
  const [videos, setVideos] = useState<VideoRecipe[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/videos?size=6")
      .then(r => r.json())
      .then(d => setVideos(d.videos || []));
  }, []);

  if (videos.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🎬 Video Recipes
          </h2>
          <p className="text-sm text-gray-500 mt-1">Watch &amp; cook — step by step videos</p>
        </div>
        <a href="https://tasty.co" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors hidden sm:block">
          More on Tasty →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative h-44 bg-black cursor-pointer group" onClick={() => setPlaying(playing === v.id ? null : v.id)}>
              {playing === v.id ? (
                <video
                  src={v.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  controls
                  playsInline
                />
              ) : (
                <>
                  <img src={v.image} alt={v.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-2xl ml-1">▶</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
                    Tasty
                  </div>
                  {v.time && (
                    <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
                      ⏱ {v.time}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-2">{v.title}</h3>
              <a
                href={`/recipe/${v.id}`}
                className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors"
              >
                Full Recipe →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How Culinse Works</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            We bring the internet's best recipes to you — personalized, searchable, and shoppable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
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


function CTA() {
  return (
    <section
      className="py-20 px-4 text-white text-center"
      style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-5xl mb-4">🍽️</div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Start discovering recipes today.
        </h2>
        <p className="text-orange-100 text-lg mb-8 max-w-lg mx-auto">
          Free forever. No subscription. Just great food, personalized for you.
        </p>
        <a
          href="#"
          className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3.5 rounded-full text-base transition-opacity hover:opacity-90"
          style={{ color: "#f97316" }}
        >
          Create Free Account →
        </a>
      </div>
    </section>
  );
}

function Footer() {
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
            <a href="/about" className="hover:text-white transition-colors">About</a>
            <a href="/impressum" className="hover:text-white transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="mailto:peter@hoelzer.xyz" className="hover:text-white transition-colors">Contact</a>
          </div>

          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Culinse. All rights reserved.
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

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1">
        <Hero search={search} setSearch={setSearch} onSearch={handleSearch} />
        <DiscoverSection search={activeSearch} category={category} setCategory={setCategory} user={user} />
        <VideoSection />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
