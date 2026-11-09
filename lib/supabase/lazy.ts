import type { SupabaseClient } from "@supabase/supabase-js";

/*
  Supabase-Client erst bei Bedarf laden. Der Client wiegt rund 62 KB (gzip) und
  wird von abgemeldeten Besuchern nicht gebraucht; fest importiert lag er im
  ersten Skript-Bündel der Startseite und teilte sich die Leitung mit dem
  Hero-Foto. Ein gemeinsames Promise sorgt dafür, dass er nur einmal lädt.
*/

let client: Promise<SupabaseClient> | null = null;

/** Lädt den Client sofort. Für Klicks und alles, was der Nutzer auslöst. */
export function loadSupabase(): Promise<SupabaseClient> {
  client ??= import("./client")
    .then((m) => m.createClient())
    .catch((error) => {
      // Fehlgeschlagenen Versuch nicht festhalten, der nächste Aufruf lädt neu.
      client = null;
      throw error;
    });
  return client;
}

/** Lädt den Client erst nach dem load-Ereignis. Für Abfragen beim Seitenstart. */
export function loadSupabaseAfterPageLoad(): Promise<SupabaseClient> {
  if (client || document.readyState === "complete") return loadSupabase();
  return new Promise((resolve, reject) => {
    window.addEventListener("load", () => loadSupabase().then(resolve, reject), { once: true });
  });
}
