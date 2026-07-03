/**
 * Zentrale Pfade + .env.local-Loader für den Rezept-Agenten.
 * Keys werden NUR zur Laufzeit aus <repo>/.env.local gelesen — nie in Dateien
 * geschrieben, nie geloggt.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const AGENT_DIR = path.resolve(HERE, "..");            // recipe-agent/
export const ROOT = path.resolve(AGENT_DIR, "..");            // Repo-Root
export const STATE_DIR = path.join(AGENT_DIR, "state");
export const QUEUE_DIR = path.join(STATE_DIR, "queue");
export const IMAGES_DIR = path.join(STATE_DIR, "images");
export const LOG_DIR = path.join(STATE_DIR, "log");
export const SEEN_FILE = path.join(STATE_DIR, "seen.json");
export const PROMPTS_DIR = path.join(AGENT_DIR, "prompts");
export const SEED_RECIPES = path.join(ROOT, "supabase", "seed", "recipes.json");

export function loadEnv() {
  const env = { ...process.env };
  try {
    const p = path.join(ROOT, ".env.local");
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      if (env[k] === undefined) env[k] = t.slice(i + 1).trim();
    }
  } catch {
    /* keine .env.local — Variablen müssen anders gesetzt sein */
  }
  return env;
}

export const ENV = loadEnv();

/** state/-Verzeichnisse sicherstellen. */
export function ensureDirs() {
  for (const d of [STATE_DIR, QUEUE_DIR, IMAGES_DIR, LOG_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

/** Kurzer Tageslog-Eintrag (JSON-Zeile) nach state/log/YYYY-MM-DD.jsonl */
export function logEvent(worker, event, detail = {}) {
  ensureDirs();
  const day = new Date().toISOString().slice(0, 10);
  const line = JSON.stringify({ at: new Date().toISOString(), worker, event, ...detail });
  fs.appendFileSync(path.join(LOG_DIR, `${day}.jsonl`), line + "\n");
}
