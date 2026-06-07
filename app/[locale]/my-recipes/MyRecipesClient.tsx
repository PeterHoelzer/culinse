"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/lib/navigation";

interface UserRecipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_position: string | null;
  is_public: boolean;
  status: string;
  cook_time: number | null;
  servings: number | null;
  likes: number;
  created_at: string;
  source_type?: string;
  source_name?: string | null;
  source_url?: string | null;
}

export default function MyRecipesClient() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user-recipes")
      .then(r => r.json())
      .then(d => { setRecipes(d.recipes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    await fetch(`/api/user-recipes/${id}`, { method: "DELETE" });
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const togglePublic = async (recipe: UserRecipe) => {
    const res = await fetch(`/api/user-recipes/${recipe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recipe, is_public: !recipe.is_public }),
    });
    const data = await res.json();
    if (res.status === 422) {
      alert("Cannot publish:\n" + data.issues.join("\n"));
      return;
    }
    if (res.ok) setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_public: !r.is_public } : r));
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
          <p className="text-gray-500 text-sm mt-1">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} created</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/recipes/import"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-orange-200 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            🔗 Import
          </Link>
          <Link
            href="/recipes/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}
          >
            + New Recipe
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No recipes yet</h2>
          <p className="text-gray-500 mb-6">Create your first recipe — or import one from any recipe site.</p>
          <div className="flex justify-center gap-3">
            <Link href="/recipes/create" className="px-6 py-3 rounded-full text-white text-sm font-semibold" style={{ background: "#f97316" }}>
              Create Recipe
            </Link>
            <Link href="/recipes/import" className="px-6 py-3 rounded-full text-sm font-semibold border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors">
              🔗 Import from URL
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <div key={recipe.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-md transition-all">
              <Link href={`/recipe/user_${recipe.id}`} className="block" title="View recipe">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} style={{ objectPosition: recipe.image_position || "50% 50%" }} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-4xl">🍳</div>
                )}
              </Link>
              <div className="p-4">
                <Link href={`/recipe/user_${recipe.id}`}>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 hover:text-orange-500 transition-colors">{recipe.title}</h3>
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  {recipe.source_type === "imported" ? (
                    <span
                      title={
                        recipe.source_url ||
                        (recipe.source_name ? `Imported from ${recipe.source_name}` : "Imported recipe")
                      }
                      className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-600"
                    >
                      🔗 {recipe.source_name || "Imported"} · 🔒
                    </span>
                  ) : (
                    <button
                      onClick={() => togglePublic(recipe)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        recipe.is_public
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {recipe.is_public ? "🌍 Public" : "🔒 Private"}
                    </button>
                  )}
                  {recipe.cook_time && <span className="text-xs text-gray-400">⏱ {recipe.cook_time}min</span>}
                  <span className="text-xs text-gray-400">❤️ {recipe.likes}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/recipes/${recipe.id}/edit`)}
                    className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(recipe.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
