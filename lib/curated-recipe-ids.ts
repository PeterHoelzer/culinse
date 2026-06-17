// Hand-curated, version-controlled list of provider recipe IDs to include in the
// sitemap. This REPLACES the previous dynamic Spoonacular popularity query, whose
// result set changed between builds (136 → 134 URLs within a single week). A
// churning URL set signals "low value" to Google (SEO masterplan §2.3).
//
// WHY EMPTY BY DEFAULT
// Aggregated provider recipes (Spoonacular / TheMealDB / Edamam / Tasty) are
// duplicate content — the identical recipe lives on the origin site — so Google
// will not index them in bulk no matter how many we submit (masterplan §3.2).
// The sitemap already lists the content that genuinely *can* rank: original user
// recipes (force-private on import, so only real originals appear), public
// collections, and the blog. Submitting hundreds of duplicate recipe URLs only
// dilutes the sitemap's perceived quality.
//
// HOW TO USE
// Add the IDs of your best / most-unique recipes here — the ones where Culinse
// adds its own value (own intro, nutrition calculation, shopping-list
// integration, later user ratings). The set then stays STABLE across builds: it
// only changes when you edit this file. Aim for ~20–40 recipes that can actually
// rank, not 50 that rotate and never get indexed.
//
//   export const CURATED_RECIPE_IDS: number[] = [716429, 715538, 782601];
//
export const CURATED_RECIPE_IDS: number[] = [];
