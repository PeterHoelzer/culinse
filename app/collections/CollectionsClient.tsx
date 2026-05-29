"use client";
import ProBadge from "@/components/ProBadge";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Collection {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  recipe_count?: number;
  preview_images?: string[];
}

const EMOJI_OPTIONS = [
  "📚", "🍝", "🍜", "🥗", "🍕", "🥩", "🐟", "🥘",
  "🍲", "🥐", "🍰", "🍖", "🌮", "🥣", "🫕", "🥦",
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
];

// ─── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const t = useTranslations("collections");
  const images = collection.preview_images ?? [];
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const renderMosaic = () => {
    if (images.length === 0) {
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: gradient }}
        >
          <span className="text-6xl drop-shadow-lg">{collection.emoji}</span>
        </div>
      );
    }
    if (images.length === 1) {
      return (
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover"
        />
      );
    }
    if (images.length === 2) {
      return (
        <div className="flex h-full gap-0.5">
          {images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-1/2 h-full object-cover" />
          ))}
        </div>
      );
    }
    if (images.length === 3) {
      return (
        <div className="flex h-full gap-0.5">
          <img src={images[0]} alt="" className="w-1/2 h-full object-cover" />
          <div className="w-1/2 flex flex-col gap-0.5">
            <img src={images[1]} alt="" className="flex-1 w-full object-cover" />
            <img src={images[2]} alt="" className="flex-1 w-full object-cover" />
          </div>
        </div>
      );
    }
    // 4+
    return (
      <div className="grid grid-cols-2 h-full gap-0.5">
        {images.slice(0, 4).map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  };

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 block"
    >
      <div className="relative h-48 overflow-hidden">{renderMosaic()}</div>

      {/* Gradient overlay + info */}
      <div
        className="relative -mt-14 pt-14 pb-4 px-4"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow">{collection.emoji}</span>
            <div>
              <h3 className="text-white font-bold text-base leading-tight drop-shadow">
                {collection.name}
              </h3>
              <p className="text-white/70 text-xs">
                {t("recipeCount", { count: collection.recipe_count ?? 0 })}
              </p>
            </div>
          </div>
          {collection.is_public && (
            <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
              🌍
            </span>
          )}
        </div>
        {collection.description && (
          <p className="text-white/60 text-xs mt-1.5 line-clamp-1">
            {collection.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Pro Upgrade Modal ────────────────────────────────────────────────────────

function ProUpgradeModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("collections");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">📚</div>
        <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
          ✦ Culinse Pro
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("upgradeTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {t("upgradeSubtext")}
        </p>
        <div className="space-y-3">
          <a
            href="/pro"
            className="block w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#f97316" }}
          >
            {t("upgradeButton")}
          </a>
          <button
            onClick={onClose}
            className="block w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Collection Modal ─────────────────────────────────────────────────────

function NewCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Collection) => void;
}) {
  const t = useTranslations("collections");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: name.trim(),
        emoji,
        description: description.trim() || null,
        is_public: isPublic,
      })
      .select()
      .single();

    if (!error && data) {
      onCreated(data);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-5">
          {t("newCollectionTitle")}
        </h2>

        {/* Emoji picker */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            {t("iconLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  emoji === e
                    ? "bg-orange-100 ring-2 ring-orange-400"
                    : "hover:bg-gray-100"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">
            {t("nameLabel")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">
            {t("descLabel")}{" "}
            <span className="normal-case font-normal text-gray-300">
              {t("descOptional")}
            </span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descPlaceholder")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {/* Public toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">{t("publicLabel")}</p>
            <p className="text-xs text-gray-400">
              {t("publicSub")}
            </p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isPublic ? "bg-orange-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPublic ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "#f97316" }}
          >
            {loading ? t("creating") : t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FREE_COLLECTION_LIMIT = 1;

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const [user, setUser] = useState<User | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);

      // Check Pro status
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", data.user.id)
        .single();
      setIsPro(profile?.is_pro ?? false);

      const { data: cols } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (!cols) {
        setLoading(false);
        return;
      }

      // Enrich each collection with recipe count + preview images
      const enriched = await Promise.all(
        cols.map(async (col) => {
          const [{ data: imgs }, { count }] = await Promise.all([
            supabase
              .from("collection_recipes")
              .select("image")
              .eq("collection_id", col.id)
              .not("image", "is", null)
              .limit(4),
            supabase
              .from("collection_recipes")
              .select("id", { count: "exact", head: true })
              .eq("collection_id", col.id),
          ]);

          return {
            ...col,
            recipe_count: count ?? 0,
            preview_images: (imgs ?? [])
              .map((r: { image: string | null }) => r.image)
              .filter(Boolean) as string[],
          };
        })
      );

      setCollections(enriched);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (newCol: Collection) => {
    setCollections((prev) => [
      { ...newCol, recipe_count: 0, preview_images: [] },
      ...prev,
    ]);
  };

  const handleNewCollectionClick = () => {
    if (!isPro && collections.length >= FREE_COLLECTION_LIMIT) {
      setShowUpgradeModal(true);
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        }}
        className="py-10 px-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              📚 {t("title")}
            </h1>
            <p className="text-orange-100 text-sm">
              {loading
                ? t("loading")
                : t("counter", { count: collections.length })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/collections/explore"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors"
            >
              🌍 Explore
            </a>
            <button
              onClick={handleNewCollectionClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-orange-500 text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm"
            >
              {t("newButton")}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-56 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && collections.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {t("empty")}
            </p>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
              {t("groupDesc")}
            </p>
            <button
              onClick={handleNewCollectionClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "#f97316" }}
            >
              {t("createFirst")}
            </button>
          </div>
        )}

        {/* Collections grid */}
        {!loading && collections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((col, i) => (
              <CollectionCard key={col.id} collection={col} index={i} />
            ))}

            {/* "Add new" card */}
            <button
              onClick={handleNewCollectionClick}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 h-48 flex flex-col items-center justify-center gap-3 hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
            >
              {!isPro && collections.length >= FREE_COLLECTION_LIMIT ? (
                <>
                  <ProBadge feature="Unlimited collections" className="mb-1" />
                  <span className="text-sm font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                    {t("upgradePro")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl text-gray-300 group-hover:text-orange-400 transition-colors">+</span>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                    {t("newCollection")}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <NewCollectionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {showUpgradeModal && (
        <ProUpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      {user && null}
    </div>
  );
}
