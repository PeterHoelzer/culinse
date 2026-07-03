/**
 * Qualitäts-Gate des Prüfers — Playbook A.1–A.5 + B.2, strenge Agenten-Stufe.
 * JS-Port der verify_seed.py-Checks, erweitert um:
 *   ≥ 4 Zutaten, ≥ 3 Schritte, image_prompt-Regeln (rein positiv), amount=String.
 */

// Verbotene Einheiten (imperial + Löffel) — exakt wie verify_seed.py
export const FORBIDDEN_UNITS = new Set([
  "cup", "cups", "tbsp", "tbs", "tablespoon", "tablespoons",
  "tsp", "teaspoon", "teaspoons", "oz", "ounce", "ounces",
  "lb", "lbs", "pound", "pounds", "fl oz", "floz", "pint", "quart",
  "el", "tl", "esslöffel", "teelöffel", "essl.", "teel.",
]);

export const MACRO_TOL = 0.12; // 12 % Toleranz (4/4/9)

// Verneinungen im image_prompt (FLUX kennt kein „nein") — B.2 Regel 1.
// Der feste Stil-Suffix (mit "no text, no watermark, no people") kommt erst im
// Fotografen dazu und ist bewusst erlaubt — geprüft wird NUR der Rezept-Prompt.
const NEGATION_RE = /\b(no|not|without|never|none)\b|\bkein\w*\b|\bohne\b/i;
const BANNED_PROMPT_PHRASES = ["beautifully garnished"];

function checkLocale(slug, lang, loc, errors, warnings) {
  for (const field of ["title", "description", "ingredients", "instructions", "tags"]) {
    const v = loc?.[field];
    if (!v || (Array.isArray(v) && v.length === 0))
      errors.push(`[${slug}/${lang}] Feld fehlt oder leer: ${field}`);
  }
  if (!loc) return;

  if ((loc.title || "").trim().length < 3)
    errors.push(`[${slug}/${lang}] Titel zu kurz (< 3 Zeichen)`);

  const ings = loc.ingredients || [];
  if (ings.length < 4)
    errors.push(`[${slug}/${lang}] zu wenige Zutaten (${ings.length} < 4)`);
  for (const ing of ings) {
    const unit = String(ing.unit ?? "").trim().toLowerCase();
    if (FORBIDDEN_UNITS.has(unit))
      errors.push(`[${slug}/${lang}] verbotene Einheit '${ing.unit}' bei '${ing.name}'`);
    if (!ing.name) errors.push(`[${slug}/${lang}] Zutat ohne Namen`);
    if (typeof ing.amount !== "string")
      errors.push(`[${slug}/${lang}] amount muss String sein bei '${ing.name}' (ist ${typeof ing.amount})`);
  }

  const steps = loc.instructions || [];
  if (steps.length < 3)
    errors.push(`[${slug}/${lang}] zu wenige Schritte (${steps.length} < 3)`);
  const nums = steps.map((s) => s.step);
  const expect = Array.from({ length: nums.length }, (_, i) => i + 1);
  if (JSON.stringify(nums) !== JSON.stringify(expect))
    errors.push(`[${slug}/${lang}] Schritte nicht fortlaufend 1..n: ${nums}`);
  const words = steps.map((s) => s.text || "").join(" ").split(/\s+/).filter(Boolean).length;
  if (words < 30)
    errors.push(`[${slug}/${lang}] Instruktionen zu knapp (${words} Wörter < 30)`);
  for (const s of steps) {
    if (!("timer_minutes" in s))
      errors.push(`[${slug}/${lang}] Schritt ${s.step}: timer_minutes fehlt (Zahl oder null)`);
  }

  for (const t of loc.tags || []) {
    if (t !== t.toLowerCase()) warnings.push(`[${slug}/${lang}] Tag nicht lowercase: '${t}'`);
  }
}

/**
 * Prüft EIN Rezept-Objekt im recipes.json-Format.
 * Rückgabe: { ok, errors, warnings, macro: {given, calc, devPct} }
 */
export function validateRecipe(r) {
  const errors = [];
  const warnings = [];
  const slug = r?.slug || "?";

  if (!/^[a-z0-9-]{3,}$/.test(slug)) errors.push(`[${slug}] Slug ungültig (kebab-case, ascii)`);

  for (const f of ["prep_time", "cook_time", "servings", "nutrition", "de", "en", "image_prompt"]) {
    if (r?.[f] === undefined || r?.[f] === null)
      errors.push(`[${slug}] Pflichtfeld fehlt: ${f}`);
  }
  for (const f of ["prep_time", "cook_time", "servings"]) {
    if (r?.[f] !== undefined && (!Number.isInteger(r[f]) || r[f] < 0))
      errors.push(`[${slug}] ${f} muss ganze Zahl ≥ 0 sein`);
  }

  // Nährwerte 4/4/9 (pro Portion)
  let macro = null;
  const n = r?.nutrition || {};
  const { calories: cal, protein: p, fat, carbs: c } = n;
  if ([cal, p, fat, c].some((x) => typeof x !== "number")) {
    errors.push(`[${slug}] Nährwerte unvollständig: ${JSON.stringify(n)}`);
  } else {
    const calc = 4 * p + 4 * c + 9 * fat;
    const dev = cal ? Math.abs(calc - cal) / cal : 1;
    macro = { given: cal, calc, devPct: +(dev * 100).toFixed(1) };
    if (dev > MACRO_TOL)
      errors.push(`[${slug}] Makros unplausibel: angegeben ${cal}, 4/4/9 = ${calc} (${macro.devPct} %)`);
  }

  // image_prompt-Regeln (B.2)
  const ip = r?.image_prompt || "";
  if (ip) {
    const m = ip.match(NEGATION_RE);
    if (m) errors.push(`[${slug}] image_prompt enthält Verneinung ('${m[0]}') — rein positiv formulieren!`);
    for (const b of BANNED_PROMPT_PHRASES)
      if (ip.toLowerCase().includes(b)) errors.push(`[${slug}] image_prompt enthält '${b}' (provoziert Deko)`);
    if (ip.split(/\s+/).length < 12)
      warnings.push(`[${slug}] image_prompt sehr kurz — Hauptzutaten, Farben, Textur, Gefäß nennen`);
    if (!/(bowl|plate|dish|glass|board|platter)/i.test(ip))
      warnings.push(`[${slug}] image_prompt nennt kein Gefäß — „served in/on one simple …" ergänzen`);
  }

  checkLocale(slug, "de", r?.de, errors, warnings);
  checkLocale(slug, "en", r?.en, errors, warnings);

  return { ok: errors.length === 0, errors, warnings, macro };
}
