"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Chip, ChipRow, Icon, Input } from "@/components/ui";
import { Link } from "@/lib/navigation";
import type { Recipe } from "./home-types";

/*
  Hero der Startseite (DESIGN.md §0, §5 „Suche“): weiß, zweispaltig ab md.
  Links das Rezept des Tages mit Serifen-Titel, rechts das Foto 3:2.
  Darunter die Suche mit sichtbarem Label, 56-px-Feld und Chips.
  Kein Verlauf, kein Badge, keine Häkchen, keine Quellen-Pillen.
*/

export interface HeroProps {
  search: string;
  setSearch: (value: string) => void;
  onSearch: () => void;
  /** Hervorgehobenes Rezept (serverseitig geladen, initialRecipes[0]). */
  featured?: Recipe | null;
}

/** Aus "45 min" wird "45 Min." (de) bzw. "45 min"; alles andere bleibt unverändert. */
function formatTime(time: string, locale: string): string | null {
  if (!time || time === "—") return null;
  const minutes = parseInt(time, 10);
  if (Number.isNaN(minutes)) return time;
  return locale === "de" ? `${minutes} Min.` : `${minutes} min`;
}

export default function Hero({ search, setSearch, onSearch, featured }: HeroProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isDE = locale === "de";
  const inputId = useId();
  const listId = `${inputId}-suggestions`;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(value)}&lang=${locale}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const submit = () => {
    setShowSuggestions(false);
    onSearch();
  };

  const handleSelect = (value: string) => {
    setSearch(value);
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch();
  };

  const quickPicks = (t.raw("hero.quickPicks") as string[]).slice(0, 6);

  // Texte mit Fallback, bis die Schlüssel in messages/*.json liegen (siehe Bericht).
  const featuredLabel = t.has("hero.featuredLabel") ? t("hero.featuredLabel") : isDE ? "Rezept des Tages" : "Recipe of the day";
  const toRecipe = t.has("hero.toRecipe") ? t("hero.toRecipe") : t("videoSection.fullRecipe");
  const searchLabel = t.has("hero.searchLabel") ? t("hero.searchLabel") : isDE ? "Was willst du kochen?" : "What do you want to cook?";
  const aiNotice = t.has("recipe.aiNotice") ? t("recipe.aiNotice") : null;

  const time = featured ? formatTime(featured.time, locale) : null;
  const servings = featured?.servings ? t("recipeCard.servings", { count: featured.servings }) : null;
  const meta = [time, servings].filter(Boolean).join(" · ");

  return (
    <>
      {/* Bühne: dunkles Panel, großer Titel, Foto füllt den Rest (Apple-Rhythmus) */}
      <section className="bg-dark text-white">
        {featured ? (
          <figure className="relative m-0 h-[70vh] min-h-[480px] w-full sm:h-[78vh] sm:max-h-[900px]">
            {featured.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.image}
                alt={featured.title}
                width={1600}
                height={1000}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="animate-hero-in absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: featured.imagePosition ?? "50% 50%" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-dark">
                <Icon name="utensils" size={32} className="text-dark-text" />
              </div>
            )}
            {/* Schleier von unten: macht Titel und Buttons auf jedem Foto lesbar */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-dark/90 via-dark/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto flex max-w-content flex-col items-start gap-3 px-4 pb-10 sm:px-6 sm:pb-14">
                <p className="text-sm text-dark-text">{featuredLabel}</p>
                <h1
                  className="max-w-4xl text-balance font-bold text-white"
                  style={{ fontSize: "clamp(2.25rem, 5.5vw, 4.75rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {featured.title}
                </h1>
                {meta && <p className="tabular text-base text-dark-text">{meta}</p>}
                <div className="mt-2 flex flex-wrap gap-3">
                  <Button href={`/recipe/${featured.id}`}>{toRecipe}</Button>
                  <Link
                    href="/weekly-meal-planner"
                    className="inline-flex h-11 items-center rounded-1 border border-dark-text px-5 text-base font-semibold text-white transition-colors hover:bg-surface hover:text-ink"
                  >
                    {t("hero.ctaPlan")}
                  </Link>
                </div>
              </div>
            </div>
            {aiNotice && (
              <figcaption className="absolute right-4 top-3 text-caption text-white/90 sm:right-6">{aiNotice}</figcaption>
            )}
          </figure>
        ) : (
          <div className="mx-auto flex max-w-content flex-col items-start px-4 py-20 sm:px-6">
            <h1 className="max-w-4xl text-balance font-bold text-white" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.02 }}>
              {t("hero.headline1")} {t("hero.headline2")}
            </h1>
            <p className="mt-5 max-w-prose text-body-lg text-dark-text">{t("hero.subline")}</p>
            <Button href="/weekly-meal-planner" className="mt-6">{t("hero.ctaPlan")}</Button>
          </div>
        )}
      </section>

      <section className="bg-surface">
      <div className="mx-auto max-w-content px-4 pt-12 pb-12 sm:px-6 sm:pt-16 sm:pb-16">
      {/* Suche */}
      <form
        role="search"
        className="mx-auto flex max-w-3xl flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="text-center font-serif text-h2-sm sm:text-h2">
          {searchLabel}
        </label>
        <div className="relative">
          <Input
            id={inputId}
            type="text"
            inputMode="search"
            name="q"
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={t("hero.searchPlaceholder")}
            leadingIcon="search"
            autoComplete="off"
            enterKeyHint="search"
            aria-autocomplete="list"
            aria-controls={showSuggestions && suggestions.length > 0 ? listId : undefined}
            aria-expanded={showSuggestions && suggestions.length > 0}
            inputClassName="h-14 pr-32"
          />
          <Button type="submit" className="absolute right-1.5 top-1.5">
            {t("hero.searchButton")}
          </Button>

          {showSuggestions && suggestions.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2 border border-line bg-surface shadow-float"
            >
              {suggestions.map((s) => (
                <li key={s} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(s)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-base text-ink transition-colors hover:bg-surface-soft"
                  >
                    <Icon name="search" size={18} className="shrink-0 text-ink-3" />
                    <span className="min-w-0 truncate">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ChipRow className="mt-1 sm:justify-center">
          {quickPicks.map((pick) => (
            <Chip key={pick} onClick={() => handleSelect(pick)}>
              {pick}
            </Chip>
          ))}
        </ChipRow>
      </form>
      </div>
      </section>
    </>
  );
}
