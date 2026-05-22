"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface CollectionRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image: string | null;
  source: string | null;
  source_url: string | null;
  time_label: string | null;
  added_at: string;
}

interface Collection {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

const GRADIENTS = [
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
];

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  index,
  canEdit,
  onRemove,
}: {
  recipe: CollectionRecipe;
  index: number;
  canEdit: boolean;
  onRemove: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200">
      <Link href={`/recipe/${recipe.recipe_id}`} className="relative h-44 block">
        {recipe.image && !imgError ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: gradient }}
          >
            🍽
          </div>
        )}

        {/* Remove button (owner only) */}
        {canEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove(recipe.id);
            }}
            title="Remove from collection"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-gray-400 flex items-center justify-center text-sm hover:bg-red-50 hover:text-red-400 transition-colors shadow-sm font-bold"
          >
            ×
          </button>
        )}

        {recipe.source && (
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
            {recipe.source}
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
          {recipe.time_label && recipe.time_label !== "—" && (
            <span>⏱ {recipe.time_label}</span>
          )}
          <Link
            href={`/recipe/${recipe.recipe_id}`}
            className="ml-auto text-orange-500 font-medium hover:text-orange-700 transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [recipes, setRecipes] = useState<CollectionRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user;
      setUser(currentUser);

      // Fetch collection
      const { data: col, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !col) {
        router.push("/collections");
        return;
      }

      // Access check: must be owner or collection must be public
      if (!col.is_public && col.user_id !== currentUser?.id) {
        router.push("/collections");
        return;
      }

      setCollection(col);
      setIsOwner(currentUser?.id === col.user_id);

      const { data: recs } = await supabase
        .from("collection_recipes")
        .select("*")
        .eq("collection_id", id)
        .order("added_at", { ascending: false });

      setRecipes(recs ?? []);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRemoveRecipe = async (rowId: string) => {
    await supabase.from("collection_recipes").delete().eq("id", rowId);
    setRecipes((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: collection?.name ?? "Collection", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublic = async () => {
    if (!collection) return;
    const newVal = !collection.is_public;
    await supabase
      .from("collections")
      .update({ is_public: newVal })
      .eq("id", id);
    setCollection({ ...collection, is_public: newVal });
  };

  const handleDeleteCollection = async () => {
    await supabase.from("collections").delete().eq("id", id);
    router.push("/collections");
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-5">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        }}
        className="py-10 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-orange-200 text-sm hover:text-white transition-colors mb-4"
          >
            ← My Collections
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-4xl">{collection.emoji}</span>
                <h1 className="text-3xl font-bold text-white">
                  {collection.name}
                </h1>
                {collection.is_public && (
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                    🌍 Public
                  </span>
                )}
              </div>
              {collection.description && (
                <p className="text-orange-100 text-sm mt-1 ml-14">
                  {collection.description}
                </p>
              )}
              <p className="text-orange-200 text-sm mt-2 ml-14">
                {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {isOwner && (
                <button
                  onClick={handleTogglePublic}
                  className="px-4 py-2 rounded-full bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors"
                >
                  {collection.is_public ? "🔒 Make Private" : "🌍 Make Public"}
                </button>
              )}
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-full bg-white text-orange-500 text-xs font-semibold hover:bg-orange-50 transition-colors shadow-sm"
              >
                {copied ? "✓ Copied!" : "↑ Share"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {recipes.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">{collection.emoji}</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              No recipes yet
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Add recipes to this collection from any recipe page.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "#f97316" }}
            >
              Discover Recipes →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r, i) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                index={i}
                canEdit={isOwner}
                onRemove={handleRemoveRecipe}
              />
            ))}
          </div>
        )}

        {/* Delete collection (owner only) */}
        {isOwner && (
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                Delete this collection
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                <p className="text-sm text-red-700">
                  Delete &quot;{collection.name}&quot;?
                </p>
                <button
                  onClick={handleDeleteCollection}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Suppress unused warning */}
      {user && null}
    </div>
  );
}
