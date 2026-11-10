/*
  Stöberseite: Filter-Vokabular und URL-Zustand. Reine Daten und Funktionen,
  ohne Server-Abhängigkeit, damit Seite und Client dieselbe Quelle nutzen.

  Die Rezepte tragen ihre Einordnung nur als freie Schlagworte, je Sprache
  anders geschrieben. Alle 16 Sprachfassungen eines Gerichts teilen sich aber
  eine translation_group, und die deutschen Schlagworte sind die gepflegte
  Fassung. Darum bildet dieses Vokabular deutsche Schlagworte auf
  sprachneutrale Schlüssel ab; lib/browse/index.ts vererbt sie über die
  Gruppe an jede Sprache. Englische Varianten stehen dabei, damit auch
  Community-Rezepte ohne Gruppe einsortiert werden.
*/

export type GroupId = "cuisine" | "region" | "course" | "dish" | "diet" | "occasion" | "method";

export interface FacetOption {
  /** Sprachneutraler Schlüssel, steht so in der URL. */
  key: string;
  /** Schlagworte im Korpus, die auf diesen Schlüssel zeigen (klein geschrieben). */
  tags: string[];
  /** Nur Regionen: Schlüssel der zugehörigen Küche. */
  parent?: string;
  /** Nur Regionen: Eigenname, in allen Sprachen gleich. Fehlt er, kommt der Name aus den Übersetzungen. */
  name?: string;
  /** Zusätzliche Suchwörter für die Filtersuche. */
  aliases?: string[];
}

export interface FacetGroup {
  id: GroupId;
  /** any: eine der Optionen genügt. all: jede gewählte Option muss zutreffen. */
  mode: "any" | "all";
  options: FacetOption[];
}

const GERMAN_STATES: [string, string, string][] = [
  ["baden-wuerttemberg", "Baden-Württemberg", "baden-württemberg"],
  ["bayern", "Bayern", "bayern"],
  ["berlin", "Berlin", "berlin"],
  ["brandenburg", "Brandenburg", "brandenburg"],
  ["bremen", "Bremen", "bremen"],
  ["hamburg", "Hamburg", "hamburg"],
  ["hessen", "Hessen", "hessen"],
  ["mecklenburg-vorpommern", "Mecklenburg-Vorpommern", "mecklenburg-vorpommern"],
  ["niedersachsen", "Niedersachsen", "niedersachsen"],
  ["nordrhein-westfalen", "Nordrhein-Westfalen", "nordrhein-westfalen"],
  ["rheinland-pfalz", "Rheinland-Pfalz", "rheinland-pfalz"],
  ["saarland", "Saarland", "saarland"],
  ["sachsen", "Sachsen", "sachsen"],
  ["sachsen-anhalt", "Sachsen-Anhalt", "sachsen-anhalt"],
  ["schleswig-holstein", "Schleswig-Holstein", "schleswig-holstein"],
  ["thueringen", "Thüringen", "thüringen"],
];

const region = (parent: string, key: string, name: string, tag = key): FacetOption => ({ key, name, parent, tags: [tag] });
// Region mit übersetztem Namen (messages: browse.options.region.<key>). Für Gegenden,
// die in jeder Sprache anders heißen (Kreta, Crete, Girit), statt eines festen Eigennamens.
const localRegion = (parent: string, key: string, tag: string): FacetOption => ({ key, parent, tags: [tag] });

