// Legt von den Rezeptbildern feste, verkleinerte Fassungen im Bildspeicher ab.
//
// Hintergrund (10.11.2026): Die Seite ließ jedes Bild bei jedem neuen Abruf von
// Supabase verkleinern (render/image). Im Pro-Tarif sind davon 100 Bilder im
// Monat enthalten, Culinse lag bei über 2.600. Die Fassungen hier sind normale
// Dateien und zählen nicht als Bildverkleinerung.
//
// Ablage: recipe-media/_sized/<breite>/<pfad des originals>, Breiten siehe
// lib/imageUrl.ts (SIZED_WIDTHS). Bearbeitet werden nur Bilder unter
// <owner>/papa/, denn nur für diesen Ordner baut die Seite die festen Adressen.
//
// Aufruf (idempotent, überspringt vorhandene Fassungen):
//   node scripts/sized-images.mjs            alle Bilder aus user_recipes
//   node scripts/sized-images.mjs --limit 3  nur die ersten drei (Probe)
//   node scripts/sized-images.mjs --force    vorhandene Fassungen neu erzeugen
// Nach jedem Import neuer Rezepte einmal laufen lassen.
import fs from "node:fs";
import sharp from "sharp";

const WIDTHS = [640, 1280];
const OWNER = process.env.CULINSE_OWNER_ID || "5518f1b2-455e-4ee3-8a38-85ad8e16a064";
const FOLDER = `${OWNER}/papa/`;
const CONCURRENCY = 3;

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const args = process.argv.slice(2);
const force = args.includes("--force");
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

// Wiederholt bei Netzfehlern und wenn Supabase bremst (429) oder kurz hakt (5xx).
// Beim ersten vollen Lauf kamen 912 von 3.188 Abrufen mit 429 zurück.
async function retry(fn, tries = 6) {
  for (let i = 0; ; i++) {
    try {
      const res = await fn();
      if (res instanceof Response && (res.status === 429 || res.status >= 500) && i < tries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i >= tries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

// Alle Bildpfade aus user_recipes, seitenweise über die ID (höchstens 1000 Zeilen je Abfrage).
async function imagePaths() {
  const paths = new Set();
  const marker = "/storage/v1/object/public/recipe-media/";
  let last = "00000000-0000-0000-0000-000000000000";
  for (;;) {
    const res = await retry(() => fetch(`${URL_BASE}/rest/v1/user_recipes?select=id,image_url,images&id=gt.${last}&order=id.asc&limit=1000`, { headers: AUTH }));
    const rows = await res.json();
    for (const row of rows) {
      for (const url of [row.image_url, ...(row.images ?? [])]) {
        if (typeof url !== "string") continue;
        const at = url.indexOf(marker);
        if (at < 0) continue;
        const path = decodeURIComponent(url.slice(at + marker.length).split("?")[0]);
        if (path.startsWith(FOLDER)) paths.add(path);
      }
    }
    if (rows.length < 1000) break;
    last = rows[rows.length - 1].id;
  }
  return [...paths].sort();
}

const encode = (path) => path.split("/").map(encodeURIComponent).join("/");
const publicUrl = (path) => `${URL_BASE}/storage/v1/object/public/recipe-media/${encode(path)}`;

async function exists(path) {
  const res = await retry(() => fetch(publicUrl(path), { method: "HEAD" }));
  return res.ok;
}

async function process1(path) {
  if (!force && (await Promise.all(WIDTHS.map((w) => exists(`_sized/${w}/${path}`)))).every(Boolean)) return "vorhanden";
  const res = await retry(() => fetch(publicUrl(path)));
  if (!res.ok) return `original fehlt (${res.status})`;
  const original = Buffer.from(await res.arrayBuffer());
  for (const w of WIDTHS) {
    // Wie bisher "contain": längste Seite höchstens w, nie vergrößern, Seitenverhältnis bleibt.
    const out = await sharp(original).rotate().resize({ width: w, height: w, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    const up = await retry(async () => {
      const r = await fetch(`${URL_BASE}/storage/v1/object/recipe-media/${encode(`_sized/${w}/${path}`)}`, {
        method: "POST",
        headers: { ...AUTH, "Content-Type": "image/jpeg", "x-upsert": "true", "cache-control": "max-age=604800" },
        body: out,
      });
      if (!r.ok) throw new Error(`upload ${r.status} ${await r.text()}`);
      return r;
    });
    void up;
  }
  return "erzeugt";
}

const all = (await imagePaths()).slice(0, limit);
console.log(`${all.length} Bilder unter ${FOLDER}`);
const counts = {};
let done = 0;
let next = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < all.length) {
      const path = all[next++];
      let result;
      try {
        result = await process1(path);
      } catch (err) {
        result = `fehler: ${String(err.message).slice(0, 80)}`;
        console.error(path, result);
      }
      counts[result.startsWith("fehler") ? "fehler" : result] = (counts[result.startsWith("fehler") ? "fehler" : result] ?? 0) + 1;
      if (++done % 200 === 0) console.log(`${done} / ${all.length}`, JSON.stringify(counts));
    }
  }),
);
console.log("fertig", JSON.stringify(counts));
process.exit(counts.fehler ? 1 : 0);
