// Erzeugt lib/browse/slugs.json: die Adressen der Themenseiten je Sprache
// (/de/recipes/japanische-rezepte, /fr/recipes/recettes-japonaises …).
//
// Die Slugs entstehen aus den Überschriften der Themenseiten in
// messages/<sprache>.json (browse.landing.titles). Englisch behält die
// neutralen Slugs aus lib/browse/facets.ts, ebenso Sprachen mit nicht
// lateinischer Schrift (ru, zh, ja, bn) und alle Regionen (Eigennamen).
//
// Aufruf nach Änderungen an den Überschriften:
//   node scripts/generate-browse-slugs.mjs
import fs from "node:fs";
import { LANDINGS } from "../lib/browse/facets.ts";

const LOCALES = ["de", "es", "fr", "it", "pt", "nl", "pl", "cs", "tr", "id", "vi"];
const GERMAN = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const OTHER = { ı: "i", ł: "l", đ: "d", ø: "o", æ: "ae", œ: "oe", ß: "ss" };

function slugify(text, locale) {
  let s = text.toLowerCase();
  if (locale === "de") s = s.replace(/[äöüß]/g, (c) => GERMAN[c]);
  s = s.replace(/[ıłđøæœß]/g, (c) => OTHER[c]);
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const topics = LANDINGS.filter((l) => l.group !== "region");
const reserved = new Set(["create", "import", ...LANDINGS.filter((l) => l.group === "region").map((l) => l.slug)]);
const out = {};
const owner = new Map(); // Slug → Thema, über alle Sprachen
for (const l of LANDINGS) owner.set(l.slug, `${l.group}:${l.key}`);
let problems = 0;

for (const locale of LOCALES) {
  const titles = JSON.parse(fs.readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")).browse.landing.titles;
  const map = {};
  const used = new Set();
  for (const l of topics) {
    const id = `${l.group}:${l.key}`;
    const slug = slugify(titles[l.group][l.key], locale);
    if (!slug || reserved.has(slug) || used.has(slug)) {
      console.error(`${locale}: Slug "${slug}" für ${id} ist leer, reserviert oder doppelt`);
      problems++;
      continue;
    }
    // Derselbe Slug darf in keiner anderen Sprache ein anderes Thema meinen,
    // sonst wäre ein Sprachwechsel auf dieser Adresse nicht eindeutig.
    if (owner.has(slug) && owner.get(slug) !== id) {
      console.error(`${locale}: Slug "${slug}" für ${id} gehört schon zu ${owner.get(slug)}`);
      problems++;
      continue;
    }
    owner.set(slug, id);
    used.add(slug);
    map[id] = slug;
  }
  out[locale] = map;
}

if (problems) {
  console.error(`${problems} Problem(e), nichts geschrieben.`);
  process.exit(1);
}
fs.writeFileSync(new URL("../lib/browse/slugs.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`lib/browse/slugs.json: ${LOCALES.length} Sprachen, je ${topics.length} Themen`);
