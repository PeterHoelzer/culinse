// Erzeugt lib/systemTexts.ts aus dem Bereich "error" der messages/*.json.
// Aufruf: node scripts/generate-system-texts.mjs
// Nötig nach jeder Änderung an den Texten der Fehlerseite oder der Seite
// „Seite nicht gefunden“. Diese Seiten laufen ohne next-intl (siehe
// components/SystemPage.tsx) und brauchen ihre Texte deshalb als feste Tabelle.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const KEYS = ["notFound", "notFoundSub", "backHome", "title", "retry", "text", "id"];
const rows = [];
for (const file of readdirSync("messages").filter((f) => f.endsWith(".json")).sort()) {
  const locale = file.replace(".json", "");
  const error = JSON.parse(readFileSync(`messages/${file}`, "utf8")).error ?? {};
  for (const key of KEYS) {
    if (typeof error[key] !== "string" || !error[key]) throw new Error(`messages/${file}: error.${key} fehlt`);
  }
  rows.push(`  ${locale}: { ${KEYS.map((k) => `${k}: ${JSON.stringify(error[k])}`).join(", ")} },`);
}

writeFileSync(
  "lib/systemTexts.ts",
  `// Erzeugt von scripts/generate-system-texts.mjs aus messages/*.json (Bereich "error").
// Nicht von Hand ändern: Texte in messages/*.json pflegen und das Skript neu laufen lassen.
export type SystemTexts = { ${KEYS.map((k) => `${k}: string`).join("; ")} };

export const SYSTEM_TEXTS: Record<string, SystemTexts> = {
${rows.join("\n")}
};
`,
);
console.log(`lib/systemTexts.ts: ${rows.length} Sprachen`);
