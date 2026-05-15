"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Recipe {
  id: number;
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

const CATEGORIES = ["All", "Pasta", "Asian", "Breakfast", "Seafood", "Pizza", "Dessert", "Salad", "Soup"];

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

function Navbar({ user }: { user: User | null }) {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-gray-900">
            culi<span style={{ color: "#f97316" }}>nse</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#discover" className="hover:text-orange-500 transition-colors">Discover</a>
          <a href="#how-it-works" className="hover:text-orange-500 transition-colors">How it Works</a>
          <a href="#discover" className="hover:text-orange-500 transition-colors">Trending</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[160px]">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Log in
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors"
                style={{ background: "#f97316" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
              >
                Get Started →
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ search, setSearch, onSearch }: { search: string; setSearch: (v: string) => void; onSearch: () => void }) {
  return (
    <section className="hero-gradient py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-full px-4 py-1.5 mb-6">
          <span>✨</span>
          <span>Personalized recipe discovery — like Spotify, but for food</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
          Find recipes you'll{" "}
          <span style={{ color: "#f97316" }}>actually love.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
          Culinse aggregates millions of recipes from the world's best food sites and shows you a personalized feed — no ads, no noise.
        </p>

        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-2 max-w-xl mx-auto border border-gray-100">
          <span className="pl-2 text-gray-400 text-xl">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search any recipe, ingredient, or cuisine..."
            className="search-input flex-1 text-base text-gray-700 bg-transparent py-2 px-1 placeholder-gray-400"
          />
          <button
            onClick={onSearch}
            className="flex-shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
            style={{ background: "#f97316" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-5 text-sm text-gray-500">
          <span>Try:</span>
          {["Pasta carbonara", "Avocado toast", "Thai curry", "Chocolate cake"].map((s) => (
            <button
              key={s}
              onClick={() => { setSearch(s); onSearch(); }}
              className="text-orange-500 hover:text-orange-700 hover:underline transition-colors"
            >
              {s}
            </button>
          ))}
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

function RecipeCard({ recipe, index, user }: { recipe: Recipe; index: number; user: User | null }) {
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = EMOJIS[index % EMOJIS.length];
  const supabase = createClient();

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
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

  return (
    <a
      href={recipe.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
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

        <button
          onClick={handleSave}
          title={user ? (saved ? "Remove from saved" : "Save recipe") : "Log in to save"}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
            saved ? "bg-white text-orange-500" : "bg-white/80 text-gray-400 hover:text-orange-400"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>

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
          <span className="ml-auto text-orange-500 font-medium">↗ Recipe</span>
        </div>
      </div>
    </a>
  );
}

function DiscoverSection({
  search,
  category,
  setCategory,
  user,
}: {
  search: string;
  category: string;
  setCategory: (v: string) => void;
  user: User | null;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      if (category && category !== "All") params.set("category", category);
      const res = await fetch(`/api/recipes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return (
    <section id="discover" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : "Trending Today"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading recipes…" : `${recipes.length} recipes from the world's best food sites`}
          </p>
        </div>
        <button className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors hidden sm:block">
          View all →
        </button>
      </div>

      <div className="mb-6">
        <CategoryChips active={category} setActive={setCategory} />
      </div>

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
          <button onClick={fetchRecipes} className="text-sm text-orange-500 mt-2 hover:underline">Try again</button>
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

function Sources() {
  const sources = [
    { name: "BBC Good Food", flag: "🇬🇧" },
    { name: "Bon Appétit", flag: "🇺🇸" },
    { name: "Chefkoch", flag: "🇩🇪" },
    { name: "Eatsmarter", flag: "🇩🇪" },
    { name: "Serious Eats", flag: "🇺🇸" },
    { name: "Minimalist Baker", flag: "🇺🇸" },
    { name: "Cookpad", flag: "🌍" },
    { name: "Marmiton", flag: "🇫🇷" },
  ];

  return (
    <section className="py-14 px-4 border-t border-gray-100">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-8">
          Recipes from the world's best food sites
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {sources.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 text-sm text-gray-600 font-medium"
            >
              <span>{s.flag}</span>
              <span>{s.name}</span>
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
            <a href="#how-it-works" className="hover:text-white transition-colors">About</a>
            <a href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="/impressum" className="hover:text-white transition-colors">Impressum</a>
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
  const [user, setUser] = useState<User | null>(null);

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
        <HowItWorks />
        <Sources />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
