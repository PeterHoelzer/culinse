"use client";

import { useEffect, useId, useMemo, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { loadSupabaseAfterPageLoad } from "@/lib/supabase/lazy";
import { Link, useRouter } from "@/lib/navigation";
import { Button, Chip, Dialog, EmptyState, Icon, Input, buttonClasses } from "@/components/ui";
import RecipeCard from "../components/RecipeCard";
import type { Recipe } from "../components/home-types";
import {
  FACET_GROUPS,
  GROUP_BY_ID,
  RANGE_IDS,
  RANGE_STEPS,
  SORT_IDS,
  countActive,
  emptyState,
  isFiltered,
  longEnough,
  normalize,
  sameIngredient,
  setRange,
  stateToQuery,
  toggleIngredient,
  toggleOption,
  type BrowseResult,
  type BrowseState,
  type GroupId,
  type RangeId,
  type SortId,
} from "@/lib/browse/facets";

/*
  Oberfläche der Stöberseite (DESIGN.md §5, §11).
  - Ein Suchfeld findet Rezepte, Zutaten und Filter; Filtertreffer stehen in
    den Vorschlägen oben und lassen sich direkt setzen.
  - Links die Filtergruppen zum Ankreuzen, jede Option mit Trefferzahl; ein
    eigenes Feld durchsucht die Filter. Mobil liegt die Leiste in einem Drawer.
  - Jede Änderung schreibt den Zustand in die Adresse; der Server rechnet neu.
    Bis die Antwort da ist, zeigt die Oberfläche die Auswahl schon an.
*/

type Translate = ReturnType<typeof useTranslations>;

/** Ein wählbarer Filter, flach für Suche und Chips: Option einer Gruppe oder Stufe eines Zahlenfilters. */
interface Entry {
  id: string;
  group: GroupId | RangeId;
  key: string;
  label: string;
  groupLabel: string;
  words: string[];
  step: number | null;
}

const NUTRITION: RangeId[] = ["kcal", "protein", "carbs"];
const VISIBLE_OPTIONS = 7;
const OPEN_BY_DEFAULT: GroupId[] = ["cuisine", "region", "course", "diet"];

function buildEntries(t: Translate): Entry[] {
  const entries: Entry[] = [];
  for (const group of FACET_GROUPS) {
    const groupLabel = t(`groups.${group.id}`);
    for (const option of group.options) {
      const label = option.name ?? t(`options.${group.id}.${option.key}`);
      entries.push({
        id: `${group.id}:${option.key}`,
        group: group.id,
        key: option.key,
        label,
        groupLabel,
        words: normalize([label, option.key, ...option.tags, ...(option.aliases ?? [])].join(" ")).split(/[\s-]+/),
        step: null,
      });
    }
  }
  for (const id of RANGE_IDS) {
    const groupLabel = t(id === "time" ? "groups.time" : "groups.nutrition");
    for (const step of RANGE_STEPS[id]) {
      const label = t(`range.${id}`, { count: step });
      entries.push({ id: `${id}:${step}`, group: id, key: String(step), label, groupLabel, words: normalize(label).split(/[\s-]+/), step });
    }
  }
  return entries;
}

function matchEntries(entries: Entry[], query: string, counts: Record<string, number>): Entry[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const parts = needle.split(" ");
  const ranked: { entry: Entry; rank: number }[] = [];
  for (const entry of entries) {
    const starts = parts.every((p) => entry.words.some((w) => w.startsWith(p)));
    const contains = starts || parts.every((p) => entry.words.some((w) => w.includes(p)));
    if (contains) ranked.push({ entry, rank: starts ? 0 : 1 });
  }
  return ranked.sort((a, b) => a.rank - b.rank || (counts[b.entry.id] ?? 0) - (counts[a.entry.id] ?? 0)).map((r) => r.entry);
}

const isOn = (state: BrowseState, e: Entry) =>
  e.step === null ? state.sel[e.group as GroupId].includes(e.key) : state.range[e.group as RangeId] === e.step;

const flip = (state: BrowseState, e: Entry) =>
  e.step === null ? toggleOption(state, e.group as GroupId, e.key) : setRange(state, e.group as RangeId, e.step);

function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    loadSupabaseAfterPageLoad()
      .then((supabase) => {
        if (cancelled) return;
        supabase.auth.getUser().then(({ data }) => {
          if (!cancelled) setUser(data.user);
        });
        const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
        unsubscribe = () => data.subscription.unsubscribe();
      })
      // Lädt der Client nicht, gilt der Besucher als abgemeldet.
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);
  return user;
}

