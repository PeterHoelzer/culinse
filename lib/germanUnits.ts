/*
  Deutsche Zutatenzeilen lesbar machen (17.11.2026).

  In der Datenbank steht je Zutat Menge, Einheit und Name, die Einheit immer in
  einer festen Form: „3 | Zehe | Knoblauch“, „1 | Stück | Zwiebel“,
  „2 | Blatt | Lorbeerblätter“. So zusammengesetzt liest es sich hölzern. Diese
  Regel ändert nur die Anzeige, nicht die Daten, und richtet sich nach der
  (auch umgerechneten) Menge: „3 Zehen Knoblauch“, „1 Zwiebel“,
  „2 Lorbeerblätter“.

  Gilt nur für deutsche Rezepte. Andere Sprachen haben eigene Zählwörter, die
  teils nötig sind (Japanisch, Chinesisch) und hier nicht angefasst werden.
*/

/** Einheiten mit eigener Mehrzahl: [Einzahl, Mehrzahl]. Alle anderen bleiben, wie sie sind (Bund, Blatt, Päckchen, EL, g …). */
const PAIRS: [string, string][] = [
  ["Zehe", "Zehen"],
  ["Scheibe", "Scheiben"],
  ["Dose", "Dosen"],
  ["Packung", "Packungen"],
  ["Prise", "Prisen"],
  ["Stange", "Stangen"],
  ["Zweig", "Zweige"],
  ["Stiel", "Stiele"],
  ["Büchse", "Büchsen"],
  ["Glas", "Gläser"],
  ["Rolle", "Rollen"],
  ["Tube", "Tuben"],
];

/**
  Bei diesen Zutaten ist „Stück“ die eigentliche Mengenangabe („1 Stück Ingwer
  (etwa 2 cm)“), ohne das Wort wäre die Zeile falsch („1 Ingwer“).
*/
const PIECE_NEEDED =
  /^(Ingwer|Knoblauch|Kassiazimt|Zimt|Mandarinenschale|Orangenschale|Zitronenschale|Zitronenabrieb|Kombu|Kombu-Alge|Tofu|Thunfisch|Weißbrot|Klippfisch|Zitronengras|Kardamom|Galgant|Kurkuma|Meerrettich|Butter|Käse|Parmesan|Speck|Schokolade|Konnyaku|Kürbis|Fisch)$/;

/**
  Hauptwörter, die im Bestand auch bei mehreren Stück in der Einzahl stehen
  („4 Stück Lauch“). Ohne „Stück“ hieße es „4 Lauch“.
*/
const SINGULAR_NAMES =
  /^(Lauch|Staudensellerie|Fladenbrot|Hähnchenbrustfilet|Entenbrust|Kopfsalat|Kalmar|Tomate|Zitrone|Bio-Zitrone|Limette|Zwiebel|Gemüsezwiebel|Frühlingszwiebel|Apfel|Ei|Banane|Avocado|Mango|Chili|Baguette|Blumenkohl|Chinakohl|Weißkohl|Wirsing|Römersalat|Romanasalat|Zimtstange|Krake)$/;

/** „Thymian (Zweige)“, „Staudensellerie (Stangen mit Blättern)“: Das Zählwort steht in der Klammer. */
const COUNT_WORD_IN_PARENS = /^(.+?) \((Zweige?|Stangen?|Stiele?|Stängel)(?: ([^)]+))?\)$/;

function plural(unit: string, many: boolean): string {
  for (const [one, more] of PAIRS) {
    if (unit === one || unit === more) return many ? more : one;
  }
  return unit;
}

