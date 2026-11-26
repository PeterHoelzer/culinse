"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const tr = useTranslations("recipeImport");
  const te = useTranslations("recipeEditor");
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<"url" | "parse" | "generic">("generic");
  const [result, setResult] = useState<ImportResult | null>(null);

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
      ? tr("pleasePasteAValid")
      : errorKind === "parse"
      ? tr("weCouldnTFind")
      : tr("somethingWentWrongPlease");

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <SectionHeader
          as="h1"
          title={tr("importAnyRecipe")}
          subtitle={tr("pasteALinkFrom")}
        />

        <div className="max-w-prose">
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <Input
              className="w-full flex-1"
              label={tr("recipeUrl")}
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
              error={status === "error" ? errorText : undefined}
            />
            <Button onClick={handleImport} disabled={!url.trim()} loading={status === "loading"}>
              {status === "loading" ? tr("importing") : tr("import")}
            </Button>
          </div>

          {status === "loading" && (
            <p role="status" className="mt-3 text-sm text-ink-3">
              {tr("readingThePageAnd")}
            </p>
          )}

          {status === "done" && result && (
            <div className="mt-6">
              <Notice tone="success">{tr("recipeImported")}</Notice>
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
                    {te("ingredientsCount", { count: result.ingredientCount })} · {te("stepsCount", { count: result.stepCount })}
                    {result.sourceName ? ` · ${tr("fromSource", { source: result.sourceName })}` : ""}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-3">
                    <Icon name="lock" size={16} />
                    {tr("savedPrivatelyToYour")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => router.push(`/recipe/${result.id}` as "/")}>{tr("viewRecipe")}</Button>
                <Button variant="secondary" onClick={reset}>{tr("importAnother")}</Button>
              </div>
            </div>
          )}

          {status !== "done" && (
            <p className="mt-4 text-caption text-ink-3">
              {tr("worksWithChefkochBbc")}
            </p>
          )}

          <p className="mt-8">
            <Link href="/my-recipes" className="text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
              {tr("backToMyRecipes")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
