/**
 * Supabase-Zugang für die Worker (Service-Key aus .env.local).
 * Nutzt @supabase/supabase-js aus den Repo-node_modules — keine neuen Deps.
 */
import { ENV } from "./env.mjs";

export async function getSupabase() {
  const url = ENV.NEXT_PUBLIC_SUPABASE_URL;
  const skey = ENV.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !skey)
    throw new Error("Supabase-Zugang fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local).");
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, skey, { auth: { persistSession: false } });
}

/** user_id per E-Mail (wie generate_images.mjs) — Abbruch, falls Konto fehlt. */
export async function findUserId(sb, email) {
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`Kein Nutzer mit E-Mail ${email}.`);
}

/**
 * Bestehende Agent-/Korpus-Rezepte aus der DB holen (für Dedup + Stau-Guard).
 * Gibt null zurück, wenn die DB nicht erreichbar ist (Offline-Betrieb) —
 * Aufrufer müssen damit umgehen (Fallback auf lokalen Korpus).
 */
export async function fetchDbCorpus(timeoutMs = 8000) {
  try {
    const sb = await getSupabase();
    const q = sb
      .from("user_recipes")
      .select("translation_group, language, title, ingredients, pipeline_status")
      .not("translation_group", "is", null);
    const { data, error } = await Promise.race([
      q,
      new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), timeoutMs)),
    ]);
    if (error) throw error;
    return data;
  } catch (e) {
    return null; // offline / nicht erreichbar
  }
}
