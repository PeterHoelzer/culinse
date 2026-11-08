"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/navigation";
import { Button, EmptyState, Input, SectionHeader, Skeleton } from "@/components/ui";

interface PublicCollection {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  collection_recipes: { count: number }[];
}

export default function ExploreClient() {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/collections/public")
      .then(r => r.json())
      .then(d => { setCollections(d.collections ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-10 py-10">
      {/* Header */}
      <div className="mb-6">
        <Button href="/collections" variant="quiet" icon="chevronLeft" className="mb-4 text-sm">
          My Collections
        </Button>
        <SectionHeader
          as="h1"
          title="Explore Collections"
          subtitle="Discover recipe collections shared by the community"
          className="mb-0"
        />
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md">
        <Input
          type="search"
          label="Search collections"
          hideLabel
          leadingIcon="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search collections..."
          autoComplete="off"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="book"
          title="No public collections yet"
          text="Be the first to make a collection public."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filtered.map(col => {
            const recipeCount = col.collection_recipes?.[0]?.count ?? 0;
            return (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group block border-t border-line pt-4"
              >
                <p className="text-sm text-ink-3 tabular mb-1">
                  {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
                </p>
                <h3 className="text-h3 text-ink group-hover:underline underline-offset-[3px] line-clamp-1">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-base text-ink-2 mt-1 line-clamp-2">{col.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
