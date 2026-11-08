"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import Navbar from "@/components/Navbar";
import { Button, Icon, Input, Notice, SectionHeader } from "@/components/ui";

interface ImportResult {
  id: string; // "user_<uuid>"
  title: string;
  image: string | null;
  sourceName: string | null;
  ingredientCount: number;
  stepCount: number;
}

type Status = "idle" | "loading" | "error" | "done";

export default function ImportClient() {
  const locale = useLocale();
  const de = locale === "de";
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<"url" | "parse" | "limit" | "generic">("generic");
  const [result, setResult] = useState<ImportResult | null>(null);

  const tr = (en: string, deStr: string) => (de ? deStr : en);

  const handleImport = async () => {
    const value = url.trim();
    if (!value || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data.error === "limit_reached") {
        setErrorKind("limit");
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setErrorKind(
          data.error === "parse_failed"
            ? "parse"
            : data.error === "invalid_url" || data.error === "missing_url"
            ? "url"
            : "generic"
        );
        setStatus("error");
        return;
      }

      setResult({ id: data.id, ...data.recipe });
      setStatus("done");
    } catch {
      setErrorKind("generic");
      setStatus("error");
    }
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setStatus("idle");
  };

  const errorText =
    errorKind === "url"
      ? tr("Please paste a valid recipe link (starting with http).", "Bitte einen gültigen Rezept-Link einfügen (mit http beginnend).")
      : errorKind === "parse"
      ? tr(
          "We couldn't find a recipe on that page. Try the direct recipe URL (not a category or search page).",
          "Auf dieser Seite konnten wir kein Rezept finden. Versuche den direkten Rezept-Link (keine Kategorie-/Suchseite).",
        )
      : tr("Something went wrong. Please try again.", "Etwas ist schiefgelaufen. Bitte erneut versuchen.");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <SectionHeader
          as="h1"
          title={tr("Import any recipe", "Jedes Rezept importieren")}
          subtitle={tr(
            "Paste a link from any recipe site. We pull in the ingredients, steps and photo.",
            "Füge einen Link von einer beliebigen Rezeptseite ein. Wir holen Zutaten, Schritte und Foto automatisch.",
          )}
        />

        <div className="max-w-prose">
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <Input
              className="w-full flex-1"
              label={tr("Recipe URL", "Rezept-Link")}
              type="url"
              inputMode="url"
              autoComplete="url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://www.chefkoch.de/rezepte/..."
              error={status === "error" && errorKind !== "limit" ? errorText : undefined}
            />
            <Button onClick={handleImport} disabled={!url.trim()} loading={status === "loading"}>
              {status === "loading" ? tr("Importing…", "Importiere…") : tr("Import", "Importieren")}
            </Button>
          </div>

          {status === "loading" && (
            <p role="status" className="mt-3 text-sm text-ink-3">
              {tr("Reading the page and extracting the recipe…", "Seite wird gelesen und das Rezept extrahiert…")}
            </p>
          )}

          {status === "error" && errorKind === "limit" && (
            <Notice tone="warn" className="mt-4">
              <p className="font-semibold">{tr("You've reached your free limit", "Du hast dein kostenloses Limit erreicht")}</p>
              <p className="mb-3">
                {tr("Free accounts can keep up to 5 recipes. Go Pro for unlimited imports.", "Kostenlose Konten können bis zu 5 Rezepte behalten. Mit Pro: unbegrenzt importieren.")}
              </p>
              <Button href="/pro" size="sm">{tr("Upgrade to Pro", "Auf Pro upgraden")}</Button>
            </Notice>
          )}

          {status === "done" && result && (
            <div className="mt-6">
              <Notice tone="success">{tr("Recipe imported", "Rezept importiert")}</Notice>
              <div className="mt-4 flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2 bg-surface-soft">
                  {result.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon name="utensils" size={28} className="text-line-strong" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-h3">{result.title}</h2>
                  <p className="mt-1 text-sm text-ink-3 tabular">
                    {result.ingredientCount} {tr("ingredients", "Zutaten")} · {result.stepCount} {tr("steps", "Schritte")}
                    {result.sourceName ? ` · ${tr("from", "von")} ${result.sourceName}` : ""}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-3">
                    <Icon name="lock" size={16} />
                    {tr("Saved privately to your recipes", "Privat in deinen Rezepten gespeichert")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => router.push(`/recipe/${result.id}` as "/")}>{tr("View recipe", "Rezept ansehen")}</Button>
                <Button variant="secondary" onClick={reset}>{tr("Import another", "Weiteres importieren")}</Button>
              </div>
            </div>
          )}

          {status !== "done" && (
            <p className="mt-4 text-caption text-ink-3">
              {tr(
                "Works with Chefkoch, BBC Good Food, NYT Cooking, Bon Appétit and most recipe sites. Imported recipes are private to you, with a link back to the original.",
                "Funktioniert mit Chefkoch, BBC Good Food, NYT Cooking, Bon Appétit und den meisten Rezeptseiten. Importierte Rezepte sind privat, mit Link zum Original.",
              )}
            </p>
          )}

          <p className="mt-8">
            <Link href="/my-recipes" className="text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
              {tr("Back to my recipes", "Zurück zu meinen Rezepten")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
