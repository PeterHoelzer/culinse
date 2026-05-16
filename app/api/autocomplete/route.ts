import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE = "https://api.spoonacular.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  if (query.length < 2) return NextResponse.json({ suggestions: [] });

  try {
    const res = await fetch(
      `${BASE}/recipes/autocomplete?query=${encodeURIComponent(query)}&number=6&apiKey=${API_KEY}`,
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