export const FACET_GROUPS: FacetGroup[] = [
  {
    id: "cuisine",
    mode: "any",
    options: [
      { key: "german", tags: ["deutschland", "bayerisch", ...GERMAN_STATES.map((s) => s[2])], aliases: ["deutsch", "german", "germany"] },
      // Reihenfolge = Anzeige im Filter: die größten Küchen zuerst.
      { key: "turkish", tags: ["türkei", "türkisch", "turkish"], aliases: ["türkei", "turkey", "turkish", "türkiye"] },
      { key: "greek", tags: ["griechenland", "griechisch", "greek"], aliases: ["griechenland", "greece", "greek", "hellas"] },
      { key: "japanese", tags: ["japan", "japanisch"], aliases: ["japan", "japanese"] },
      { key: "irish", tags: ["irland", "irisch"], aliases: ["irland", "ireland", "irish"] },
      { key: "kurdish", tags: ["kurdistan", "kurdisch", "kurdish", "berwar"], aliases: ["kurdistan", "kurdish"] },
      { key: "portuguese", tags: ["portugal", "portugiesisch"], aliases: ["portugal", "portuguese"] },
      { key: "mediterranean", tags: ["mediterran", "mediterranean"], aliases: ["mittelmeer", "mediterranean"] },
      { key: "asian", tags: ["asiatisch", "asian"], aliases: ["asien", "asia", "asian"] },
      { key: "italian", tags: ["italienisch", "italian"], aliases: ["italien", "italy", "italian"] },
      { key: "mexican", tags: ["mexikanisch", "mexican"], aliases: ["mexiko", "mexico", "mexican"] },
      { key: "indian", tags: ["indisch", "indian"], aliases: ["indien", "india", "indian"] },
    ],
  },
  {
    id: "region",
    mode: "any",
    options: [
      ...GERMAN_STATES.map(([key, name, tag]) => region("german", key, name, tag)),
      region("japanese", "kanto", "Kanto"),
      region("japanese", "kansai", "Kansai"),
      region("japanese", "kyushu", "Kyushu"),
      region("japanese", "chubu", "Chubu"),
      region("japanese", "hokkaido", "Hokkaido"),
      region("japanese", "tohoku", "Tohoku"),
      region("japanese", "chugoku", "Chugoku"),
      region("japanese", "shikoku", "Shikoku"),
      region("japanese", "okinawa", "Okinawa"),
      region("irish", "ulster", "Ulster"),
      region("irish", "munster", "Munster"),
      region("irish", "connacht", "Connacht"),
      region("irish", "dublin", "Dublin"),
      region("irish", "leinster", "Leinster"),
      region("portuguese", "lisboa", "Lisboa", "lissabon"),
      region("portuguese", "alentejo", "Alentejo"),
      region("portuguese", "acores", "Açores", "azoren"),
      region("portuguese", "madeira", "Madeira"),
      region("portuguese", "minho", "Minho"),
      region("portuguese", "algarve", "Algarve"),
      region("portuguese", "ribatejo-oeste", "Ribatejo e Oeste", "ribatejo und oeste"),
      region("portuguese", "tras-os-montes", "Trás-os-Montes", "trás-os-montes"),
      region("portuguese", "beiras", "Beiras"),
      region("portuguese", "porto-douro", "Porto e Douro", "porto und douro"),
      region("kurdish", "berwar", "Berwar"),
      localRegion("greek", "macedonia", "makedonien"),
      localRegion("greek", "crete", "kreta"),
      localRegion("greek", "peloponnese", "peloponnes"),
      localRegion("greek", "north-aegean", "nordägäis"),
      localRegion("greek", "cyclades", "kykladen"),
      localRegion("greek", "ionian-islands", "ionische inseln"),
      localRegion("greek", "epirus", "epirus"),
      localRegion("greek", "dodecanese", "dodekanes"),
      localRegion("greek", "thessaly", "thessalien"),
      localRegion("greek", "thrace", "thrakien"),
      localRegion("greek", "central-greece", "mittelgriechenland"),
      localRegion("greek", "attica", "attika"),
      localRegion("turkish", "marmara", "marmara"),
      localRegion("turkish", "turkish-aegean", "ägäis"),
      localRegion("turkish", "black-sea", "schwarzmeer"),
      localRegion("turkish", "central-anatolia", "zentralanatolien"),
      localRegion("turkish", "turkish-mediterranean", "mittelmeer"),
      localRegion("turkish", "southeastern-anatolia", "südostanatolien"),
      localRegion("turkish", "eastern-anatolia", "ostanatolien"),
    ],
  },
  {
    id: "course",
    mode: "any",
    options: [
      { key: "main", tags: ["hauptgericht", "main course", "main dish"] },
      { key: "side", tags: ["beilage", "side dish"] },
      { key: "starter", tags: ["vorspeise", "starter", "appetizer"] },
      { key: "soup", tags: ["suppe", "kalte-suppe", "soup"] },
      { key: "salad", tags: ["salat", "salad"] },
      { key: "breakfast", tags: ["frühstück", "fruehstueck", "breakfast"] },
      { key: "dessert", tags: ["dessert", "nachtisch"] },
      { key: "cake", tags: ["kuchen", "cake"] },
      { key: "pastry", tags: ["gebäck", "gebaeck", "pastry"] },
      { key: "snack", tags: ["snack", "snacks", "fingerfood", "street-food"] },
      { key: "drink", tags: ["getränk", "drink"] },
      { key: "basic", tags: ["grundrezept"] },
    ],
  },
  {
    id: "dish",
    mode: "any",
    options: [
      { key: "casserole", tags: ["auflauf", "ofengericht", "casserole"] },
      { key: "pasta", tags: ["pasta", "nudeln"] },
      { key: "stew", tags: ["eintopf", "schmorgericht", "stew"] },
      { key: "pan", tags: ["pfanne", "pfannengericht"] },
      { key: "bowl", tags: ["bowl"] },
      { key: "curry", tags: ["curry"] },
      { key: "dip", tags: ["dip"] },
      { key: "wrap", tags: ["wrap"] },
    ],
  },
  {
    id: "diet",
    mode: "all",
    options: [
      // Vegane Rezepte sind immer auch vegetarisch.
      { key: "vegetarian", tags: ["vegetarisch", "vegetarian", "vegan"], aliases: ["veggie", "fleischlos"] },
      { key: "vegan", tags: ["vegan"] },
      { key: "lactosefree", tags: ["laktosefrei", "lactose free", "dairy free"], aliases: ["milchfrei", "dairy free"] },
      { key: "highprotein", tags: ["proteinreich", "high protein"], aliases: ["eiweißreich", "high protein", "protein"] },
      { key: "glutenfree", tags: ["glutenfrei", "gluten free"] },
      { key: "lowcarb", tags: ["low carb", "low-carb"], aliases: ["low carb", "kohlenhydratarm"] },
    ],
  },
  {
    id: "occasion",
    mode: "all",
    options: [
      { key: "budget", tags: ["günstig", "budget"], aliases: ["billig", "preiswert", "cheap"] },
      { key: "quick", tags: ["schnell", "quick"], aliases: ["fix", "fast"] },
      { key: "festive", tags: ["festlich", "festive"], aliases: ["feier", "weihnachten", "party"] },
      { key: "easy", tags: ["einfach", "easy"], aliases: ["leicht", "anfänger", "simple"] },
      { key: "mealprep", tags: ["meal-prep", "meal prep"], aliases: ["vorkochen", "meal prep"] },
    ],
  },
  {
    id: "method",
    mode: "any",
    options: [
      { key: "airfryer", tags: ["heissluftfritteuse", "airfryer", "air fryer"], aliases: ["airfryer", "air fryer", "heißluftfritteuse", "heissluftfritteuse"] },
      { key: "grill", tags: ["grillen", "grill"], aliases: ["bbq", "barbecue"] },
      { key: "onepot", tags: ["one-pot", "one pot"], aliases: ["one pot", "ein topf"] },
    ],
  },
];

