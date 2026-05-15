"use client";

import { useState } from "react";

// ─── Mock recipe data (will be replaced by Spoonacular API) ───────────────────
const RECIPES = [
  {
    id: 1,
    title: "Creamy Tuscan Garlic Pasta",
    source: "BBC Good Food",
    time: "25 min",
    calories: 480,
    tags: ["pasta", "italian", "quick"],
    category: "Pasta",
    emoji: "🍝",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    rating: 4.8,
    saves: 2341,
  },
  {
    id: 2,
    title: "Thai Green Curry with Jasmine Rice",
    source: "Serious Eats",
    time: "35 min",
    calories: 520,
    tags: ["thai", "curry", "spicy"],
    category: "Asian",
    emoji: "🍛",
    gradient: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
    rating: 4.9,
    saves: 1872,
  },
  {
    id: 3,
    title: "Classic Avocado Toast with Poached Egg",
    source: "Minimalist Baker",
    time: "15 min",
    calories: 320,
    tags: ["breakfast", "healthy", "quick"],
    category: "Breakfast",
    emoji: "🥑",
    gradient: "linear-gradient(135deg, #84cc16 0%, #15803d 100%)",
    rating: 4.6,
    saves: 3104,
  },
  {
    id: 4,
    title: "Slow-Roasted Salmon with Lemon Herbs",
    source: "Bon Appétit",
    time: "40 min",
    calories: 390,
    tags: ["seafood", "healthy", "dinner"],
    category: "Seafood",
    emoji: "🐟",
    gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
    rating: 4.7,
    saves: 1456,
  },
  {
    id: 5,
    title: "Homemade Margherita Pizza",
    source: "Chefkoch",
    time: "45 min",
    calories: 560,
    tags: ["pizza", "italian", "weekend"],
    category: "Pizza",
    emoji: "🍕",
    gradient: "linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)",
    rating: 4.8,
    saves: 4210,
  },
  {
    id: 6,
    title: "Chocolate Lava Cake",
    source: "Eatsmarter",
    time: "20 min",
    calories: 410,
    tags: ["dessert", "chocolate", "quick"],
    category: "Dessert",
    emoji: "🍫",
    gradient: "linear-gradient(135deg, #78350f 0%, #1c1917 100%)",
    rating: 4.9,
    saves: 5621,
  },
];

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

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-gray-900">
            culi<span style={{ color: "#f97316" }}>nse</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#discover" className="hover:text-orange-500 transition-colors">Discover</a>
          <a href="#how-it-works" className="hover:text-orange-500 transition-colors">How it Works</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Trending</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors"
            style={{ background: "#f97316" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
          >
            Get Started →
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  return (
    <section className="hero-gradient py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-full px-4 py-1.5 mb-6">
          <span>✨</span>
          <span>Personalized recipe discovery — like Spotify, but for food</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
          Find recipes you'll{" "}
          <span style={{ color: "#f97316" }}>actually love.</span>
        </h1>

        {/* Sub */}
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
          Culinse aggregates millions of recipes from the world's best food sites and shows you a personalized feed — no ads, no noise.
        </p>

        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-2 max-w-xl mx-auto border border-gray-100">
          <span className="pl-2 text-gray-400 text-xl">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any recipe, ingredient, or cuisine..."
            className="search-input flex-1 text-base text-gray-700 bg-transparent py-2 px-1 placeholder-gray-400"
          />
          <button
            className="flex-shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
            style={{ background: "#f97316" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
          >
            Search
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-5 text-sm text-gray-500">
          <span>Try:</span>
          {["Pasta carbonara", "Avocado toast", "Thai curry", "Chocolate cake"].map((s) => (
            <button
              key={s}
              onClick={() => setSearch(s)}
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

function CategoryChips({
  active,
  setActive,
}: {
  active: string;
  setActive: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

function RecipeCard({ recipe }: { recipe: (typeof RECIPES)[0] }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="recipe-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
      {/* Gradient placeholder with emoji (real images come from Spoonacular API) */}
      <div
        className="relative h-44 flex items-center justify-center"
        style={{ background: recipe.gradient }}
      >
        <span className="text-6xl drop-shadow-lg">{recipe.emoji}</span>

        {/* Save button */}
        <button
          onClick={() => setSaved(!saved)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
            saved ? "bg-white text-orange-500" : "bg-white/80 text-gray-400 hover:text-orange-400"
          }`}
        >
          {saved ? "♥" : "♡"}
        </button>

        {/* Source badge */}
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
          {recipe.source}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{recipe.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
          <span>⏱ {recipe.time}</span>
          <span>🔥 {recipe.calories} kcal</span>
          <span>⭐ {recipe.rating}</span>
          <span className="ml-auto text-orange-500 font-medium">↗ Recipe</span>
        </div>
      </div>
    </div>
  );
}

function DiscoverSection({
  search,
  category,
  setCategory,
}: {
  search: string;
  category: string;
  setCategory: (v: string) => void;
}) {
  const filtered = RECIPES.filter((r) => {
    const matchCat = category === "All" || r.category === category;
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <section id="discover" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {search ? `Results for "${search}"` : "Trending Today"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} recipes found from the world's best food sites
          </p>
        </div>
        <button className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors hidden sm:block">
          View all →
        </button>
      </div>

      {/* Category chips */}
      <div className="mb-6">
        <CategoryChips active={category} setActive={setCategory} />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
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
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
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
  const [category, setCategory] = useState("All");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero search={search} setSearch={setSearch} />
        <DiscoverSection search={search} category={category} setCategory={setCategory} />
        <HowItWorks />
        <Sources />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
