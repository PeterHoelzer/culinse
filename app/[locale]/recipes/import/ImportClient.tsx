"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/lib/navigation";
import Navbar from "@/components/Navbar";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="px-4 pt-10 pb-16" style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {tr("Import any recipe", "Jedes Rezept importieren")}
          </h1>
          <p className="text-orange-100 text-sm">
            {tr(
              "Paste a link from any recipe site — we'll pull in the ingredients, steps and photo.",
              "Füge einen Link von einer beliebigen Rezeptseite ein — wir holen Zutaten, Schritte und Foto automatisch.",
            )}
          </p>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 -mt-9 pb-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          {/* Input */}
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            {tr("Recipe URL", "Rezept-Link")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              inputMode="url"
              autoFocus
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://www.chefkoch.de/rezepte/..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <button
              onClick={handleImport}
              disabled={!url.trim() || status === "loading"}
              className="px-6 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
              style={{ background: "#f97316" }}
            >
              {status === "loading" ? tr("Importing…", "Importiere…") : tr("Import", "Importieren")}
            </button>
          </div>

          {/* Loading hint */}
          {status === "loading" && (
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {tr("Reading the page and extracting the recipe…", "Seite wird gelesen und das Rezept extrahiert…")}
            </p>
          )}

          {/* Errors */}
          {status === "error" && errorKind === "url" && (
            <p className="text-sm text-red-500 mt-3">
              {tr("Please paste a valid recipe link (starting with http).", "Bitte einen gültigen Rezept-Link einfügen (mit http beginnend).")}
            </p>
          )}
          {status === "error" && errorKind === "parse" && (
            <p className="text-sm text-red-500 mt-3">
              {tr(
                "We couldn't find a recipe on that page. Try the direct recipe URL (not a category or search page).",
                "Auf dieser Seite konnten wir kein Rezept finden. Versuche den direkten Rezept-Link (keine Kategorie-/Suchseite).",
              )}
            </p>
          )}
          {status === "error" && errorKind === "generic" && (
            <p className="text-sm text-red-500 mt-3">
              {tr("Something went wrong. Please try again.", "Etwas ist schiefgelaufen. Bitte erneut versuchen.")}
            </p>
          )}
          {status === "error" && errorKind === "limit" && (
            <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {tr("You've reached your free limit", "Du hast dein kostenloses Limit erreicht")}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {tr("Free accounts can keep up to 5 recipes. Go Pro for unlimited imports.", "Kostenlose Konten können bis zu 5 Rezepte behalten. Mit Pro: unbegrenzt importieren.")}
              </p>
              <Link href="/pro" className="inline-block px-5 py-2 rounded-full text-white text-sm font-semibold" style={{ background: "#f97316" }}>
                {tr("Upgrade to Pro", "Auf Pro upgraden")}
              </Link>
            </div>
          )}

          {/* Success */}
          {status === "done" && result && (
            <div className="mt-5 border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-green-50 border-b border-green-100">
                <span className="text-lg">✅</span>
                <p className="text-sm font-semibold text-green-800">
                  {tr("Recipe imported", "Rezept importiert")}
                </p>
              </div>
              <div className="flex gap-3 p-3">
                {result.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.image} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍳</div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-2 leading-tight">{result.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {result.ingredientCount} {tr("ingredients", "Zutaten")} · {result.stepCount} {tr("steps", "Schritte")}
                    {result.sourceName ? ` · ${tr("from", "von")} ${result.sourceName}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">🔒 {tr("Saved privately to your recipes", "Privat in deinen Rezepten gespeichert")}</p>
                </div>
              </div>
              <div className="flex gap-2 p-3 pt-0">
                <button
                  onClick={() => router.push(`/recipe/${result.id}`)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#f97316" }}
                >
                  {tr("View recipe", "Rezept ansehen")}
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {tr("Import another", "Weiteres importieren")}
                </button>
              </div>
            </div>
          )}

          {/* Footer hint */}
          {status !== "done" && (
            <p className="text-xs text-gray-400 mt-4 leading-relaxed">
              {tr(
                "Works with Chefkoch, BBC Good Food, NYT Cooking, Bon Appétit and most recipe sites. Imported recipes are private to you, with a link back to the original.",
                "Funktioniert mit Chefkoch, BBC Good Food, NYT Cooking, Bon Appétit und den meisten Rezeptseiten. Importierte Rezepte sind privat — mit Link zum Original.",
              )}
            </p>
          )}
        </div>

        <div className="text-center mt-5">
          <Link href="/my-recipes" className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
            {tr("← Back to my recipes", "← Zurück zu meinen Rezepten")}
          </Link>
        </div>
      </main>
    </div>
  );
}
