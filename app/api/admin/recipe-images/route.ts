import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/reviewerGate";
import { CULINSE_OWNER_ID } from "@/lib/culinse";

/**
 * Bilder-Werkstatt (14.09.2026): Papa tauscht Cover-Bilder des eigenen
 * Korpus gegen seine Higgsfield-Bilder.
 *
 * GET  → alle öffentlichen Owner-Rezepte, gruppiert nach translation_group
 *        (DE+EN teilen das Bild). swapped = Bild liegt schon im papa/-Ordner.
 * POST → multipart/form-data { file, group } — lädt das Bild in den Bucket
 *        recipe-media unter {owner}/papa/... und setzt image_url + images[0]
 *        für ALLE Zeilen der Gruppe. Alte Dateien bleiben im Bucket liegen
 *        (nichts wird gelöscht); image_position wird zurückgesetzt, weil der
 *        alte Ausschnitt zum neuen Bild nicht mehr passt.
 */

interface Row {
  id: string;
  language: string | null;
  translation_group: string | null;
  title: string;
  image_url: string | null;
  images: string[] | null;
}

const SWAP_MARKER = "/papa/";

function groupKey(r: Row): string {
  return r.translation_group || `__${r.id}`;
}

export async function GET() {
  const gate = await requireReviewer();
  if ("error" in gate) return gate.error;
  const { data, error } = await gate.db
    .from("user_recipes")
    .select("id, language, translation_group, title, image_url, images")
    .eq("user_id", CULINSE_OWNER_ID)
    .eq("is_public", true)
    .limit(3000);
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  const groups = new Map<string, { titleDe: string; titleEn: string; image: string | null; swapped: boolean }>();
  for (const r of (data ?? []) as Row[]) {
    const key = groupKey(r);
    const g = groups.get(key) ?? { titleDe: "", titleEn: "", image: null, swapped: false };
    if (r.language === "de" || !g.titleDe) g.titleDe = r.language === "de" ? r.title : g.titleDe || r.title;
    if (r.language !== "de" && !g.titleEn) g.titleEn = r.title;
    if (!g.image && r.image_url) g.image = r.image_url;
    if (r.image_url && r.image_url.includes(SWAP_MARKER)) g.swapped = true;
    groups.set(key, g);
  }
  const recipes = Array.from(groups.entries())
    .map(([group, g]) => ({ group, ...g }))
    .sort((a, b) => (a.titleDe || a.titleEn).localeCompare(b.titleDe || b.titleEn, "de"));
  return NextResponse.json(
    { recipes },
    { headers: { "Cache-Control": "no-store" } }
  );
}

const MAX_UPLOAD = 8 * 1024 * 1024; // Client verkleinert vorher auf ~<1 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const gate = await requireReviewer();
  if ("error" in gate) return gate.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const file = form.get("file");
  const group = String(form.get("group") || "");
  if (!(file instanceof File) || !group)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!file.type.startsWith("image/") || !EXT[file.type])
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  if (file.size > MAX_UPLOAD)
    return NextResponse.json({ error: "too_large" }, { status: 413 });

  // Zeilen der Gruppe holen — Gruppe muss dem Owner gehören.
  let q = gate.db
    .from("user_recipes")
    .select("id, images")
    .eq("user_id", CULINSE_OWNER_ID);
  q = group.startsWith("__") ? q.eq("id", group.slice(2)) : q.eq("translation_group", group);
  const { data: rows, error: rowErr } = await q;
  if (rowErr || !rows || rows.length === 0)
    return NextResponse.json({ error: "group_not_found" }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const path = `${CULINSE_OWNER_ID}/papa/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${EXT[file.type]}`;
  const { error: upErr } = await gate.db.storage
    .from("recipe-media")
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: "upload_failed" }, { status: 502 });
  const { data: { publicUrl } } = gate.db.storage.from("recipe-media").getPublicUrl(path);

  const now = new Date().toISOString();
  for (const r of rows as { id: string; images: string[] | null }[]) {
    const rest = Array.isArray(r.images) ? r.images.slice(1) : [];
    const { error: updErr } = await gate.db
      .from("user_recipes")
      .update({
        image_url: publicUrl,
        images: [publicUrl, ...rest],
        image_position: "50% 50%",
        updated_at: now,
      })
      .eq("id", r.id)
      .eq("user_id", CULINSE_OWNER_ID);
    if (updErr) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ imageUrl: publicUrl });
}
