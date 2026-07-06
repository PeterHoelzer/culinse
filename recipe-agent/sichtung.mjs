#!/usr/bin/env node
/**
 * Bild-Sichtung im Browser — Peters bequemer Weg (statt Dateien löschen):
 *
 *   node recipe-agent/sichtung.mjs        → öffnet http://127.0.0.1:4711
 *
 * Dort per Klick: Bilder erzeugen (falls noch keine da) → beste Variante
 * antippen → einzelne Gerichte neu würfeln → „Hochladen". Der Upload macht
 * exakt dasselbe wie UPLOAD=1 photographer.mjs (Bucket + DB-Entwurf mit
 * pipeline_status='pending_review'). Läuft nur lokal (127.0.0.1), keine Deps.
 */
import http from "http";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { ENV, IMAGES_DIR, logEvent } from "./lib/env.mjs";
import * as queue from "./lib/queue.mjs";
import { generateVariants } from "./lib/images.mjs";
import { getSupabase, findUserId } from "./lib/supa.mjs";
import { authorEmail, resolveChosenFile, uploadOne } from "./lib/publish.mjs";

const PORT = parseInt(ENV.SICHTUNG_PORT || "4711", 10);
const VARIANTS = Math.max(1, parseInt(ENV.VARIANTS || "3", 10));

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function state() {
  return {
    todo: queue.list("ready_for_image"),
    review: queue.list("image_ready"),
    done: queue.list("pending_review").length,
    rejected: queue.list("rejected").length,
  };
}

function variantInfo(item) {
  return (item.image?.variants || [])
    .map((f) => path.basename(f))
    .filter((f) => fs.existsSync(path.join(IMAGES_DIR, f)))
    .map((f) => ({
      file: f,
      n: parseInt((f.match(/-v(\d+)\.jpg$/) || [])[1] || "0", 10),
      mtime: fs.statSync(path.join(IMAGES_DIR, f)).mtimeMs,
    }));
}

function card(item) {
  const r = item.recipe;
  const n = r.nutrition || {};
  const chosen = item.image?.chosen_variant ?? null;
  const vars = variantInfo(item);
  const imgs = vars.map((v) => `
    <figure class="var ${chosen === v.n ? "sel" : ""}" data-slug="${item.slug}" data-n="${v.n}">
      <img src="/img/${v.file}?t=${v.mtime}" alt="Variante ${v.n}" loading="lazy">
      <figcaption>${chosen === v.n ? "✓ gewählt" : "Variante " + v.n}</figcaption>
    </figure>`).join("");
  return `
  <section class="card" id="card-${item.slug}">
    <header>
      <div>
        <h2>${esc(r.de?.title || item.slug)}</h2>
        <p class="meta">${esc(item.slug)} · ${n.calories ?? "?"} kcal · ${r.servings ?? "?"} Portionen</p>
      </div>
      <button class="ghost reroll" data-slug="${item.slug}">🎲 Neu würfeln</button>
    </header>
    ${vars.length ? `<div class="vars">${imgs}</div>` : `<p class="meta">Keine Bilddateien gefunden — bitte neu würfeln.</p>`}
  </section>`;
}

function todoCard(item) {
  return `
  <section class="card todo" id="card-${item.slug}">
    <header>
      <div>
        <h2>${esc(item.recipe?.de?.title || item.slug)}</h2>
        <p class="meta">${esc(item.slug)} · noch keine Bilder</p>
      </div>
      <button class="primary gen" data-slug="${item.slug}">📸 Bilder erzeugen</button>
    </header>
  </section>`;
}

