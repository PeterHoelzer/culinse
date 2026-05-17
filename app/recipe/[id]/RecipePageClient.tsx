"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import { AffiliateBox } from "@/components/AffiliateBox";
import { getIngredientAffiliateUrl } from "@/lib/affiliateProducts";

interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

interface Step {
  number: number;
  step: string;
}

interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  videoUrl?: string | null;
  source: string;
  sourceUrl: string;
  time: string | null;
  servings: number | null;
  summary: string | null;
  ingredients: Ingredient[];
  instructions: Step[];
  diets: string[];
  dishTypes: string[];
}

export default function RecipePageClient() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: recipe?.title || "Recipe", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    fetch(`/api/recipe/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.recipe) setRecipe(data.recipe);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", id)
      .single()
      .then(({ data }) => setSaved(!!data));
  }, [user, id]);

  const handleSave = async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (!recipe) return;

    if (saved) {
      await supabase.from("saved_recipes").delete().eq("recipe_id", recipe.id).eq("user_id", user.id);
      setSaved(false);
    } else {
      await supabase.from("saved_recipes").insert({
        user_id: user.id,
        recipe_id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        source: recipe.source,
        source_url: recipe.sourceUrl,
        time: recipe.time,
      });
      setSaved(true);
    }
  };

  // Schema.org structured data for Google Rich Results
  const schemaData = recipe ? {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    image: recipe.image ? [recipe.image] : [],
    author: { "@type": "Organization", name: recipe.source },
    description: recipe.summary?.replace(/<[^>]+>/g, "").slice(0, 200) || "",
    prepTime: recipe.time ? `PT${recipe.time.replace(" min", "")}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    recipeIngredient: recipe.ingredients.map((i) => i.original),
    recipeInstructions: recipe.instructions.map((s) => ({
      "@type": "HowToStep",
      text: s.step,
    })),
    url: `https://culinse.com/recipe/${recipe.id}`,
  } : null;

  // Strip HTML from summary
  const cleanSummary = recipe?.summary
    ? recipe.summary.replace(/<[^>]+>/g, "").split(".").slice(0, 3).join(".") + "."
    : null;

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema.org structured data */}
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      <Navbar />

      {/* Loading */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
          <div className="h-5 bg-gray-100 rounded w-32 animate-pulse" />
          <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-8 bg-gray-100 rounded-xl w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-xl w-full animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-xl w-5/6 animate-pulse" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-24 text-center text-gray-400">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-lg font-medium">Recipe not found</p>
          <Link href="/" className="text-orange-500 text-sm mt-2 hover:underline block">← Back to home</Link>
        </div>
      )}

      {/* Add to Collection Modal */}
      {showCollectionModal && recipe && (
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

      {/* Recipe */}
      {recipe && !loading && (
        <main className="max-w-4xl mx-auto px-4 pb-16 pt-6">

          {/* Breadcrumb */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors mb-5">
            ← Discover
          </Link>

          {/* Hero Image / Video */}
          <div className="relative mb-6 rounded-2xl overflow-hidden shadow-sm">
            {recipe.videoUrl ? (
              <video
                src={recipe.videoUrl}
                controls
                playsInline
                poster={recipe.image || undefined}
                className="w-full h-64 sm:h-96 object-cover bg-black"
              />
            ) : recipe.image && !imgError ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-64 sm:h-96 object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-64 sm:h-80 flex items-center justify-center text-8xl"
                style={{ background: "linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)" }}>
                🍳
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
              📖 {recipe.source}
            </div>
          </div>

          {/* Title + meta + actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
            {recipe.diets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.diets.slice(0, 4).map((d) => (
                  <span key={d} className="text-xs font-medium px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full capitalize">
                    {d}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
              {recipe.title}
            </h1>

            {cleanSummary && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4 border-b border-gray-50 pb-4">
                {cleanSummary}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mb-5">
              {recipe.time && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <span>⏱</span>
                  <div>
                    <p className="text-xs text-gray-400">Cook time</p>
                    <p className="text-sm font-semibold text-gray-800">{recipe.time}</p>
                  </div>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <span>🍽</span>
                  <div>
                    <p className="text-xs text-gray-400">Servings</p>
                    <p className="text-sm font-semibold text-gray-800">{recipe.servings}</p>
                  </div>
                </div>
              )}
              {recipe.ingredients.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <span>🧂</span>
                  <div>
                    <p className="text-xs text-gray-400">Ingredients</p>
                    <p className="text-sm font-semibold text-gray-800">{recipe.ingredients.length}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <button
                onClick={handleSave}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  saved
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                }`}
              >
                {saved ? "♥ Saved" : "♡ Save Recipe"}
              </button>
              {user && (
                <button
                  onClick={() => setShowCollectionModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-orange-300 transition-all"
                >
                  📚 Collections
                </button>
              )}
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#f97316" }}
              >
                ↗ View Original
              </a>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-orange-300 transition-all"
              >
                {copied ? "✓ Copied!" : "↑ Share"}
              </button>
            </div>
          </div>

          {/* Ingredients + Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:sticky md:top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Ingredients</h2>
                  {checkedIngredients.size > 0 && (
                    <button
                      onClick={() => setCheckedIngredients(new Set())}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {recipe.servings && (
                  <p className="text-xs text-gray-400 mb-3">For {recipe.servings} servings</p>
                )}
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <button
                        onClick={() => toggleIngredient(i)}
                        className={`flex-1 flex items-start gap-3 py-2.5 px-1 rounded-xl text-left transition-colors hover:bg-gray-50 group ${
                          checkedIngredients.has(i) ? "opacity-50" : ""
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          checkedIngredients.has(i)
                            ? "border-orange-400 bg-orange-400"
                            : "border-gray-200 group-hover:border-orange-300"
                        }`}>
                          {checkedIngredients.has(i) && (
                            <span className="text-white text-xs font-bold">✓</span>
                          )}
                        </span>
                        <span className={`text-sm text-gray-700 leading-snug ${
                          checkedIngredients.has(i) ? "line-through text-gray-400" : ""
                        }`}>
                          {ing.original}
                        </span>
                      </button>
                      {(() => {
                        const url = getIngredientAffiliateUrl(ing.name);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            title={`Buy ${ing.name} on Amazon`}
                            className="flex-shrink-0 w-7 h-7 mt-1.5 rounded-lg flex items-center justify-center text-gray-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
                          >
                            🛒
                          </a>
                        ) : null;
                      })()}
                    </li>
                  ))}
                </ul>

              {/* Affiliate Box — kitchen tools only */}
              <AffiliateBox
                dishTypes={recipe.dishTypes}
                ingredientNames={recipe.ingredients.map(i => i.name)}
                recipeTitle={recipe.title}
                toolsOnly
              />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-5">Instructions</h2>
                {recipe.instructions.length > 0 ? (
                  <ol className="space-y-5">
                    {recipe.instructions.map((step) => (
                      <li key={step.number} className="flex gap-4">
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white mt-0.5"
                          style={{ background: "#f97316" }}
                        >
                          {step.number}
                        </span>
                        <p className="text-gray-700 text-sm leading-relaxed pt-0.5">{step.step}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <p className="text-gray-500 text-sm mb-3">Full instructions are on the original site.</p>
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                      style={{ background: "#f97316" }}
                    >
                      ↗ View Full Recipe
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
