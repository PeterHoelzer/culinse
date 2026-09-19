import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel } from "@/lib/culinse";
import { optimizedImageUrl } from "@/lib/imageUrl";

// Words that carry no signal for finding related dishes (EN + DE).
const STOPWORDS = new Set([
  "with", "and", "the", "for", "from", "easy", "quick", "best", "simple",
  "recipe", "recipes", "style", "homemade", "creamy", "baked", "classic",
  "mit", "und", "oder", "aus", "der", "die", "das", "den", "dem", "vom",
  "einfach", "einfache", "einfacher", "einfaches", "schnell", "schnelle",
  "schneller", "schnelles", "rezept", "rezepte", "cremig", "cremige",
  "cremiger", "cremiges", "selbstgemacht", "klassisch", "klassische",
]);

/** Meaningful title words (≥4 letters, no stopwords) — safe for ilike. */
function titleTokens(title: string): string[] {
  const words = title.toLowerCase().match(/[a-zäöüß]{4,}/g) ?? [];
  return Array.from(new Set(words.filter((w) => !STOPWORDS.has(w)))).slice(0, 2);
}

/** Small deterministic hash so fallback picks vary per recipe but stay stable. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

interface UserRecipeRow {
  id: string;
  user_id: string | null;
  title: string;
  image_url: string | null;
  image_position: string | null;
  cook_time: number | null;
  prep_time: number | null;
  tags: string[] | null;
  translation_group: string | null;
  created_at: string | null;
}

interface SimilarCard {
  id: string | number;
  title: string;
  image: string | null;
  imagePosition: string | null;
  time: string | null;
  source: string;
}

/**
 * Related recipes for the recipe detail page ("Ähnliche Rezepte").
 *
 * Primary pool is our own corpus + community recipes (user_recipes) — those are
 * the pages that actually rank, so internal links between them are the SEO
 * lever (GSC 20.07.: recipe long-tail is growing). Candidates are matched by
 * tag overlap and title tokens in the page language; for Spoonacular seeds a
 * few provider recipes are mixed in via the /similar endpoint. German titles
 * for provider recipes come from the cached translation layer.
 *
 * GET /api/similar-recipes?id=<recipeId>&lang=de|en&tags=a,b,c&title=...&number=8
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const lang = searchParams.get("lang") === "de" ? "de" : searchParams.get("lang") === "es" ? "es" : searchParams.get("lang") === "fr" ? "fr" : searchParams.get("lang") === "it" ? "it" : searchParams.get("lang") === "pl" ? "pl" : searchParams.get("lang") === "tr" ? "tr" : "en";
  const number = Math.min(Math.max(Math.floor(Number(searchParams.get("number")) || 8), 1), 12);
  const tagsParam = (searchParams.get("tags") || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);

  if (!id) return NextResponse.json({ recipes: [] });

  const currentUuid = id.startsWith("user_") ? id.slice("user_".length) : null;

  try {
    const supabase = createAdminClient();

    // ── Seed: for community recipes, enrich tags + translation group from the DB ──
    let seedTags = tagsParam;
    let seedTitle = searchParams.get("title") || "";
    let excludeGroup: string | null = null;
    if (currentUuid) {
      const { data: row } = await supabase
        .from("user_recipes")
        .select("title, tags, translation_group")
        .eq("id", currentUuid)
        .single();
      if (row) {
        const own = Array.isArray(row.tags) ? row.tags.map((t: unknown) => String(t).toLowerCase()) : [];
        seedTags = Array.from(new Set([...seedTags, ...own])).slice(0, 12);
        excludeGroup = row.translation_group ?? null;
        if (!seedTitle && row.title) seedTitle = row.title;
      }
    }
    const tokens = titleTokens(seedTitle);

    // Public recipes with an image, in the page language (NULL = language-neutral
    // legacy entries) — same visibility rule as /api/community-recipes.
    const baseQuery = () =>
      supabase
        .from("user_recipes")
        .select("id, user_id, title, image_url, image_position, cook_time, prep_time, tags, translation_group, created_at")
        .eq("is_public", true)
        .not("image_url", "is", null)
        .or(`language.eq.${lang},language.is.null`);

    // The current recipe and its translation sibling never count as "similar".
    const isSelf = (r: UserRecipeRow) =>
      (currentUuid !== null && r.id === currentUuid) ||
      (excludeGroup !== null && r.translation_group === excludeGroup);

    // ── Candidates: tag overlap + title-token matches, scored in JS ──
    const queries: PromiseLike<{ data: UserRecipeRow[] | null }>[] = [];
    if (seedTags.length) {
      queries.push(baseQuery().overlaps("tags", seedTags).order("created_at", { ascending: false }).limit(40));
    }
    for (const tok of tokens) {
      queries.push(baseQuery().ilike("title", `%${tok}%`).order("created_at", { ascending: false }).limit(15));
    }
    const results = queries.length ? await Promise.all(queries) : [];

    const seedTagSet = new Set(seedTags);
    const scored = new Map<string, { row: UserRecipeRow; score: number }>();
    results.forEach(({ data }, qi) => {
      const isTagQuery = seedTags.length > 0 && qi === 0;
      for (const r of data ?? []) {
        if (!r?.id || isSelf(r)) continue;
        const prev = scored.get(r.id);
        let score = prev?.score ?? 0;
        if (isTagQuery) {
          const overlap = (r.tags ?? []).filter((t) => seedTagSet.has(String(t).toLowerCase())).length;
          score += 2 * Math.min(overlap, 4);
        } else {
          score += 3; // title-token hit — strong "same dish family" signal
        }
        scored.set(r.id, { row: r, score });
      }
    });

    const community: UserRecipeRow[] = [...scored.values()]
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.row.created_at ?? "").localeCompare(a.row.created_at ?? "")
      )
      .map((v) => v.row);

    // ── Mix: community/corpus first, a few provider recipes for Spoonacular seeds ──
    const externalTarget = 0; // externe Provider seit 13.09.2026 entfernt
    const communityTarget = number - externalTarget;

    // Fallback fill so every recipe page links into the corpus, even without
    // matches. Deterministic per-recipe rotation → stable pages, varied links.
    if (community.length < communityTarget) {
      const { data: recent } = await baseQuery()
        .order("created_at", { ascending: false })
        .limit(60);
      const pool = (recent ?? []).filter((r) => r?.id && !isSelf(r) && !scored.has(r.id));
      if (pool.length) {
        const start = hashId(id) % pool.length;
        for (let i = 0; i < pool.length && community.length < communityTarget; i++) {
          community.push(pool[(start + i) % pool.length]);
        }
      }
    }

    const external: SimilarCard[] = [];

    const communityCards: SimilarCard[] = community
      .slice(0, number - Math.min(external.length, externalTarget))
      .map((r) => {
        const total = (r.cook_time ?? 0) + (r.prep_time ?? 0);
        return {
          id: `user_${r.id}`,
          title: r.title,
          image: optimizedImageUrl(r.image_url, 640),
          imagePosition: r.image_position ?? null,
          time: total > 0 ? `${total} min` : null,
          source: recipeSourceLabel(r.user_id),
        };
      });

    const cards = [...communityCards, ...external.slice(0, number - communityCards.length)];

    return NextResponse.json(
      { recipes: cards },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch (err) {
    console.error(err);
    // Non-fatal: the recipe page simply renders without the similar section.
    return NextResponse.json({ recipes: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
