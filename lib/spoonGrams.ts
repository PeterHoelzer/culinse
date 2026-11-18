/*
  Gramm in Klammern mit den Portionen umrechnen (18.11.2026).

  Gemahlene Gewürze stehen in Löffeln, das Gewicht dahinter in Klammern:
  „4 TL Zimt (10 g)“. Stellt jemand die Portionen um, rechnet die Seite die
  Menge um, die Klammer gehört aber zum Namen und blieb stehen: „2 TL Zimt
  (10 g)“. Diese Regel rechnet die Klammer mit.

  Sie greift bewusst nur bei Löffel-Einheiten und nur, wenn die Klammer am
  Ende steht und nichts als ein Gewicht enthält. Bei „4 Hähnchenschenkel
  (etwa 150 g)“ ist offen, ob das Gewicht je Stück oder zusammen gemeint ist;
  solche Zeilen bleiben, wie sie sind.
*/

/** Löffel-Einheiten, wie sie in den 16 Sprachfassungen im Feld `unit` stehen. */
const SPOON_UNITS = new Set([
  "EL", "TL",
  "tbsp", "tsp",
  "cucharada", "cucharadas", "cucharadita", "cucharaditas", "cda.", "cdas.", "cdta.", "cdtas.",
  "c. à s.", "c. à soupe", "c. à c.", "c. à café",
  "cucchiaio", "cucchiai", "cucchiaino", "cucchiaini",
  "łyżka", "łyżki", "łyżek", "łyżeczka", "łyżeczki", "łyżeczek",
  "yemek kaşığı", "çay kaşığı", "tatlı kaşığı",
  "el", "tl",
  "lžíce", "lžic", "lžička", "lžičky", "lžiček",
  "ст. л.", "ч. л.",
  "colher de sopa", "colheres de sopa", "colher de chá", "colheres de chá",
  "汤匙", "茶匙",
  "大さじ", "小さじ",
  "sdm", "sdt",
  "muỗng canh", "muỗng cà phê",
  "টেবিল চামচ", "চা চামচ",
]);

/**
  Klammer am Zeilenende, die mit genau einem Gewicht schließt: „(10 g)“,
  „(ca. 6 g)“, „（約10g）“, „(около 5 г)“, „(Adaçayı, etwa 4 g)“. Vor der Zahl
  darf Text stehen, aber keine zweite Zahl: „(2 gehäufte TL, 14 g)“ bleibt.
*/
const GRAM_PAREN = /([(（][^\d()（）]*?)(\d+(?:[.,]\d+)?)(\s*(?:g|г|克|গ্রাম)\s*[)）]\s*)$/;

/**
  `text` ist die Zutatenzeile ohne Menge („TL Zimt (10 g)“). `format` schreibt
  die neue Zahl in der Schreibweise der Seite (Komma oder Punkt, Rundung).
*/
export function scaleSpoonGrams(unit: string, text: string, factor: number, format: (n: number) => string): string {
  if (factor === 1 || !isFinite(factor) || factor <= 0 || !SPOON_UNITS.has(unit)) return text;
  const m = text.match(GRAM_PAREN);
  if (!m || m.index === undefined) return text;
  const grams = parseFloat(m[2].replace(",", "."));
  if (!isFinite(grams)) return text;
  return text.slice(0, m.index) + m[1] + format(grams * factor) + m[3];
}
