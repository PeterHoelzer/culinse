import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel } from "@/lib/culinse";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { nameLangFromTags } from "@/lib/recipeTitle";
import {
  FACET_GROUPS,
  GROUP_BY_ID,
  PAGE_SIZE,
  RANGE_IDS,
  RANGE_STEPS,
  TAG_TO_KEYS,
  ingredientMatches,
  longEnough,
  normalize,
  type BrowseItem,
  type BrowseResult,
  type BrowseState,
  type RangeId,
} from "./facets";

/*
  Stöberseite: Rezeptverzeichnis im Arbeitsspeicher. Nur auf dem Server
  verwenden: die Abfrage läuft mit dem Service-Schlüssel und liest
  ausschließlich öffentliche Rezepte.

  Der Korpus hat rund 2400 Gerichte je Sprache. Das ist klein genug, um je
  Sprache einmal alle Rezepte zu laden und Filter, Trefferzahlen und Suche
  direkt im Server zu rechnen: keine Datenbank-Migration, keine Abfrage je
  Klick, und die Trefferzahlen aller Optionen fallen in einem Durchlauf an.
  Das Verzeichnis lebt 15 Minuten; danach wird es im Hintergrund erneuert,
  während Besucher noch die alte Fassung sehen.

  Wächst der Korpus deutlich über 10 000 Gerichte je Sprache, gehört diese
  Logik in die Datenbank (Schlüsselspalte mit GIN-Index und Volltextindex).
*/

const TTL_MS = 15 * 60 * 1000;
const BATCH = 1000; // Supabase liefert höchstens 1000 Zeilen je Abfrage.

interface IndexRow extends BrowseItem {
  keys: Set<string>;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  created: number;
  /** Titel, Zutaten und eigene Schlagworte, vereinheitlicht für die Suche. */
  text: string;
  /** Zutatennamen und ihre Wörter, vereinheitlicht für den Zutatenfilter. */
  ingredientNames: string[];
  ingredientWords: Set<string>;
  titleText: string;
  /** Feste Zufallszahl je Rezept für die gemischte Reihenfolge. */
  hash: number;
}

interface DbRow {
  id: string;
  user_id: string | null;
  title: string;
  image_url: string | null;
  image_position: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  nutrition: { calories?: number; protein?: number; carbs?: number } | null;
  tags: string[] | null;
  translation_group: string | null;
  created_at: string | null;
  ingredients: { name?: string }[] | null;
}

interface LocaleIndex {
  rows: IndexRow[];
  /** Zutatenwörter mit Rezeptzahl, häufigste zuerst, für die Vorschläge. */
  vocabulary: { word: string; label: string; count: number }[];
}

type Entry<T> = { at: number; value: T; refreshing: Promise<void> | null };
const indexCache = new Map<string, Entry<LocaleIndex>>();
let germanTags: Entry<Map<string, string[]>> | null = null;

async function fetchAll<T>(columns: string, language: string, withUnassigned: boolean): Promise<T[]> {
  const supabase = createAdminClient();
  const out: T[] = [];
  for (let from = 0; ; from += BATCH * 4) {
    const pages = await Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        let query = supabase.from("user_recipes").select(columns).eq("is_public", true).not("image_url", "is", null);
        query = withUnassigned ? query.or(`language.eq.${language},language.is.null`) : query.eq("language", language);
        const { data, error } = await query.order("id", { ascending: true }).range(from + i * BATCH, from + (i + 1) * BATCH - 1);
        if (error) throw new Error(error.message);
        return (data ?? []) as T[];
      }),
    );
    for (const page of pages) out.push(...page);
    if (pages[3].length < BATCH) break;
  }
  return out;
}

/** Hält einen Wert 15 Minuten; danach liefert er den alten weiter und erneuert im Hintergrund. */
async function cached<T>(get: () => Entry<T> | null | undefined, set: (entry: Entry<T>) => void, load: () => Promise<T>): Promise<T> {
  const entry = get();
  if (!entry) {
    const value = await load();
    set({ at: Date.now(), value, refreshing: null });
    return value;
  }
  if (Date.now() - entry.at > TTL_MS && !entry.refreshing) {
    entry.refreshing = load()
      .then((value) => set({ at: Date.now(), value, refreshing: null }))
      .catch((error) => {
        console.error("browse index refresh failed", error);
        entry.refreshing = null;
      });
    try {
      // Hält die Funktion wach, bis die Erneuerung fertig ist.
      after(() => entry.refreshing);
    } catch {
      // Außerhalb einer Anfrage (z. B. beim Build) läuft die Erneuerung ohnehin durch.
    }
  }
  return entry.value;
}

