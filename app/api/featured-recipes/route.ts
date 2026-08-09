import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/featured-recipes?lang=de&number=12
// Neueste öffentliche Katalog-Rezepte für den server-gerenderten SEO-Block der
// Startseite. Bewusst deterministisch (kein Zufall, kein no-store), damit die
// Antwort im Vercel Data Cache liegen kann — die Startseite fetcht mit
// revalidate und rendert die Links ins crawlbare HTML.
// Hintergrund (GSC 09.08.2026): 429 Rezept-URLs stehen auf "Gefunden –
// zurzeit nicht indexiert"; die Startseite verlinkte bisher kein einziges
// Rezept im initialen HTML, weil das Grid client-seitig lädt.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const number = Math.min(Math.max(Number(searchParams.get("number") || 12), 1), 24);
  const lang = searchParams.get("lang") === "de" ? "de" : "en";
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user_recipes")
      .select("id, title")
      .eq("is_public", true)
      .not("image_url", "is", null)
      .or(`language.eq.${lang},language.is.null`)
      .order("created_at", { ascending: false })
      .limit(number);
    if (error) throw error;
    const recipes = (data ?? []).map((r) => ({
      id: `user_${r.id}`,
      title: r.title,
    }));
    return NextResponse.json({ recipes });
  } catch (err) {
    console.error("featured recipes failed:", err);
    return NextResponse.json({ recipes: [] });
  }
}
