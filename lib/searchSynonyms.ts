// Fehlertolerante Heißluftfritteusen-Suche (19.09.2026, Peter-Wunsch):
// "airfryer" und "Heißluftfritteuse" samt gängiger Tippfehler
// (heissluftfriteuse, heisluftfritteuse, Luftfritteuse, frittöse, freidora,
// friggitrice, frytkownica, fritöz …) sollen die Airfryer-Rezepte finden.
// Wahrheit ist der sprachunabhängig vererbte Korpus-Tag `heissluftfritteuse`
// (Import 19.09.26, ~400 Rezepte je Sprache) — Titel allein reicht nicht,
// weil jede Sprache anders formuliert ("… aus der Heißluftfritteuse" /
// "Air Fryer …" / "… z airfryera").

export const AIRFRYER_TAG = "heissluftfritteuse";

// Zusätzlicher Titel-OR-Pass für Rezepte ohne Tag (ältere Korpus-Titel).
// PostgREST-.or()-Syntax; wird in /api/recipes mit tags.ov kombiniert.
export const AIRFRYER_TITLE_OR =
  "title.ilike.%air fryer%,title.ilike.%airfryer%,title.ilike.%fritteuse%,title.ilike.%friteuse%";

// Erkennt die Absicht "Heißluftfritteuse" in allen 7 Sprachen, tolerant gegen
// Tippfehler: Kleinschreibung, ß→ss, Akzente/Umlaute strippen, alles außer
// a–z entfernen — danach reichen wenige stabile Kernmuster.
export function isAirfryerQuery(raw: string): boolean {
  const norm = raw
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\u0430-\u044f\u0451\u4e00-\u9fff]/g, "");
  if (norm.length < 4) return false;
  const hits = [
    "airfr", // airfryer, air fryer, air-frier …
    "luftfrit", // heissluftfritteuse, heisluftfriteuse, luftfritteuse …
    "fritteuse",
    "friteuse", // Tippfehler mit einem t / fr
    "fritose", // fritöse/frittöse (nach Umlaut-Strip)
    "frittose",
    "freidora", // es
    "friggitrice", // it
    "frytk", // pl frytkownica
    "frytow", // pl frytownica
    "fritoz", // tr fritöz
    "fritez", // cs fritéza/horkovzdušná fritéza (nach Diakritik-Strip)
    "аэрогрил", // ru аэрогриль/аэрогрили
    "аэрофритюр", // ru аэрофритюрница
    "фритюрниц", // ru фритюрница
    "fritadeir", // pt fritadeira/fritadeiras
    "空气炸锅", // zh Airfryer
    "气炸锅", // zh Kurzform 空气炸锅/气炸锅
  ];
  if (hits.some((h) => norm.includes(h))) return true;
  return /^heis?sluft/.test(norm);
}
