"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Chip, ChipRow, Icon, Input } from "@/components/ui";
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
    <section className="bg-surface-soft">
      <div className="mx-auto max-w-content px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16">
      {featured ? (
        <div className="grid gap-8 md:grid-cols-[5fr_7fr] md:items-center md:gap-12">
          <div className="order-2 flex flex-col items-start gap-4 md:order-1">
            <p className="text-sm text-ink-3">{featuredLabel}</p>
            <h1 className="text-display-sm font-bold md:text-display">{featured.title}</h1>
            {meta && <p className="tabular text-sm text-ink-3">{meta}</p>}
            <div className="mt-2 flex flex-wrap gap-3">
              <Button href={`/recipe/${featured.id}`}>{toRecipe}</Button>
              <Button variant="secondary" href="/weekly-meal-planner">
                {t("hero.ctaPlan")}
              </Button>
            </div>
          </div>

          <figure className="order-1 m-0 md:order-2">
            {featured.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.image}
                alt={featured.title}
                width={1200}
                height={900}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="aspect-[4/3] w-full rounded-2 object-cover"
                style={{ objectPosition: featured.imagePosition ?? "50% 50%" }}
              />
            ) : (
              <div className="flex aspect-[3/2] w-full items-center justify-center rounded-2 bg-surface-soft">
                <Icon name="utensils" size={32} className="text-line-strong" />
              </div>
            )}
            {aiNotice && <figcaption className="mt-2 text-caption text-ink-3">{aiNotice}</figcaption>}
          </figure>
        </div>
      ) : (
        <div className="flex max-w-prose flex-col items-start gap-5">
          <h1 className="text-display-sm md:text-display">
            {t("hero.headline1")} {t("hero.headline2")}
          </h1>
          <p className="text-body-lg text-ink-2">{t("hero.subline")}</p>
          <Button href="/weekly-meal-planner">{t("hero.ctaPlan")}</Button>
        </div>
      )}

      {/* Suche */}
      <form
        role="search"
        className="mt-10 flex max-w-3xl flex-col gap-3 sm:mt-12"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="text-h3">
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

        <ChipRow className="mt-1">
          {quickPicks.map((pick) => (
            <Chip key={pick} onClick={() => handleSelect(pick)}>
              {pick}
            </Chip>
          ))}
        </ChipRow>
      </form>
      </div>
    </section>
  );
}
