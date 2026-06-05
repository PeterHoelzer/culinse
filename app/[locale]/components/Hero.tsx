"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function Hero({ search, setSearch, onSearch }: { search: string; setSearch: (v: string) => void; onSearch: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/autocomplete?query=${encodeURIComponent(val)}&lang=${locale}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    }, 250);
  };

  const handleSelect = (s: string) => {
    setSearch(s);
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch();
  };

  const quickPicks = t.raw("hero.quickPicks") as string[];

  return (
    <section className="hero-gradient py-20 sm:py-28 px-4">
      <div className="max-w-3xl mx-auto text-center">

        {/* Credibility badge */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-orange-700 bg-white/70 border border-orange-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span>👨‍🍳</span>
          <span>{t("hero.badge")}</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-5">
          {t("hero.headline1")}<br />
          <span style={{ color: "#f97316" }}>{t("hero.headline2")}</span>
        </h1>

        {/* Subline */}
        <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
          {t("hero.subline")}
        </p>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto">
          <div className="flex items-center gap-2 bg-white rounded-2xl shadow-lg p-2 border border-orange-100">
            <span className="pl-1 text-gray-400 text-xl flex-shrink-0">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); onSearch(); } }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={t("hero.searchPlaceholder")}
              className="search-input flex-1 min-w-0 text-sm sm:text-base text-gray-700 bg-transparent py-2 px-1 placeholder-gray-400"
            />
            <button
              onClick={() => { setShowSuggestions(false); onSearch(); }}
              className="flex-shrink-0 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: "#f97316" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ea6c00")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
            >
              {t("hero.searchButton")}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(s)}
                  className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-3"
                >
                  <span className="text-gray-300">🔍</span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick picks */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-gray-500">
          <span>{t("hero.tryLabel")}</span>
          {quickPicks.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="text-orange-500 hover:text-orange-700 hover:underline transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Source trust row */}
        <div className="mt-8 text-xs text-gray-400">
          {/* Mobile: compact version */}
          <div className="sm:hidden flex flex-wrap justify-center items-center gap-2">
            <span>{t("hero.sourcesMobile")}</span>
            <span className="text-gray-300">·</span>
            <span>{t("hero.freeLabel")}</span>
          </div>
          {/* Desktop: badge version */}
          <div className="hidden sm:flex flex-wrap justify-center items-center gap-x-3 gap-y-2">
            <span>{t("hero.sourcesDesktop")}</span>
            {["Spoonacular", "MealDB", "Edamam", "Tasty"].map((src) => (
              <span key={src} className="font-medium text-gray-500 bg-white/60 border border-gray-200 px-2.5 py-1 rounded-full">{src}</span>
            ))}
            <span className="text-gray-300">·</span>
            <span>{t("hero.freeLabel")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Category Chips ───────────────────────────────────────────────────────────