export const GROUP_IDS = FACET_GROUPS.map((g) => g.id);
export const GROUP_BY_ID = Object.fromEntries(FACET_GROUPS.map((g) => [g.id, g])) as Record<GroupId, FacetGroup>;

/** Schlagwort → Liste von "gruppe:schlüssel". */
export const TAG_TO_KEYS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of FACET_GROUPS) {
    for (const option of group.options) {
      const id = `${group.id}:${option.key}`;
      for (const tag of option.tags) map.set(tag, [...(map.get(tag) ?? []), id]);
      // Eine Region gehört immer auch zu ihrer Küche.
      if (option.parent) for (const tag of option.tags) map.set(tag, [...(map.get(tag) ?? []), `cuisine:${option.parent}`]);
    }
  }
  return map;
})();

/** Zahlenfilter: feste Stufen, je eine wählbar. */
export const RANGE_STEPS = {
  time: [15, 30, 45, 60],
  kcal: [300, 500, 700],
  protein: [20, 30, 40],
  carbs: [20, 40, 60],
} as const;
export type RangeId = keyof typeof RANGE_STEPS;
export const RANGE_IDS = Object.keys(RANGE_STEPS) as RangeId[];

export const SORT_IDS = ["mix", "new", "fast", "kcal", "protein"] as const;
export type SortId = (typeof SORT_IDS)[number];

export const PAGE_SIZE = 24;

/** Zutatenfilter: höchstens so viele Begriffe je Richtung. */
export const INGREDIENT_MAX = 5;

export interface BrowseState {
  q: string;
  sel: Record<GroupId, string[]>;
  /** Zutaten, die im Rezept vorkommen müssen bzw. nicht vorkommen dürfen (frei eingegeben). */
  with: string[];
  without: string[];
  range: Record<RangeId, number | null>;
  sort: SortId;
  page: number;
}

