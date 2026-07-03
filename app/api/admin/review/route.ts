import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CULINSE_OWNER_ID } from "@/lib/culinse";

/**
 * Rezept-Agent Review-Queue (Phase 2 des Agent-Plans).
 *
 * GET  → alle pending_review-Rezepte des Culinse-Kontos, gruppiert nach
 *        translation_group (DE+EN teilen Bild und Entscheidung).
 * POST → { group, action: "approve" | "discard" }
 *        approve  = Freigabe schaltet DE+EN GEMEINSAM öffentlich
 *                   (is_public=true, status/published, pipeline_status='published';
 *                   identisch zu recipe-agent/workers/distributor.mjs)
 *        discard  = pipeline_status='discarded' — bleibt privater Entwurf.
 *
 * Nur für das Culinse-Owner-Konto (Peter) — alle anderen bekommen 403.
 */

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.id !== CULINSE_OWNER_ID)
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase, user };
}

export async function GET() {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const { data, error } = await supabase
    .from("user_recipes")
    .select(
      "id, language, translation_group, title, description, image_url, ingredients, instructions, cook_time, prep_time, servings, tags, nutrition, created_at, pipeline_status"
    )
    .eq("user_id", user.id)
    .eq("pipeline_status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Nach translation_group bündeln — eine Karte pro Gericht
  const groups: Record<string, { group: string; created_at: string; recipes: typeof data }> = {};
  for (const row of data ?? []) {
    const g = row.translation_group ?? row.id;
    groups[g] ??= { group: g, created_at: row.created_at, recipes: [] };
    groups[g].recipes.push(row);
  }
  return NextResponse.json({ groups: Object.values(groups) });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOwner();
  if ("error" in ctx) return ctx.error;
  const { supabase, user } = ctx;

  const { group, action } = await req.json();
  if (!group || !["approve", "discard"].includes(action))
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if (action === "approve") {
    // Qualitäts-Gate (Sicherheitsnetz): nie ohne Bild veröffentlichen
    const { data: rows, error: selErr } = await supabase
      .from("user_recipes")
      .select("id, image_url")
      .eq("user_id", user.id)
      .eq("translation_group", group)
      .eq("pipeline_status", "pending_review");
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rows.some((r) => !r.image_url))
      return NextResponse.json({ error: "quality_check_failed", issues: ["Bild fehlt"] }, { status: 422 });

    const { error } = await supabase
      .from("user_recipes")
      .update({
        is_public: true,
        status: "published",
        pipeline_status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("translation_group", group)
      .eq("pipeline_status", "pending_review");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, published: rows.length });
  }

  // discard — bleibt privater Entwurf, taucht nie wieder in der Queue auf
  const { error } = await supabase
    .from("user_recipes")
    .update({ pipeline_status: "discarded", updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("translation_group", group)
    .eq("pipeline_status", "pending_review");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
