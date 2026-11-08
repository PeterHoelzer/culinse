"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button, Icon, Input } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

const FREE_RECIPE_LIMIT = 10;

interface Collection {
  id: string;
  name: string;
  emoji: string;
  has_recipe?: boolean;
  recipe_count?: number;
}

interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  source: string;
  sourceUrl: string;
  time: string | null;
}

// Neue Sammlungen bekommen das Standard-Symbol (Spalte `emoji` bleibt befüllt, wird im UI nicht angezeigt).
const DEFAULT_COLLECTION_SYMBOL = "\u{1F4DA}";

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
  const [isPro, setIsPro] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const t = useTranslations("modals");
  const locale = useLocale();
  const supabase = createClient();

  async function loadCollections() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check Pro status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();
    setIsPro(profile?.is_pro ?? false);

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

    // Check which collections already contain this recipe + get recipe count
    const checked = await Promise.all(
      cols.map(async (col) => {
        const [{ data: existing }, { count }] = await Promise.all([
          supabase
            .from("collection_recipes")
            .select("id")
            .eq("collection_id", col.id)
            .eq("recipe_id", recipeIdStr)
            .maybeSingle(),
          supabase
            .from("collection_recipes")
            .select("id", { count: "exact", head: true })
            .eq("collection_id", col.id),
        ]);
        return { ...col, has_recipe: !!existing, recipe_count: count ?? 0 };
      })
    );

    setCollections(checked);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (col: Collection) => {
    // Enforce free limit: max 10 recipes per collection
    if (!col.has_recipe && !isPro && (col.recipe_count ?? 0) >= FREE_RECIPE_LIMIT) {
      window.location.assign("/pro");
      return;
    }

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
      .insert({ user_id: user.id, name: newName.trim(), emoji: DEFAULT_COLLECTION_SYMBOL })
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
    }
    setCreating(false);
  };

  const nameLabel = t.has("collectionName") ? t("collectionName") : locale === "de" ? "Name der Sammlung" : "Collection name";

  return (
    <Dialog open onClose={onClose} title={t("addToCollection")}>
      <p className="-mt-2 mb-4 line-clamp-1 text-sm text-ink-3">{recipe.title}</p>

      <div className="-mx-2 max-h-64 overflow-y-auto">
        {loading ? (
          <p className="px-2 py-8 text-center text-base text-ink-3" role="status">
            {t("loading")}
          </p>
        ) : collections.length === 0 && !showCreate ? (
          <div className="px-2 py-6 text-center">
            <p className="text-base text-ink-2">{t("noCollections")}</p>
            <p className="text-caption text-ink-3">{t("createOneBelow")}</p>
          </div>
        ) : (
          <ul>
            {collections.map((col) => {
              const atLimit = !isPro && !col.has_recipe && (col.recipe_count ?? 0) >= FREE_RECIPE_LIMIT;
              return (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={() => handleToggle(col)}
                    disabled={adding === col.id}
                    aria-pressed={atLimit ? undefined : !!col.has_recipe}
                    className="flex min-h-11 w-full items-center gap-3 rounded-1 px-2 py-2 text-left transition-colors hover:bg-surface-soft disabled:text-ink-3"
                  >
                    <Icon name="book" size={20} className="shrink-0 text-ink-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-ink">{col.name}</span>
                      {atLimit && <span className="block text-caption text-brand">{t("fullUpgrade")}</span>}
                    </span>
                    {atLimit ? (
                      <Icon name="lock" size={20} className="shrink-0 text-brand" />
                    ) : col.has_recipe ? (
                      <Icon name="check" size={20} className="shrink-0 text-green" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showCreate && (
        <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <Input
            label={nameLabel}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("collectionNamePlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
            autoFocus
            className="min-w-0 flex-1"
          />
          <Button onClick={handleCreateAndAdd} disabled={!newName.trim()} loading={creating}>
            {t("create")}
          </Button>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-4">
        {!showCreate ? (
          <Button variant="secondary" icon="plus" fullWidth onClick={() => setShowCreate(true)}>
            {t("newCollection").replace(/^\+\s*/, "")}
          </Button>
        ) : (
          <Button
            variant="quiet"
            onClick={() => {
              setShowCreate(false);
              setNewName("");
            }}
          >
            {t("cancel")}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