/** Das erste großgeschriebene Wort vor einer Klammer: bei „frischer Ingwer (gerieben)“ ist das „Ingwer“. */
function headNoun(name: string): string {
  const words = name.replace(/\(.*$/, "").trim().split(/\s+/);
  const noun = words.find((w) => /^[A-ZÄÖÜ]/.test(w)) ?? words[0] ?? "";
  return noun.replace(/[,;]$/, "");
}

/**
  Einheit und Name einer deutschen Zutatenzeile für die Anzeige.
  `amount` ist die anzuzeigende Menge (bei „2–3“ die obere Zahl), `null`, wenn
  keine Zahl dasteht. `storedAmount` ist die Menge, wie sie im Rezept steht,
  bevor die Portionen umgestellt wurden: An ihr hängt, ob der Name in der
  Einzahl oder Mehrzahl geschrieben ist. Eine leere Einheit heißt: nichts
  zwischen Menge und Name.
*/
export function germanIngredientLine(
  unit: string,
  name: string,
  amount: number | null,
  storedAmount: number | null = amount
): { unit: string; name: string } {
  const many = amount != null && amount > 1;
  const beforeParens = name.replace(/\(.*$/, "").trim();

  // „1 Blatt Lorbeerblatt“ / „2 Stück Lorbeerblätter“ → „1 Lorbeerblatt“ / „2 Lorbeerblätter“
  if ((unit === "Blatt" || unit === "Stück") && /^Lorbeerbl(att|ätter)$/.test(beforeParens)) {
    const rest = name.slice(name.indexOf(beforeParens) + beforeParens.length);
    return { unit: "", name: (amount == null ? beforeParens : many ? "Lorbeerblätter" : "Lorbeerblatt") + rest };
  }

  if (unit === "Stück") {
    const m = name.match(COUNT_WORD_IN_PARENS);
    if (m) return { unit: plural(m[2], many), name: m[3] ? `${m[1]} (${m[3]})` : m[1] };
    const head = headNoun(name);
    if (PIECE_NEEDED.test(head) || /\((?:[^)]* )?(Zweige?|Stangen?|Stiele?|Stängel)\b/.test(name)) return { unit, name };
    // Name in der Einzahl, Menge über 1: „2 Stück Zwiebel“ bleibt, „2 Zwiebel“ wäre falsch.
    const singularName = (storedAmount != null && storedAmount <= 1) || SINGULAR_NAMES.test(head);
    if (many && singularName) return { unit, name };
    return { unit: "", name };
  }

  // Das Zählwort steckt schon im Namen: „2 Blatt Shiso-Blätter“, „3 Zehen Knoblauchzehen“
  const stem = unit === "Blatt" ? /bl(att|ätter)/i : unit === "Zehe" || unit === "Zehen" ? /zehen?\b/i : unit === "Scheibe" || unit === "Scheiben" ? /scheiben?\b/i : null;
  if (stem && stem.test(beforeParens)) return { unit: "", name };

  return { unit: plural(unit, many), name };
}

/** Ganze Zeile ohne Menge („Zehen Knoblauch“, „Zwiebel“). */
export function germanIngredientRest(unit: string, name: string, amount: number | null, storedAmount: number | null = amount): string {
  const d = germanIngredientLine(unit, name, amount, storedAmount);
  return [d.unit, d.name].filter(Boolean).join(" ");
}

/** „0,5“, „1/2“, „2–3“ (obere Zahl) als Zahl; `null`, wenn keine Menge dasteht. */
function parseLeadingAmount(lead: string): number | null {
  const frac = lead.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const m = lead.match(/^(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|bis)\s*(\d+(?:[.,]\d+)?))?$/);
  return m ? parseFloat((m[2] ?? m[1]).replace(",", ".")) : null;
}

/**
  Fertige Zeile „Menge Einheit Name“ mit deutschen Einheiten, für Stellen ohne
  Portionsregler (strukturierte Daten). `original` ist die Zeile, wie die API
  sie liefert; passt sie nicht zu Einheit und Name, bleibt sie unverändert.
*/
export function germanOriginalLine(original: string, unit: string, name: string): string {
  const tail = [unit, name].filter(Boolean).join(" ");
  if (!tail || !original.endsWith(tail)) return original;
  const lead = original.slice(0, original.length - tail.length).trim();
  return [lead, germanIngredientRest(unit, name, lead ? parseLeadingAmount(lead) : null)].filter(Boolean).join(" ");
}
