import { createAdminClient } from "@/lib/supabase/admin";

const DEEPL_KEY = process.env.DEEPL_API_KEY;
// Free DeepL keys end in ":fx" and use a different host than Pro keys.
const DEEPL_URL = DEEPL_KEY?.endsWith(":fx")
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

/**
 * Translate a search term to English before it's sent to the recipe providers.
 *
 * Order: curated synonym table → translation cache → DeepL (if configured) →
 * fall back to the original query. Every branch is wrapped so search NEVER
 * breaks: on any error or missing dependency, the original query is returned.
 *
 * - sourceLang "DE": German site — translate German → English.
 * - sourceLang "EN": English site — only substitute a known German term (so a
 *   user typing "Sauerbraten" still gets results); never run DeepL on English.
 */
export async function translateSearchQuery(
  query: string,
  sourceLang: "DE" | "EN" = "DE"
): Promise<string> {
  const q = query.trim();
  if (!q) return query;
  const key = q.toLowerCase();

  try {
    const supabase = createAdminClient();

    // 1. Curated synonym table (fast, free, high quality). DE term → EN term.
    const { data: syn } = await supabase
      .from("search_synonyms")
      .select("term_en")
      .eq("term_de", key)
      .maybeSingle();
    if (syn?.term_en) return syn.term_en;

    // On the English site we only substitute known German terms — anything
    // else is assumed to already be English and passes through untouched.
    if (sourceLang === "EN") return query;

    // 2. Translation cache.
    const { data: cached } = await supabase
      .from("search_query_cache")
      .select("query_translated")
      .eq("query_original", key)
      .eq("source_lang", "DE")
      .eq("target_lang", "EN")
      .maybeSingle();
    if (cached?.query_translated) return cached.query_translated;

    // 3. DeepL — only when a key is configured and the term is long enough.
    if (DEEPL_KEY && q.length >= 3) {
      const body = new URLSearchParams({
        text: q,
        source_lang: "DE",
        target_lang: "EN",
      });
      const res = await fetch(DEEPL_URL, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      if (res.ok) {
        const data = await res.json();
        const translated: string | undefined = data?.translations?.[0]?.text;
        if (translated && translated.trim()) {
          const value = translated.trim();
          // 4. Cache it for next time (translations don't change).
          await supabase
            .from("search_query_cache")
            .upsert(
              { query_original: key, query_translated: value, source_lang: "DE", target_lang: "EN" },
              { onConflict: "query_original,source_lang,target_lang" }
            );
          return value;
        }
      }
    }
  } catch (err) {
    console.error("translateSearchQuery failed:", err);
  }

  // 5. Fallback: original query — search still works, just untranslated.
  return query;
}
