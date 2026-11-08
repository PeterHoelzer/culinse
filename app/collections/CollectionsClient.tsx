"use client";
import ProBadge from "@/components/ProBadge";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Link } from "@/lib/navigation";
import Navbar from "@/components/Navbar";
import { Button, EmptyState, Icon, Input, Checkbox, SectionHeader, Skeleton } from "@/components/ui";
import { FREE_FOR_ALL } from "@/lib/freeMode";

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

const stripPlus = (label: string) => label.replace(/^\+\s*/, "");

// ─── Collection Card ──────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: Collection }) {
  const t = useTranslations("collections");
  const images = collection.preview_images ?? [];

  const renderMosaic = () => {
    if (images.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-surface-soft">
          <Icon name="book" size={32} className="text-line-strong" />
        </div>
      );
    }
    if (images.length === 1) {
      return <img src={images[0]} alt="" className="h-full w-full object-cover" />;
    }
    if (images.length === 2) {
      return (
        <div className="flex h-full gap-0.5">
          {images.map((img, i) => (
            <img key={i} src={img} alt="" className="h-full w-1/2 object-cover" />
          ))}
        </div>
      );
    }
    if (images.length === 3) {
      return (
        <div className="flex h-full gap-0.5">
          <img src={images[0]} alt="" className="h-full w-1/2 object-cover" />
          <div className="flex w-1/2 flex-col gap-0.5">
            <img src={images[1]} alt="" className="w-full flex-1 object-cover" />
            <img src={images[2]} alt="" className="w-full flex-1 object-cover" />
          </div>
        </div>
      );
    }
    return (
      <div className="grid h-full grid-cols-2 gap-0.5">
        {images.slice(0, 4).map((img, i) => (
          <img key={i} src={img} alt="" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  };

  return (
    <Link href={`/collections/${collection.id}` as "/"} className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">{renderMosaic()}</div>
      <div className="mt-3">
        <h3 className="text-h3 group-hover:underline underline-offset-[3px]">{collection.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3 tabular">
          {t("recipeCount", { count: collection.recipe_count ?? 0 })}
          {collection.is_public && <Icon name="globe" size={16} label={t("publicLabel")} />}
        </p>
        {collection.description && <p className="mt-1 line-clamp-1 text-sm text-ink-2">{collection.description}</p>}
      </div>
    </Link>
  );
}

// ─── Dialog-Hülle (Escape schließt, Klick auf den Hintergrund auch) ──────────

function Dialog({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2 border border-line bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Pro Upgrade Modal ────────────────────────────────────────────────────────

function ProUpgradeModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("collections");

  return (
    <Dialog titleId="upgrade-title" onClose={onClose}>
      <ProBadge className="mb-3" />
      <h2 id="upgrade-title" className="text-h2-sm">{t("upgradeTitle")}</h2>
      <p className="mt-2 mb-6 text-base text-ink-2">{t("upgradeSubtext")}</p>
      <div className="flex flex-wrap gap-3">
        <Button href="/pro">{t("upgradeButton")}</Button>
        <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
      </div>
    </Dialog>
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
        emoji: "",
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
    <Dialog titleId="new-collection-title" onClose={onClose}>
      <h2 id="new-collection-title" className="text-h2-sm mb-5">{t("newCollectionTitle")}</h2>

      <div className="space-y-4">
        <Input
          label={t("nameLabel")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoComplete="off"
          autoFocus
        />
        <Input
          label={
            <>
              {t("descLabel")} <span className="font-normal text-ink-3">{t("descOptional")}</span>
            </>
          }
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descPlaceholder")}
          autoComplete="off"
        />
        <div>
          <Checkbox
            label={t("publicLabel")}
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <p className="mt-1 pl-8 text-caption text-ink-3">{t("publicSub")}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
        <Button onClick={handleCreate} disabled={!name.trim()} loading={loading}>
          {loading ? t("creating") : t("create")}
        </Button>
      </div>
    </Dialog>
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
      setIsPro(FREE_FOR_ALL || (profile?.is_pro ?? false));

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

  const atLimit = !isPro && collections.length >= FREE_COLLECTION_LIMIT;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            as="h1"
            className="mb-0!"
            title={t("title")}
            subtitle={loading ? t("loading") : t("counter", { count: collections.length })}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/collections/explore" variant="secondary" icon="globe">
              {t.has("exploreButton") ? t("exploreButton") : "Explore"}
            </Button>
            <Button icon="plus" onClick={handleNewCollectionClick}>{stripPlus(t("newButton"))}</Button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        )}

        {!loading && collections.length === 0 && (
          <EmptyState
            icon="book"
            title={t("empty")}
            text={t("groupDesc")}
            action={<Button onClick={handleNewCollectionClick}>{stripPlus(t("createFirst"))}</Button>}
          />
        )}

        {!loading && collections.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}

            <div className="relative">
              <button
                onClick={handleNewCollectionClick}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2 border border-dashed border-line-strong text-ink-2 transition-colors hover:bg-surface-soft"
              >
                <Icon name={atLimit ? "lock" : "plus"} size={24} />
                <span className="text-base font-semibold">{atLimit ? t("upgradePro") : stripPlus(t("newCollection"))}</span>
              </button>
              {atLimit && <ProBadge feature="Unlimited collections" className="absolute left-3 top-3" />}
            </div>
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
