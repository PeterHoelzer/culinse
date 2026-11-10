// Distinguishes official Culinse recipes (created by the site owner) from
// community recipes (posted by any other member).
//
// Recipes from the owner account are labelled "Culinse" and blend in with the
// provider recipes; everyone else's public recipes are labelled "Community"
// and carry the community badge.
//
// The owner id is public (it already appears in public image URLs), so it's fine
// in the repo. Override via the CULINSE_OWNER_ID env var if the account changes.
export const CULINSE_OWNER_ID =
  process.env.CULINSE_OWNER_ID || "5518f1b2-455e-4ee3-8a38-85ad8e16a064";

export function recipeSourceLabel(userId: string | null | undefined): "Culinse" | "Community" {
  return userId === CULINSE_OWNER_ID ? "Culinse" : "Community";
}

// Konto der Familie (10.11.2026): Diese Rezepte sind selbst gekocht und nicht mit
// KI erstellt. Sie bekommen auf der Rezeptseite den Hinweis "Familienrezept" statt
// der KI-Kennzeichnung. Die ID steht wie die Owner-ID in öffentlichen Bildadressen.
// Weitere Konten per Komma in CULINSE_FAMILY_IDS.
export const CULINSE_FAMILY_IDS: readonly string[] = (
  process.env.CULINSE_FAMILY_IDS || "904ec862-580d-414b-a05a-8936148667b4"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isFamilyRecipe(userId: string | null | undefined): boolean {
  return !!userId && CULINSE_FAMILY_IDS.includes(userId);
}
