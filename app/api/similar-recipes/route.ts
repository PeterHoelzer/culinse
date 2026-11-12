import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel } from "@/lib/culinse";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { TAG_TO_KEYS } from "@/lib/browse/facets";

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

/**
  Startpunkt im ID-Raum, abgeleitet aus der Rezept-ID. Die IDs sind zufällig
  verteilt; "alle ab hier" ist damit ein je Rezept anderer, aber fester
  Ausschnitt des Bestands. Die erste Stelle bleibt unter c, damit hinter dem
  Start immer mindestens ein Viertel aller Rezepte liegt.
*/
function startId(id: string): string {
  const h = hashId(id);
  const first = (h % 12).toString(16);
  const rest = (h >>> 4).toString(16).padStart(7, "0").slice(-7);
  return `${first}${rest}-0000-0000-0000-000000000000`;
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
  const lang = searchParams.get("lang") === "de" ? "de" : searchParams.get("lang") === "es" ? "es" : searchParams.get("lang") === "fr" ? "fr" : searchParams.get("lang") === "it" ? "it" : searchParams.get("lang") === "pl" ? "pl" : searchParams.get("lang") === "tr" ? "tr" : searchParams.get("lang") === "nl" ? "nl" : searchParams.get("lang") === "cs" ? "cs" : searchParams.get("lang") === "ru" ? "ru" : searchParams.get("lang") === "pt" ? "pt" : searchParams.get("lang") === "zh" ? "zh" : searchParams.get("lang") === "ja" ? "ja" : searchParams.get("lang") === "id" ? "id" : searchParams.get("lang") === "vi" ? "vi" : searchParams.get("lang") === "bn" ? "bn" : "en";
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
    // Bis 12.11.2026 kamen die Kandidaten nach Datum sortiert (die 40 neuesten
    // mit irgendeinem gemeinsamen Schlagwort). Dadurch verlinkten fast alle
    // Rezeptseiten dieselben zuletzt eingespielten Rezepte, und zur Paella
    // erschienen chinesische Gerichte. Jetzt: erst Rezepte derselben Küche und
    // Region, und jeweils ein anderer Ausschnitt je Rezept (Start an einer aus
    // der Rezept-ID abgeleiteten Stelle), damit sich die Verweise über den
    // ganzen Bestand verteilen. Das Ergebnis bleibt je Rezept stabil.
    const placeTags = seedTags.filter((tag) => (TAG_TO_KEYS.get(tag) ?? []).some((key) => key.startsWith("cuisine:") || key.startsWith("region:")));
    const regionTags = new Set(seedTags.filter((tag) => (TAG_TO_KEYS.get(tag) ?? []).some((key) => key.startsWith("region:"))));
    const start = startId(id);

    const queries: PromiseLike<{ data: UserRecipeRow[] | null }>[] = [];
    // Dieselbe Region zuerst (kleine Mengen, darum ohne Ausschnitt), dann dieselbe Küche.
    if (regionTags.size) queries.push(baseQuery().overlaps("tags", [...regionTags]).order("id", { ascending: true }).limit(30));
    if (placeTags.length) queries.push(baseQuery().overlaps("tags", placeTags).gte("id", start).order("id", { ascending: true }).limit(40));
    if (seedTags.length) queries.push(baseQuery().overlaps("tags", seedTags).gte("id", start).order("id", { ascending: true }).limit(40));
    const tagQueries = queries.length;
    for (const tok of tokens) {
      queries.push(baseQuery().ilike("title", `%${tok}%`).order("created_at", { ascending: false }).limit(15));
    }
    const results = queries.length ? await Promise.all(queries) : [];

    const seedTagSet = new Set(seedTags);
    const placeTagSet = new Set(placeTags);
    const scored = new Map<string, { row: UserRecipeRow; score: number }>();
    results.forEach(({ data }, qi) => {
      for (const r of data ?? []) {
        if (!r?.id || isSelf(r)) continue;
        const prev = scored.get(r.id);
        if (qi < tagQueries) {
          if (prev) continue; // schon über die Küche gefunden, nicht doppelt zählen
          const tags = (r.tags ?? []).map((t) => String(t).toLowerCase());
          const overlap = tags.filter((t) => seedTagSet.has(t)).length;
          const samePlace = tags.some((t) => placeTagSet.has(t));
          const sameRegion = tags.some((t) => regionTags.has(t));
          scored.set(r.id, { row: r, score: 2 * Math.min(overlap, 4) + (samePlace ? 4 : 0) + (sameRegion ? 2 : 0) });
        } else {
          // title-token hit — strong "same dish family" signal
          scored.set(r.id, { row: r, score: (prev?.score ?? 0) + 3 });
        }
      }
    });

    const community: UserRecipeRow[] = [...scored.values()]
      .sort((a, b) => b.score - a.score || hashId(id + a.row.id) - hashId(id + b.row.id))
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
