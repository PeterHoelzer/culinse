"use client";

import { useState, Fragment } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import UpgradeModal from "@/components/UpgradeModal";
import { Link } from "@/lib/navigation";
import { Recipe, GRADIENTS, EMOJIS } from "./home-types";

export default function RecipeCard({ recipe, index, user }: { recipe: Recipe; index: number; user: User | null | undefined }) {
  const t = useTranslations();
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const emoji = EMOJIS[index % EMOJIS.length];
  const supabase = createClient();
  const isCommunity = typeof recipe.id === "string" && recipe.id.startsWith("user_");

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
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
          alert(`Free plan limit reached (${data.limit} saved recipes). Upgrade to Pro for unlimited saves!`);
          return;
        }
      }
      if (res.ok) setSaved(true);
    }
  };

  const handleCollectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setShowLoginPrompt(true); return; }
    setShowCollectionModal(true);
  };

  return (
    <Fragment>
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
        className="recipe-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
      >
        <div className="relative h-44">
          {recipe.image && !imgError ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              style={recipe.imagePosition ? { objectPosition: recipe.imagePosition } : undefined}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
              <span className="text-6xl drop-shadow-lg">{emoji}</span>
            </div>
          )}

          {/* Action buttons — top right */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={handleCollectionClick}
              title={t("recipeCard.addToCollection")}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-orange-500 flex items-center justify-center text-sm transition-all shadow-sm"
            >
              📚
            </button>
            <button
              onClick={handleSave}
              title={user ? (saved ? t("recipeCard.removeSave") : t("recipeCard.save")) : t("recipeCard.loginToSave")}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-sm ${
                saved ? "bg-white text-orange-500" : "bg-white/80 text-gray-400 hover:text-orange-400 hover:bg-white"
              }`}
            >
              {saved ? "♥" : "♡"}
            </button>
          </div>

          {isCommunity && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
              👩‍🍳 Community
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-lg">
            {recipe.source}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{recipe.title}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
            {recipe.time !== "—" && <span>⏱ {recipe.time}</span>}
            {recipe.servings && <span>🍽 {t("recipeCard.servings", { count: recipe.servings })}</span>}
            {recipe.rating && <span>⭐ {recipe.rating}</span>}
            <span className="ml-auto text-orange-500 font-medium">{t("recipeCard.details")}</span>
          </div>
        </div>
      </Link>

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
    </Fragment>
  );
}

// ─── Discover Section ─────────────────────────────────────────────────────────