function loadGermanTags(): Promise<Map<string, string[]>> {
  return cached(
    () => germanTags,
    (entry) => {
      germanTags = entry;
    },
    async () => {
      const rows = await fetchAll<{ translation_group: string | null; tags: string[] | null }>("translation_group,tags", "de", false);
      const map = new Map<string, string[]>();
      for (const row of rows) if (row.translation_group) map.set(row.translation_group, row.tags ?? []);
      return map;
    },
  );
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const COURSE_KEYS = GROUP_BY_ID.course.options.map((o) => `course:${o.key}`);

function toIndexRow(row: DbRow, deTags: Map<string, string[]>): IndexRow {
  const ownTags = (row.tags ?? []).map((t) => t.toLowerCase());
  // Die deutschen Schlagworte der Übersetzungsgruppe sind die gepflegte Fassung.
  const sourceTags = (row.translation_group && deTags.get(row.translation_group)?.map((t) => t.toLowerCase())) || ownTags;
  const keys = new Set<string>();
  for (const tag of sourceTags) for (const key of TAG_TO_KEYS.get(tag) ?? []) keys.add(key);

  const prep = row.prep_time ?? 0;
  const cook = row.cook_time ?? 0;
  const minutes = prep + cook > 0 ? prep + cook : null;
  const course = COURSE_KEYS.find((k) => keys.has(k))?.slice("course:".length) ?? null;
  const rawNames = (row.ingredients ?? []).map((i) => i?.name ?? "").filter(Boolean);
  const ingredientNames = rawNames.map(normalize);
  const number = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  return {
    id: `user_${row.id}`,
    title: row.title,
    image: optimizedImageUrl(row.image_url, 640) ?? row.image_url,
    imagePosition: row.image_position ?? "50% 50%",
    source: recipeSourceLabel(row.user_id),
    minutes,
    servings: row.servings ?? null,
    nameLang: nameLangFromTags(sourceTags),
    course,
    diet: keys.has("diet:vegan") ? "vegan" : keys.has("diet:vegetarian") ? "vegetarian" : null,
    keys,
    kcal: number(row.nutrition?.calories),
    protein: number(row.nutrition?.protein),
    carbs: number(row.nutrition?.carbs),
    created: row.created_at ? Date.parse(row.created_at) : 0,
    text: normalize(`${row.title} ${rawNames.join(" ")} ${ownTags.join(" ")}`),
    ingredientNames,
    ingredientWords: new Set(ingredientNames.flatMap(splitWords)),
    titleText: normalize(row.title),
    hash: hashId(row.id),
  };
}

// Wörter eines Zutatennamens ohne Klammern und Satzzeichen.
function splitWords(name: string): string[] {
  return name.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
}

const HAS_SPACES = /^[\u0000-\u024f\u0370-\u052f\s]+$/; // lateinisch, griechisch, kyrillisch

/*
  Vorschlagsliste für den Zutatenfilter: je Zutatenwort, in wie vielen Rezepten
  es steht. Mehrzahl und Einzahl fallen auf die kürzere Form zusammen (Tomaten
  zu Tomate, eggs zu egg), weil der Filter mit der kürzeren Form beide trifft.
  Im Deutschen zählen nur großgeschriebene Wörter, das hält Beiwörter wie
  "lauwarmes" heraus. Sprachen ohne Wortzwischenraum (Japanisch, Chinesisch)
  zählen den ganzen Zutatennamen.
*/
function buildVocabulary(rows: DbRow[], locale: string): LocaleIndex["vocabulary"] {
  const perRow: Map<string, string>[] = [];
  const all = new Set<string>();
  for (const row of rows) {
    const inRow = new Map<string, string>();
    for (const ingredient of row.ingredients ?? []) {
      const name = (ingredient?.name ?? "").replace(/[(（].*?[)）]/g, " ").trim();
      if (!name) continue;
      const spaced = HAS_SPACES.test(name);
      for (const part of spaced ? name.split(/[^\p{L}\p{M}\p{N}]+/u) : [name]) {
        const word = normalize(part);
        if (!word || /^\d+$/.test(word) || (spaced && word.length < 3)) continue;
        if (locale === "de" && spaced && part[0] !== part[0].toUpperCase()) continue;
        if (!inRow.has(word)) inRow.set(word, part);
        all.add(word);
      }
    }
    perRow.push(inRow);
  }
  // Kürzeste Grundform: ein vorhandenes Wort, das bis zu zwei Buchstaben kürzer ist.
  const stemOf = (word: string) => {
    for (let cut = 2; cut >= 1; cut--) {
      const stem = word.slice(0, -cut);
      if (stem.length >= 3 && all.has(stem)) return stem;
    }
    return word;
  };
  const seen = new Map<string, { label: string; count: number }>();
  for (const inRow of perRow) {
    const stems = new Map<string, string>();
    for (const [word, label] of inRow) {
      const stem = stemOf(word);
      // Beschriftung in der Grundform, wenn das Rezept sie selbst nennt.
      if (!stems.has(stem) || stem === word) stems.set(stem, stem === word ? label : (stems.get(stem) ?? label.slice(0, stem.length)));
    }
    for (const [stem, label] of stems) {
      const entry = seen.get(stem);
      if (entry) {
        entry.count++;
        if (label.length < entry.label.length) entry.label = label;
      } else seen.set(stem, { label, count: 1 });
    }
  }
  return [...seen]
    .filter(([, v]) => v.count >= 2)
    .map(([word, v]) => ({ word, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

function loadIndex(locale: string): Promise<LocaleIndex> {
  return cached(
    () => indexCache.get(locale),
    (entry) => indexCache.set(locale, entry),
    async () => {
      const [rows, deTags] = await Promise.all([
        fetchAll<DbRow>(
          "id,user_id,title,image_url,image_position,prep_time,cook_time,servings,nutrition,tags,translation_group,created_at,ingredients",
          locale,
          true,
        ),
        loadGermanTags(),
      ]);
      return { rows: rows.map((row) => toIndexRow(row, deTags)), vocabulary: buildVocabulary(rows, locale) };
    },
  );
}

/** Zutaten-Vorschläge zu einem Wortanfang, häufigste zuerst. */
export async function suggestIngredients(locale: string, query: string, limit = 8): Promise<{ label: string; count: number }[]> {
  const q = normalize(query);
  if (!longEnough(q)) return [];
  const { vocabulary } = await loadIndex(locale);
  const starts: typeof vocabulary = [];
  const contains: typeof vocabulary = [];
  for (const entry of vocabulary) {
    if (entry.word.startsWith(q)) starts.push(entry);
    else if (q.length >= 3 && entry.word.includes(q)) contains.push(entry);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit).map(({ label, count }) => ({ label, count }));
}

// Tageswert: die gemischte Reihenfolge wechselt täglich und bleibt tagsüber stabil.
function daySeed(): number {
  const d = new Date();
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

const mix = (hash: number, seed: number) => Math.imul(hash ^ seed, 2654435761) >>> 0;

function passesRange(row: IndexRow, id: RangeId, limit: number): boolean {
  if (id === "time") return row.minutes !== null && row.minutes <= limit;
  if (id === "kcal") return row.kcal !== null && row.kcal <= limit;
  if (id === "carbs") return row.carbs !== null && row.carbs <= limit;
  return row.protein !== null && row.protein >= limit;
}

/*
  Küche und Region bilden zusammen eine Ortsangabe: Eine gewählte Region engt
  ihre eigene Küche ein, andere gewählte Küchen bleiben vollständig. Beispiel:
  Japan und Irland gewählt, dazu Kansai, ergibt Kansai plus ganz Irland.
*/
function placeMatcher(state: BrowseState): ((row: IndexRow) => boolean) | null {
  const cuisines = state.sel.cuisine;
  const regions = state.sel.region;
  if (!cuisines.length && !regions.length) return null;
  const parents = new Map(GROUP_BY_ID.region.options.map((o) => [o.key, o.parent]));
  const narrowed = new Set(regions.map((r) => parents.get(r)));
  const wanted = [...regions.map((r) => `region:${r}`), ...cuisines.filter((c) => !narrowed.has(c)).map((c) => `cuisine:${c}`)];
  return (row) => wanted.some((key) => row.keys.has(key));
}

const SIMPLE_GROUPS = FACET_GROUPS.filter((g) => g.id !== "cuisine" && g.id !== "region");

export async function runBrowse(locale: string, state: BrowseState): Promise<BrowseResult> {
  const { rows } = await loadIndex(locale);
  const tokens = normalize(state.q).split(" ").filter(Boolean);
  const place = placeMatcher(state);

  // Prüfungen in fester Reihenfolge. Jede hat eine Nummer, damit sich je Zeile
  // merken lässt, an welcher einzelnen Prüfung sie gescheitert ist.
  type Check = { id: string; mode: "any" | "all" | "range"; test: (row: IndexRow) => boolean };
  const checks: Check[] = [];
  if (tokens.length) checks.push({ id: "q", mode: "all", test: (row) => tokens.every((t) => row.text.includes(t)) });
  if (place) checks.push({ id: "place", mode: "any", test: place });
  for (const group of SIMPLE_GROUPS) {
    const keys = state.sel[group.id].map((k) => `${group.id}:${k}`);
    if (!keys.length) continue;
    checks.push({
      id: group.id,
      mode: group.mode,
      test: group.mode === "all" ? (row) => keys.every((k) => row.keys.has(k)) : (row) => keys.some((k) => row.keys.has(k)),
    });
  }
  if (state.with.length) {
    checks.push({ id: "with", mode: "all", test: (row) => state.with.every((term) => ingredientMatches(term, row.ingredientNames, row.ingredientWords)) });
  }
  if (state.without.length) {
    checks.push({ id: "without", mode: "all", test: (row) => !state.without.some((term) => ingredientMatches(term, row.ingredientNames, row.ingredientWords)) });
  }
  for (const id of RANGE_IDS) {
    const limit = state.range[id];
    if (limit !== null) checks.push({ id, mode: "range", test: (row) => passesRange(row, id, limit) });
  }

  const counts: Record<string, number> = {};
  const bump = (key: string) => {
    counts[key] = (counts[key] ?? 0) + 1;
  };
  const matches: IndexRow[] = [];

  for (const row of rows) {
    let failed = 0;
    let failedId = "";
    for (const check of checks) {
      if (!check.test(row)) {
        failed++;
        failedId = check.id;
        if (failed > 1) break;
      }
    }
    if (failed > 1) continue;
    if (failed === 0) matches.push(row);

    // Trefferzahl einer Option: wie viele Rezepte blieben, wenn man sie
    // ankreuzt. Bei "eine genügt" zählt die eigene Gruppe dabei nicht mit,
    // bei "alle müssen zutreffen" schon.
    const open = (id: string) => failed === 0 || failedId === id;
    if (open("place")) {
      for (const key of row.keys) if (key.startsWith("cuisine:") || key.startsWith("region:")) bump(key);
    }
    for (const group of SIMPLE_GROUPS) {
      if (group.mode === "all" ? failed !== 0 : !open(group.id)) continue;
      const prefix = `${group.id}:`;
      for (const key of row.keys) if (key.startsWith(prefix)) bump(key);
    }
    for (const id of RANGE_IDS) {
      if (!open(id)) continue;
      for (const step of RANGE_STEPS[id]) if (passesRange(row, id, step)) bump(`${id}:${step}`);
    }
  }

  const seed = daySeed();
  const byMix = (a: IndexRow, b: IndexRow) => mix(a.hash, seed) - mix(b.hash, seed);
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
    a === null ? (b === null ? 0 : 1) : b === null ? -1 : (a - b) * dir;
  if (state.sort === "new") matches.sort((a, b) => b.created - a.created || byMix(a, b));
  else if (state.sort === "fast") matches.sort((a, b) => nullsLast(a.minutes, b.minutes, 1) || byMix(a, b));
  else if (state.sort === "kcal") matches.sort((a, b) => nullsLast(a.kcal, b.kcal, 1) || byMix(a, b));
  else if (state.sort === "protein") matches.sort((a, b) => nullsLast(a.protein, b.protein, -1) || byMix(a, b));
  else if (tokens.length) {
    // Beste Treffer: Suchwort im Titel schlägt Suchwort nur in den Zutaten.
    const score = (row: IndexRow) => tokens.reduce((s, t) => s + (row.titleText.startsWith(t) ? 3 : row.titleText.includes(t) ? 2 : 0), 0);
    const scores = new Map(matches.map((row) => [row, score(row)]));
    matches.sort((a, b) => scores.get(b)! - scores.get(a)! || byMix(a, b));
  } else matches.sort(byMix);

  const total = matches.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const items: BrowseItem[] = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((row) => ({
    id: row.id,
    title: row.title,
    image: row.image,
    imagePosition: row.imagePosition,
    source: row.source,
    minutes: row.minutes,
    servings: row.servings,
    nameLang: row.nameLang,
    course: row.course,
    diet: row.diet,
  }));

  return { total, page, pages, items, counts };
}
