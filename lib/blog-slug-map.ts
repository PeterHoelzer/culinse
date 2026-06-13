// Canonical EN ↔ DE blog slug mapping — the single source of truth for linking
// a post's two language versions (hreflang alternates + sitemap).
//
// Slugs are localized (not literal translations), so one cannot be derived from
// the other. Each pair below was verified against the actual article content in
// blog-posts.ts / blog-posts-de.ts (matching titles, descriptions and intros) —
// NOT by array order, which is misleading for the three "dinner ideas" posts.
//
// If you add a blog post, add its slug pair here too, or the cross-language link
// will fall back to the same slug and 404 in the other language.
export const EN_TO_DE_BLOG_SLUGS: Record<string, string> = {
  "how-to-meal-prep-for-the-week": "meal-prep-fuer-die-woche",
  "best-free-meal-planner-apps-2026": "beste-kostenlose-meal-planner-apps-2026",
  "weekly-meal-plan-with-shopping-list": "wochenmenuplan-mit-einkaufsliste",
  "easy-dinner-ideas-for-busy-weeknights": "schnelle-abendessen-ideen-unter-30-minuten",
  "quick-dinner-recipes-under-30-minutes": "schnelle-abendessen-rezepte-was-wirklich-funktioniert",
  "high-protein-meals-for-muscle-building": "proteinreiche-mahlzeiten-muskelaufbau",
  "vegetarian-dinner-ideas-easy-recipes": "vegetarische-abendessen-ideen",
  "mediterranean-diet-recipes-beginners": "mediterrane-diaet-rezepte-anfaenger",
  "budget-meals-under-5-euros": "guenstige-mahlzeiten-unter-5-euro",
  "meal-prep-for-beginners": "meal-prep-fuer-anfaenger",
  "what-should-i-cook-tonight": "was-koche-ich-heute-abend-ideen-fuer-die-woche",
  "weekly-grocery-list-from-meal-plan": "einkaufsliste-fuer-die-woche-erstellen",
  "meal-planning-on-a-budget": "guenstig-einkaufen-mit-wochenplan",
  "family-meal-planning": "familien-essensplan-wochenplanung",
};

// Reverse lookup (DE slug → EN slug), derived automatically so it can never
// drift out of sync with the map above.
export const DE_TO_EN_BLOG_SLUGS: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_DE_BLOG_SLUGS).map(([en, de]) => [de, en])
);

/**
 * Given a blog slug and the locale it belongs to, return the matching EN + DE
 * slug pair. Falls back to the same slug if no mapping exists (e.g. a brand-new
 * post not yet added to the map) so callers never crash.
 */
export function blogSlugPair(slug: string, locale: string): { en: string; de: string } {
  if (locale === "de") {
    return { en: DE_TO_EN_BLOG_SLUGS[slug] ?? slug, de: slug };
  }
  return { en: slug, de: EN_TO_DE_BLOG_SLUGS[slug] ?? slug };
}