interface BrowseClientProps {
  state: BrowseState;
  result: BrowseResult;
  title: string;
  subtitle: string;
  /** Nur Themenseiten: Beschriftung des Links zurück zur ganzen Liste. */
  backLabel?: string;
  /** Themenseite: ihr Pfad in dieser Sprache; Seitenzahlen bleiben auf dieser Adresse. */
  basePath?: string;
  /** Themen-Links unter der Liste, vom Server gerendert. */
  children?: ReactNode;
}

export default function BrowseClient({ state, result, title, subtitle, backLabel, basePath, children }: BrowseClientProps) {
  const t = useTranslations("browse");
  const router = useRouter();
  const user = useUser();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useOptimistic(state);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const entries = useMemo(() => buildEntries(t), [t]);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Der Dialog setzt den Fokus auf das erste Feld; auf dem Handy klappt dadurch
  // sofort die Tastatur auf. Der Fokus geht stattdessen auf den Drawer-Inhalt.
  useEffect(() => {
    if (drawerOpen) drawerRef.current?.focus();
  }, [drawerOpen]);

  const apply = (next: BrowseState) =>
    startTransition(() => {
      setView(next);
      router.push(`/recipes${stateToQuery(next)}` as "/", { scroll: false });
    });

  const active = entries.filter((e) => isOn(view, e));
  const activeCount = countActive(view);
  const reset = () => apply({ ...emptyState(), sort: view.sort });

  const recipes: Recipe[] = result.items.map((item) => ({
    id: item.id,
    title: item.title,
    image: item.image,
    source: item.source,
    sourceUrl: "#",
    time: item.minutes ? `${item.minutes} min` : "—",
    servings: item.servings,
    rating: null,
    imagePosition: item.imagePosition,
    nameLang: item.nameLang,
    category: item.course ? t(`options.course.${item.course}`) : null,
    diet: item.diet,
    accent: item.accent,
  }));

  const panel = (idPrefix: string) => (
    <FilterPanel idPrefix={idPrefix} view={view} counts={result.counts} entries={entries} onChange={apply} t={t} />
  );
  // Filter-Klicks gehen immer auf /recipes?…, damit die Ansicht beim Ankreuzen
  // nicht zwischen zwei Routen wechselt. Nur das Blättern einer Themenseite
  // bleibt auf deren fester Adresse.
  const pageHref = (page: number) => {
    if (!basePath) return `/recipes${stateToQuery({ ...state, page })}`;
    const query = stateToQuery({ ...emptyState(), sort: state.sort, page });
    return `${basePath}${query}`;
  };

  return (
    <>
      <section className="bg-surface-soft">
        <div className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
          {backLabel && (
            <nav aria-label="Breadcrumb" className="mb-4 text-sm">
              <Link href="/recipes" className="font-semibold text-ink-2 underline underline-offset-[3px] hover:text-ink">
                {backLabel}
              </Link>
            </nav>
          )}
          <span aria-hidden="true" className="mb-3 block h-[3px] w-10 bg-brand" />
          <h1 className="text-h1-sm sm:text-h1">{title}</h1>
          <p className="mt-2 max-w-prose text-body-lg text-ink-2">{subtitle}</p>
          <SearchBox view={view} counts={result.counts} entries={entries} onChange={apply} t={t} />
        </div>
      </section>

      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:py-10">
        <aside aria-label={t("filters")} className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-4 pr-3">{panel("side")}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p role="status" className="tabular font-serif text-h3 font-semibold text-ink">
              {t("results", { count: result.total })}
              {pending && <span className="sr-only"> · {t("updating")}</span>}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" icon="sliders" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
                {t("filters")}
                {activeCount > 0 && <span className="tabular">({activeCount})</span>}
              </Button>
              <SortSelect view={view} onChange={apply} t={t} />
            </div>
          </div>

          {(activeCount > 0 || view.q) && (
            <ul aria-label={t("active")} className="mt-4 flex flex-wrap items-center gap-2">
              {view.q && (
                <li>
                  <Chip active size="sm" aria-pressed={undefined} aria-label={t("remove", { name: view.q })} onClick={() => apply({ ...view, q: "", page: 1 })}>
                    {t("searchChip", { query: view.q })}
                    <Icon name="x" size={16} />
                  </Chip>
                </li>
              )}
              {active.map((e) => (
                <li key={e.id}>
                  <Chip active size="sm" aria-pressed={undefined} aria-label={t("remove", { name: e.label })} onClick={() => apply(flip(view, e))}>
                    {e.label}
                    <Icon name="x" size={16} />
                  </Chip>
                </li>
              ))}
              {(["with", "without"] as const).flatMap((list) =>
                view[list].map((term) => {
                  const label = t(list === "with" ? "ingredients.withChip" : "ingredients.withoutChip", { name: term });
                  return (
                    <li key={`${list}:${term}`}>
                      <Chip active size="sm" aria-pressed={undefined} aria-label={t("remove", { name: label })} onClick={() => apply(toggleIngredient(view, list, term))}>
                        {label}
                        <Icon name="x" size={16} />
                      </Chip>
                    </li>
                  );
                }),
              )}
              <li>
                <Button variant="quiet" className="ml-1 text-sm" onClick={reset}>
                  {t("reset")}
                </Button>
              </li>
            </ul>
          )}

          <div className={["mt-6 transition-opacity duration-150", pending ? "opacity-50" : ""].join(" ")} aria-busy={pending}>
            {recipes.length > 0 ? (
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe, i) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={i} user={user} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("emptyTitle")}
                text={t("emptyText")}
                action={
                  isFiltered(view) ? (
                    <Button variant="secondary" onClick={reset}>
                      {t("reset")}
                    </Button>
                  ) : undefined
                }
              />
            )}
          </div>

          {result.pages > 1 && (
            <nav aria-label={t("pagination")} className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1) as "/"} rel="prev" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  {t("prev")}
                </Link>
              ) : (
                <span />
              )}
              <p className="tabular text-sm text-ink-3">{t("pageOf", { page: result.page, pages: result.pages })}</p>
              {result.page < result.pages ? (
                <Link href={pageHref(result.page + 1) as "/"} rel="next" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  {t("next")}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          {children}
        </div>
      </div>

      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("filters")} side>
        {drawerOpen && (
          <div ref={drawerRef} tabIndex={-1} className="flex flex-col gap-6 outline-none">
            {panel("drawer")}
            <div className="sticky -bottom-6 -mx-6 -mb-6 border-t border-line bg-surface px-6 py-4 sm:-bottom-8 sm:-mx-8 sm:-mb-8 sm:px-8">
              <Button fullWidth onClick={() => setDrawerOpen(false)}>
                {t("showResults", { count: result.total })}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

interface PartProps {
  view: BrowseState;
  counts: Record<string, number>;
  entries: Entry[];
  onChange: (next: BrowseState) => void;
  t: Translate;
}

/* ─── Suchfeld mit Vorschlägen: erst passende Filter, dann Rezepttitel ─────── */

type Suggestion = { kind: "filter"; entry: Entry } | { kind: "query"; text: string } | { kind: "with"; text: string } | { kind: "title"; text: string };

function SearchBox({ view, counts, entries, onChange, t }: PartProps) {
  const locale = useLocale();
  const inputId = useId();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(view.q);
  const [syncedQ, setSyncedQ] = useState(view.q);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [titles, setTitles] = useState<string[]>([]);

  // Ändert sich die Suche von außen (Zurück-Knopf, Chip entfernt), folgt das Feld.
  if (view.q !== syncedQ) {
    setSyncedQ(view.q);
    setText(view.q);
  }

  const trimmed = text.trim();
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/autocomplete?query=${encodeURIComponent(trimmed)}&lang=${locale}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data: { suggestions?: string[] }) => setTitles((data.suggestions ?? []).slice(0, 5)))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (trimmed.length < 2) return [];
    return [
      ...matchEntries(entries, trimmed, counts)
        .filter((e) => !isOn(view, e))
        .slice(0, 6)
        .map((entry) => ({ kind: "filter" as const, entry })),
      { kind: "query" as const, text: trimmed },
      ...(view.with.some((term) => sameIngredient(term, trimmed)) ? [] : [{ kind: "with" as const, text: trimmed }]),
      ...titles.filter((title) => title.toLowerCase() !== trimmed.toLowerCase()).map((title) => ({ kind: "title" as const, text: title })),
    ];
  }, [entries, trimmed, counts, view, titles]);

  const expanded = open && suggestions.length > 0;
  const close = () => {
    setOpen(false);
    setCursor(-1);
  };

  const search = (query: string) => {
    close();
    setText(query);
    // Eine neue Suche beginnt mit den besten Treffern.
    onChange({ ...view, q: query, sort: "mix", page: 1 });
  };

  const pick = (s: Suggestion) => {
    if (s.kind === "query" || s.kind === "title") return search(s.text);
    close();
    setText(view.q);
    onChange(s.kind === "with" ? toggleIngredient(view, "with", s.text) : flip(view, s.entry));
  };

  const firstOf = (kind: Suggestion["kind"]) => suggestions.findIndex((s) => s.kind === kind);

  return (
    <form
      role="search"
      className="mt-6 max-w-3xl"
      onSubmit={(e) => {
        e.preventDefault();
        if (expanded && cursor >= 0) pick(suggestions[cursor]);
        else search(trimmed);
      }}
    >
      <div
        ref={boxRef}
        className="relative"
        onBlur={(e) => {
          if (!boxRef.current?.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <Input
          id={inputId}
          label={t("searchLabel")}
          hideLabel
          type="text"
          inputMode="search"
          name="q"
          role="combobox"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setCursor(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") return close();
            if (!expanded || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setCursor((c) => (c + step + suggestions.length + (c < 0 && step < 0 ? 1 : 0)) % suggestions.length);
          }}
          placeholder={t("searchPlaceholder")}
          leadingIcon="search"
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && cursor >= 0 ? `${listId}-${cursor}` : undefined}
          inputClassName="h-14 pr-32"
        />
        <Button type="submit" className="absolute right-1.5 top-1.5">
          {t("searchButton")}
        </Button>

        {expanded && (
          <ul id={listId} role="listbox" aria-label={t("searchLabel")} className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2 border border-line bg-surface py-1 shadow-float">
            {suggestions.map((s, i) => {
              const heading = i === firstOf("filter") && s.kind === "filter" ? t("suggestFilters") : i === firstOf("title") && s.kind === "title" ? t("suggestRecipes") : null;
              return (
                <li key={s.kind === "filter" ? s.entry.id : `${s.kind}:${s.text}`} role="presentation">
                  {heading && <p className="px-4 pb-1 pt-2 text-caption font-semibold text-ink-3">{heading}</p>}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={cursor === i}
                    // mousedown statt click: das Feld verliert sonst vorher den Fokus und die Liste schließt.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(s);
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={["flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-base text-ink", cursor === i ? "bg-surface-soft" : "", s.kind === "query" ? "border-t border-line first:border-t-0" : ""].join(" ")}
                  >
                    <Icon name={s.kind === "filter" ? "sliders" : s.kind === "query" ? "search" : s.kind === "with" ? "plus" : "utensils"} size={18} className="shrink-0 text-ink-3" />
                    {s.kind === "filter" ? (
                      <>
                        <span className="min-w-0 flex-1 truncate">
                          <span className="text-ink-3">{s.entry.groupLabel}: </span>
                          <span className="font-semibold">{s.entry.label}</span>
                        </span>
                        <span className="tabular shrink-0 text-sm text-ink-3">{counts[s.entry.id] ?? 0}</span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 truncate">
                        {s.kind === "query" ? t("searchFor", { query: s.text }) : s.kind === "with" ? t("ingredients.suggestWith", { query: s.text }) : s.text}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </form>
  );
}

/* ─── Filterleiste: Gruppen zum Ankreuzen, Zahlenfilter als Stufen ─────────── */

function FilterPanel({ view, counts, entries, onChange, t, idPrefix }: PartProps & { idPrefix: string }) {
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<GroupId[]>([]);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const searching = normalize(query).length >= 2;
  const found = searching ? matchEntries(entries, query, counts).filter((e) => isOn(view, e) || (counts[e.id] ?? 0) > 0) : [];

  const row = (e: Entry, withGroup = false) => {
    const checked = isOn(view, e);
    const count = counts[e.id] ?? 0;
    const id = `${idPrefix}-${e.id}`;
    return (
      <li key={e.id}>
        <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-3 rounded-1 py-1 text-base text-ink hover:bg-surface-soft">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={() => onChange(flip(view, e))}
            className="h-5 w-5 shrink-0 cursor-pointer rounded-1 border-line-strong accent-brand"
          />
          <span className="min-w-0 flex-1">
            {withGroup && <span className="text-ink-3">{e.groupLabel}: </span>}
            {e.label}
          </span>
          <span className="tabular shrink-0 text-sm text-ink-3">{count}</span>
        </label>
      </li>
    );
  };

  const selectedCuisines = new Set(view.sel.cuisine);

  return (
    <div className="flex flex-col gap-5">
      <Input
        label={t("filterSearchLabel")}
        hideLabel
        type="text"
        inputMode="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("filterSearchPlaceholder")}
        leadingIcon="search"
        autoComplete="off"
      />

      {searching ? (
        found.length > 0 ? (
          <ul className="flex flex-col">{found.slice(0, 20).map((e) => row(e, true))}</ul>
        ) : (
          <p className="text-base text-ink-2">{t("noFilterMatch", { query: query.trim() })}</p>
        )
      ) : (
        <>
          {FACET_GROUPS.map((group) => {
            let options = group.options.map((o) => byId.get(`${group.id}:${o.key}`)!);
            if (group.id === "region") {
              // Regionen erscheinen erst, wenn ihre Küche gewählt ist.
              const parents = new Map(GROUP_BY_ID.region.options.map((o) => [o.key, o.parent]));
              options = options.filter((e) => isOn(view, e) || selectedCuisines.has(parents.get(e.key) ?? ""));
            }
            options = options.filter((e) => isOn(view, e) || (counts[e.id] ?? 0) > 0);
            if (!options.length) return null;
            const selected = view.sel[group.id].length;
            const expanded = expandedGroups.includes(group.id);
            const needsToggle = options.length > VISIBLE_OPTIONS + 2;
            const shown = needsToggle && !expanded ? options.filter((e, i) => i < VISIBLE_OPTIONS || isOn(view, e)) : options;
            return (
              <details key={group.id} open={OPEN_BY_DEFAULT.includes(group.id) || selected > 0} className="group/filter border-t border-line pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>
                    {t(`groups.${group.id}`)}
                    {selected > 0 && <span className="tabular ml-2 text-sm font-normal text-ink-3">{selected}</span>}
                  </span>
                  <Icon name="chevronDown" size={18} className="text-ink-3 transition-transform duration-150 group-open/filter:rotate-180" />
                </summary>
                <ul className="mt-2 flex flex-col">{shown.map((e) => row(e))}</ul>
                {needsToggle && (
                  <Button
                    variant="quiet"
                    className="mt-1 text-sm"
                    aria-expanded={expanded}
                    onClick={() => setExpandedGroups((g) => (expanded ? g.filter((id) => id !== group.id) : [...g, group.id]))}
                  >
                    {expanded ? t("showLess") : t("showMore")}
                  </Button>
                )}
              </details>
            );
          })}

          <details open={view.with.length + view.without.length > 0} className="group/filter border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span>
                {t("groups.ingredients")}
                {view.with.length + view.without.length > 0 && (
                  <span className="tabular ml-2 text-sm font-normal text-ink-3">{view.with.length + view.without.length}</span>
                )}
              </span>
              <Icon name="chevronDown" size={18} className="text-ink-3 transition-transform duration-150 group-open/filter:rotate-180" />
            </summary>
            <div className="mt-3 flex flex-col gap-4">
              <IngredientInput list="with" view={view} onChange={onChange} t={t} />
              <IngredientInput list="without" view={view} onChange={onChange} t={t} />
              <p className="text-caption text-ink-3">{t("ingredients.hint")}</p>
            </div>
          </details>

          <details open className="group/filter border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {t("groups.time")}
              <Icon name="chevronDown" size={18} className="text-ink-3 transition-transform duration-150 group-open/filter:rotate-180" />
            </summary>
            <RangeChips id="time" view={view} counts={counts} entries={entries} onChange={onChange} />
          </details>

          <details open={NUTRITION.some((id) => view.range[id] !== null)} className="group/filter border-t border-line pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {t("groups.nutrition")}
              <Icon name="chevronDown" size={18} className="text-ink-3 transition-transform duration-150 group-open/filter:rotate-180" />
            </summary>
            {NUTRITION.map((id) => (
              <RangeChips key={id} id={id} view={view} counts={counts} entries={entries} onChange={onChange} />
            ))}
          </details>
        </>
      )}
    </div>
  );
}

/* Zutat hinzufügen: freies Feld mit Vorschlägen aus den Zutaten der Sprache. */
function IngredientInput({ list, view, onChange, t }: Pick<PartProps, "view" | "onChange" | "t"> & { list: "with" | "without" }) {
  const locale = useLocale();
  const [text, setText] = useState("");
  const [found, setFound] = useState<{ query: string; items: { label: string; count: number }[] }>({ query: "", items: [] });
  const trimmed = text.trim();

  useEffect(() => {
    if (!longEnough(trimmed)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/browse/ingredients?lang=${locale}&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data: { suggestions?: { label: string; count: number }[] }) => setFound({ query: trimmed, items: data.suggestions ?? [] }))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  const add = (term: string) => {
    setText("");
    if (!view[list].some((t) => sameIngredient(t, term.trim()))) onChange(toggleIngredient(view, list, term));
  };
  // Nur Vorschläge zur aktuellen Eingabe zeigen, nicht die der vorigen.
  const items = longEnough(trimmed) && found.query === trimmed ? found.items : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (longEnough(trimmed)) add(trimmed);
      }}
    >
      <div className="flex items-end gap-2">
        <Input
          className="min-w-0 flex-1"
          label={t(`ingredients.${list}`)}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t(list === "with" ? "ingredients.placeholder" : "ingredients.placeholderWithout")}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={30}
        />
        <Button type="submit" variant="icon" icon="plus" aria-label={`${t("ingredients.add")}: ${t(`ingredients.${list}`)}`} disabled={!longEnough(trimmed)} />
      </div>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.label}>
              <Chip size="sm" onClick={() => add(item.label)} aria-pressed={undefined}>
                {item.label}
                <span className="tabular font-normal text-ink-3">{item.count}</span>
              </Chip>
            </li>
          ))}
        </ul>
      )}
      {view[list].length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {view[list].map((term) => (
            <li key={term}>
              <Chip active size="sm" aria-pressed={undefined} aria-label={t("remove", { name: term })} onClick={() => onChange(toggleIngredient(view, list, term))}>
                {term}
                <Icon name="x" size={16} />
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function RangeChips({ id, view, counts, entries, onChange }: Omit<PartProps, "t"> & { id: RangeId }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries
        .filter((e) => e.group === id)
        .map((e) => {
          const on = isOn(view, e);
          return (
            <Chip key={e.id} size="sm" active={on} disabled={!on && (counts[e.id] ?? 0) === 0} className="disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onChange(flip(view, e))}>
              {e.label}
            </Chip>
          );
        })}
    </div>
  );
}

function SortSelect({ view, onChange, t }: Pick<PartProps, "view" | "onChange" | "t">) {
  const id = useId();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {t("sortLabel")}
      </label>
      <select
        id={id}
        value={view.sort}
        onChange={(e) => onChange({ ...view, sort: e.target.value as SortId, page: 1 })}
        className="h-10 cursor-pointer appearance-none rounded-1 border border-line-strong bg-surface pl-3 pr-9 text-sm font-semibold text-ink transition-colors hover:bg-surface-soft"
      >
        {SORT_IDS.map((sort) => (
          <option key={sort} value={sort}>
            {sort === "mix" && view.q ? t("sort.relevance") : t(`sort.${sort}`)}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
    </div>
  );
}
