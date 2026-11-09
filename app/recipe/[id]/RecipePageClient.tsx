"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { convertMeasurements } from "@/lib/convertMeasurements";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { estimateRecipeCost, formatEstPrice } from "@/lib/ingredient-prices";
import { AddToCollectionModal } from "@/components/AddToCollectionModal";
import AddToPlanModal from "@/components/AddToPlanModal";
import LoginPromptModal from "@/components/LoginPromptModal";
import UpgradeModal from "@/components/UpgradeModal";
import ShoppingListDrawer from "@/components/ShoppingListDrawer";
import { Link as LocaleLink } from "@/lib/navigation";
import type { DishColors } from "@/app/[locale]/components/home-types";
import { displayTitle, nameLangFromTags, stageTitleSize } from "@/lib/recipeTitle";
import { AffiliateBox } from "@/components/AffiliateBox";
import { getIngredientAffiliateUrl, trackedUrl } from "@/lib/affiliateProducts";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { Button, buttonClasses, Checkbox, EmptyState, Icon, SectionHeader, Skeleton } from "@/components/ui";

interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

interface Step {
  number: number;
  step: string;
}

export interface Recipe {
  id: number | string;
  title: string;
  image: string | null;
  images?: string[] | null;
  imagePosition?: string | null;
  videoUrl?: string | null;
  source: string;
  sourceUrl: string;
  time: string | null;
  servings: number | null;
  summary: string | null;
  ingredients: Ingredient[];
  instructions: Step[];
  diets: string[];
  dishTypes: string[];
  nutrition?: { calories: number; protein: number | null; fat: number | null; carbs: number | null } | null;
  prepTime?: number | null;
  cookTime?: number | null;
  datePublished?: string | null;
  aiAssisted?: boolean;
  cuisine?: string | null;
}

/** Card data for the "Ähnliche Rezepte" section (built server-side in page.tsx). */
export interface SimilarRecipe {
  id: number | string;
  title: string;
  image: string | null;
  imagePosition?: string | null;
  time?: string | null;
  source?: string | null;
}

/** Translate a batch of strings EN→DE via the MyMemory route (chunked to 50). */
async function translateBatch(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const chunk = texts.slice(i, i + 50);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: chunk, targetLang: "de" }),
      });
      if (!res.ok) { out.push(...chunk); continue; }
      const data = await res.json();
      out.push(...(Array.isArray(data.translated) ? data.translated : chunk));
    } catch {
      out.push(...chunk); // fallback: keep English for this chunk
    }
  }
  return out;
}

/**
 * Produce a German version of a recipe: convert imperial units to metric
 * first, then translate the display text. `ingredient.name` and `dishTypes`
 * stay English on purpose — affiliate matching and related-video tags rely
 * on them.
 */
async function translateRecipeToGerman(r: Recipe): Promise<Recipe> {
  const ingredientTexts = r.ingredients.map((i) => convertMeasurements(i.original));
  const stepTexts = r.instructions.map((s) => convertMeasurements(s.step));
  const summaryText = r.summary ? convertMeasurements(r.summary) : "";

  // Fixed layout so we can map results back by index
  const layout = [r.title, summaryText, ...ingredientTexts, ...stepTexts, ...r.diets];
  const translated = await translateBatch(layout);

  let idx = 0;
  const title = translated[idx++] ?? r.title;
  const summary = translated[idx++] ?? summaryText;
  const ingredients = r.ingredients.map((ing) => ({
    ...ing,
    original: translated[idx++] ?? ing.original,
  }));
  const instructions = r.instructions.map((st) => ({
    ...st,
    step: translated[idx++] ?? st.step,
  }));
  const diets = r.diets.map((d) => translated[idx++] ?? d);

  return {
    ...r,
    title,
    summary: r.summary ? summary : r.summary,
    ingredients,
    instructions,
    diets,
  };
}

/* ── Bild-Helfer ───────────────────────────────────────────────────────── */

const HERO_WIDTHS = [640, 960, 1440, 1920];

/**
 * Responsive Quellen für Supabase-Bilder. Die API liefert bereits Render-URLs
 * mit `width=`/`height=`; wir tauschen nur die Zahl aus. Für nackte
 * Storage-URLs greift optimizedImageUrl. Fremde Hosts bekommen kein srcSet.
 */
