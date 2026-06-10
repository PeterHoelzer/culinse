import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import CollectionDetailClient, {
  type Collection,
  type CollectionRecipe,
} from "../../../collections/[id]/CollectionDetailClient";

// Per-request render so owners always see fresh content; public collections are
// server-rendered (content + metadata + JSON-LD) for SEO, private ones stay
// client-only / owner-gated and are not indexed.
export const dynamic = "force-dynamic";

const BASE = "https://culinse.com";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

async function fetchPublicCollection(
  id: string
): Promise<{ collection: Collection; recipes: CollectionRecipe[] } | null> {
  try {
    const admin = createAdminClient();
    const { data: col } = await admin.from("collections").select("*").eq("id", id).single();
    if (!col || !col.is_public) return null;
    const { data: recs } = await admin
      .from("collection_recipes")
      .select("*")
      .eq("collection_id", id)
      .order("added_at", { ascending: false });
    return { collection: col as Collection, recipes: (recs ?? []) as CollectionRecipe[] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await fetchPublicCollection(id);

  // Private / missing → don't index.
  if (!data) {
    return { title: "Collection", robots: { index: false, follow: false } };
  }

  const title = data.collection.name || "Collection";
  const count = data.recipes.length;
  const description =
    data.collection.description ||
    (locale === "de"
      ? `Eine handverlesene Rezeptsammlung auf Culinse: „${title}" mit ${count} Rezept${count === 1 ? "" : "en"}.`
      : `A handpicked recipe collection on Culinse: "${title}" with ${count} recipe${count === 1 ? "" : "s"}.`);
  const url = `${BASE}/${locale}/collections/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE}/en/collections/${id}`,
        de: `${BASE}/de/collections/${id}`,
        "x-default": `${BASE}/en/collections/${id}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Culinse",
      images: data.recipes.find((r) => r.image)?.image
        ? [{ url: data.recipes.find((r) => r.image)!.image as string }]
        : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, id } = await params;
  const data = await fetchPublicCollection(id);

  // Build ItemList JSON-LD for public collections — unique, indexable content.
  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: data.collection.name,
        ...(data.collection.description ? { description: data.collection.description } : {}),
        numberOfItems: data.recipes.length,
        itemListElement: data.recipes.slice(0, 50).map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${BASE}/${locale}/recipe/${r.recipe_id}`,
          name: r.title,
        })),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd)
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }}
        />
      )}
      {/* Public collections render their content server-side via initialData (SEO
          + no-JS); private collections pass nothing and the client fetches +
          access-gates as before. */}
      <CollectionDetailClient
        initialCollection={data?.collection ?? null}
        initialRecipes={data?.recipes ?? []}
      />
    </>
  );
}
