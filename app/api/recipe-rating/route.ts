import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ratingKey, ratingSummary } from "@/lib/recipeRatings";

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

/** Schlüssel des Gerichts, nur für öffentliche Rezepte. */
async function keyFor(admin: ReturnType<typeof createAdminClient>, uuid: string): Promise<string | null> {
  const { data, error } = await admin.from("user_recipes").select("id, translation_group, is_public").eq("id", uuid).maybeSingle();
  if (error || !data || !data.is_public) return null;
  return ratingKey(data);
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

async function respond(admin: ReturnType<typeof createAdminClient>, key: string, userId: string | null) {
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
  const key = await keyFor(admin, uuid);
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  return respond(admin, key, await currentUserId());
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
  const key = await keyFor(admin, uuid);
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });

  // Eine Zeile je Konto und Gericht: erneutes Bewerten überschreibt die alte Bewertung.
  const { error } = await admin
    .from("recipe_ratings")
    .upsert({ user_id: userId, rating_key: key, stars, updated_at: new Date().toISOString() }, { onConflict: "user_id,rating_key" });
  if (error) return NextResponse.json({ error: "Could not save" }, { status: 500, headers: NO_STORE });

  return respond(admin, key, userId);
}
