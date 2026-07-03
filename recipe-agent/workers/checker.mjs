#!/usr/bin/env node
/**
 * Prüfer — composed → ready_for_image | rejected
 * Deterministisches Qualitäts-Gate (Playbook A.5, strenge Stufe: ≥ 4 Zutaten,
 * ≥ 3 Schritte, 4/4/9 ≤ 12 %, Einheiten metrisch, image_prompt rein positiv)
 * plus gründlicher Dedup (Zutaten-Jaccard) — BEVOR ein Bild erzeugt wird
 * (kostenoptimale Reihenfolge, Plan §2). Keine KI.
 *
 * Aufruf:  node recipe-agent/workers/checker.mjs
 */
import { logEvent } from "../lib/env.mjs";
import * as queue from "../lib/queue.mjs";
import { validateRecipe } from "../lib/validate.mjs";
import { loadCorpus, deepDup } from "../lib/dedup.mjs";

async function main() {
  const items = queue.list("composed");
  if (!items.length) { console.log("Nichts zu prüfen (kein Eintrag im Status composed)."); return; }

  const corpus = await loadCorpus();
  if (!corpus.dbReachable)
    console.log("Hinweis: DB nicht erreichbar — Dedup nur gegen lokalen Korpus (Seed + seen.json).\n");

  let ok = 0, bad = 0;
  for (const item of items) {
    console.log(`── Prüfe: ${item.slug} ─────────────────────────────`);
    const { errors, warnings, macro } = validateRecipe(item.recipe);

    if (macro)
      console.log(`  Nährwerte: angegeben ${macro.given} kcal | 4/4/9 = ${macro.calc} | Abw. ${macro.devPct} %`);

    const dup = deepDup(item.recipe, corpus);
    console.log(`  Dedup (Jaccard): max. Ähnlichkeit ${(dup.sim * 100).toFixed(0)} %${dup.slug ? ` zu '${dup.slug}'` : ""}`);
    if (dup.verdict === "duplicate") errors.push(`Dublette: ${(dup.sim * 100).toFixed(0)} % Zutaten-Überlappung mit '${dup.slug}'`);
    if (dup.verdict === "warn") warnings.push(`Ähnlich zu '${dup.slug}' (${(dup.sim * 100).toFixed(0)} %) — bitte im Review beachten`);

    for (const w of warnings) console.log(`  WARN  ${w}`);

    if (errors.length) {
      for (const e of errors) console.log(`  FEHLER  ${e}`);
      queue.move(item.slug, "composed", "rejected", "checker", { check: { errors, warnings, macro, dedup: dup } });
      logEvent("checker", "rejected", { slug: item.slug, errors: errors.length });
      console.log(`✗ ${item.slug} → rejected (${errors.length} Fehler)\n`);
      bad++;
    } else {
      queue.move(item.slug, "composed", "ready_for_image", "checker", { check: { errors: [], warnings, macro, dedup: dup } });
      logEvent("checker", "passed", { slug: item.slug });
      console.log(`✓ ${item.slug} → ready_for_image\n`);
      ok++;
    }
  }
  console.log(`Prüfer fertig: ${ok} bestanden, ${bad} abgelehnt.`);
}

main().catch((e) => { console.error("Prüfer-Abbruch:", e?.message || e); process.exit(1); });
