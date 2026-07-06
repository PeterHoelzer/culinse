/**
 * Datei-basierte Status-Queue: ein JSON pro Rezept in state/queue/<slug>.json.
 * Crash-sicher (Schreiben via tmp+rename), jeder Übergang wird in history
 * protokolliert. Die DB bekommt ein Rezept erst KOMPLETT (inkl. Bild) als
 * pipeline_status='pending_review' — bis dahin lebt alles hier.
 *
 * Status-Fluss (Plan §2, lokal gespiegelt):
 *   trend_candidate → composed → ready_for_image → image_ready → pending_review
 *                        └─────────► rejected ◄────────┘
 *   (image_ready = Bild lokal erzeugt, wartet auf Peters Sichtung)
 */
import fs from "fs";
import path from "path";
import { QUEUE_DIR, ensureDirs } from "./env.mjs";

export const STATUSES = [
  "trend_candidate",
  "composed",
  "ready_for_image",
  "image_ready",
  "pending_review",
  "rejected",
];

function fileFor(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Ungültiger Slug: ${slug}`);
  return path.join(QUEUE_DIR, `${slug}.json`);
}

function writeAtomic(file, obj) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

export function get(slug) {
  const f = fileFor(slug);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

export function put(item) {
  ensureDirs();
  item.updated_at = new Date().toISOString();
  writeAtomic(fileFor(item.slug), item);
  return item;
}

export function list(status = null) {
  ensureDirs();
  const items = fs
    .readdirSync(QUEUE_DIR)
    // Nur echte Queue-Dateien (<slug>.json) — nicht <slug>.response.json / .prompt.txt
    .filter((f) => /^[a-z0-9-]+\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, f), "utf8")));
  const filtered = status ? items.filter((i) => i.status === status) : items;
  return filtered.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
}

/** Neuen Kandidaten anlegen (Scout). */
export function create(slug, candidate) {
  if (get(slug)) throw new Error(`Queue-Eintrag existiert schon: ${slug}`);
  const now = new Date().toISOString();
  return put({
    slug,
    status: "trend_candidate",
    created_at: now,
    updated_at: now,
    candidate,
    recipe: null,
    check: null,
    image: null,
    history: [{ at: now, to: "trend_candidate", by: "scout" }],
  });
}

/** Statusübergang mit Guard + Protokoll. */
export function move(slug, from, to, by, patch = {}, note = null) {
  const item = get(slug);
  if (!item) throw new Error(`Kein Queue-Eintrag: ${slug}`);
  if (item.status !== from)
    throw new Error(`${slug}: erwartet Status '${from}', ist aber '${item.status}'`);
  if (!STATUSES.includes(to)) throw new Error(`Unbekannter Zielstatus: ${to}`);
  Object.assign(item, patch);
  item.status = to;
  item.history.push({ at: new Date().toISOString(), from, to, by, ...(note ? { note } : {}) });
  return put(item);
}
