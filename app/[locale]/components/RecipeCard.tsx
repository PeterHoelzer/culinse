"use client";

import { useState, Fragment } from "react";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import UpgradeModal from "@/components/UpgradeModal";
import { Link } from "@/lib/navigation";
import { Button, Icon } from "@/components/ui";
import type { Recipe } from "./home-types";

/*
  Rezeptkarte (DESIGN.md §5): Foto 4:3, darunter Metazeile, Serifen-Titel,
  Zeit · Portionen. Kein Rahmen, kein Schatten, keine Hover-Anhebung.
  Die ganze Karte ist der Link; Herz und Sammlung sind eigene Buttons
  neben dem Link (nicht darin), damit kein Interaktives verschachtelt ist.
*/
export default function RecipeCard({ recipe, index, user }: { recipe: Recipe; index: number; user: User | null | undefined }) {
  const t = useTranslations();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setShowLoginPrompt(true); return; }
    if (saved) {
      await fetch("/api/saved-recipes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipe.id }),
      });
      setSaved(false);
    } else {
      const res = await fetch("/api/saved-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          source: recipe.source,
          source_url: recipe.sourceUrl,
          time: recipe.time,
        }),
      });
      if (res.status === 403) {
        const data = await res.json();
        if (data.error === "limit_reached") {
          // Statt alert(): der vorhandene Upgrade-Dialog erklärt das Limit.
          setShowUpgrade(true);
          return;
        }
      }
      if (res.ok) setSaved(true);
    }
  };

  const handleCollectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { setShowLoginPrompt(true); return; }
    setShowCollectionModal(true);
  };

  const hasImage = Boolean(recipe.image) && !imgError;
  const dietLabel =
    recipe.diet === "vegan" ? t("dietFilters.vegan") : recipe.diet === "vegetarian" ? t("dietFilters.vegetarian") : null;
  const metaTop = [recipe.category, recipe.source].filter(Boolean) as string[];
  // API liefert "45 min"; wir zeigen "45 Min." (DESIGN.md §2)
  const minutes = recipe.time && recipe.time !== "—" ? recipe.time.match(/(\d+)/) : null;
  const timeLabel = minutes ? t("recipeCard.minutes", { count: Number(minutes[1]) }) : recipe.time !== "—" ? recipe.time : null;
  const metaBottom = [
    timeLabel,
    recipe.servings ? t("recipeCard.servings", { count: recipe.servings }) : null,
  ].filter(Boolean) as string[];

  return (
    <Fragment>
      <article className="group relative flex flex-col">
        <Link
          href={`/recipe/${recipe.id}`}
          id={`recipe-${recipe.id}`}
          onClick={() => {
            // Remember where this card was so we can scroll back to it after the
            // user presses "back" from the recipe page.
            try {
              sessionStorage.setItem(
                "culinse:returnTo",
                JSON.stringify({ id: recipe.id, y: window.scrollY, t: Date.now() })
              );
            } catch {}
          }}
          className="flex flex-col gap-3 rounded-2 no-underline"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2 bg-surface-soft">
            {hasImage ? (
              <img
                src={recipe.image as string}
                alt={recipe.title}
                width={640}
                height={480}
                style={recipe.imagePosition ? { objectPosition: recipe.imagePosition } : undefined}
                className="h-full w-full object-cover"
                loading={index < 3 ? "eager" : "lazy"}
                fetchPriority={index < 3 ? "high" : undefined}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon name="utensils" size={32} className="text-line-strong" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span aria-hidden="true" className="mb-1 block h-1 w-14 bg-brand" style={{ backgroundColor: recipe.accent ?? undefined }} />
            <p className="tabular flex flex-wrap items-center gap-x-2 text-sm text-ink-3">
              {metaTop.length > 0 && <span>{metaTop.join(" · ")}</span>}
              {dietLabel && (
                <>
                  {metaTop.length > 0 && <span aria-hidden="true">·</span>}
                  <span className="font-semibold text-green">{dietLabel}</span>
                </>
              )}
            </p>
            <h3 className="text-h3 line-clamp-2 text-ink underline-offset-[3px] group-hover:underline">{recipe.title}</h3>
            {metaBottom.length > 0 && <p className="tabular text-sm text-ink-3">{metaBottom.join(" · ")}</p>}
          </div>
        </Link>

        {/* Aktionen: eigene Buttons über dem Bild, oben rechts */}
        <div className="absolute right-3 top-3 flex gap-2">
          <Button
            variant="icon"
            size="sm"
            icon="bookmark"
            onClick={handleCollectionClick}
            aria-label={t("recipeCard.addToCollection")}
            title={t("recipeCard.addToCollection")}
          />
          <Button
            variant="icon"
            size="sm"
            icon="heart"
            iconFilled={saved}
            onClick={handleSave}
            aria-pressed={saved}
            aria-label={user ? t("recipeCard.save") : t("recipeCard.loginToSave")}
            title={user ? (saved ? t("recipeCard.removeSave") : t("recipeCard.save")) : t("recipeCard.loginToSave")}
            className="aria-pressed:text-green"
          />
        </div>
      </article>

      {showCollectionModal && (
        <AddToCollectionModal
          recipe={{
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            source: recipe.source,
            sourceUrl: recipe.sourceUrl,
            time: recipe.time,
          }}
          onClose={() => setShowCollectionModal(false)}
        />
      )}

      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          redirectTo="/login"
        />
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </Fragment>
  );
}
