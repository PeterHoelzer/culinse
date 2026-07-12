import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CULINSE_OWNER_ID } from "@/lib/culinse";

/**
 * Rezept-Agent Review-Queue (Phase 2 des Agent-Plans).
 *
 * GET  → alle pending_review-Rezepte des Culinse-Kontos, gruppiert nach
 *        translation_group (DE+EN teilen Bild und Entscheidung).
 * POST → { group, action: "approve" | "discard" }
 *        approve  = Freigabe schaltet DE+EN GEMEINSAM öffentlich
 *        discard  = pipeline_status='discarded' — bleibt privater Entwurf.
 *
 * Zugriff: das Culinse-Owner-Konto (Peter) UND Reviewer aus der Allow-List
 * CULINSE_REVIEWER_EMAILS (kommagetrennt, z. B. Peters Vater — braucht ein
 * normales Culinse-Konto mit genau dieser E-Mail). Die Rezepte gehören immer
 * dem Owner-Konto; Reviewer entscheiden nur. Deshalb laufen die Datenzugriffe
 * nach bestandener Zugangsprüfung über den Service-Client (RLS würde fremde
 * Sessions sonst aussperren) — strikt gescoped auf Owner + pipeline_status.
 */

// Standard-Reviewer: Gerd (Peters Vater). Überschreibbar/erweiterbar via
// Env-Var CULINSE_REVIEWER_EMAILS (kommagetrennt) — gleiche Konvention wie
// CULINSE_OWNER_ID in lib/culinse.ts.
function reviewerEmails(): string[] {
  return (process.env.CULINSE_REVIEWER_EMAILS || "gerd@hoelzer.xyz")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireReviewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const isOwner = user.id === CULINSE_OWNER_ID;
  // Nur BESTÄTIGTE E-Mail zählt — sonst könnte (falls E-Mail-Confirmation je
  // deaktiviert wird) jeder ein Konto mit der Reviewer-Adresse registrieren.
  const isReviewer =
    Boolean(user.email_confirmed_at) &&
    reviewerEmails().includes((user.email || "").toLowerCase());
  if (!isOwner && !isReviewer)
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  // Ab hier Service-Client: Reviewer-Sessions dürfen per RLS nicht auf die
  // Owner-Zeilen zugreifen — die Autorisierung ist oben bereits erfolgt.
  return { db: createAdminClient(), reviewer: user.email ?? user.id, isOwner };
}

export async function GET() {
  const ctx = await requireReviewer();
  if ("error" in ctx) return ctx.error;

  const { data, error } = await ctx.db
    .from("user_recipes")
    .select(
      "id, language, translation_group, title, description, image_url, ingredients, instructions, cook_time, prep_time, servings, tags, nutrition, created_at, pipeline_status"
    )
    .eq("user_id", CULINSE_OWNER_ID)
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
  return NextResponse.json({ groups: Object.values(groups), viewer: { isOwner: ctx.isOwner } });
}

export async function POST(req: NextRequest) {
  const ctx = await requireReviewer();
  if ("error" in ctx) return ctx.error;

  const { group, action } = await req.json();
  if (!group || !["approve", "discard"].includes(action))
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  if (action === "approve") {
    // Qualitäts-Gate (Sicherheitsnetz): nie ohne Bild veröffentlichen
    const { data: rows, error: selErr } = await ctx.db
      .from("user_recipes")
      .select("id, image_url")
      .eq("user_id", CULINSE_OWNER_ID)
      .eq("translation_group", group)
      .eq("pipeline_status", "pending_review");
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rows.some((r) => !r.image_url))
      return NextResponse.json({ error: "quality_check_failed", issues: ["Bild fehlt"] }, { status: 422 });

    const { error } = await ctx.db
      .from("user_recipes")
      .update({
        is_public: true,
        status: "published",
        pipeline_status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", CULINSE_OWNER_ID)
      .eq("translation_group", group)
      .eq("pipeline_status", "pending_review");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, published: rows.length, by: ctx.reviewer });
  }

  // discard — bleibt privater Entwurf, taucht nie wieder in der Queue auf
  const { error } = await ctx.db
    .from("user_recipes")
    .update({ pipeline_status: "discarded", updated_at: new Date().toISOString() })
    .eq("user_id", CULINSE_OWNER_ID)
    .eq("translation_group", group)
    .eq("pipeline_status", "pending_review");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, by: ctx.reviewer });
}
