"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { Icon } from "@/components/ui";

/*
  Sterne-Bewertung unter einem Rezept. Lesen kann jeder, bewerten nur ein
  angemeldetes Konto (eine Bewertung je Gericht, änderbar). Ohne Anmeldung
  führt ein Klick auf einen Stern zum Hinweis mit Verweis auf die Anmeldung.
*/

interface State {
  count: number;
  average: number | null;
  mine: number | null;
}

export default function RecipeRating({ recipeId, loggedIn }: { recipeId: string; loggedIn: boolean }) {
  const t = useTranslations("recipe.rating");
  const locale = useLocale();
  const [state, setState] = useState<State | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<"login" | "error" | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/recipe-rating?id=${encodeURIComponent(recipeId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: State | null) => {
        if (!cancelled && data && typeof data.count === "number") setState(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [recipeId, loggedIn]);

  // Ohne Antwort der Schnittstelle (z. B. privates Rezept) bleibt der Block weg.
  if (!state) return null;

  async function rate(stars: number) {
    if (!loggedIn) {
      setNotice("login");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/recipe-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipeId, stars }),
      });
      if (res.status === 401) setNotice("login");
      else if (!res.ok) setNotice("error");
      else setState((await res.json()) as State);
    } catch {
      setNotice("error");
    } finally {
      setSaving(false);
    }
  }

  const shown = hover ?? state.mine ?? Math.round(state.average ?? 0);
  const average = state.average === null ? null : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(state.average);

  return (
    <section aria-labelledby="recipe-rating-title" className="print-hide mt-12 border-t border-line pt-8">
      <h2 id="recipe-rating-title" className="text-h2-sm">
        {t("title")}
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-labelledby="recipe-rating-title" className="flex" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              type="button"
              disabled={saving}
              aria-label={t("starLabel", { stars })}
              aria-pressed={state.mine === stars}
              onMouseEnter={() => setHover(stars)}
              onFocus={() => setHover(stars)}
              onBlur={() => setHover(null)}
              onClick={() => rate(stars)}
              className="flex h-11 w-11 items-center justify-center rounded-1 transition-colors hover:bg-surface-soft disabled:opacity-60"
            >
              <Icon name="star" size={28} filled={stars <= shown} className={stars <= shown ? "text-brand" : "text-line-strong"} />
            </button>
          ))}
        </div>
        <p className="tabular text-base text-ink-2">
          {state.count > 0 && average ? t("summary", { average, count: state.count }) : t("none")}
        </p>
      </div>
      {state.mine !== null && <p className="mt-2 text-sm text-ink-3">{t("yours", { stars: state.mine })}</p>}
      {notice === "login" && (
        <p role="status" className="mt-2 text-sm text-ink-2">
          <Link href="/login" className="font-semibold text-brand underline underline-offset-[3px] hover:text-brand-hover">
            {t("login")}
          </Link>
        </p>
      )}
      {notice === "error" && (
        <p role="alert" className="mt-2 text-sm text-error">
          {t("error")}
        </p>
      )}
    </section>
  );
}
