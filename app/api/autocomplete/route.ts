import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateSearchQuery } from "@/lib/translateSearchQuery";

// Autocomplete aus dem eigenen Korpus (13.09.2026; vorher Spoonacular).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim();
  const lang = (searchParams.get("lang") || "en").toLowerCase();
  if (query.length < 2) return NextResponse.json({ suggestions: [] });
  const l = lang === "de" ? "de" : lang === "es" ? "es" : lang === "fr" ? "fr" : lang === "it" ? "it" : lang === "pl" ? "pl" : "en";
  try {
    const supabase = createAdminClient();
    const run = async (term: string) => {
      const { data } = await supabase
        .from("user_recipes")
        .select("title")
        .eq("is_public", true)
        .or(`language.eq.${l},language.is.null`)
        .ilike("title", `%${term}%`)
        .limit(12);
      return (data ?? []).map((r) => String(r.title));
    };
    let titles = await run(query);
    if (!titles.length) {
      const translated = await translateSearchQuery(query, l === "de" ? "DE" : "EN");
      if (translated && translated.toLowerCase() !== query.toLowerCase()) {
        titles = await run(translated);
      }
    }
    const suggestions = Array.from(new Set(titles)).slice(0, 6);
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