function page() {
  const s = state();
  const pickedCount = s.review.filter((i) => {
    const c = resolveChosenFile(i.slug);
    return c && !c.ambiguous;
  }).length;
  const body = `
  <main>
    <h1>Culinse · Bild-Sichtung</h1>
    <p class="sub">${s.todo.length} ohne Bilder · ${s.review.length} zu sichten · ${s.done} warten auf Review${s.rejected ? ` · ${s.rejected} abgelehnt` : ""}</p>
    ${s.todo.length ? `<button class="primary big" id="genAll">📸 Alle Bilder erzeugen (${s.todo.length} Gerichte à ${VARIANTS} Varianten)</button>` : ""}
    ${s.todo.map(todoCard).join("")}
    ${s.review.map(card).join("")}
    ${s.review.length ? `<button class="primary big" id="uploadAll">⬆️ Hochladen (${pickedCount}/${s.review.length} gewählt)</button>` : ""}
    ${!s.todo.length && !s.review.length ? `<div class="empty">🧑‍🍳 Nichts zu sichten. ${s.done ? `<a href="https://culinse.com/de/admin/review" target="_blank">→ ${s.done} Rezept(e) im Review freigeben</a>` : "Der nächste Nacht-Lauf füllt die Queue."}</div>` : ""}
    <p class="foot"><button class="ghost" id="quit">Server beenden</button></p>
  </main>
  <div id="toast"></div>`;

  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Culinse Bild-Sichtung</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:-apple-system,system-ui,sans-serif; background:#faf7f2; color:#1f2937; }
  main { max-width:1000px; margin:0 auto; padding:24px 16px 80px; }
  h1 { font-size:26px; margin:8px 0 2px; }
  .sub { color:#6b7280; margin:0 0 20px; font-size:14px; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:16px; margin:14px 0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
  .card header { display:flex; justify-content:space-between; align-items:center; gap:12px; }
  .card h2 { font-size:18px; margin:0; }
  .meta { color:#9ca3af; font-size:12px; margin:2px 0 0; }
  .vars { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-top:12px; }
  .var { margin:0; cursor:pointer; border:3px solid transparent; border-radius:12px; overflow:hidden; background:#f3f4f6; transition:border-color .15s; }
  .var img { width:100%; aspect-ratio:1; object-fit:cover; display:block; }
  .var figcaption { text-align:center; font-size:13px; padding:6px; color:#6b7280; }
  .var.sel { border-color:#f97316; }
  .var.sel figcaption { color:#ea580c; font-weight:600; }
  button { font:inherit; cursor:pointer; border-radius:999px; border:1px solid transparent; padding:9px 16px; font-weight:600; font-size:14px; }
  button:disabled { opacity:.5; cursor:wait; }
  .primary { background:#f97316; color:#fff; }
  .primary:hover:not(:disabled) { background:#ea580c; }
  .ghost { background:#fff; border-color:#e5e7eb; color:#374151; }
  .ghost:hover:not(:disabled) { background:#f9fafb; }
  .big { width:100%; padding:14px; font-size:16px; margin:10px 0; }
  .empty { text-align:center; color:#6b7280; padding:60px 0; font-size:15px; }
  .empty a { color:#ea580c; }
  .foot { text-align:center; margin-top:30px; }
  #toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#111827; color:#fff; padding:10px 18px; border-radius:999px; font-size:14px; opacity:0; transition:opacity .2s; pointer-events:none; max-width:90vw; }
  #toast.show { opacity:1; }
</style></head><body>${body}
<script>
  const toast = (m) => { const t = document.getElementById("toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3500); };
  const api = async (p, body) => {
    const r = await fetch(p, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || r.status);
    return d;
  };
  // Variante wählen
  document.querySelectorAll(".var").forEach(el => el.addEventListener("click", async () => {
    try {
      await api("/api/pick", { slug: el.dataset.slug, n: +el.dataset.n });
      el.closest(".vars").querySelectorAll(".var").forEach(v => { v.classList.remove("sel"); v.querySelector("figcaption").textContent = "Variante " + v.dataset.n; });
      el.classList.add("sel"); el.querySelector("figcaption").textContent = "✓ gewählt";
    } catch (e) { toast("Fehler: " + e.message); }
  }));
  // Einzeln erzeugen / neu würfeln
  const genOne = async (btn, endpoint) => {
    btn.disabled = true; const old = btn.textContent; btn.textContent = "⏳ erzeuge …";
    try { await api(endpoint, { slug: btn.dataset.slug }); location.reload(); }
    catch (e) { toast("Fehler: " + e.message); btn.disabled = false; btn.textContent = old; }
  };
  document.querySelectorAll(".gen").forEach(b => b.addEventListener("click", () => genOne(b, "/api/generate")));
  document.querySelectorAll(".reroll").forEach(b => b.addEventListener("click", () => genOne(b, "/api/reroll")));
  // Alle erzeugen (sequenziell, damit nichts in Timeouts läuft)
  const genAll = document.getElementById("genAll");
  genAll && genAll.addEventListener("click", async () => {
    genAll.disabled = true;
    const slugs = [...document.querySelectorAll(".gen")].map(b => b.dataset.slug);
    let i = 0;
    for (const slug of slugs) {
      genAll.textContent = "⏳ erzeuge " + (++i) + "/" + slugs.length + " (" + slug + ") …";
      try { await api("/api/generate", { slug }); } catch (e) { toast(slug + ": " + e.message); }
    }
    location.reload();
  });
  // Hochladen
  const up = document.getElementById("uploadAll");
  up && up.addEventListener("click", async () => {
    up.disabled = true; up.textContent = "⏳ lade hoch …";
    try {
      const d = await api("/api/upload");
      toast(d.summary);
      setTimeout(() => location.reload(), 1200);
    } catch (e) { toast("Fehler: " + e.message); up.disabled = false; up.textContent = "⬆️ Hochladen"; }
  });
  document.getElementById("quit").addEventListener("click", async () => { await api("/api/quit").catch(() => {}); document.body.innerHTML = "<main><div class='empty'>Server beendet — Fenster kann zu.</div></main>"; });
</script></body></html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) reject(new Error("Body zu groß")); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
  });
}

const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(page());
    }

    if (req.method === "GET" && url.pathname.startsWith("/img/")) {
      const name = path.basename(url.pathname.slice(5));
      if (!/^[a-z0-9-]+(-v\d+)?\.jpg$/.test(name)) return json(res, 400, { error: "Ungültiger Dateiname" });
      const file = path.join(IMAGES_DIR, name);
      if (!fs.existsSync(file)) return json(res, 404, { error: "Nicht gefunden" });
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
      return fs.createReadStream(file).pipe(res);
    }

    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const body = await readBody(req);

    if (url.pathname === "/api/pick") {
      const item = queue.get(body.slug);
      if (!item || item.status !== "image_ready") return json(res, 400, { error: "Kein sichtbares Gericht: " + body.slug });
      queue.put({ ...item, image: { ...item.image, chosen_variant: body.n } });
      logEvent("sichtung", "picked", { slug: body.slug, n: body.n });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/api/generate" || url.pathname === "/api/reroll") {
      const isReroll = url.pathname === "/api/reroll";
      const item = queue.get(body.slug);
      const need = isReroll ? "image_ready" : "ready_for_image";
      if (!item || item.status !== need) return json(res, 400, { error: `Erwartet Status ${need}: ${body.slug}` });
      const { files, prompt } = await generateVariants(item.recipe, VARIANTS);
      if (isReroll) queue.put({ ...queue.get(body.slug), image: { prompt, variants: files, chosen_variant: null } });
      else queue.move(body.slug, "ready_for_image", "image_ready", "photographer", { image: { prompt, variants: files } });
      logEvent("sichtung", isReroll ? "rerolled" : "generated", { slug: body.slug });
      return json(res, 200, { ok: true, variants: files.map((f) => path.basename(f)) });
    }

    if (url.pathname === "/api/upload") {
      const items = queue.list("image_ready");
      if (!items.length) return json(res, 400, { error: "Nichts zu sichten." });
      const sb = await getSupabase();
      const userId = await findUserId(sb, authorEmail());
      let ok = 0, skipped = [];
      for (const item of items) {
        const chosen = resolveChosenFile(item.slug);
        if (!chosen || chosen.ambiguous) { skipped.push(item.slug + " (keine Variante gewählt)"); continue; }
        const r = await uploadOne(sb, userId, item, chosen);
        if (r.ok) ok++; else skipped.push(item.slug + " (" + r.skip + ")");
      }
      const summary = `${ok} hochgeladen${skipped.length ? " · übersprungen: " + skipped.join(", ") : ""} → Review: culinse.com/de/admin/review`;
      return json(res, 200, { ok: true, uploaded: ok, skipped, summary });
    }

    if (url.pathname === "/api/quit") {
      json(res, 200, { ok: true });
      setTimeout(() => process.exit(0), 200);
      return;
    }

    return json(res, 404, { error: "Unbekannte Route" });
  } catch (e) {
    return json(res, 500, { error: e?.message || String(e) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  const s = state();
  console.log(`Bild-Sichtung läuft: ${url}`);
  console.log(`${s.todo.length} ohne Bilder · ${s.review.length} zu sichten · ${s.done} warten auf App-Review`);
  console.log("Beenden: Ctrl+C oder Button auf der Seite.");
  exec(`open ${url}`, () => {});
});
