/*
  Schalter für „Mit Apple anmelden“ (25.11.2026).

  Der Knopf darf nur erscheinen, wenn Apple beim Anmeldedienst eingerichtet ist
  (deploy/apple-anmeldung.sh). Sonst endete der Klick auf einer Fehlerseite.

  Gefragt wird der Anmeldedienst selbst: /auth/v1/settings nennt die aktiven
  Anmeldewege ("external": { "apple": true, … }). Vorteile gegenüber einer
  Umgebungsvariable der Website:
  - Der Knopf erscheint von selbst, sobald Apple am Server eingeschaltet ist,
    und verschwindet, wenn es dort abgeschaltet wird. Kein neuer Bau nötig.
  - Die Seiten liegen fertig bei Cloudflare im Speicher. Eine Variable wäre in
    die gespeicherte Seite eingebacken und bliebe bis zum nächsten Leeren alt.
  Die Abfrage geht an den Datenserver, den die Inhalts-Sicherheitsrichtlinie
  (next.config.ts, connect-src) schon erlaubt.

  NEXT_PUBLIC_APPLE_LOGIN übersteuert die Abfrage, falls nötig:
  "on" zeigt den Knopf immer (lokale Vorschau), "off" nie (Notbremse).
  Ohne die Variable entscheidet der Anmeldedienst.
*/

export async function appleLoginEnabled(): Promise<boolean> {
  const forced = process.env.NEXT_PUBLIC_APPLE_LOGIN;
  if (forced === "on") return true;
  if (forced === "off") return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!response.ok) return false;
    const settings: { external?: { apple?: unknown } } = await response.json();
    return settings.external?.apple === true;
  } catch {
    // Datenserver nicht erreichbar: lieber kein Knopf als einer, der ins Leere führt.
    return false;
  }
}
