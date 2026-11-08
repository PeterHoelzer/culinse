"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Chip, ChipRow, Icon, Input } from "@/components/ui";
import { Link } from "@/lib/navigation";
import { heroSrcSet, HERO_SIZES } from "@/lib/heroImage";
import type { DishColors, Recipe } from "./home-types";

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
  /** Farben aus dem Foto (DESIGN.md §11); null = Markenfarben. */
  colors?: DishColors | null;
}

/** Aus "45 min" wird "45 Min." (de) bzw. "45 min"; alles andere bleibt unverändert. */
function formatTime(time: string, locale: string): string | null {
  if (!time || time === "—") return null;
  const minutes = parseInt(time, 10);
  if (Number.isNaN(minutes)) return time;
  return locale === "de" ? `${minutes} Min.` : `${minutes} min`;
}

export default function Hero({ search, setSearch, onSearch, featured, colors }: HeroProps) {
  const stage = colors?.stage ?? "#7a2e0e";
  const tint = colors?.tint ?? "#fbede4";
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
      {/* Bühne in der Farbe des Gerichts: links Titel und große Zahlen, rechts das Foto */}
      <section style={{ backgroundColor: stage }} className="text-white">
        {featured ? (
          <div className="grid md:h-[76vh] md:max-h-[840px] md:min-h-[560px] md:grid-cols-[minmax(0,520px)_1fr]">
            <div className="order-2 flex flex-col justify-end gap-5 px-4 pb-10 pt-8 sm:px-10 sm:pb-12 md:order-1">
              <p className="text-sm text-white/80">{featuredLabel}</p>
              <h1
                className="text-balance font-serif font-semibold text-white"
                style={{ fontSize: "clamp(2.5rem, 6.2vw, 5.75rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}
              >
                {featured.title}
              </h1>
              {(time || servings) && (
                <div className="mt-1 flex gap-10">
                  {time && (
                    <div>
                      <p className="tabular font-serif text-[52px] font-medium leading-none text-white">{parseInt(time, 10)}</p>
                      <p className="mt-1.5 text-sm text-white/80">{isDE ? "Minuten" : "minutes"}</p>
                    </div>
                  )}
                  {featured.servings && (
                    <div>
                      <p className="tabular font-serif text-[52px] font-medium leading-none text-white">{featured.servings}</p>
                      <p className="mt-1.5 text-sm text-white/80">{isDE ? "Portionen" : "servings"}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href={`/recipe/${featured.id}`}
                  className="inline-flex h-12 items-center rounded-1 bg-surface px-6 text-base font-bold transition-colors hover:bg-surface-soft"
                  style={{ color: stage }}
                >
                  {toRecipe}
                </Link>
                <Link
                  href="/weekly-meal-planner"
                  className="inline-flex h-12 items-center rounded-1 border border-white/60 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t("hero.ctaPlan")}
                </Link>
              </div>
            </div>
            <figure className="relative order-1 m-0 md:order-2 md:h-full">
              {featured.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.image}
                  srcSet={heroSrcSet(featured.image)}
                  sizes={HERO_SIZES}
                  alt={featured.title}
                  width={1600}
                  height={1200}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="animate-hero-in aspect-[4/3] w-full object-cover md:absolute md:inset-0 md:aspect-auto md:h-full"
                  style={{ objectPosition: featured.imagePosition ?? "50% 50%" }}
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center md:absolute md:inset-0 md:aspect-auto md:h-full">
                  <Icon name="utensils" size={32} className="text-white/60" />
                </div>
              )}
              {aiNotice && (
                <figcaption className="absolute right-4 top-3 rounded-1 bg-dark/55 px-2 py-1 text-caption text-white sm:right-6">{aiNotice}</figcaption>
              )}
            </figure>
          </div>
        ) : (
          <div className="mx-auto flex max-w-content flex-col items-start px-4 py-20 sm:px-6">
            <h1 className="max-w-4xl text-balance font-serif font-semibold text-white" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1 }}>
              {t("hero.headline1")} {t("hero.headline2")}
            </h1>
            <p className="mt-5 max-w-prose text-body-lg text-white/85">{t("hero.subline")}</p>
            <Button href="/weekly-meal-planner" className="mt-6">{t("hero.ctaPlan")}</Button>
          </div>
        )}
      </section>

      <section style={{ backgroundColor: tint }}>
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-12">
      {/* Suche */}
      <form
        role="search"
        className="mx-auto flex max-w-4xl flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="text-center font-serif text-h2-sm font-medium sm:text-h2" style={{ color: stage }}>
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
