/**
 * convertMeasurements
 * --------------------
 * Converts US/imperial cooking measurements found in free text into metric
 * units used in Germany/Europe (ml, g, cm, °C).
 *
 * Recipes on Culinse come from US APIs (Spoonacular, TheMealDB, Tasty, Edamam)
 * and therefore use cups / oz / °F. This runs BEFORE the German translation
 * (MyMemory) so the German recipe page shows sensible metric values.
 *
 * Handles: integers, decimals (1.5), simple fractions (1/2),
 * mixed numbers (1 1/2), unicode fractions (½, 1½) and ranges (2-3, 2 to 3).
 *
 * Conversions:
 *   1 cup        = 240 ml
 *   1 tablespoon = 15 ml
 *   1 teaspoon   = 5 ml
 *   1 fl oz      = 30 ml
 *   1 oz         = 28 g
 *   1 lb         = 454 g
 *   1 inch       = 2.54 cm
 *   °F → °C      = (F - 32) × 5/9
 */

// Unicode vulgar fractions → decimal value
const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75,
  "⅐": 1 / 7, "⅑": 1 / 9, "⅒": 0.1,
  "⅓": 1 / 3, "⅔": 2 / 3,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8,
  "⅙": 1 / 6, "⅚": 5 / 6,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

// Character class matching any single unicode fraction glyph
const UNI = "\\u00BC-\\u00BE\\u2150-\\u215E";

// A quantity token: mixed numbers, fractions, unicode fractions, decimals.
// Order matters — longer/compound forms must come first.
const QTY =
  `\\d+\\s+\\d+\\/\\d+` + // 1 1/2
  `|\\d+\\s*[${UNI}]` + // 1½
  `|\\d+\\/\\d+` + // 1/2
  `|[${UNI}]` + // ½
  `|\\d+(?:\\.\\d+)?`; // 2 or 1.5

/** Parse a single quantity token into a number. Returns null if unparseable. */
function parseQty(raw: string): number | null {
  const s = raw.trim();

  // "1½" (integer + unicode fraction)
  const mixUni = s.match(new RegExp(`^(\\d+)\\s*([${UNI}])$`));
  if (mixUni) return parseInt(mixUni[1], 10) + (UNICODE_FRACTIONS[mixUni[2]] ?? 0);

  // bare unicode fraction "½"
  if (UNICODE_FRACTIONS[s] !== undefined) return UNICODE_FRACTIONS[s];

  // mixed number "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10);

  // simple fraction "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);

  // decimal or integer
  const f = parseFloat(s);
  return Number.isNaN(f) ? null : f;
}

/** Round metric amounts to cooking-friendly precision. */
function roundMetric(v: number): number {
  if (v < 10) return Math.round(v * 2) / 2; // nearest 0.5
  if (v < 50) return Math.round(v); // nearest 1
  return Math.round(v / 5) * 5; // nearest 5
}

/** Format a number with German decimal comma, dropping trailing .0 */
function fmt(v: number): string {
  const rounded = Math.round(v * 100) / 100;
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(".", ",");
}

type Converter = (n: number) => number;

/** Build a replacer for a quantity(+range) + unit pattern. */
function replaceUnit(
  text: string,
  unitPattern: string,
  convert: Converter,
  outUnit: string
): string {
  // qty, optional range " - qty" / " to qty", then the unit
  // Trailing (?![A-Za-z]) acts as a word boundary that also works after the
  // ″ / " symbols (where \b would fail) and prevents matching "cup" in
  // "cupboard".
  const re = new RegExp(
    `(${QTY})(?:\\s*(?:-|–|—|to)\\s*(${QTY}))?[\\s-]*(?:${unitPattern})(?![A-Za-z])`,
    "gi"
  );

  return text.replace(re, (match, q1: string, q2: string | undefined) => {
    const n1 = parseQty(q1);
    if (n1 === null) return match; // leave untouched if we can't parse
    const v1 = roundMetric(convert(n1));

    if (q2) {
      const n2 = parseQty(q2);
      if (n2 !== null) {
        const v2 = roundMetric(convert(n2));
        return `${fmt(v1)}–${fmt(v2)} ${outUnit}`;
      }
    }
    return `${fmt(v1)} ${outUnit}`;
  });
}

/**
 * Convert all imperial measurements in a text string to metric.
 */
export function convertMeasurements(input: string): string {
  if (!input) return input;
  let text = input;

  // ── Temperature: °F → °C (round to nearest 5°) ──────────────────────────
  const fToC = (f: number) => Math.round(((f - 32) * 5) / 9 / 5) * 5;
  text = text.replace(
    /(\d+(?:\.\d+)?)(?:\s*(?:[-–—]|to)\s*(\d+(?:\.\d+)?))?\s*(?:°\s*F\b|°F|degrees?\s*F(?:ahrenheit)?\b|℉)/gi,
    (_m, f1: string, f2: string | undefined) =>
      f2
        ? `${fToC(parseFloat(f1))}–${fToC(parseFloat(f2))} °C`
        : `${fToC(parseFloat(f1))} °C`
  );

  // ── Volume ──────────────────────────────────────────────────────────────
  // fluid ounce must be matched BEFORE plain ounce
  text = replaceUnit(text, "fl(?:uid)?\\.?\\s*oz|fluid\\s+ounces?", (n) => n * 30, "ml");
  text = replaceUnit(text, "cups?", (n) => n * 240, "ml");
  text = replaceUnit(text, "tablespoons?|tbsps?|tbs\\.?", (n) => n * 15, "ml");
  text = replaceUnit(text, "teaspoons?|tsps?", (n) => n * 5, "ml");

  // ── Weight ────────────────────────────────────────────────────────────────
  text = replaceUnit(text, "pounds?|lbs?\\.?", (n) => n * 454, "g");
  text = replaceUnit(text, "ounces?|oz\\.?", (n) => n * 28, "g");

  // ── Length: inch → cm (handles inches, inch, in., and the ″ / " symbols) ──
  text = replaceUnit(text, 'inches|inch|in\\.|["″]', (n) => n * 2.54, "cm");

  return text;
}

export default convertMeasurements;
