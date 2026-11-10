import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Bewertungen für Rezepte (1 bis 5 Sterne), Tabelle recipe_ratings
  (supabase/recipe_ratings_migration.sql).

  Eine Bewertung gilt dem Gericht, nicht der Sprachfassung: Schlüssel ist die
  translation_group, damit ein Gericht in allen 16 Sprachen dieselben Sterne
  trägt. Rezepte ohne Gruppe (Familien- und Community-Rezepte) nutzen ihre ID.

  Die Tabelle erlaubt jedem Konto nur den Blick auf die eigene Zeile. Summen
  rechnet der Server mit dem Service-Schlüssel; nach außen gehen nur Anzahl
  und Durchschnitt.
*/

export interface RatingSummary {
  count: number;
  /** Durchschnitt mit einer Nachkommastelle, null ohne Bewertungen. */
  average: number | null;
}

export function ratingKey(row: { id: string; translation_group?: string | null }): string {
  return row.translation_group ? row.translation_group : `id:${row.id}`;
}

/** Anzahl und Durchschnitt zu einem Gericht. Fehler (auch fehlende Tabelle) ergeben null. */
export async function ratingSummary(admin: SupabaseClient, key: string): Promise<RatingSummary | null> {
  let sum = 0;
  let count = 0;
  // Supabase liefert höchstens 1000 Zeilen je Abfrage, deshalb seitenweise.
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await admin
      .from("recipe_ratings")
      .select("stars")
      .eq("rating_key", key)
      .order("user_id", { ascending: true })
      .range(from, from + 999);
    if (error) return null;
    for (const row of data ?? []) {
      sum += row.stars as number;
      count++;
    }
    if (!data || data.length < 1000) break;
  }
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : null };
}
