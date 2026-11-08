"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Link } from "@/lib/navigation";
import Navbar from "@/components/Navbar";
import { Button, EmptyState, Icon, Skeleton } from "@/components/ui";

export interface CollectionRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image: string | null;
  source: string | null;
  source_url: string | null;
  time_label: string | null;
  added_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  canEdit,
  onRemove,
}: {
  recipe: CollectionRecipe;
  canEdit: boolean;
  onRemove: (id: string) => void;
}) {
  const t = useTranslations("collections");
  const [imgError, setImgError] = useState(false);
  const hasTime = recipe.time_label && recipe.time_label !== "—";
  const meta = [recipe.source, hasTime ? recipe.time_label : null].filter(Boolean).join(" · ");

  return (
    <div className="relative">
      <Link href={`/recipe/${recipe.recipe_id}` as "/"} className="group block">
        <div className="aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
          {recipe.image && !imgError ? (
            <img
              src={recipe.image}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon name="utensils" size={32} className="text-line-strong" />
            </div>
          )}
        </div>
        <div className="mt-3">
          {meta && <p className="text-sm text-ink-3 tabular">{meta}</p>}
          <h3 className="mt-0.5 line-clamp-2 text-h3 group-hover:underline underline-offset-[3px]">{recipe.title}</h3>
        </div>
      </Link>

      {canEdit && (
        <Button
          variant="icon"
          size="sm"
          icon="trash"
          aria-label={t("removeFromCollection")}
          title={t("removeFromCollection")}
          onClick={() => onRemove(recipe.id)}
          className="absolute right-3 top-3"
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollectionDetailPage({
  initialCollection,
  initialRecipes,
}: {
  initialCollection?: Collection | null;
  initialRecipes?: CollectionRecipe[];
} = {}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("collections");
  const [user, setUser] = useState<User | null>(null);
  const [collection, setCollection] = useState<Collection | null>(initialCollection ?? null);
  const [recipes, setRecipes] = useState<CollectionRecipe[]>(initialRecipes ?? []);
  const [loading, setLoading] = useState(!initialCollection);
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user;
      setUser(currentUser);

      // Server already provided a (public) collection → just resolve ownership.
      if (initialCollection) {
        setIsOwner(currentUser?.id === initialCollection.user_id);
        setLoading(false);
        return;
      }

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
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12 space-y-6" aria-busy="true">
          <Skeleton className="h-24" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <Link href="/collections" className="mb-6 inline-flex items-center gap-1.5 text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
          <Icon name="arrowLeft" size={18} />
          {t("detailBack")}
        </Link>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-h1-sm sm:text-h1">{collection.name}</h1>
            {collection.description && <p className="mt-1 max-w-prose text-body-lg text-ink-2">{collection.description}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-3 tabular">
              {t("recipeCount", { count: recipes.length })}
              {collection.is_public && (
                <>
                  <span aria-hidden="true">·</span>
                  <Icon name="globe" size={16} />
                  {t("publicBadge")}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwner && (
              <Button variant="secondary" onClick={handleTogglePublic}>
                {collection.is_public ? t("makePrivate") : t("makePublic")}
              </Button>
            )}
            <Button icon={copied ? "check" : "share"} onClick={handleShare}>
              {copied ? t("copied") : t("share")}
            </Button>
          </div>
        </div>

        {recipes.length === 0 ? (
          <EmptyState
            icon="book"
            title={t("noRecipes")}
            text={t("noRecipesSub")}
            action={<Button href="/">{t("discoverCta")}</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} canEdit={isOwner} onRemove={handleRemoveRecipe} />
            ))}
          </div>
        )}

        {isOwner && (
          <div className="mt-12 border-t border-line pt-8">
            {!showDeleteConfirm ? (
              <Button variant="quiet" icon="trash" onClick={() => setShowDeleteConfirm(true)}>
                {t("deleteThis")}
              </Button>
            ) : (
              <div role="alert" className="flex flex-wrap items-center gap-4 rounded-2 bg-error-soft px-5 py-4">
                <p className="text-base text-error">{t("deleteNamed", { name: collection.name })}</p>
                <Button variant="secondary" size="sm" onClick={handleDeleteCollection}>{t("yesDelete")}</Button>
                <Button variant="quiet" onClick={() => setShowDeleteConfirm(false)}>{t("cancel")}</Button>
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
