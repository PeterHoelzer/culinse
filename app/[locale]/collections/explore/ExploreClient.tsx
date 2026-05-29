"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/navigation";

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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/collections" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← My Collections
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Explore Collections</h1>
        <p className="text-gray-500">Discover recipe collections shared by the community</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search collections..."
          className="w-full max-w-md px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-lg font-medium">No public collections yet</p>
          <p className="text-sm mt-1">Be the first to make a collection public!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(col => {
            const recipeCount = col.collection_recipes?.[0]?.count ?? 0;
            return (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group block bg-white border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
                    📚
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    {recipeCount} recipe{recipeCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{col.description}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
