/*
  Adressen, die vom Ort abhängen, an dem die Website läuft (Umzugsvorbereitung
  16.11.2026). Ohne die Umgebungsvariablen gilt der bisherige Stand: Website auf
  culinse.com, Datenbank und Bilder im Supabase-Projekt.
*/

/** Bisheriges Supabase-Projekt. Bildadressen in älteren Rezeptzeilen zeigen dorthin. */
export const LEGACY_SUPABASE_ORIGIN = "https://ztfhnzslyztxfmvkyrrn.supabase.co";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Ursprung von Datenbank-API und Bildspeicher (aus NEXT_PUBLIC_SUPABASE_URL). */
export const SUPABASE_ORIGIN = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? LEGACY_SUPABASE_ORIGIN;

/** Gehört die Adresse zum eigenen Bildspeicher (neu oder bisher)? */
export function isSupabaseHost(hostname: string): boolean {
  return hostname === new URL(SUPABASE_ORIGIN).hostname || hostname.endsWith(".supabase.co");
}

/** Öffentliche Adresse der Website: für Links, Canonicals und Rücksprünge. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://culinse.com";

/*
  Adresse, unter der der Server seine eigene API abruft. Auf einem eigenen Server
  auf http://127.0.0.1:<port> setzen: dann laufen die Abrufe nicht über das
  Internet und treffen auch im Probebetrieb unter einer Testadresse die eigene
  Instanz statt der Live-Seite. Nur zur Laufzeit setzen, nicht beim Bauen (beim
  Bauen lauscht dort noch nichts). Ohne die Variable gilt die öffentliche Adresse.
*/
export const INTERNAL_API_URL = process.env.INTERNAL_API_URL || SITE_URL;
