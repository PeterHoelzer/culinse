import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ratingKey, ratingSummary } from "@/lib/recipeRatings";
import { refreshRecipePage } from "@/lib/recipeCache";

/*
  Bewertung eines Rezepts.

  GET  /api/recipe-rating?id=user_<uuid>  → { count, average, mine }
  POST /api/recipe-rating  { id, stars }  → dasselbe nach dem Speichern (Anmeldung nötig)

  "mine" ist die eigene Bewertung des angemeldeten Kontos, sonst null.
*/

const NO_STORE = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuidOf(id: unknown): string | null {
  if (typeof id !== "string" || !id.startsWith("user_")) return null;
  const uuid = id.slice(5);
  return UUID.test(uuid) ? uuid : null;
}

type Admin = ReturnType<typeof createAdminClient>;

/** Schlüssel und Gruppe des Gerichts, nur für öffentliche Rezepte. */
async function dishOf(admin: Admin, uuid: string): Promise<{ key: string; group: string | null } | null> {
  const { data, error } = await admin.from("user_recipes").select("id, translation_group, is_public").eq("id", uuid).maybeSingle();
  if (error || !data || !data.is_public) return null;
  return { key: ratingKey(data), group: (data.translation_group as string | null) ?? null };
}

/** IDs aller Sprachfassungen des Gerichts; ohne Gruppe (oder bei einem Fehler) nur das Rezept selbst. */
async function versionIds(admin: Admin, uuid: string, group: string | null): Promise<string[]> {
  if (!group) return [uuid];
  const { data, error } = await admin.from("user_recipes").select("id").eq("translation_group", group).limit(50);
  if (error || !data) return [uuid];
  return [...new Set([uuid, ...data.map((row) => row.id as string)])];
}

async function currentUserId(): Promise<string | null> {
  try {
    const sb = await createServerClient();
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function respond(admin: Admin, key: string, userId: string | null) {
  const summary = await ratingSummary(admin, key);
  if (!summary) return NextResponse.json({ error: "Ratings unavailable" }, { status: 503, headers: NO_STORE });
  let mine: number | null = null;
  if (userId) {
    const { data } = await admin.from("recipe_ratings").select("stars").eq("rating_key", key).eq("user_id", userId).maybeSingle();
    mine = (data?.stars as number | undefined) ?? null;
  }
  return NextResponse.json({ ...summary, mine }, { headers: NO_STORE });
}

export async function GET(req: NextRequest) {
  const uuid = uuidOf(req.nextUrl.searchParams.get("id"));
  if (!uuid) return NextResponse.json({ error: "Invalid id" }, { status: 400, headers: NO_STORE });
  const admin = createAdminClient();
  const dish = await dishOf(admin, uuid);
  if (!dish) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  return respond(admin, dish.key, await currentUserId());
}

export async function POST(req: NextRequest) {
  let body: { id?: unknown; stars?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: NO_STORE });
  }
  const uuid = uuidOf(body.id);
  const stars = body.stars;
  if (!uuid || typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400, headers: NO_STORE });
  }

  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401, headers: NO_STORE });

  const admin = createAdminClient();
  const dish = await dishOf(admin, uuid);
  if (!dish) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  const { key } = dish;

  // Eine Zeile je Konto und Gericht: erneutes Bewerten überschreibt die alte Bewertung.
  const { error } = await admin
    .from("recipe_ratings")
    .upsert({ user_id: userId, rating_key: key, stars, updated_at: new Date().toISOString() }, { onConflict: "user_id,rating_key" });
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500, headers: NO_STORE });

  // Anzahl und Durchschnitt stehen auch in den strukturierten Daten der Rezeptseite.
  // Die Bewertung gilt dem Gericht in allen Sprachen, deshalb jede Sprachfassung
  // erneuern. Vorher blieb sie in den übrigen Sprachen bis zu 30 Tage unsichtbar.
  for (const id of await versionIds(admin, uuid, dish.group)) refreshRecipePage(id);
  return respond(admin, key, userId);
}
