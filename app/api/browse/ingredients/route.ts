import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { suggestIngredients } from "@/lib/browse";

// Vorschläge für den Zutatenfilter der Stöberseite: Zutatenwörter der Sprache
// mit Rezeptzahl. Öffentliche Daten, je Adresse eine Stunde im Edge-Cache.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = (searchParams.get("lang") || "").toLowerCase();
  const locale = (routing.locales as readonly string[]).includes(lang) ? lang : "en";
  const query = (searchParams.get("q") || "").trim().slice(0, 30);
  try {
    const suggestions = await suggestIngredients(locale, query);
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ suggestions: [] });
  }
}
