"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Collection {
  id: string;
  name: string;
  emoji: string;
  has_recipe?: boolean;
}

interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string | null;
}

const EMOJI_OPTIONS = ["📚", "🍝", "🍜", "🥗", "🍕", "🥩", "🐟", "🥘", "🍲", "🥐", "🍰", "🍖", "🌮", "🥣", "🫕"];

export function AddToCollectionModal({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📚");
  const [creating, setCreating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCollections = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: cols } = await supabase
      .from("collections")
      .select("id, name, emoji")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!cols) {
      setLoading(false);
      return;
    }

    const recipeIdStr = String(recipe.id);

    // Check which collections already contain this recipe
    const checked = await Promise.all(
      cols.map(async (col) => {
        const { data } = await supabase
          .from("collection_recipes")
          .select("id")
          .eq("collection_id", col.id)
          .eq("recipe_id", recipeIdStr)
          .maybeSingle();
        return { ...col, has_recipe: !!data };
      })
    );

    setCollections(checked);
    setLoading(false);
  };

  const handleToggle = async (col: Collection) => {
    setAdding(col.id);
    const recipeIdStr = String(recipe.id);

    if (col.has_recipe) {
      await supabase
        .from("collection_recipes")
        .delete()
        .eq("collection_id", col.id)
        .eq("recipe_id", recipeIdStr);
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, has_recipe: false } : c))
      );
    } else {
      await supabase.from("collection_recipes").upsert({
        collection_id: col.id,
        recipe_id: recipeIdStr,
        title: recipe.title,
        image: recipe.image,
        source: recipe.source,
        source_url: recipe.sourceUrl,
        time_label: recipe.time,
      });
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, has_recipe: true } : c))
      );
    }
    setAdding(null);
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }

    const { data: col, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: newName.trim(), emoji: newEmoji })
      .select()
      .single();

    if (!error && col) {
      await supabase.from("collection_recipes").insert({
        collection_id: col.id,
        recipe_id: String(recipe.id),
        title: recipe.title,
        image: recipe.image,
        source: recipe.source,
        source_url: recipe.sourceUrl,
        time_label: recipe.time,
      });
      setCollections((prev) => [{ ...col, has_recipe: true }, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewEmoji("📚");
    }
    setCreating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Add to Collection
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {recipe.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Collections list */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Loading…
            </div>
          ) : collections.length === 0 && !showCreate ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-gray-400 mb-1">No collections yet</p>
              <p className="text-xs text-gray-300">Create one below</p>
            </div>
          ) : (
            collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleToggle(col)}
                disabled={adding === col.id}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
              >
                <span className="text-2xl flex-shrink-0">{col.emoji}</span>
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {col.name}
                </span>
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    col.has_recipe
                      ? "border-orange-400 bg-orange-400"
                      : "border-gray-200"
                  }`}
                >
                  {col.has_recipe && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Inline create form */}
        {showCreate && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {EMOJI_OPTIONS.slice(0, 10).map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    newEmoji === e
                      ? "bg-orange-100 ring-2 ring-orange-300"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name…"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                autoFocus
              />
              <button
                onClick={handleCreateAndAdd}
                disabled={!newName.trim() || creating}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: "#f97316" }}
              >
                {creating ? "…" : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors"
            >
              + New Collection
            </button>
          ) : (
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewEmoji("📚");
              }}
              className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
