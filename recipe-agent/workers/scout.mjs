#!/usr/bin/env node
/**
 * Scout — (neu) → trend_candidate
 * Findet Trend-Gerichte aus eigenen Signalen (Saison, Themenliste, optional GSC),
 * macht den Vorab-Dedup (Slug/Titel) und legt die besten Kandidaten in die Queue.
 * Kein Scraping, keine KI. Drosselt bei zu vielen offenen Rezepten (Stau-Guard).
 *
 * Aufruf:  node recipe-agent/workers/scout.mjs
 * Env:     SCOUT_COUNT=1   Anzahl neuer Kandidaten (Default 1)
 *          MAX_OPEN=15     Stau-Grenze (offene lokale + pending_review in DB)
 */
import { ENV, logEvent } from "../lib/env.mjs";
import * as queue from "../lib/queue.mjs";
import { scoreDishes, proteinType } from "../lib/trends.mjs";
import { loadCorpus, quickDup } from "../lib/dedup.mjs";
import { fetchDbCorpus } from "../lib/supa.mjs";

const COUNT = parseInt(ENV.SCOUT_COUNT || "1", 10);
const MAX_OPEN = parseInt(ENV.MAX_OPEN || "15", 10);

async function main() {
  // Stau-Guard: lokale offene + DB pending_review
  const openLocal = queue.list().filter((i) =>
    ["trend_candidate", "composed", "ready_for_image", "image_ready"].includes(i.status)
  );
  const dbRows = await fetchDbCorpus();
  const pendingDb = dbRows ? dbRows.filter((r) => r.pipeline_status === "pending_review").length / 2 : 0;
  const open = openLocal.length + pendingDb;
  if (open >= MAX_OPEN) {
    console.log(`Stau-Guard: ${open} Rezepte offen (≥ ${MAX_OPEN}) — Scout pausiert.`);
    logEvent("scout", "throttled", { open });
    return;
  }
  if (dbRows === null) console.log("Hinweis: DB nicht erreichbar — Dedup nur gegen lokalen Korpus.\n");

  const corpus = await loadCorpus();
  const month = new Date().getMonth() + 1;
  const ranked = scoreDishes(month);

  console.log(`Scout — Monat ${month} · Kandidaten-Ranking (Top 8):\n`);
  const fresh = [];
  let printed = 0;
  for (const d of ranked) {
    const dup = quickDup(d.slug, d.de, d.en, corpus) ||
      (queue.get(d.slug) ? "schon in der Queue" : null);
    if (printed < 8) {
      console.log(`  ${dup ? "✗" : "•"} ${String(d.score).padStart(5)}  ${d.de}${dup ? `  (${dup})` : `  [${d.reasons.join(" · ")}]`}`);
      printed++;
    }
    if (!dup) fresh.push(d);
  }

  // Fleisch/Fisch-Quote (Peters Regel 14.08.2026): pro 10 Kandidaten werden 4 ersetzt
  // durch genau 2 Fisch- und 2 Fleischgerichte; die übrigen Plätze gehen an neutrale
  // (pflanzliche) Gerichte nach Score. Bei COUNT<5 entfällt die Quote (quota=0).
  // Fehlen Kandidaten einer Sorte, wird typoffen aufgefüllt — kein Leerlauf.
  const quota = Math.floor(COUNT / 5);
  let chosen;
  if (quota > 0) {
    const fischPick = fresh.filter((d) => proteinType(d) === "fisch").slice(0, quota);
    const fleischPick = fresh.filter((d) => proteinType(d) === "fleisch").slice(0, quota);
    const picked = new Set([...fischPick, ...fleischPick].map((d) => d.slug));
    const neutralPick = fresh
      .filter((d) => !picked.has(d.slug) && proteinType(d) === null)
      .slice(0, Math.max(0, COUNT - picked.size));
    for (const d of neutralPick) picked.add(d.slug);
    const fillPick = fresh
      .filter((d) => !picked.has(d.slug))
      .slice(0, Math.max(0, COUNT - picked.size));
    chosen = [...fischPick, ...fleischPick, ...neutralPick, ...fillPick]
      .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
    console.log(`\nQuote: ${fischPick.length}/${quota} Fisch · ${fleischPick.length}/${quota} Fleisch · ${neutralPick.length} neutral · ${fillPick.length} aufgefüllt.`);
  } else {
    chosen = fresh.slice(0, COUNT);
  }
  if (!chosen.length) { console.log("\nKeine neuen Kandidaten (alles Dublette?)."); return; }

  for (const d of chosen) {
    queue.create(d.slug, {
      dish_de: d.de, dish_en: d.en, category: d.category, topics: d.topics,
      month, season_hits: d.seasonHits, score: d.score, reasons: d.reasons, notes: d.notes,
    });
    logEvent("scout", "candidate_created", { slug: d.slug, score: d.score });
    console.log(`\n✓ Kandidat angelegt: ${d.slug} (Score ${d.score}) → trend_candidate`);
  }
}

main().catch((e) => { console.error("Scout-Abbruch:", e?.message || e); process.exit(1); });