function heroSrcSet(url: string): string | undefined {
  if (/[?&]width=\d+/.test(url)) {
    return HERO_WIDTHS.map((w) => `${url.replace(/([?&])width=\d+/, `$1width=${w}`).replace(/([?&])height=\d+/, `$1height=${w}`)} ${w}w`).join(", ");
  }
  if (url.includes("/storage/v1/object/public/")) {
    return HERO_WIDTHS.map((w) => `${optimizedImageUrl(url, w)} ${w}w`).join(", ");
  }
  return undefined;
}

/** "45 min" (API) → "45 Min." auf Deutsch, sonst unverändert. */
function formatTime(time: string, locale: string): string {
  const m = time.match(/^(\d+)\s*min$/i);
  if (!m) return time;
  return locale === "de" ? `${m[1]} Min.` : `${m[1]} min`;
}

/* ── Portionsregler ────────────────────────────────────────────────────── */

const UNICODE_FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const AMOUNT_TOKEN = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔⅛]?|[½¼¾⅓⅔⅛]`;
const LEADING_AMOUNT = new RegExp(`^\\s*(${AMOUNT_TOKEN})(?:\\s*(?:-|–|bis|to)\\s*(${AMOUNT_TOKEN}))?(?=\\s|$)`);

function parseAmount(s: string): number {
  const v = s.trim();
  if (UNICODE_FRACTIONS[v] != null) return UNICODE_FRACTIONS[v];
  const uni = v.match(/^(\d+(?:[.,]\d+)?)\s*([½¼¾⅓⅔⅛])$/);
  if (uni) return parseFloat(uni[1].replace(",", ".")) + UNICODE_FRACTIONS[uni[2]];
  const mixed = v.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = v.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return parseFloat(v.replace(",", "."));
}

function formatAmount(n: number, locale: string): string {
  const rounded = n >= 10 ? Math.round(n) : Math.round(n * 100) / 100;
  const s = rounded.toFixed(2).replace(/\.?0+$/, "");
  return locale === "de" ? s.replace(".", ",") : s;
}

/**
 * Trennt die Menge vom Rest der Zutatenzeile („200 g Mehl“ → „200 g“ fett)
 * und skaliert sie beim Umstellen der Portionen. Zeilen ohne führende Zahl
 * bleiben unverändert.
 */
function splitIngredient(original: string, factor: number, locale: string): { amount: string | null; rest: string } {
  const m = original.match(LEADING_AMOUNT);
  if (!m) return { amount: null, rest: original };
  const rest = original.slice(m[0].length).trimStart();
  if (factor === 1) return { amount: m[0].trim(), rest };
  const a = formatAmount(parseAmount(m[1]) * factor, locale);
  const b = m[2] ? formatAmount(parseAmount(m[2]) * factor, locale) : null;
  return { amount: b ? `${a}–${b}` : a, rest };
}

/* ── Rezeptkarte für „Ähnliche Rezepte“ (DESIGN.md §5 „Rezeptkarte“) ──── */

function SimilarCard({ recipe: s, locale }: { recipe: SimilarRecipe; locale: string }) {
  const meta = [s.source, s.time ? formatTime(s.time, locale) : null].filter(Boolean);
  return (
    <LocaleLink href={`/recipe/${s.id}`} className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-2 bg-surface-soft">
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.image}
            alt=""
            loading="lazy"
            decoding="async"
            width={480}
            height={360}
            style={s.imagePosition ? { objectPosition: s.imagePosition } : undefined}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name="utensils" size={32} className="text-line-strong" />
          </div>
        )}
      </div>
      {meta.length > 0 && <p className="mt-3 text-sm text-ink-3 tabular">{meta.join(" · ")}</p>}
      <h3 className="mt-1 line-clamp-2 text-h3 text-ink underline-offset-[3px] group-hover:underline">{s.title}</h3>
    </LocaleLink>
  );
}

export default function RecipePageClient({ serverTitle, initialRecipe, similarRecipes, colors }: { serverTitle?: string | null; initialRecipe?: Recipe | null; similarRecipes?: SimilarRecipe[] | null; colors?: DishColors | null }) {
  // Die Farbe des Gerichts (DESIGN.md §11): Bühne hinter dem Titel, heller Ton im Zutatenkasten.
  const stage = colors?.stage ?? "#7a2e0e";
  const tint = colors?.tint ?? "#fbede4";
  const { id } = useParams();
  const locale = useLocale();
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe ?? null);

  // Geschätzte Zutatenkosten (Discounter-Niveau) — nur bei guter Abdeckung zeigen
  const estCost = useMemo(() => {
    if (!recipe?.ingredients?.length) return null;
    const c = estimateRecipeCost(
      recipe.ingredients.map(i => ({ name: i.name, amount: i.amount, unit: i.unit })),
      recipe.servings
    );
    return c.priced >= 3 && c.priced / c.count >= 0.6 ? c : null;
  }, [recipe?.ingredients, recipe?.servings]);
  const translatedRef = useRef(false);
  const t = useTranslations("recipe");
  const tCard = useTranslations("recipeCard");
  // Neue Texte: Schlüssel, sobald er in messages/*.json steht, sonst Fallback.
  const tx = (key: string, de: string, en: string) => (t.has(key) ? t(key) : locale === "de" ? de : en);

  const [loading, setLoading] = useState(!initialRecipe);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [imgError, setImgError] = useState(false);
  // Mehrbild-Galerie (Community-Rezepte): Index 0 = Cover.
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const gallery = recipe?.images?.length ? recipe.images : recipe?.image ? [recipe.image] : [];
  const heroImage = gallery.length ? gallery[Math.min(activeImageIdx, gallery.length - 1)] : recipe?.image ?? null;
  const [copied, setCopied] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [printWithImage, setPrintWithImage] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  // Portionsregler: Zielportionen, Faktor skaliert die Mengen in der Zutatenliste.
  const [servingsTarget, setServingsTarget] = useState<number | null>(initialRecipe?.servings ?? null);
  useEffect(() => {
    setServingsTarget(recipe?.servings ?? null);
  }, [recipe?.id, recipe?.servings]);
  const servingsFactor = recipe?.servings && servingsTarget ? servingsTarget / recipe.servings : 1;

  // Sticky „Zum Wochenplan": erscheint nach kurzem Scrollen und bleibt
  // beim Weiterscrollen sichtbar (Review-Paket C10).
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 250);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Wie bei den Video-Karten: eingeloggt → Plan-Modal, sonst Login-Prompt.
  const openPlanModal = () => {
    if (!user) { setShowLoginPrompt(true); return; }
    setShowPlanModal(true);
  };

  // Einkaufsliste braucht ein Konto (/api/shopping-list antwortet sonst 401).
  const openShoppingList = () => {
    if (!user) { setShowLoginPrompt(true); return; }
    setShowShoppingList(true);
  };

  const handlePrint = (withImage: boolean) => {
    setShowPrintMenu(false);
    // flushSync so the print view reflects the image choice before printing
    flushSync(() => setPrintWithImage(withImage));
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: recipe?.title || "Recipe", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    // Reset translation guard so a newly loaded recipe gets translated again.
    translatedRef.current = false;
    // The server fetched this recipe and passed it as initialRecipe. The page
    // keys this component per recipe, so initialRecipe is already the initial
    // state and is present in the SSR HTML — skip the client fetch entirely
    // (crawlers see the full recipe without executing JavaScript).
    if (initialRecipe && String(initialRecipe.id) === String(id)) {
      return;
    }
    setLoading(true);
    setError(false);
    fetch(`/api/recipe/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.recipe) setRecipe(data.recipe);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, initialRecipe]);

  // On the German site, convert measurements + translate the recipe content.
  // Runs once after the recipe loads; on failure the English version stays.
  useEffect(() => {
    if (locale !== "de" || !recipe || translatedRef.current) return;
    translatedRef.current = true;
    let cancelled = false;
    translateRecipeToGerman(recipe)
      .then((translated) => { if (!cancelled) setRecipe(translated); })
      .catch(() => { /* keep English fallback */ });
    return () => { cancelled = true; };
  }, [locale, recipe]);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from("saved_recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_id", id)
      .single()
      .then(({ data }) => setSaved(!!data));
  }, [user, id]);

  const handleSave = async () => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (!recipe || saving) return;
    setSaving(true);
    try {
      if (saved) {
        await fetch("/api/saved-recipes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe_id: recipe.id }),
        });
        setSaved(false);
      } else {
        const res = await fetch("/api/saved-recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe_id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            source: recipe.source,
            source_url: recipe.sourceUrl,
            time: recipe.time,
          }),
        });
        if (res.status === 403) {
          const data = await res.json();
          if (data.error === "limit_reached") {
            setShowUpgrade(true);
            return;
          }
        }
        if (res.ok) setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  // Recipe JSON-LD is rendered once, server-side, in page.tsx — single source of
  // truth, present in the crawlable HTML and not duplicated here on the client.

  // Strip HTML from summary
  const cleanSummary = recipe?.summary
    ? recipe.summary.replace(/<[^>]+>/g, "").split(".").slice(0, 3).join(".") + "."
    : null;

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [moreVideos, setMoreVideos] = useState<{ id: string; title: string; thumbnail: string | null; videoUrl: string; time: string | null }[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);

  useEffect(() => {
    if (recipe?.videoUrl) setActiveVideoUrl(recipe.videoUrl);
  }, [recipe?.videoUrl]);

  const loadMoreVideos = async () => {
    if (!recipe || videosLoaded) return;
    setLoadingVideos(true);
    const tags = recipe.dishTypes?.slice(0, 2).join(",") || "";
    const excludeId = String(recipe.id).replace("tasty_", "");
    try {
      const res = await fetch(`/api/tasty-related?tags=${encodeURIComponent(tags)}&exclude=${excludeId}${locale === "de" ? "&lang=de" : ""}`);
      const data = await res.json();
      setMoreVideos(data.videos || []);
    } catch { /* silently fail */ }
    finally {
      setLoadingVideos(false);
      setVideosLoaded(true);
    }
  };

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const hasSourceUrl = !!recipe?.sourceUrl && recipe.sourceUrl !== "#";
  const planLabel = t("addToPlan").replace(/^\+\s*/, "");
  const copiedLabel = t("copied").replace(/!$/, "");

  // Kopfzeile über dem Titel: Küche · Gericht · Ernährungsform (als Worte, keine Pillen)
  const stageTitle = displayTitle(recipe?.title ?? "", locale, nameLangFromTags(recipe?.diets));
  const tagLine = recipe
    ? [
        ...(recipe.cuisine ? [{ text: recipe.cuisine, green: false }] : []),
        ...(recipe.dishTypes ?? []).slice(0, 2).map((d) => ({ text: d, green: false })),
        ...(recipe.diets ?? []).slice(0, 3).map((d) => ({ text: d, green: /vegetar|vegan/i.test(d) })),
      ]
    : [];

  const nutritionRows = recipe?.nutrition
    ? [
        { label: tx("calories", "Kalorien", "Calories"), value: recipe.nutrition.calories, unit: "kcal" },
        { label: tx("protein", "Eiweiß", "Protein"), value: recipe.nutrition.protein, unit: "g" },
        { label: tx("fat", "Fett", "Fat"), value: recipe.nutrition.fat, unit: "g" },
        { label: tx("carbs", "Kohlenhydrate", "Carbs"), value: recipe.nutrition.carbs, unit: "g" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* SSR H1: present in server-rendered HTML before the client fetch resolves.
          Google sees this even without executing JavaScript. Once the recipe
          loads, the full <main> block below renders its own visible H1. */}
      {loading && serverTitle && (
        <h1 className="sr-only">{serverTitle}</h1>
      )}

      {/* Loading */}
      {loading && (
        <div className="mx-auto max-w-content space-y-6 px-4 pt-6 sm:px-6" aria-busy="true">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="aspect-[3/2] w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      )}

      {/* Error */}
      {error && (
        <main className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <EmptyState
            tone="error"
            icon="alert"
            title={t("notFound")}
            action={
              <Button variant="secondary" href="/" icon="arrowLeft">
                {t("backToDiscover")}
              </Button>
            }
          />
        </main>
      )}

      {/* Add to Collection Modal */}
      {showCollectionModal && recipe && (
        <AddToCollectionModal
          recipe={{
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            source: recipe.source,
            sourceUrl: recipe.sourceUrl,
            time: recipe.time,
          }}
          onClose={() => setShowCollectionModal(false)}
        />
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} />
      )}

      {/* Add to Meal Plan Modal (Aktionsleiste + Sticky-Button) */}
      {showPlanModal && recipe && (
        <AddToPlanModal
          recipe={{
            id: String(recipe.id),
            title: recipe.title,
            image: recipe.image ?? undefined,
            readyInMinutes: recipe.time ? parseInt(recipe.time, 10) || undefined : undefined,
          }}
          onClose={() => setShowPlanModal(false)}
        />
      )}

      {/* Einkaufsliste für dieses eine Rezept, skaliert auf die gewählten Portionen */}
      {showShoppingList && recipe && (
        <ShoppingListDrawer
          recipeIds={[String(recipe.id)]}
          recipeTitles={[recipe.title]}
          planName={recipe.title}
          targets={recipe.servings && servingsTarget ? { [String(recipe.id)]: servingsTarget } : undefined}
          onClose={() => setShowShoppingList(false)}
        />
      )}

      {/* ── Print-only view (inline styles so Tailwind can't override) ── */}
      {recipe && !loading && (
        <div className="recipe-print-view" style={{ padding: "24px", fontFamily: "system-ui, sans-serif" }}>
          {printWithImage && recipe.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image}
              alt={recipe.title}
              style={{ width: "100%", maxHeight: "240px", objectFit: "cover", borderRadius: "8px", marginBottom: "16px" }}
            />
          )}
          <h1 style={{ fontSize: "22pt", fontWeight: "bold", marginBottom: "4px" }}>{recipe.title}</h1>
          <p style={{ fontSize: "10pt", color: "var(--color-ink-3)", marginBottom: "16px" }}>
            {[
              recipe.time ? formatTime(recipe.time, locale) : null,
              recipe.servings ? tCard("servings", { count: recipe.servings }) : null,
              recipe.ingredients.length > 0 ? `${recipe.ingredients.length} ${t("ingredients")}` : null,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
            <div style={{ width: "32%", flexShrink: 0 }}>
              <h2 style={{ fontSize: "13pt", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--color-line)", paddingBottom: "4px" }}>
                {t("ingredients")}
              </h2>
              <ul style={{ listStyle: "disc", paddingLeft: "18px", margin: 0 }}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} style={{ fontSize: "9.5pt", marginBottom: "4px", lineHeight: "1.4" }}>
                    {ing.original}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "13pt", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid var(--color-line)", paddingBottom: "4px" }}>
                {t("instructions")}
              </h2>
              <ol style={{ paddingLeft: "20px", margin: 0 }}>
                {recipe.instructions.map((step) => (
                  <li key={step.number} style={{ fontSize: "9.5pt", marginBottom: "10px", lineHeight: "1.5" }}>
                    {step.step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Recipe */}
      {recipe && !loading && (
        <main className="recipe-screen-view mx-auto max-w-content px-4 pb-16 pt-6 sm:px-6">

          {/* Brotkrume */}
          <LocaleLink
            href="/"
            className="print-hide mb-6 inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink"
          >
            <Icon name="arrowLeft" size={16} />
            {t("backToDiscover")}
          </LocaleLink>

          {/* Bühne in der Farbe des Gerichts: Titel links, Foto rechts (DESIGN.md §11) */}
          <section className="relative left-1/2 mb-8 w-screen -translate-x-1/2 text-white" style={{ backgroundColor: stage }}>
            <div className="mx-auto grid max-w-content lg:grid-cols-[minmax(0,520px)_1fr]">
            <div className="order-2 flex flex-col items-start gap-5 px-4 pb-10 pt-8 sm:px-10 sm:pb-12 lg:order-1 lg:justify-end">
            {tagLine.length > 0 && (
              <p className="text-sm text-white/80">
                {tagLine.map((tag, i) => (
                  <span key={`${tag.text}-${i}`}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    <span className={`capitalize ${tag.green ? "font-semibold text-green-soft" : ""}`}>{tag.text}</span>
                  </span>
                ))}
              </p>
            )}
            <h1 className="font-serif font-semibold text-white [overflow-wrap:anywhere]">
              <span className="block text-balance" style={{ fontSize: stageTitleSize(stageTitle.main, 0.82), lineHeight: 0.98, letterSpacing: "-0.01em" }}>{stageTitle.main}</span>
              {stageTitle.sub && (
                <span className="mt-3 block text-balance font-sans text-body-lg font-normal text-white/85">{stageTitle.sub}</span>
              )}
            </h1>
            {cleanSummary && (
              <p className="max-w-prose text-body-lg text-white/85">{cleanSummary}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-10 tabular">
              {recipe.time && (
                <div>
                  <p className="font-serif text-[48px] font-medium leading-none text-white">{parseInt(recipe.time, 10) || recipe.time}</p>
                  <p className="mt-1.5 text-sm text-white/80">{tCard("minutesLabel")}</p>
                </div>
              )}
              {recipe.servings && (
                <div>
                  <p className="font-serif text-[48px] font-medium leading-none text-white">{recipe.servings}</p>
                  <p className="mt-1.5 text-sm text-white/80">{tCard("servingsLabel")}</p>
                </div>
              )}
              {recipe.ingredients.length > 0 && (
                <div>
                  <p className="font-serif text-[48px] font-medium leading-none text-white">{recipe.ingredients.length}</p>
                  <p className="mt-1.5 text-sm text-white/80">{t("ingredients")}</p>
                </div>
              )}
            </div>
            </div>
          <figure className="relative order-1 m-0 lg:order-2 lg:min-h-[560px]">
            <div className="aspect-[4/3] w-full overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto lg:h-full">
              {activeVideoUrl ? (
                <video
                  key={activeVideoUrl}
                  src={activeVideoUrl}
                  controls
                  playsInline
                  preload="none"
                  poster={recipe.image || undefined}
                  className="h-full w-full bg-dark object-contain"
                />
              ) : heroImage && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  srcSet={heroSrcSet(heroImage)}
                  sizes="(min-width: 1200px) 1152px, 100vw"
                  width={1200}
                  height={800}
                  alt={recipe.aiAssisted ? `${recipe.title} – ${t("aiNotice")}` : recipe.title}
                  fetchPriority="high"
                  decoding="async"
                  style={recipe.imagePosition ? { objectPosition: recipe.imagePosition } : undefined}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon name="image" size={32} className="text-line-strong" />
                </div>
              )}
            </div>

            {/* Freiwillige KI-Kennzeichnung (EU AI Act Art. 50) fuer Korpus-Rezepte */}
            {recipe.aiAssisted && (
              <figcaption className="print-hide absolute right-4 top-3 rounded-1 bg-dark/55 px-2 py-1 text-caption text-white sm:right-6">
                {t("aiNotice")} ·{" "}
                <LocaleLink href="/ki-transparenz" className="underline underline-offset-[3px] transition-colors hover:text-white/80">
                  {t("aiNoticeMore")}
                </LocaleLink>
              </figcaption>
            )}
          </figure>
            </div>
          </section>

          {/* Bildergalerie — nur wenn das Rezept mehrere Fotos hat (Community) */}
          {gallery.length > 1 && !activeVideoUrl && (
            <div className="print-hide -mt-2 mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label={recipe.title}>
              {gallery.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => { setActiveImageIdx(i); setImgError(false); }}
                  aria-label={`${recipe.title} ${i + 1}`}
                  aria-pressed={i === activeImageIdx}
                  className={`shrink-0 overflow-hidden rounded-2 border-2 transition-colors ${
                    i === activeImageIdx ? "border-brand" : "border-transparent hover:border-line-strong"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" loading="lazy" width={80} height={80} className="h-16 w-16 object-cover sm:h-20 sm:w-20" />
                </button>
              ))}
            </div>
          )}

          {/* More Videos — only for Tasty recipes with video */}
          {recipe.source === "Tasty" && recipe.videoUrl && (
            <div className="print-hide mb-8">
              {!videosLoaded ? (
                <Button variant="secondary" icon="play" loading={loadingVideos} onClick={loadMoreVideos}>
                  {t("moreVideos")}
                </Button>
              ) : moreVideos.length > 0 ? (
                <div>
                  <p className="mb-3 text-sm font-semibold text-ink">{t("moreVideos")}</p>
                  <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
                    {moreVideos.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVideoUrl(v.videoUrl)}
                        aria-pressed={activeVideoUrl === v.videoUrl}
                        className="w-40 shrink-0 rounded-2 text-left"
                      >
                        <div
                          className={`relative aspect-[4/3] overflow-hidden rounded-2 border-2 bg-surface-soft transition-colors ${
                            activeVideoUrl === v.videoUrl ? "border-brand" : "border-transparent hover:border-line-strong"
                          }`}
                        >
                          {v.thumbnail ? (
                            <Image src={v.thumbnail} alt="" fill className="object-cover" sizes="160px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Icon name="video" size={28} className="text-line-strong" />
                            </div>
                          )}
                          {v.time && (
                            <span className="absolute bottom-2 right-2 rounded-1 bg-dark px-1.5 py-0.5 text-caption text-white tabular">
                              {v.time}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-ink">{v.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Aktionen */}
          <header className="mb-12">
            <div className="print-hide mt-6 flex flex-wrap items-center gap-3">
              <Button
                variant={saved ? "secondary" : "primary"}
                icon="heart"
                iconFilled={saved}
                loading={saving}
                onClick={handleSave}
                aria-pressed={saved}
                className={saved ? "[&>svg]:text-green" : undefined}
              >
                {saved ? t("savedRecipe") : t("saveRecipe")}
              </Button>
              <Button variant="secondary" icon="calendar" onClick={openPlanModal}>
                {planLabel}
              </Button>
              <Button
                variant="icon"
                icon="book"
                aria-label={t("collections")}
                title={t("collections")}
                onClick={() => user ? setShowCollectionModal(true) : setShowLoginPrompt(true)}
              />
              <Button
                variant="icon"
                icon={copied ? "check" : "share"}
                aria-label={copied ? copiedLabel : t("share")}
                title={t("share")}
                onClick={handleShare}
                className={copied ? "text-green" : undefined}
              />
              <div className="relative">
                <Button
                  variant="icon"
                  icon="printer"
                  aria-label={t("print")}
                  title={t("print")}
                  aria-haspopup="menu"
                  aria-expanded={showPrintMenu}
                  onClick={() => setShowPrintMenu((v) => !v)}
                />
                {showPrintMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPrintMenu(false)} aria-hidden="true" />
                    <div
                      role="menu"
                      aria-label={t("print")}
                      className="absolute left-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-2 border border-line bg-surface py-1 shadow-float"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handlePrint(true)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-soft"
                      >
                        <Icon name="image" size={18} className="text-ink-3" />
                        {t("printWithImage")}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handlePrint(false)}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-soft"
                      >
                        <Icon name="printer" size={18} className="text-ink-3" />
                        {t("printNoImage")}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {hasSourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("viewOriginal")}
                  title={t("viewOriginal")}
                  className={buttonClasses({ variant: "icon" })}
                >
                  <Icon name="externalLink" size={24} />
                </a>
              )}
              {copied && (
                <span role="status" className="text-sm text-green">{copiedLabel}</span>
              )}
            </div>
          </header>

          {/* Zutaten (links, sticky) + Zubereitung (rechts) */}
          <div className="print-ingredients-grid grid gap-12 lg:grid-cols-[5fr_7fr]">
            <aside className="print-col-ingredients min-w-0">
              <div className="print-sticky space-y-8 lg:sticky lg:top-20">
                <section className="rounded-2 p-6" style={{ backgroundColor: tint }} aria-labelledby="ingredients-heading">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 id="ingredients-heading" className="text-h2-sm">{t("ingredients")}</h2>
                    {checkedIngredients.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setCheckedIngredients(new Set())}
                        className="print-hide text-sm text-ink-3 underline-offset-[3px] transition-colors hover:text-ink hover:underline"
                      >
                        {t("reset")}
                      </button>
                    )}
                  </div>

                  {recipe.servings && servingsTarget && (
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        variant="icon"
                        size="sm"
                        icon="minus"
                        aria-label={tx("servingsLess", "Eine Portion weniger", "One serving fewer")}
                        disabled={servingsTarget <= 1}
                        onClick={() => setServingsTarget((v) => Math.max(1, (v ?? 1) - 1))}
                      />
                      <span className="min-w-[8ch] text-center text-base text-ink tabular" aria-live="polite">
                        {tCard("servings", { count: servingsTarget })}
                      </span>
                      <Button
                        variant="icon"
                        size="sm"
                        icon="plus"
                        aria-label={tx("servingsMore", "Eine Portion mehr", "One serving more")}
                        disabled={servingsTarget >= 99}
                        onClick={() => setServingsTarget((v) => Math.min(99, (v ?? 1) + 1))}
                      />
                    </div>
                  )}

                  {estCost && (
                    <p
                      className="print-hide mt-4 text-sm text-ink-3 tabular"
                      title={tx("estimatedCostHint", "Schätzung auf Discounter-Niveau, Preise variieren je nach Markt", "Discount-store estimate, prices vary by store")}
                    >
                      {tx("estimatedCost", "Geschätzte Kosten", "Estimated cost")}:{" "}
                      <span className="font-semibold text-ink">{formatEstPrice(estCost.total, locale)}</span>
                      {estCost.perServing != null && (
                        <> · {formatEstPrice(estCost.perServing, locale)}{tx("perServingShort", "/Portion", "/serving")}</>
                      )}
                    </p>
                  )}

                  <ul className="mt-5 divide-y divide-line">
                    {recipe.ingredients.map((ing, i) => {
                      const checked = checkedIngredients.has(i);
                      const { amount, rest } = splitIngredient(ing.original, servingsFactor, locale);
                      const url = getIngredientAffiliateUrl(ing.name);
                      return (
                        <li key={i} className="ingredient-item flex items-start gap-2 py-2.5">
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleIngredient(i)}
                            className="flex-1"
                            label={
                              <span className={checked ? "text-ink-3 line-through" : ""}>
                                {amount && <span className="font-semibold tabular">{amount} </span>}
                                {rest}
                              </span>
                            }
                          />
                          {url && (
                            <a
                              href={trackedUrl(url, "recipe_ingredient", recipe.id)}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              aria-label={tx("buyIngredient", `${ing.name} bei Amazon kaufen`, `Buy ${ing.name} on Amazon`)}
                              title={tx("buyIngredient", `${ing.name} bei Amazon kaufen`, `Buy ${ing.name} on Amazon`)}
                              className="ingredient-shop-link print-hide inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-1 text-ink-3 transition-colors hover:text-brand"
                            >
                              <Icon name="cart" size={18} />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <Button variant="secondary" fullWidth icon="cart" className="print-hide mt-6" onClick={openShoppingList}>
                    {tx("addToShoppingList", "Auf die Einkaufsliste", "Add to shopping list")}
                  </Button>
                </section>

                {/* Nährwerte je Portion */}
                {recipe.nutrition && (
                  <section className="print-hide" aria-labelledby="nutrition-heading">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 id="nutrition-heading" className="text-h2-sm">{tx("nutrition", "Nährwerte", "Nutrition")}</h2>
                      <span className="text-sm text-ink-3">{tx("perServing", "je Portion", "per serving")}</span>
                    </div>
                    <table className="mt-3 w-full border-t border-line text-base">
                      <tbody>
                        {nutritionRows.map((row) => (
                          <tr key={row.label} className="border-b border-line">
                            <th scope="row" className="py-2.5 text-left font-normal text-ink-2">{row.label}</th>
                            <td className="py-2.5 text-right font-semibold text-ink tabular">
                              {row.value != null ? `${row.value} ${row.unit}` : "–"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Affiliate Box — kitchen tools only */}
                <div className="print-hide">
                  <AffiliateBox
                    dishTypes={recipe.dishTypes}
                    ingredientNames={recipe.ingredients.map(i => i.name)}
                    recipeTitle={recipe.title}
                    toolsOnly
                    recipeId={recipe.id}
                  />
                </div>
              </div>
            </aside>

            <section className="print-col-instructions min-w-0" aria-labelledby="instructions-heading">
              <h2 id="instructions-heading" className="text-h2">{t("instructions")}</h2>
              {recipe.instructions.length > 0 ? (
                <ol className="mt-6">
                  {recipe.instructions.map((step) => (
                    <li key={step.number} className="flex gap-6 border-t border-line py-5">
                      <span className="w-8 shrink-0 font-serif text-h2 leading-none text-ink-3 tabular" aria-hidden="true">
                        {step.number}
                      </span>
                      <p className="max-w-prose text-body-lg text-ink">{step.step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState
                  className="mt-6"
                  icon="externalLink"
                  title={t("instructionsOnSource")}
                  action={
                    hasSourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses({ variant: "secondary" })}
                      >
                        <Icon name="externalLink" size={18} />
                        {t("viewFullRecipe")}
                      </a>
                    ) : undefined
                  }
                />
              )}
            </section>
          </div>

          {/* Ähnliche Rezepte — interne Links, server-gerendert (SEO, Review-Paket C10) */}
          {similarRecipes && similarRecipes.length > 0 && (
            <section className="print-hide mt-16">
              <SectionHeader title={t("similarRecipes")} />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {similarRecipes.map((s) => (
                  <SimilarCard key={String(s.id)} recipe={s} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* Sticky „Zum Wochenplan" — bleibt beim Scrollen sichtbar */}
      {recipe && !loading && (
        <div
          className={`print-hide fixed inset-x-4 bottom-4 z-40 flex justify-center transition-opacity duration-200 sm:inset-x-auto sm:right-6 sm:justify-end ${
            stickyVisible && !showPlanModal ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!stickyVisible || showPlanModal}
        >
          <Button
            variant="secondary"
            icon="calendar"
            onClick={openPlanModal}
            tabIndex={stickyVisible && !showPlanModal ? 0 : -1}
            className="w-full shadow-float sm:w-auto"
          >
            {planLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
