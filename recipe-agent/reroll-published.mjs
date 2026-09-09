#!/usr/bin/env node
/**
 * Reroll-Runde fuer BESTANDS-Bilder (09.09.): veroeffentlichte Rezepte mit
 * heiklen Zutaten (Garnelen/Fisch/Pilze — ingredientGuards) bekommen neue
 * Bild-Varianten MIT Leitplanken. Sichtung auf einer eigenen Mini-Seite;
 * ein Klick ersetzt NUR die Storage-Datei ({user}/agent/{slug}.jpg, upsert)
 * — keine Queue-, keine DB-Aenderung. Ungeklicktes bleibt unveraendert.
 *
 *   node recipe-agent/reroll-published.mjs           # generieren + Server
 *   SERVE=1 node recipe-agent/reroll-published.mjs   # nur Server (nichts generieren)
 *   ONLY=slug1,slug2 …                               # Teilmenge
 *   FRESH=1 …                                        # auch bereits gerollte neu
 *   VARIANTS=4 (Default)                             # Varianten je Gericht
 *
 * Erledigt-Kennzeichen: {slug}-v4.jpg existiert (alte Laeufe hatten nur v1-v3),
 * dadurch ist das Skript nach Cloudflare-Tageslimit einfach fortsetzbar.
 */
import fs from "fs";
import http from "http";
import path from "path";
import { execFile } from "child_process";
import { IMAGES_DIR, STATE_DIR, ensureDirs } from "./lib/env.mjs";
import { generateVariants, hasGuards, uploadSighted, localVariantPath } from "./lib/images.mjs";
import { getSupabase, findUserId } from "./lib/supa.mjs";
import { authorEmail } from "./lib/publish.mjs";

const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const FRESH = !!process.env.FRESH;
const SERVE_ONLY = !!process.env.SERVE;
const VARIANTS = Math.max(2, parseInt(process.env.VARIANTS || "4", 10));
const PORT = parseInt(process.env.PORT || "4712", 10);

/** Alle Agent-Eintraege (queue + archive) als slug -> image_prompt. */
function collectPrompts() {
  const map = new Map();
  for (const dir of ["queue", "archive"]) {
    const full = path.join(STATE_DIR, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".json") || f.endsWith(".response.json")) continue;
      try {
        const d = JSON.parse(fs.readFileSync(path.join(full, f), "utf8"));
        const slug = d.slug || (d.recipe && d.recipe.slug);
        const ip = d.recipe && d.recipe.image_prompt;
        if (slug && ip && !map.has(slug)) map.set(slug, ip);
      } catch { /* kaputte Datei ueberspringen */ }
    }
  }
  return map;
}

/** Live veroeffentlichte Agent-Rezepte: slug -> { title, image_url }. */
async function liveAgentRecipes(sb) {
  const { data, error } = await sb
    .from("user_recipes")
    .select("title, image_url, language, is_public")
    .eq("is_public", true)
    .like("image_url", "%/agent/%");
  if (error) throw error;
  const map = new Map();
  for (const r of data || []) {
    const m = /\/agent\/([a-z0-9-]+)\.jpg/.exec(r.image_url || "");
    if (!m) continue;
    const slug = m[1];
    const prev = map.get(slug) || {};
    const next = { ...prev };
    next.image_url = next.image_url || r.image_url;
    if (r.language === "de" || !next.title) next.title = r.title;
    if (r.language === "en" || !next.title_en) next.title_en = r.title;
    map.set(slug, next);
  }
  return map;
}

function doneAlready(slug) {
  return fs.existsSync(localVariantPath(slug, 4));
}

