"use client";

/**
 * Review-Queue des Rezept-Agenten (Plan §6): zeigt alle pending_review-Rezepte
 * als Karten (Bild, DE/EN, Zutaten, Schritte, Nährwerte inkl. 4/4/9-Check).
 * Ein Tap: Freigeben (veröffentlicht DE+EN gemeinsam) / Bearbeiten / Verwerfen.
 * Nur Peters Konto — die API liefert sonst 403. Mobil-tauglich.
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/navigation";

interface Ingredient { amount: string; unit: string; name: string }
interface Step { step: number; text: string; timer_minutes: number | null }
interface Nutrition { calories: number; protein: number; fat: number; carbs: number }
interface ReviewRecipe {
  id: string;
  language: "de" | "en";
  translation_group: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ingredients: Ingredient[];
  instructions: Step[];
  cook_time: number | null;
  prep_time: number | null;
  servings: number | null;
  tags: string[] | null;
  nutrition: Nutrition | null;
  created_at: string;
}
interface Group { group: string; created_at: string; recipes: ReviewRecipe[] }

function macroCheck(n: Nutrition | null): { calc: number; devPct: number; ok: boolean } | null {
  if (!n) return null;
  const calc = 4 * n.protein + 4 * n.carbs + 9 * n.fat;
  const devPct = n.calories ? Math.abs(calc - n.calories) / n.calories * 100 : 100;
  return { calc, devPct: Math.round(devPct * 10) / 10, ok: devPct <= 12 };
}

function GroupCard({ g, onDone }: { g: Group; onDone: (group: string) => void }) {
  const [lang, setLang] = useState<"de" | "en">("de");
  const [busy, setBusy] = useState<string | null>(null);
  const r = g.recipes.find((x) => x.language === lang) ?? g.recipes[0];
  const other = g.recipes.find((x) => x.language !== r.language);
  const macro = macroCheck(r.nutrition);

  const act = async (action: "approve" | "discard") => {
    if (action === "discard" && !confirm(`„${r.title}" wirklich verwerfen? (bleibt privater Entwurf)`)) return;
    if (action === "approve" && !confirm(`„${r.title}" freigeben? DE + EN werden gemeinsam öffentlich.`)) return;
    setBusy(action);
    const res = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: g.group, action }),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(`Fehler: ${d.error ?? res.status}${d.issues ? "\n" + d.issues.join("\n") : ""}`);
      return;
    }
    onDone(g.group);
  };

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {r.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.image_url} alt={r.title} className="w-full aspect-[4/3] sm:aspect-[16/9] object-cover" />
      )}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex gap-1 rounded-full bg-gray-100 p-1 text-xs font-semibold">
            {(["de", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full transition-colors ${lang === l ? "bg-white shadow text-orange-600" : "text-gray-500"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {new Date(g.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {" · "}{g.group}
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900">{r.title}</h2>
        {r.description && <p className="text-gray-600 text-sm mt-1">{r.description}</p>}

        <div className="flex flex-wrap gap-2 mt-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">🔪 {r.prep_time ?? 0} min</span>
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">🍳 {r.cook_time ?? 0} min</span>
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">🍽 {r.servings ?? "?"} Portionen</span>
          {r.nutrition && (
            <span
              className={`px-2 py-1 rounded-full ${macro?.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              title={`4/4/9-Check: berechnet ${macro?.calc} kcal, Abweichung ${macro?.devPct} %`}
            >
              {r.nutrition.calories} kcal · P {r.nutrition.protein} · F {r.nutrition.fat} · KH {r.nutrition.carbs}
              {macro ? (macro.ok ? " ✓" : ` ⚠ ${macro.devPct} %`) : ""}
            </span>
          )}
        </div>

        {!!r.tags?.length && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {r.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs">#{t}</span>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <details open className="rounded-xl border border-gray-100 p-3">
            <summary className="text-sm font-semibold text-gray-800 cursor-pointer select-none">
              Zutaten ({r.ingredients?.length ?? 0})
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {r.ingredients?.map((i, idx) => (
                <li key={idx}>
                  <span className="font-medium">{i.amount} {i.unit}</span> {i.name}
                </li>
              ))}
            </ul>
          </details>
          <details open className="rounded-xl border border-gray-100 p-3">
            <summary className="text-sm font-semibold text-gray-800 cursor-pointer select-none">
              Schritte ({r.instructions?.length ?? 0})
            </summary>
            <ol className="mt-2 space-y-2 text-sm text-gray-700">
              {r.instructions?.map((s) => (
                <li key={s.step} className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs flex items-center justify-center font-semibold">
                    {s.step}
                  </span>
                  <span>
                    {s.text}
                    {s.timer_minutes != null && <span className="text-gray-400"> ⏱ {s.timer_minutes} min</span>}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          <button
            onClick={() => act("approve")}
            disabled={busy !== null}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {busy === "approve" ? "Veröffentliche …" : "✓ Freigeben (DE+EN öffentlich)"}
          </button>
          <Link
            href={`/recipes/${r.id}/edit`}
            className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            ✏️ Bearbeiten ({r.language.toUpperCase()})
          </Link>
          {other && (
            <Link
              href={`/recipes/${other.id}/edit`}
              className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
            >
              ✏️ {other.language.toUpperCase()}
            </Link>
          )}
          <button
            onClick={() => act("discard")}
            disabled={busy !== null}
            className="ml-auto px-4 py-2.5 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {busy === "discard" ? "Verwerfe …" : "Verwerfen"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ReviewClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "error">("loading");

  const load = useCallback(() => {
    fetch("/api/admin/review")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) { setState("forbidden"); return; }
        if (!res.ok) { setState("error"); return; }
        const d = await res.json();
        setGroups(d.groups ?? []);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rezept-Review</h1>
        <p className="text-gray-500 text-sm mt-1">
          {state === "ok" ? `${groups.length} Rezept${groups.length === 1 ? "" : "e"} warten auf deine Entscheidung` : "Rezept-Agent · pending_review"}
        </p>
      </div>

      {state === "loading" && <p className="text-gray-400">Lade Queue …</p>}
      {state === "forbidden" && (
        <p className="text-gray-500">Kein Zugriff — diese Seite ist nur für das Culinse-Konto.</p>
      )}
      {state === "error" && <p className="text-red-600">Fehler beim Laden der Queue.</p>}
      {state === "ok" && groups.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🧑‍🍳</p>
          <p>Queue leer — der nächste Agent-Lauf füllt sie wieder.</p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <GroupCard key={g.group} g={g} onDone={(group) => setGroups((prev) => prev.filter((x) => x.group !== group))} />
        ))}
      </div>
    </main>
  );
}
