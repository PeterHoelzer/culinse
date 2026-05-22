"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";

interface SavedRecipe {
  id: string;
  recipe_id: string;
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
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = EMOJIS[index % EMOJIS.length];

  return (
    <Fragment>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
        <Link href={`/recipe/${recipe.recipe_id}`} className="relative h-44 block">
          {recipe.image && !imgError ? (
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
              <span className="text-6xl drop-shadow-lg">{emoji}</span>
            </div>
          )}
          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); setShowCollectionModal(true); }}
              title="Add to collection"
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-orange-500 flex items-center justify-center text-sm transition-all shadow-sm"
            >
              📚
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onRemove(recipe.id); }}
              title="Remove from saved"
              className="w-8 h-8 rounded-full bg-white text-orange-500 flex items-center justify-center text-sm hover:bg-red-50 hover:text-red-400 transition-colors shadow-sm"
            >
              ♥
            </button>
          </div>
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
            {recipe.source}
          </div>
        </Link>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{recipe.title}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
            {recipe.time && recipe.time !== "—" && <span>⏱ {recipe.time}</span>}
            <Link href={`/recipe/${recipe.recipe_id}`} className="ml-auto text-orange-500 font-medium hover:text-orange-700 transition-colors">
              Details →
            </Link>
          </div>
        </div>
      </div>

      {showCollectionModal && (
        <AddToCollectionModal
          recipe={{
            id: recipe.recipe_id,
            title: recipe.title,
            image: recipe.image,
            source: recipe.source,
            sourceUrl: recipe.source_url,
            time: recipe.time,
          }}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </Fragment>
  );
}

export default function SavedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/login"; return; }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }} className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">♥ My Saved Recipes</h1>
          <p className="text-orange-100 text-sm">
            {loading ? "Loading…" : recipes.length === 0 ? "No recipes saved yet" : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} in your collection`}
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
          <div className="text-center py-24">
            <div className="text-6xl mb-4">♡</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">Your cookbook is empty</p>
            <p className="text-sm text-gray-500 mb-8">Click the ♡ on any recipe to save it here.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
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
