"use client";

import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { loadSupabase } from "@/lib/supabase/lazy";
import { Link } from "@/lib/navigation";
import { Button, Chip, EmptyState, Notice, SectionHeader, Skeleton } from "@/components/ui";
import { Recipe, TREND_FILTER_DEFS, STATE_CHIPS } from "./home-types";
import CategoryChips from "./CategoryChips";
import RecipeCard from "./RecipeCard";

// Merge keys into the URL query string without navigating, so the user's filter
// selection survives navigating to a recipe and pressing "back".
function updateUrlParams(updates: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

const FILTER_PANEL_ID = "discover-filters";
const FILTER_TOGGLE_ID = "discover-filters-toggle";

/** Eine Chip-Gruppe im Filter-Panel; der erste Chip („Alle …“) benennt die Gruppe. */
function FilterGroup({ children, divider = true }: { children: ReactNode; divider?: boolean }) {
  return (
    <div role="group" className={["flex flex-wrap gap-2", divider ? "border-t border-line pt-4" : ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/** Skeleton in Kartenhöhe: Bild 4:3 plus drei Textzeilen */
function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export default function DiscoverSection({
  search,
  category,
  setCategory,
  user,
  initialRecipes,
}: {
  search: string;
  category: string;
  setCategory: (v: string) => void;
  user: User | null | undefined;
  // Server-gefetchte Default-Karten (E2) - decken den ersten Render ab.
  initialRecipes?: Recipe[];
}) {
  const t = useTranslations();
  const locale = useLocale();

  const TIME_FILTERS = [
    { label: t("timeFilters.any"), value: "" },
    { label: t("timeFilters.15"),  value: "15" },
    { label: t("timeFilters.30"),  value: "30" },
    { label: t("timeFilters.60"),  value: "60" },
  ];

  const DIET_FILTERS = [
    { label: t("dietFilters.all"),         value: "" },
    { label: t("dietFilters.vegetarian"),  value: "vegetarian" },
    { label: t("dietFilters.vegan"),       value: "vegan" },
    { label: t("dietFilters.glutenFree"),  value: "gluten free" },
  ];

  const TREND_FILTERS = TREND_FILTER_DEFS.map((d) => ({
    ...d,
    label: t(`trendFilters.${d.key}` as Parameters<typeof t>[0]),
  }));

  // SSR-Startdaten (E2): Die ersten 6 Karten kommen bereits server-gerendert
  // an - kein Skeleton, das LCP-Bild startet mit dem ersten Paint.
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes ?? []);
  const [loading, setLoading] = useState(!(initialRecipes?.length));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [count, setCount] = useState(6);
  const [maxTime, setMaxTime] = useState("");
  const [diet, setDiet] = useState("");
  const [trend, setTrend] = useState("");
  const [forYouActive, setForYouActive] = useState(false);
  const [region, setRegion] = useState(""); // Bundesland; greift nur bei Kategorie "German"
  const [userPrefs, setUserPrefs] = useState<{ diet: string; intolerances: string[]; max_time: number } | null>(null);
  const [community, setCommunity] = useState<Recipe[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load a couple of public, user-created recipes once, to sprinkle into the
  // default discover view. Failure is silent — they're a bonus, not required.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/community-recipes?number=4&lang=${locale}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCommunity(d.recipes ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  useEffect(() => {
    if (!user) return;
    loadSupabase()
      .then((supabase) => supabase.from("user_preferences").select("*").eq("user_id", user.id).single())
      .then(({ data }) => { if (data) setUserPrefs(data); });
  }, [user]);

  const fetchRecipes = useCallback(async (num = 6, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      params.set("lang", locale);
      if (category && category !== "All") params.set("category", category);
      if (category === "German" && region) params.set("region", region);
      if (maxTime) params.set("maxTime", maxTime);
      if (diet) params.set("diet", diet);
      if (forYouActive && userPrefs) {
        if (!diet && userPrefs.diet) params.set("diet", userPrefs.diet);
        if (!maxTime && userPrefs.max_time) params.set("maxTime", String(userPrefs.max_time));
        if (userPrefs.intolerances?.length) params.set("intolerances", userPrefs.intolerances.join(","));
      }
      const activeTrend = TREND_FILTER_DEFS.find(f => f.value === trend && f.value !== "");
      if (activeTrend) {
        if (activeTrend.type === "minProtein") params.set("minProtein", activeTrend.value);
        if (activeTrend.type === "maxCarbs") params.set("maxCarbs", activeTrend.value);
        if (activeTrend.type === "diet") params.set("diet", activeTrend.value);
        if (activeTrend.type === "intolerances") params.set("intolerances", activeTrend.value);
        if (activeTrend.type === "cuisine") params.set("cuisine", activeTrend.value);
      }
      params.set("number", String(num));
      const res = await fetch(`/api/recipes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fetched: Recipe[] = data.recipes || [];
      setRecipes(fetched);
      setHasMore(!!data.hasMore);
      setQuotaExceeded(!!data.quota_exceeded);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, region, maxTime, diet, trend, forYouActive, userPrefs]);

  // Keep the loaded count in a ref so the fetch effect can read the latest
  // value without re-running on every Load More. applyCount syncs state, ref
  // and the URL, so the count survives a back navigation.
  const countRef = useRef(6);
  const applyCount = (n: number) => {
    countRef.current = n;
    setCount(n);
    updateUrlParams({ n: n > 6 ? String(n) : undefined });
  };

  const handleLoadMore = () => {
    const newCount = count + 6;
    applyCount(newCount);
    fetchRecipes(newCount, true);
  };

  // Restore filters + loaded count from the URL on mount (e.g. after the
  // browser back button). Declared before the fetch effect so the first fetch
  // already uses the restored count. Intentional one-time setState on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const time = params.get("time");
    const dietParam = params.get("diet");
    const trendParam = params.get("trend");
    const n = parseInt(params.get("n") || "", 10);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (time) setMaxTime(time);
    if (dietParam) setDiet(dietParam);
    if (trendParam) setTrend(trendParam);
    if (n && n > 6) { countRef.current = n; setCount(n); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Der Mount-Run wird uebersprungen, wenn die SSR-Daten den Default-View
  // abdecken (E2): kein doppelter Fetch, ein Provider-API-Call weniger pro
  // Besuch. Der URL-Restore-Effekt oben laeuft vorher - bei n > 6 oder
  // Filtern aus der URL greift der normale Fetch (fetchRecipes aendert sich,
  // der Effekt laeuft erneut mit skippedInitialFetch = true).
  const skippedInitialFetch = useRef(false);
  useEffect(() => {
    if (!skippedInitialFetch.current) {
      skippedInitialFetch.current = true;
      if ((initialRecipes?.length ?? 0) > 0 && countRef.current === 6) return;
    }
    setHasMore(true);
    fetchRecipes(countRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRecipes]);

  // After results load, scroll the previously-clicked recipe card back into
  // view. Re-checks on each load (deps include recipes) so it still works once
  // the restored count brings the card in. The marker is cleared when consumed
  // and ignored after 60s, so it never fires on an unrelated fresh visit.
  useEffect(() => {
    if (loading) return;
    let raw: string | null = null;
    try { raw = sessionStorage.getItem("culinse:returnTo"); } catch {}
    if (!raw) return;
    let data: { id?: string; y?: number; t?: number } = {};
    try { data = JSON.parse(raw); }
    catch { try { sessionStorage.removeItem("culinse:returnTo"); } catch {} return; }
    if (data.t && Date.now() - data.t > 60000) {
      try { sessionStorage.removeItem("culinse:returnTo"); } catch {}
      return;
    }
    const el = data.id ? document.getElementById(`recipe-${data.id}`) : null;
    if (el) {
      try { sessionStorage.removeItem("culinse:returnTo"); } catch {}
      requestAnimationFrame(() => el.scrollIntoView({ block: "center", behavior: "auto" }));
    }
  }, [loading, recipes]);

  const selectMaxTime = (v: string) => { setMaxTime(v); applyCount(6); updateUrlParams({ time: v || undefined }); };
  const selectDiet = (v: string) => { setDiet(v); applyCount(6); updateUrlParams({ diet: v || undefined }); };
  const selectTrend = (v: string) => { setTrend(v); applyCount(6); updateUrlParams({ trend: v || undefined }); };

  // Only sprinkle community recipes into the unfiltered default view, where
  // relevance doesn't matter; on a real search/filter we show pure results.
  const isDefaultView =
    !search && (!category || category === "All") && !maxTime && !diet && !trend && !forYouActive;

  const displayedRecipes = useMemo(() => {
    if (!isDefaultView || community.length === 0 || recipes.length === 0) return recipes;
    // Feste Regel (Peters Vorgabe): Jedes 6. Bild gehört der Community/dem
    // eigenen Korpus — Index 5, 11, 17, … Die Gesamtzahl bleibt unverändert;
    // Provider-Rezepte füllen die übrigen Slots. So sind die eigenen Rezepte
    // verlässlich in jedem Sechser-Block sichtbar statt an Zufallspositionen.
    const target = recipes.length;
    const communityIds = new Set(community.map((c) => String(c.id)));
    const providers = recipes.filter((r) => !communityIds.has(String(r.id)));
    const out: Recipe[] = [];
    let pi = 0;
    let ci = 0;
    for (let i = 0; i < target; i++) {
      const isCommunitySlot = (i + 1) % 6 === 0 && ci < community.length;
      if (isCommunitySlot) out.push(community[ci++]);
      else if (pi < providers.length) out.push(providers[pi++]);
      else if (ci < community.length) out.push(community[ci++]);
      else break;
    }
    return out;
  }, [recipes, community, isDefaultView]);

  // ── Filter-Panel (DESIGN.md §5: nur eine sichtbare Chip-Reihe) ───────────
  const showStates = category === "German";
  const activeFilterCount =
    (maxTime ? 1 : 0) + (diet ? 1 : 0) + (trend ? 1 : 0) + (showStates && region ? 1 : 0);
  const hasForYouChip =
    !!user && !!userPrefs && (!!userPrefs.diet || (userPrefs.intolerances?.length ?? 0) > 0 || !!userPrefs.max_time);
  const intoleranceCount = userPrefs?.intolerances?.length ?? 0;

  const closeFilters = (returnFocus = false) => {
    setFiltersOpen(false);
    if (returnFocus) document.getElementById(FILTER_TOGGLE_ID)?.focus();
  };

  return (
    <section id="discover" aria-labelledby="discover-title" className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-16 lg:px-10">

      {user && !userPrefs && (
        <Notice tone="info" className="mb-6">
          <Link href="/profile" className="font-semibold text-brand underline underline-offset-[3px] hover:text-brand-hover">
            {t("discover.profileCta")}
          </Link>{" "}
          <span className="text-ink-2">{t("discover.profileCtaSub")}</span>
        </Notice>
      )}

      <SectionHeader
        id="discover-title"
        className="discover-anchor scroll-mt-24"
        title={search ? t("discover.resultsFor", { query: search }) : t("discover.title")}
        subtitle={loading ? t("discover.loading") : t("discover.recipesFound", { count: recipes.length })}
      />

      {/* Die eine Chip-Reihe: Filter-Schalter, „Für dich“, Kategorien */}
      <CategoryChips
        active={category}
        setActive={setCategory}
        leading={
          <>
            <Chip
              id={FILTER_TOGGLE_ID}
              icon="sliders"
              active={activeFilterCount > 0}
              aria-pressed={undefined}
              aria-expanded={filtersOpen}
              aria-controls={FILTER_PANEL_ID}
              onClick={() => setFiltersOpen((v) => !v)}
              onKeyDown={(e) => { if (e.key === "Escape" && filtersOpen) closeFilters(); }}
            >
              {t("discover.filters")}
              {activeFilterCount > 0 && (
                <>
                  <span aria-hidden="true" className="tabular">({activeFilterCount})</span>
                  <span className="sr-only">{t("discover.filtersActive", { count: activeFilterCount })}</span>
                </>
              )}
            </Chip>
            {hasForYouChip && (
              <Chip
                icon="user"
                active={forYouActive}
                onClick={() => { setForYouActive(v => !v); applyCount(6); }}
              >
                {t("trendFilters.forYou")}
              </Chip>
            )}
          </>
        }
      />

      {forYouActive && intoleranceCount > 0 && (
        <p className="mt-3 text-sm text-ink-3">
          <Link href="/profile" className="text-brand underline underline-offset-[3px] hover:text-brand-hover">
            {intoleranceCount === 1
              ? t("discover.allergenFiltered", { count: intoleranceCount })
              : t("discover.allergensFiltered", { count: intoleranceCount })}
          </Link>
        </p>
      )}

      {/* Panel mit Trend-, Zeit-, Diät- und Bundesland-Filtern */}
      <div
        id={FILTER_PANEL_ID}
        hidden={!filtersOpen}
        onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); closeFilters(true); } }}
        className="mt-4 flex flex-col gap-4 rounded-2 bg-surface-soft p-4"
      >
        <FilterGroup divider={false}>
          {TREND_FILTERS.map((f) => (
            <Chip key={f.value} size="sm" active={trend === f.value} onClick={() => selectTrend(f.value)}>
              {f.label}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup>
          {TIME_FILTERS.map((f) => (
            <Chip key={f.value} size="sm" active={maxTime === f.value} onClick={() => selectMaxTime(f.value)}>
              <span className="tabular">{f.label}</span>
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup>
          {DIET_FILTERS.map((f) => (
            <Chip
              key={f.value}
              size="sm"
              active={diet === f.value}
              icon={userPrefs?.diet === f.value && f.value !== "" ? "user" : undefined}
              onClick={() => selectDiet(f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </FilterGroup>

        {showStates && (
          <FilterGroup>
            {([["", t("allStates")]] as [string, string][]).concat(STATE_CHIPS).map(([val, label]) => (
              <Chip key={val || "alle"} size="sm" active={region === val} onClick={() => setRegion(val)}>
                {label}
              </Chip>
            ))}
          </FilterGroup>
        )}
      </div>

      {quotaExceeded && !loading && (
        <Notice tone="warn" className="mt-6">
          {t("discover.quotaWarning")}
        </Notice>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            icon="alert"
            title={t("discover.error")}
            action={
              <Button variant="secondary" onClick={() => fetchRecipes(count)}>
                {t("discover.tryAgain")}
              </Button>
            }
          />
        ) : recipes.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedRecipes.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} index={i} user={user} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
                  {t("discover.loadMore")}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title={t("discover.noRecipes")} text={t("discover.noRecipesSub")} />
        )}
      </div>
    </section>
  );
}