export function emptyState(): BrowseState {
  return {
    q: "",
    sel: { cuisine: [], region: [], course: [], dish: [], diet: [], occasion: [], method: [] },
    with: [],
    without: [],
    range: { time: null, kcal: null, protein: null, carbs: null },
    sort: "mix",
    page: 1,
  };
}

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Säubert einen frei eingegebenen Zutatenbegriff; leer, wenn nichts Brauchbares bleibt. Die Schreibweise bleibt ("Lachs"). */
export function cleanIngredient(text: string): string {
  return text.replace(/[,;?&=#%<>"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 30);
}

/** Gleicher Begriff ohne Rücksicht auf Groß- und Kleinschreibung. */
export function sameIngredient(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Mindestlänge einer Eingabe: zwei Buchstaben, in Schriften ohne Wortzwischenraum (z. B. 卵) genügt ein Zeichen. */
export function longEnough(text: string): boolean {
  return text.length >= 2 || /[^\u0000-\u024f]/.test(text);
}

function ingredientList(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const term = cleanIngredient(part);
    if (longEnough(term) && !out.some((t) => sameIngredient(t, term))) out.push(term);
  }
  return out.slice(0, INGREDIENT_MAX);
}

/** Liest den Zustand aus den URL-Parametern; Unbekanntes fällt still weg. */
export function parseState(params: RawParams): BrowseState {
  const state = emptyState();
  state.q = first(params.q).trim().slice(0, 80);
  for (const group of FACET_GROUPS) {
    const wanted = new Set(first(params[group.id]).split(",").filter(Boolean));
    state.sel[group.id] = group.options.filter((o) => wanted.has(o.key)).map((o) => o.key);
  }
  state.with = ingredientList(first(params.with));
  state.without = ingredientList(first(params.without)).filter((term) => !state.with.some((t) => sameIngredient(t, term)));
  for (const id of RANGE_IDS) {
    const n = Number(first(params[id]));
    state.range[id] = (RANGE_STEPS[id] as readonly number[]).includes(n) ? n : null;
  }
  const sort = first(params.sort) as SortId;
  state.sort = SORT_IDS.includes(sort) ? sort : "mix";
  const page = Math.floor(Number(first(params.page)));
  state.page = page > 1 && page < 1000 ? page : 1;
  return state;
}

/** Schreibt den Zustand als Query-String, ohne Standardwerte, in fester Reihenfolge. */
export function stateToQuery(state: BrowseState): string {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  for (const id of GROUP_IDS) if (state.sel[id].length) p.set(id, state.sel[id].join(","));
  if (state.with.length) p.set("with", state.with.join(","));
  if (state.without.length) p.set("without", state.without.join(","));
  for (const id of RANGE_IDS) if (state.range[id] !== null) p.set(id, String(state.range[id]));
  if (state.sort !== "mix") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const s = p.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

export function countActive(state: BrowseState): number {
  return (
    GROUP_IDS.reduce((n, id) => n + state.sel[id].length, 0) +
    RANGE_IDS.filter((id) => state.range[id] !== null).length +
    state.with.length +
    state.without.length
  );
}

export function isFiltered(state: BrowseState): boolean {
  return Boolean(state.q) || countActive(state) > 0;
}

/** Schaltet eine Option um. Fällt eine Küche weg, fallen ihre Regionen mit. */
export function toggleOption(state: BrowseState, group: GroupId, key: string): BrowseState {
  const has = state.sel[group].includes(key);
  const sel = { ...state.sel, [group]: has ? state.sel[group].filter((k) => k !== key) : [...state.sel[group], key] };
  if (group === "cuisine" && has) {
    const regions = new Map(GROUP_BY_ID.region.options.map((o) => [o.key, o.parent]));
    sel.region = sel.region.filter((k) => regions.get(k) !== key);
  }
  return { ...state, sel, page: 1 };
}

/** Fügt einen Zutatenbegriff hinzu oder nimmt ihn heraus. Ein Begriff steht nie in beiden Listen. */
export function toggleIngredient(state: BrowseState, list: "with" | "without", raw: string): BrowseState {
  const term = cleanIngredient(raw);
  if (!longEnough(term)) return state;
  const other = list === "with" ? "without" : "with";
  const has = state[list].some((t) => sameIngredient(t, term));
  const next = has ? state[list].filter((t) => !sameIngredient(t, term)) : [...state[list], term].slice(-INGREDIENT_MAX);
  return { ...state, [list]: next, [other]: state[other].filter((t) => !sameIngredient(t, term)), page: 1 } as BrowseState;
}

export function setRange(state: BrowseState, id: RangeId, value: number | null): BrowseState {
  return { ...state, range: { ...state.range, [id]: state.range[id] === value ? null : value }, page: 1 };
}

/** Vereinheitlicht Text für Suche und Vergleich: klein, ohne Akzente, ß als ss. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  Prüft, ob ein Begriff in den Zutaten eines Rezepts steht. `names` sind die
  vereinheitlichten Zutatennamen, `words` deren einzelne Wörter.
  Lange Begriffe treffen auch im Wortinneren ("lachs" in "räucherlachs"),
  kurze nur als ganzes Wort mit Endung ("ei" trifft "ei" und "eier", aber nicht
  "reis"). Schriften ohne Wortzwischenraum werden immer im Ganzen durchsucht.
*/
export function ingredientMatches(term: string, names: readonly string[], words: ReadonlySet<string>): boolean {
  const t = normalize(term);
  if (!t) return false;
  if (t.length >= 4 || t.includes(" ") || /[^\u0000-\u024f]/.test(t)) return names.some((name) => name.includes(t));
  if (words.has(t)) return true;
  for (const word of words) if (word.startsWith(t) && word.length <= t.length + 2) return true;
  return false;
}

export interface BrowseItem {
  id: string;
  title: string;
  image: string | null;
  imagePosition: string;
  source: "Culinse" | "Community";
  minutes: number | null;
  servings: number | null;
  nameLang: string | null;
  course: string | null;
  diet: "vegan" | "vegetarian" | null;
  /** Akzentfarbe aus dem Foto (lib/dishColor.ts); setzt die Seite, nicht das Verzeichnis. */
  accent?: string | null;
}

export interface BrowseResult {
  total: number;
  page: number;
  pages: number;
  items: BrowseItem[];
  /** Trefferzahl je Option, Schlüssel "gruppe:option" bzw. "time:30". */
  counts: Record<string, number>;
}

/* ─── Themenseiten: eine feste Adresse je Filteroption (/recipes/<slug>) ────── */

const SLUGS: Record<string, string> = {
  "course:main": "main-dishes",
  "course:side": "side-dishes",
  "course:starter": "starters",
  "course:soup": "soups",
  "course:salad": "salads",
  "course:dessert": "desserts",
  "course:cake": "cakes",
  "course:pastry": "baking",
  "course:snack": "snacks",
  "course:drink": "drinks",
  "course:basic": "basics",
  "dish:casserole": "casseroles",
  "dish:stew": "stews",
  "dish:pan": "pan-dishes",
  "dish:bowl": "bowls",
  "dish:curry": "curries",
  "dish:dip": "dips",
  "dish:wrap": "wraps",
  "diet:lactosefree": "lactose-free",
  "diet:highprotein": "high-protein",
  "diet:glutenfree": "gluten-free",
  "diet:lowcarb": "low-carb",
  "occasion:mealprep": "meal-prep",
  "method:airfryer": "air-fryer",
  "method:grill": "grilling",
  "method:onepot": "one-pot",
};

export interface Landing {
  group: GroupId;
  key: string;
  slug: string;
  /** Nur Regionen: Küche und Eigenname. */
  parent?: string;
  name?: string;
}

export const LANDINGS: Landing[] = FACET_GROUPS.flatMap((group) =>
  group.options.map((o) => ({ group: group.id, key: o.key, slug: SLUGS[`${group.id}:${o.key}`] ?? o.key, parent: o.parent, name: o.name })),
);
export const LANDING_BY_SLUG = new Map(LANDINGS.map((l) => [l.slug, l]));
const LANDING_BY_ID = new Map(LANDINGS.map((l) => [`${l.group}:${l.key}`, l]));

/** Ab so vielen Rezepten gilt eine Themenseite als eigenständig (Index, Sitemap, Links). */
export const LANDING_MIN = 12;

/** Zustand einer Themenseite. Eine Region bringt ihre Küche mit, damit die Leiste beide zeigt. */
export function landingState(landing: Landing): BrowseState {
  const state = emptyState();
  state.sel[landing.group] = [landing.key];
  if (landing.parent) state.sel.cuisine = [landing.parent];
  return state;
}

/** Die Themenseite, die genau diesem Zustand entspricht, sonst null. */
export function landingOf(state: BrowseState): Landing | null {
  if (state.q || state.with.length || state.without.length || RANGE_IDS.some((id) => state.range[id] !== null)) return null;
  const picked = GROUP_IDS.flatMap((id) => state.sel[id].map((key) => LANDING_BY_ID.get(`${id}:${key}`)!));
  if (picked.length === 1) return picked[0];
  if (picked.length === 2) {
    const region = picked.find((l) => l.group === "region");
    const cuisine = picked.find((l) => l.group === "cuisine");
    if (region && cuisine && region.parent === cuisine.key) return region;
  }
  return null;
}