async function main() {
  ensureDirs();
  const sb = await getSupabase();
  const userId = await findUserId(sb, authorEmail());
  const prompts = collectPrompts();
  const live = await liveAgentRecipes(sb);

  // Prompt: gespeicherter image_prompt, sonst Titel-Fallback (aeltere Laeufe
  // haben keine Queue-JSONs mehr) — Guards + STYLE kommen in buildPrompt dazu.
  const promptFor = (slug) => {
    const stored = prompts.get(slug);
    if (stored) return stored;
    const info = live.get(slug) || {};
    const t = info.title_en || info.title;
    return t ? `${t}, freshly prepared and plated, served in one simple dish on a wooden table` : null;
  };
  // Kandidaten: live + heikle Zutat + irgendein Prompt vorhanden
  let slugs = [...live.keys()].filter((slug) => {
    const ip = promptFor(slug);
    return ip && hasGuards({ slug, image_prompt: ip });
  }).sort();
  if (ONLY.length) slugs = slugs.filter((s) => ONLY.includes(s));

  const fallbackCount = slugs.filter((s) => !prompts.get(s)).length;
  if (fallbackCount)
    console.log(`Mit Titel-Fallback-Prompt (kein Queue-JSON mehr): ${fallbackCount}`);

  console.log(`Kandidaten (${slugs.length}):`, slugs.join(", ") || "-");

  if (!SERVE_ONLY) {
    let ok = 0, skipped = 0, failed = 0;
    for (const slug of slugs) {
      if (!FRESH && doneAlready(slug)) { skipped++; continue; }
      process.stdout.write(`• ${slug} … `);
      try {
        await generateVariants({ slug, image_prompt: promptFor(slug) }, VARIANTS);
        ok++; console.log(`ok (${VARIANTS} Varianten)`);
      } catch (e) {
        failed++; console.log(`FEHLER: ${String(e).slice(0, 140)}`);
        if (/429|quota|neuron/i.test(String(e))) {
          console.log("Cloudflare-Kontingent erschoepft — spaeter erneut starten (macht nur die fehlenden).");
          break;
        }
      }
    }
    console.log(`\nGeneriert: ${ok} · uebersprungen (schon gerollt): ${skipped} · Fehler: ${failed}`);
  }

  // ── Mini-Sichtung ──────────────────────────────────────────────────────────
  const replaced = new Set();
  const server = http.createServer(async (req, res) => {
    const json = (code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    try {
      if (req.method === "GET" && req.url === "/") {
        const cards = slugs.map((slug) => {
          const info = live.get(slug) || {};
          const vs = [];
          for (let i = 1; i <= 8; i++) if (fs.existsSync(localVariantPath(slug, i))) vs.push(i);
          const imgs = vs.map((i) =>
            `<div class="v"><img src="/img/${slug}-v${i}.jpg" loading="lazy"><br><button onclick="pick('${slug}',${i},this)">Diese live schalten</button></div>`
          ).join("");
          return `<div class="card" id="c-${slug}"><h3>${info.title || slug}</h3>
            <div class="row"><div class="v"><img src="${info.image_url || ""}?cb=${Date.now()}" loading="lazy"><br><b>Aktuell live</b></div>${imgs}</div></div>`;
        }).join("\n");
        const html = `<!doctype html><meta charset="utf-8"><title>Reroll-Sichtung</title>
<style>body{font-family:-apple-system,sans-serif;margin:20px;background:#fafaf9}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:14px;margin-bottom:18px}
.card.done{outline:3px solid #16a34a}.row{display:flex;gap:10px;overflow-x:auto}
.v{text-align:center;font-size:12px}.v img{width:190px;height:190px;object-fit:cover;border-radius:8px}
button{margin-top:6px;padding:6px 10px;border-radius:999px;border:0;background:#f97316;color:#fff;font-weight:600;cursor:pointer}
h1{font-size:20px}</style>
<h1>Bestands-Bilder erneuern — Klick ersetzt das Live-Bild (${slugs.length} Gerichte)</h1>
<p>Nichts passiert ohne Klick. Ersetzte Karten werden gr&uuml;n. Bild-Caches brauchen bis zu 1&nbsp;h.</p>
${cards}
<script>async function pick(slug,n,btn){btn.disabled=true;btn.textContent="l\\u00e4uft \\u2026";
const r=await fetch("/pick",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,n})});
const d=await r.json();if(d.ok){document.getElementById("c-"+slug).classList.add("done");btn.textContent="ersetzt \\u2713";}
else{btn.textContent="Fehler";alert(d.error||"Fehler");btn.disabled=false;}}</script>`;
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(html); return;
      }
      if (req.method === "GET" && req.url.startsWith("/img/")) {
        const name = decodeURIComponent(req.url.slice(5));
        if (!/^[a-z0-9-]+-v\d+\.jpg$/.test(name)) return json(400, { error: "bad name" });
        const file = path.join(IMAGES_DIR, name);
        if (!fs.existsSync(file)) return json(404, { error: "not found" });
        res.writeHead(200, { "Content-Type": "image/jpeg" }); res.end(fs.readFileSync(file)); return;
      }
      if (req.method === "POST" && req.url === "/pick") {
        let body = "";
        for await (const c of req) body += c;
        const { slug, n } = JSON.parse(body || "{}");
        if (!slugs.includes(slug)) return json(400, { error: "unbekannter slug" });
        const file = localVariantPath(slug, parseInt(n, 10));
        if (!fs.existsSync(file)) return json(400, { error: "Variante fehlt" });
        const url = await uploadSighted(sb, userId, slug, file);
        replaced.add(slug);
        console.log(`ersetzt: ${slug} (v${n}) -> ${url}`);
        return json(200, { ok: true, url });
      }
      json(404, { error: "not found" });
    } catch (e) { json(500, { error: String(e).slice(0, 200) }); }
  });
  server.listen(PORT, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${PORT}/`;
    console.log(`\nSichtung offen: ${url} (Strg+C beendet; ersetzt wird nur per Klick)`);
    if (process.env.OPEN !== "0") execFile("open", [url], () => {});
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
