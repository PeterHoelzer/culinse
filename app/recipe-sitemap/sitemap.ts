import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

/*
  Rezept-Sitemaps, eine je Sprache: /recipe-sitemap/sitemap/<sprache>.xml

  Bis 12.11.2026 standen nur die deutschen und englischen Rezepte in der
  Sitemap, die rund 61.000 Rezeptseiten der anderen 14 Sprachen fehlten. Alle
  zusammen (über 70.000 Adressen) passen nicht in eine Datei (Grenze 50.000),
  darum die Aufteilung nach Sprache.

  Die Einträge tragen bewusst keine hreflang-Angaben: Jede Rezeptseite nennt
  ihre 16 Sprachfassungen schon im <head>. Zwei Quellen dafür widersprachen
  sich vorher (Sitemap: nur de/en, Seite: alle 16).
*/
const baseUrl = "https://culinse.com";
const LOCALES = ["en", "de", "es", "fr", "it", "pl", "tr", "nl", "cs", "ru", "pt", "zh", "ja", "id", "vi", "bn"] as const;

// Alle sechs Stunden neu, damit neue Rezepte ohne Deploy erscheinen.
export const revalidate = 21600;

export async function generateSitemaps() {
  return LOCALES.map((id) => ({ id }));
}

type Row = { id: string; created_at: string | null; updated_at: string | null };

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const locale = await props.id;
  if (!(LOCALES as readonly string[]).includes(locale)) return [];

  const admin = createAdminClient();
  const rows: Row[] = [];
  // Supabase liefert höchstens 1000 Zeilen je Abfrage, darum seitenweise über die id.
  for (let last = "00000000-0000-0000-0000-000000000000"; ; ) {
    const { data, error } = await admin
      .from("user_recipes")
      .select("id, created_at, updated_at")
      .eq("is_public", true)
      .eq("language", locale)
      .gt("id", last)
      .order("id", { ascending: true })
      .limit(1000);
    // Lieber ein Fehler (die alte Fassung bleibt im Cache) als eine halbe Sitemap.
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
    last = data[data.length - 1].id;
  }

  return rows.map((r) => ({
    url: `${baseUrl}/${locale}/recipe/user_${r.id}`,
    lastModified: new Date(r.updated_at ?? r.created_at ?? "2026-07-14"),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}
