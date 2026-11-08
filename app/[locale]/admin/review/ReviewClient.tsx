"use client";

/**
 * Review-Queue des Rezept-Agenten (Plan §6): zeigt alle pending_review-Rezepte
 * als Karten (Bild, DE/EN, Zutaten, Schritte, Nährwerte inkl. 4/4/9-Check).
 * Ein Tap: Freigeben (veröffentlicht DE+EN gemeinsam) / Bearbeiten / Verwerfen.
 * Nur Peters Konto — die API liefert sonst 403. Mobil-tauglich.
 */

import { useState, useEffect, useCallback } from "react";
import { Button, Chip, EmptyState, Icon, Notice, SectionHeader, Skeleton } from "@/components/ui";

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

function GroupCard({ g, onDone, canEdit }: { g: Group; onDone: (group: string) => void; canEdit: boolean }) {
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

  const factClass = "inline-flex items-center gap-1.5 text-sm text-ink-2 tabular";

  return (
    <article className="overflow-hidden rounded-2 border border-line">
      {r.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.image_url} alt={r.title} className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]" />
      )}
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" role="group" aria-label="Sprache">
            {(["de", "en"] as const).map((l) => (
              <Chip key={l} size="sm" active={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </Chip>
            ))}
          </div>
          <span className="text-sm text-ink-3 tabular">
            {new Date(g.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {" · "}{g.group}
          </span>
        </div>

        <h2 className="text-h2-sm">{r.title}</h2>
        {r.description && <p className="mt-1 text-base text-ink-2">{r.description}</p>}

        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          <span className={factClass}><Icon name="clock" size={16} />Vorbereiten {r.prep_time ?? 0} min</span>
          <span className={factClass}><Icon name="flame" size={16} />Kochen {r.cook_time ?? 0} min</span>
          <span className={factClass}><Icon name="users" size={16} />{r.servings ?? "?"} Portionen</span>
        </p>
        {r.nutrition && (
          <p className={`mt-2 text-sm tabular ${macro?.ok ? "text-green-deep" : "text-error"}`} title={`4/4/9-Check: berechnet ${macro?.calc} kcal, Abweichung ${macro?.devPct} %`}>
            {r.nutrition.calories} kcal · P {r.nutrition.protein} · F {r.nutrition.fat} · KH {r.nutrition.carbs}
            {macro ? (macro.ok ? ", 4/4/9-Check bestanden" : `, 4/4/9-Check: Abweichung ${macro.devPct} %`) : ""}
          </p>
        )}

        {!!r.tags?.length && (
          <p className="mt-2 text-sm text-ink-3">{r.tags.map((t) => `#${t}`).join(" ")}</p>
        )}

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <details open>
            <summary className="cursor-pointer select-none border-b border-line pb-2 text-base font-semibold text-ink">
              Zutaten ({r.ingredients?.length ?? 0})
            </summary>
            <ul className="mt-2 space-y-1 text-base text-ink">
              {r.ingredients?.map((i, idx) => (
                <li key={idx} className="border-b border-line py-1 tabular">
                  <span className="font-semibold">{i.amount} {i.unit}</span> {i.name}
                </li>
              ))}
            </ul>
          </details>
          <details open>
            <summary className="cursor-pointer select-none border-b border-line pb-2 text-base font-semibold text-ink">
              Schritte ({r.instructions?.length ?? 0})
            </summary>
            <ol className="mt-2 space-y-2 text-base text-ink">
              {r.instructions?.map((s) => (
                <li key={s.step} className="flex gap-3 border-b border-line py-1">
                  <span className="w-5 shrink-0 font-serif font-semibold text-ink-3 tabular">{s.step}</span>
                  <span>
                    {s.text}
                    {s.timer_minutes != null && <span className="text-ink-3"> ({s.timer_minutes} min Timer)</span>}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => act("approve")} disabled={busy !== null} loading={busy === "approve"}>
            {busy === "approve" ? "Veröffentliche …" : "Freigeben (DE+EN öffentlich)"}
          </Button>
          {canEdit && (
            <Button variant="secondary" href={`/recipes/${r.id}/edit`} icon="pencil">
              Bearbeiten ({r.language.toUpperCase()})
            </Button>
          )}
          {canEdit && other && (
            <Button variant="secondary" href={`/recipes/${other.id}/edit`} icon="pencil">
              {other.language.toUpperCase()}
            </Button>
          )}
          <Button variant="secondary" className="sm:ml-auto" onClick={() => act("discard")} disabled={busy !== null} loading={busy === "discard"}>
            {busy === "discard" ? "Verwerfe …" : "Verwerfen"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function ReviewClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [canEdit, setCanEdit] = useState(true);
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "error">("loading");

  const load = useCallback(() => {
    fetch("/api/admin/review")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) { setState("forbidden"); return; }
        if (!res.ok) { setState("error"); return; }
        const d = await res.json();
        setGroups(d.groups ?? []);
        setCanEdit(d.viewer?.isOwner ?? false);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
      <SectionHeader
        as="h1"
        title="Rezept-Review"
        subtitle={state === "ok" ? `${groups.length} Rezept${groups.length === 1 ? "" : "e"} warten auf deine Entscheidung` : "Rezept-Agent, pending_review"}
      />

      <div className="max-w-3xl">
        {state === "loading" && <Skeleton className="h-40" />}
        {state === "forbidden" && (
          <Notice tone="warn">
            Kein Zugriff. Diese Seite ist nur für das Culinse-Konto und freigeschaltete
            Reviewer. Bitte mit dem richtigen Konto einloggen.
          </Notice>
        )}
        {state === "error" && <Notice tone="error">Fehler beim Laden der Queue.</Notice>}
        {state === "ok" && groups.length === 0 && (
          <EmptyState icon="check" title="Queue leer" text="Der nächste Agent-Lauf füllt sie wieder." />
        )}

        <div className="space-y-8">
          {groups.map((g) => (
            <GroupCard key={g.group} g={g} canEdit={canEdit} onDone={(group) => setGroups((prev) => prev.filter((x) => x.group !== group))} />
          ))}
        </div>
      </div>
    </main>
  );
}
