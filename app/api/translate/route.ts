import { NextResponse, type NextRequest } from "next/server";

// MyMemory free translation API
// - No API key required
// - 5,000 chars/day (anonymous), 10,000 chars/day with email param
// - With Next.js ISR caching (7 days) this is more than enough at launch

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
// Add email to double the daily quota
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL ?? "";

async function translateText(text: string, langpair: string): Promise<string> {
  if (!text.trim()) return text;

  const url = new URL(MYMEMORY_URL);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);
  if (MYMEMORY_EMAIL) url.searchParams.set("de", MYMEMORY_EMAIL);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Culinse/1.0 (recipe discovery platform)" },
    next: { revalidate: 604800 }, // 7 days ISR cache
  });

  if (!res.ok) {
    console.error(`[translate] MyMemory error ${res.status} for text: "${text.slice(0, 50)}"`);
    return text; // fallback: return original
  }

  const data = await res.json();

  // MyMemory returns responseStatus 200 for success, 429/403 for quota exceeded
  if (data.responseStatus !== 200) {
    console.warn(`[translate] MyMemory status ${data.responseStatus}: ${data.responseDetails}`);
    return text; // fallback: return original
  }

  return data.responseData?.translatedText ?? text;
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

  // Limit to 50 texts per request to avoid hammering the API
  if (texts.length > 50) {
    return NextResponse.json({ error: "Maximum 50 texts per request" }, { status: 400 });
  }

  const langpair = targetLang === "de" ? "en|de" : "de|en";

  // Translate all texts in parallel
  const translated = await Promise.all(
    texts.map((text) =>
      typeof text === "string"
        ? translateText(text, langpair).catch(() => text) // per-item fallback
        : Promise.resolve(String(text))
    )
  );

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

  const langpair = targetLang === "de" ? "en|de" : "de|en";
  const translated = await translateText(text, langpair).catch(() => text);

  return NextResponse.json(
    { translated },
    {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
