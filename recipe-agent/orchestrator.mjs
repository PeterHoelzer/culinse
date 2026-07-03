#!/usr/bin/env node
/**
 * Orchestrator — ein Tageslauf: Scout → Autor → Prüfer → Fotograf (lokal).
 * Die Worker sind über die Datei-Queue entkoppelt; jeder ist einzeln neu
 * startbar. Der Lauf STOPPT bewusst nach der lokalen Bild-Erzeugung:
 * Peters Sichtungs-Regel — Upload + DB erst nach seinem OK (UPLOAD=1),
 * und der Distributor läuft grundsätzlich nur auf ausdrückliche Freigabe.
 *
 * Aufruf:  node recipe-agent/orchestrator.mjs
 * Env:     SCOUT_COUNT=10 für den vollen Tageslauf (Default 1)
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import * as queue from "./lib/queue.mjs";
import { logEvent } from "./lib/env.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = (f) => path.join(HERE, "workers", f);

function run(name, file, extraEnv = {}) {
  console.log(`\n════ ${name} ═══════════════════════════════════════`);
  const res = spawnSync(process.execPath, [file], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  // Exit-Code 2 = Autor wartet auf manuellen Prompt-Weg (kein API-Key) — kein Fehler
  if (res.status !== 0 && res.status !== 2)
    throw new Error(`${name} fehlgeschlagen (Exit ${res.status})`);
  return res.status;
}

function summary() {
  const counts = {};
  for (const i of queue.list()) counts[i.status] = (counts[i.status] || 0) + 1;
  console.log("\n════ Queue-Stand ═══════════════════════════════════");
  for (const [s, n] of Object.entries(counts)) console.log(`  ${s.padEnd(16)} ${n}`);
  logEvent("orchestrator", "summary", counts);
}

async function main() {
  run("Scout", W("scout.mjs"));
  const authorStatus = run("Autor", W("author.mjs"));
  if (authorStatus === 2) {
    summary();
    console.log("\nWeiter, sobald composed-Rezepte da sind: node recipe-agent/orchestrator.mjs");
    return;
  }
  run("Prüfer", W("checker.mjs"));
  run("Fotograf (lokal)", W("photographer.mjs"));
  summary();
  console.log(
    "\nNächste Schritte (bewusst manuell):\n" +
    "  1) Bilder sichten:  open recipe-agent/state/images/\n" +
    "  2) Hochladen + DB:  UPLOAD=1 node recipe-agent/workers/photographer.mjs\n" +
    "  3) Review in der App (pending_review) → Freigabe → node recipe-agent/workers/distributor.mjs"
  );
}

main().catch((e) => { console.error("Orchestrator-Abbruch:", e?.message || e); process.exit(1); });
