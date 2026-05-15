"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface SavedRecipe {
  id: string;
  recipe_id: number;
  title: string;
  image: string | null;
  source: string;
  source_url: string;
  time: string;
  created_at: string;
}

const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  "linear-gradient(135deg, #84cc16 0%, #15803d 100%)",
  "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #78350f 0%, #1c1917 100%)",
];
const EMOJIS = ["🍝", "🍛", "🥑", "🐟", "🍕", "🍫", "🥗", "🍜", "🥘", "🍲"];

function SavedCard({ recipe, index, onRemove }: { recipe: SavedRecipe; index: number; onRemove: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = EMOJIS[index % EMOJIS.length];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
      style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
    >
      <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="relative h-44 block">
        {recipe.image && !imgError ? (
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <span className="text-6xl drop-shadow-lg">{emoji}</span>
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(recipe.id); }}
          title="Remove from saved"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center text-sm hover:bg-orange-50 transition-colors"
        >
          ♥
        </button>
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
          {recipe.source}
        </div>
      </a>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{recipe.title}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
          {recipe.time && recipe.time !== "—" && <span>⏱ {recipe.time}</span>}
          <span className="ml-auto text-orange-500 font-medium">↗ Recipe</span>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);

      const { data: saved } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      setRecipes(saved || []);
      setLoading(false);
    });
  }, []);

  const handleRemove = async (id: string) => {
    await supabase.from("saved_recipes").delete().eq("id", id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-gray-900">
              culi<span style={{ color: "#f97316" }}>nse</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-orange-500 transition-colors">Discover</Link>
            <Link href="/saved" className="text-orange-500 font-semibold">My Recipes</Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[160px]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Saved Recipes</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Loading…" : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">♡</div>
            <p className="text-xl font-medium text-gray-700 mb-2">No saved recipes yet</p>
            <p className="text-sm mb-6">Click the heart on any recipe to save it here.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#f97316" }}
            >
              Discover Recipes →
            </Link>
          </div>
        )}

        {/* Recipe grid */}
        {!loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((recipe, i) => (
              <SavedCard key={recipe.id} recipe={recipe} index={i} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
