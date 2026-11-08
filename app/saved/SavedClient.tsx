"use client";

import { useEffect, useState, Fragment } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Link } from "@/lib/navigation";
import Navbar from "@/components/Navbar";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import { Button, EmptyState, Icon, SectionHeader, Skeleton } from "@/components/ui";

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

function SavedCard({ recipe, onRemove }: { recipe: SavedRecipe; onRemove: (id: string) => void }) {
  const t = useTranslations("saved");
  const [imgError, setImgError] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const hasTime = recipe.time && recipe.time !== "—";
  const meta = [recipe.source, hasTime ? recipe.time : null].filter(Boolean).join(" · ");
  const addLabel = t.has("addToCollection") ? t("addToCollection") : "Zu Sammlung hinzufügen";
  const removeLabel = t.has("removeFromSaved") ? t("removeFromSaved") : "Aus Gespeichert entfernen";

  return (
    <Fragment>
      <div className="relative">
        <Link href={`/recipe/${recipe.recipe_id}` as "/"} className="group block">
          <div className="aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
            {recipe.image && !imgError ? (
              <img src={recipe.image} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} />
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
        <div className="absolute right-3 top-3 flex gap-2">
          <Button variant="icon" size="sm" icon="book" aria-label={addLabel} title={addLabel} onClick={() => setShowCollectionModal(true)} />
          <Button
            variant="icon"
            size="sm"
            icon="heart"
            iconFilled
            aria-label={removeLabel}
            title={removeLabel}
            onClick={() => onRemove(recipe.id)}
            className="text-green"
          />
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
  const t = useTranslations("saved");
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

  const countLabel = t.has("recipeCount") ? t("recipeCount", { count: recipes.length }) : `${recipes.length} Rezepte`;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <SectionHeader as="h1" title={t("title")} subtitle={loading ? t.has("loading") ? t("loading") : "Lädt…" : recipes.length > 0 ? countLabel : undefined} />

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <EmptyState
            icon="heart"
            title={t("empty")}
            text={t("emptySub")}
            action={<Button href="/">{t("discover")}</Button>}
          />
        )}

        {!loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <SavedCard key={recipe.id} recipe={recipe} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
