import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const DEEPL_KEY = process.env.DEEPL_API_KEY;
// Free DeepL keys end in ":fx" and use a different host than Pro keys.
const DEEPL_URL = DEEPL_KEY?.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL ?? "";

type Lang = "EN" | "DE";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

// DeepL can translate a whole batch in one request (preferred: better quality
// and far fewer round-trips). Returns null if unavailable so we can fall back.
async function deeplTranslate(texts: string[], source: Lang, target: Lang): Promise<string[] | null> {
  if (!DEEPL_KEY) return null;
  try {
    const body = new URLSearchParams();
    texts.forEach((t) => body.append("text", t));
    body.set("source_lang", source);
    body.set("target_lang", target);
    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const arr = data?.translations;
    if (!Array.isArray(arr) || arr.length !== texts.length) return null;
    return arr.map((x: { text?: string }, i: number) => x?.text || texts[i]);
  } catch {
    return null;
  }
}

// MyMemory fallback (free, no key). One text per request.
async function myMemoryTranslate(text: string, source: Lang, target: Lang): Promise<string> {
  try {
    const url = new URL(MYMEMORY_URL);
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `${source.toLowerCase()}|${target.toLowerCase()}`);
    if (MYMEMORY_EMAIL) url.searchParams.set("de", MYMEMORY_EMAIL);
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Culinse/1.0 (recipe discovery platform)" },
      next: { revalidate: 604800 },
    });
    if (!res.ok) return text;
    const data = await res.json();
    if (data.responseStatus !== 200) return text;
    return data.responseData?.translatedText ?? text;
  } catch {
    return text;
  }
}

/**
 * Translate texts with a persistent Supabase cache. Prefers DeepL (better
 * quality / higher volume) and falls back to MyMemory when no DeepL key is set.
 * Never throws — on any failure the original text is returned for that item.
 * Order and duplicates in the input are preserved.
 */
export async function translateTexts(
  texts: string[],
  sourceLang: Lang,
  targetLang: Lang
): Promise<string[]> {
  if (sourceLang === targetLang || texts.length === 0) return texts;

  const unique = Array.from(new Set(texts.filter((t) => t && t.trim())));
  if (unique.length === 0) return texts;

  const result = new Map<string, string>();

  try {
    const supabase = createAdminClient();
    const hashes = unique.map(md5);
    const hashToText = new Map(unique.map((t) => [md5(t), t] as const));

    // 1. Cache lookup (by hash → uses the unique index).
    const { data: cached } = await supabase
      .from("translation_cache")
      .select("source_hash, translated_text")
      .eq("source_lang", sourceLang)
      .eq("target_lang", targetLang)
      .in("source_hash", hashes);
    (cached ?? []).forEach((r) => {
      const text = hashToText.get(r.source_hash);
      if (text) result.set(text, r.translated_text);
    });

    const misses = unique.filter((t) => !result.has(t));

    if (misses.length > 0) {
      // 2. Translate misses: DeepL batch first, MyMemory per-item fallback.
      let translated = await deeplTranslate(misses, sourceLang, targetLang);
      if (!translated) {
        translated = await Promise.all(
          misses.map((t) => myMemoryTranslate(t, sourceLang, targetLang))
        );
      }

      const rows: {
        source_hash: string;
        source_text: string;
        translated_text: string;
        source_lang: string;
        target_lang: string;
      }[] = [];
      misses.forEach((t, i) => {
        const val = translated![i] ?? t;
        result.set(t, val);
        if (val && val !== t) {
          rows.push({
            source_hash: md5(t),
            source_text: t,
            translated_text: val,
            source_lang: sourceLang,
            target_lang: targetLang,
          });
        }
      });

      // 3. Persist new translations (ignore conflicts).
      if (rows.length > 0) {
        await supabase
          .from("translation_cache")
          .upsert(rows, { onConflict: "source_hash,source_lang,target_lang" });
      }
    }
  } catch (err) {
    console.error("translateTexts failed:", err);
  }

  // 4. Map back, preserving order + duplicates; fall back to original.
  return texts.map((t) => (t && t.trim() ? result.get(t) ?? t : t));
}
