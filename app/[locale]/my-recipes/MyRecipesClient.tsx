"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/navigation";
import { Button, EmptyState, Icon, Notice, SectionHeader, Skeleton } from "@/components/ui";

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
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [publishIssues, setPublishIssues] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/user-recipes")
      .then(r => r.json())
      .then(d => { setRecipes(d.recipes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    await fetch(`/api/user-recipes/${id}`, { method: "DELETE" });
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const togglePublic = async (recipe: UserRecipe) => {
    setPublishIssues(null);
    const res = await fetch(`/api/user-recipes/${recipe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recipe, is_public: !recipe.is_public }),
    });
    const data = await res.json();
    if (res.status === 422) {
      setPublishIssues(data.issues ?? []);
      return;
    }
    if (res.ok) setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_public: !r.is_public } : r));
  };

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          as="h1"
          className="mb-0!"
          title="My Recipes"
          subtitle={`${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} created`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/recipes/import" variant="secondary" icon="link">Import</Button>
          <Button href="/recipes/create" icon="plus">New Recipe</Button>
        </div>
      </div>

      {publishIssues && (
        <Notice tone="error" className="mb-6">
          <p className="font-semibold">Cannot publish:</p>
          <ul className="list-disc pl-5">
            {publishIssues.map((issue, i) => <li key={i}>{issue}</li>)}
          </ul>
        </Notice>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-[4/3]" />)}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="utensils"
          title="No recipes yet"
          text="Create your first recipe, or import one from any recipe site."
          action={
            <div className="flex flex-wrap gap-3">
              <Button href="/recipes/create" icon="plus">Create Recipe</Button>
              <Button href="/recipes/import" variant="secondary" icon="link">Import from URL</Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map(recipe => {
            const sourceLabel = recipe.source_name || "Imported";
            const meta = [
              recipe.cook_time ? `${recipe.cook_time} min` : null,
              `${recipe.likes} likes`,
            ].filter(Boolean).join(" · ");
            return (
              <div key={recipe.id}>
                <Link href={`/recipe/user_${recipe.id}` as "/"} className="block" title="View recipe">
                  <div className="aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt="" style={{ objectPosition: recipe.image_position || "50% 50%" }} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon name="utensils" size={32} className="text-line-strong" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="mt-3">
                  <p className="text-sm text-ink-3 tabular">{meta}</p>
                  <Link href={`/recipe/user_${recipe.id}` as "/"}>
                    <h3 className="mt-0.5 line-clamp-2 text-h3 hover:underline underline-offset-[3px]">{recipe.title}</h3>
                  </Link>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {recipe.source_type === "imported" ? (
                      <span
                        title={recipe.source_url || (recipe.source_name ? `Imported from ${recipe.source_name}` : "Imported recipe")}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-2"
                      >
                        <Icon name="lock" size={16} />
                        {sourceLabel}, private
                      </span>
                    ) : (
                      <button
                        onClick={() => togglePublic(recipe)}
                        aria-pressed={recipe.is_public}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-1 px-2.5 text-sm font-semibold transition-colors ${
                          recipe.is_public ? "bg-green-soft text-green-deep hover:bg-line" : "bg-surface-soft text-ink-2 hover:bg-line"
                        }`}
                      >
                        <Icon name={recipe.is_public ? "globe" : "lock"} size={16} />
                        {recipe.is_public ? "Public" : "Private"}
                      </button>
                    )}
                    <span className="flex-1" />
                    <Button variant="icon" size="sm" icon="pencil" href={`/recipes/${recipe.id}/edit`} aria-label={`Edit ${recipe.title}`} title="Edit" />
                    <Button variant="icon" size="sm" icon="trash" aria-label={`Delete ${recipe.title}`} title="Delete" onClick={() => setConfirmDeleteId(recipe.id)} />
                  </div>

                  {confirmDeleteId === recipe.id && (
                    <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-2 bg-error-soft px-4 py-3">
                      <p className="text-sm text-error">Delete this recipe?</p>
                      <Button size="sm" variant="secondary" onClick={() => handleDelete(recipe.id)}>Delete</Button>
                      <Button variant="quiet" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
