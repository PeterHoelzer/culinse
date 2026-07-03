/**
 * Muster-Prompt für den Autor: prompts/author.md laden und mit dem Kandidaten
 * befüllen. Derselbe Prompt für beide Wege:
 *   – manuell (--print-prompt → in Claude einfügen → Antwort speichern → --ingest)
 *   – API (author.mjs ruft api.anthropic.com direkt, sobald ANTHROPIC_API_KEY da ist)
 */
import fs from "fs";
import path from "path";
import { PROMPTS_DIR, SEED_RECIPES } from "./env.mjs";
import { SEASON } from "./trends.mjs";

const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

export function existingTitles() {
  const seed = JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8"));
  return seed.recipes.flatMap((r) => [r.de?.title, r.en?.title]).filter(Boolean);
}

export function seasonContext(month) {
  const inSeason = Object.entries(SEASON)
    .filter(([, months]) => months.includes(month))
    .map(([p]) => p);
  return `${MONTH_NAMES[month - 1]} — Saison in Deutschland: ${inSeason.join(", ")}`;
}

export function buildAuthorPrompt(item) {
  const tpl = fs.readFileSync(path.join(PROMPTS_DIR, "author.md"), "utf8");
  const c = item.candidate;
  const month = c.month || new Date().getMonth() + 1;
  return tpl
    .replaceAll("{{SLUG}}", item.slug)
    .replaceAll("{{DISH_DE}}", c.dish_de || c.de || "")
    .replaceAll("{{DISH_EN}}", c.dish_en || c.en || "")
    .replaceAll("{{CATEGORY}}", c.category || "")
    .replaceAll("{{SEASON_CONTEXT}}", seasonContext(month))
    .replaceAll("{{AUTHOR_NOTES}}", c.notes || c.author_notes || "—")
    .replaceAll("{{EXISTING_TITLES}}", existingTitles().join(" · "));
}

/** Antwort des LLM robust zu JSON parsen (Markdown-Zäune tolerieren). */
export function parseAuthorResponse(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Keine JSON-Struktur in der Autor-Antwort gefunden.");
  return JSON.parse(t.slice(start, end + 1));
}
