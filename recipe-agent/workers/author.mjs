#!/usr/bin/env node
/**
 * Autor — trend_candidate → composed  (der einzige echte KI-Worker)
 * Schreibt pro Kandidat ein ORIGINAL-Rezept (DE+EN, metrisch, Nährwerte vorab)
 * über den Muster-Prompt in prompts/author.md.
 *
 * Zwei Betriebsarten:
 *   API     node recipe-agent/workers/author.mjs
 *           (braucht ANTHROPIC_API_KEY in .env.local; Modell via AUTHOR_MODEL)
 *   Manuell node recipe-agent/workers/author.mjs --print-prompt [slug]
 *             → befüllten Muster-Prompt ausgeben + nach state/queue/<slug>.prompt.txt
 *           Antwort-JSON speichern als state/queue/<slug>.response.json, dann:
 *           node recipe-agent/workers/author.mjs --ingest <slug>
 */
import fs from "fs";
import path from "path";
import { ENV, QUEUE_DIR, logEvent } from "../lib/env.mjs";
import * as queue from "../lib/queue.mjs";
import { buildAuthorPrompt, parseAuthorResponse } from "../lib/prompt.mjs";

const MODEL = ENV.AUTHOR_MODEL || "claude-sonnet-5";

async function callClaude(prompt) {
  const key = ENV.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return { text, usage: data.usage };
}

function attachRecipe(item, recipe, by) {
  if (recipe.slug !== item.slug)
    throw new Error(`Slug-Mismatch: Antwort '${recipe.slug}' ≠ Kandidat '${item.slug}'`);
  queue.move(item.slug, "trend_candidate", "composed", by, { recipe });
  logEvent("author", "composed", { slug: item.slug, by });
  console.log(`✓ ${item.slug} → composed (${by})`);
}

async function main() {
  const args = process.argv.slice(2);

  // ── Manuell: Prompt ausgeben ────────────────────────────────────────────────
  if (args[0] === "--print-prompt") {
    const item = args[1] ? queue.get(args[1]) : queue.list("trend_candidate")[0];
    if (!item || item.status !== "trend_candidate")
      throw new Error("Kein Kandidat im Status trend_candidate gefunden.");
    const prompt = buildAuthorPrompt(item);
    const f = path.join(QUEUE_DIR, `${item.slug}.prompt.txt`);
    fs.writeFileSync(f, prompt);
    console.log(prompt);
    console.error(`\n— Prompt auch gespeichert: ${path.relative(process.cwd(), f)}`);
    console.error(`— Antwort-JSON ablegen als: state/queue/${item.slug}.response.json, dann --ingest ${item.slug}`);
    return;
  }

  // ── Manuell: Antwort einlesen ───────────────────────────────────────────────
  if (args[0] === "--ingest") {
    const slug = args[1];
    if (!slug) throw new Error("Aufruf: --ingest <slug> [datei]");
    const item = queue.get(slug);
    if (!item) throw new Error(`Kein Queue-Eintrag: ${slug}`);
    const file = args[2] || path.join(QUEUE_DIR, `${slug}.response.json`);
    const recipe = parseAuthorResponse(fs.readFileSync(file, "utf8"));
    attachRecipe(item, recipe, "author:manual");
    return;
  }

  // ── API-Modus ───────────────────────────────────────────────────────────────
  const candidates = queue.list("trend_candidate");
  if (!candidates.length) { console.log("Keine Kandidaten (trend_candidate) in der Queue."); return; }
  if (!ENV.ANTHROPIC_API_KEY) {
    console.log(
      "ANTHROPIC_API_KEY fehlt in .env.local — manueller Weg:\n" +
      `  1) node recipe-agent/workers/author.mjs --print-prompt\n` +
      `  2) Prompt in Claude einfügen, Antwort speichern als state/queue/<slug>.response.json\n` +
      `  3) node recipe-agent/workers/author.mjs --ingest <slug>`
    );
    process.exit(2);
  }
  for (const item of candidates) {
    process.stdout.write(`• ${item.slug} … `);
    const { text, usage } = await callClaude(buildAuthorPrompt(item));
    const recipe = parseAuthorResponse(text);
    attachRecipe(item, recipe, `author:api(${MODEL})`);
    if (usage) logEvent("author", "tokens", { slug: item.slug, in: usage.input_tokens, out: usage.output_tokens });
  }
}

main().catch((e) => { console.error("Autor-Abbruch:", e?.message || e); process.exit(1); });
