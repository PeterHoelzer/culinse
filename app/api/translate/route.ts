import { NextResponse, type NextRequest } from "next/server";
import { translateTexts } from "@/lib/translate";

// Translation now goes through lib/translate, which adds a persistent Supabase
// cache and prefers DeepL (with a MyMemory fallback). The request/response
// contract is unchanged, so existing callers (e.g. the recipe detail page)
// keep working — they just get better quality and caching for free.

function langsFor(targetLang: "de" | "en"): { source: "EN" | "DE"; target: "EN" | "DE" } {
  return targetLang === "de" ? { source: "EN", target: "DE" } : { source: "DE", target: "EN" };
}

export async function POST(request: NextRequest) {
  let body: { texts?: unknown; targetLang?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { texts, targetLang } = body;

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts must be a non-empty array" }, { status: 400 });
  }
  if (targetLang !== "de" && targetLang !== "en") {
    return NextResponse.json({ error: "targetLang must be 'de' or 'en'" }, { status: 400 });
  }
  if (texts.length > 50) {
    return NextResponse.json({ error: "Maximum 50 texts per request" }, { status: 400 });
  }

  const strTexts = texts.map((t) => (typeof t === "string" ? t : String(t)));
  const { source, target } = langsFor(targetLang);
  const translated = await translateTexts(strTexts, source, target);

  return NextResponse.json({ translated });
}

// Also support GET for single-text translation (convenient for server components)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text");
  const targetLang = searchParams.get("targetLang");

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (targetLang !== "de" && targetLang !== "en") {
    return NextResponse.json({ error: "targetLang must be 'de' or 'en'" }, { status: 400 });
  }

  const { source, target } = langsFor(targetLang);
  const [translated] = await translateTexts([text], source, target);

  return NextResponse.json(
    { translated },
    {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
