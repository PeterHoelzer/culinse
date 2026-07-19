import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel, CULINSE_OWNER_ID } from "@/lib/culinse";

// GET /api/community-recipes?number=2
// Returns up to `number` random public, user-created recipes, mapped to the
// same shape the homepage recipe cards use. IDs are prefixed with "user_" so
// the cards link to /recipe/user_<uuid> and the detail API knows the source.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = Math.min(Math.max(Number(searchParams.get("number") || 2), 1), 6);
  const lang = searchParams.get("lang") === "de" ? "de" : "en";

  try {
    const supabase = createAdminClient();
    // Nur öffentliche Rezepte mit Bild; Sprach-Filter wie gehabt (NULL = überall).
    // WICHTIG: Mitglieder-Rezepte bekommen ihre EIGENE Abfrage — ein gemeinsamer
    // "neueste 50"-Pool wurde komplett vom Owner-Korpus verdrängt, sobald der
    // Rezept-Agent viel veröffentlicht (so verschwanden die Familienrezepte).
    const base = () =>
      supabase
        .from("user_recipes")
        .select("id, user_id, title, image_url, image_position, cook_time, servings")
        .eq("is_public", true)
        .not("image_url", "is", null)
        .or(`language.eq.${lang},language.is.null`);

    const [memberRes, ownerRes] = await Promise.all([
      base().neq("user_id", CULINSE_OWNER_ID).order("created_at", { ascending: false }).limit(50),
      base().eq("user_id", CULINSE_OWNER_ID).order("created_at", { ascending: false }).limit(50),
    ]);
    if (memberRes.error) throw memberRes.error;
    if (ownerRes.error) throw ownerRes.error;

    const shuffle = <T,>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    // Echte Mitglieder zuerst, Owner-Rezepte nur als Füller.
    const member = shuffle(memberRes.data ?? []);
    const owner = shuffle(ownerRes.data ?? []);
    const picked = [...member, ...owner].slice(0, number);

    const recipes = picked.map((r) => ({
      id: `user_${r.id}`,
      title: r.title,
      image: r.image_url,
      source: recipeSourceLabel(r.user_id),
      sourceUrl: "#",
      time: r.cook_time ? `${r.cook_time} min` : "—",
      servings: r.servings ?? null,
      rating: null,
      imagePosition: r.image_position ?? "50% 50%",
    }));

    return NextResponse.json({ recipes }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    // Non-fatal: the homepage simply shows no community recipes on failure.
    return NextResponse.json({ recipes: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
