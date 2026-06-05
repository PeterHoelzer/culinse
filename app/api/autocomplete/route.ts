import { NextRequest, NextResponse } from "next/server";
import { translateSearchQuery } from "@/lib/translateSearchQuery";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const lang = (searchParams.get("lang") || "en").toLowerCase();

  if (query.length < 2) return NextResponse.json({ suggestions: [] });

  // Translate German terms to English so the (English) autocomplete matches.
  const term = await translateSearchQuery(query, lang === "de" ? "DE" : "EN");

  try {
    const res = await fetch(
      `${BASE}/recipes/autocomplete?query=${encodeURIComponent(term)}&number=6&apiKey=${API_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const suggestions = data.map((item: { title: string }) => item.title);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
