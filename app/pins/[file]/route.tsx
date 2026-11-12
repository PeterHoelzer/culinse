import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFamilyRecipe, recipeSourceLabel } from "@/lib/culinse";
import { dishColorsWithin } from "@/lib/dishColor";
import { hasSizedVariants, sizedImageUrl } from "@/lib/imageUrl";
import { splitTitle } from "@/lib/recipeTitle";
import { LANDINGS, keysForTags } from "@/lib/browse/facets";
import { routing } from "@/i18n/routing";

/*
  Pin-Grafik für Pinterest: /pins/<rezept-id>.png, 1000 × 1500 (2:3).

  Die Rezeptfotos sind quer, Pinterest bevorzugt Hochformat mit dem Titel im
  Bild. Die Grafik entsteht bei Abruf aus Foto und Rezeptdaten: oben das Foto,
  unten eine Fläche in der Farbe des Gerichts (DESIGN.md §11) mit Küche und
  Gang, Titel, Erklärung, Zeit und Portionen. Jede Sprachfassung eines Rezepts
  hat ihre eigene ID und damit ihre eigene Grafik in ihrer Sprache.

  KI-Kennzeichnung: Der Zuschnitt schneidet den Hinweis im Foto (unten rechts)
  an. Ein Verlauf überdeckt die Stelle, und der Hinweis steht als Text in der
  Fläche. Familienrezepte sind nicht mit KI erstellt und tragen ihn nicht.

  Die Adresse endet auf .png, damit die Sprach-Weiterleitung (middleware.ts)
  sie durchlässt.
*/

const W = 1000;
const H = 1500;
const PHOTO_H = 940;
const PANEL_TOP = 880;

const FALLBACK = { stage: "#23201C", tint: "#FAF7F2", accent: "#BF4A14" };

// Schriften je Sprache. Fraunces und Source Sans 3 (DESIGN.md §2) decken
// Lateinisch und Vietnamesisch ab; für andere Schriften die Noto-Familien.
const FONTS: Record<string, { title: string; text: string }> = {
  ru: { title: "Noto Serif", text: "Noto Sans" },
  zh: { title: "Noto Serif SC", text: "Noto Sans SC" },
  ja: { title: "Noto Serif JP", text: "Noto Sans JP" },
  bn: { title: "Noto Serif Bengali", text: "Noto Sans Bengali" },
};
const LATIN = { title: "Fraunces", text: "Source Sans 3" };

const fontMemo = new Map<string, Promise<ArrayBuffer | null>>();

/** Lädt genau die benötigten Zeichen einer Google-Schrift als TTF (kleine Datei, jede Schrift). */
function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  const chars = Array.from(new Set(Array.from(text))).sort().join("");
  const key = `${family}:${weight}:${chars}`;
  let p = fontMemo.get(key);
  if (!p) {
    p = (async () => {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(chars)}`,
      ).then((r) => (r.ok ? r.text() : ""));
      const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) return null;
      const res = await fetch(url);
      return res.ok ? res.arrayBuffer() : null;
    })().catch(() => null);
    fontMemo.set(key, p);
    if (fontMemo.size > 500) fontMemo.delete(fontMemo.keys().next().value as string);
  }
  return p;
}

// Chinesische, japanische und koreanische Zeichen sind etwa doppelt so breit.
function width(text: string): number {
  return Array.from(text).reduce((sum, ch) => sum + (/[　-鿿가-힯＀-￯]/.test(ch) ? 2 : 1), 0);
}

type Row = {
  id: string;
  user_id: string | null;
  title: string;
  image_url: string | null;
  cook_time: number | null;
  prep_time: number | null;
  servings: number | null;
  tags: string[] | null;
  language: string | null;
  is_public: boolean | null;
  pipeline_status: string | null;
  source_type: string | null;
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.match(/^(?:user_)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.png$/i)?.[1];
  if (!id) return new Response("Not found", { status: 404 });

  const { data } = await createAdminClient()
    .from("user_recipes")
    .select("id, user_id, title, image_url, cook_time, prep_time, servings, tags, language, is_public, pipeline_status, source_type")
    .eq("id", id)
    .maybeSingle();
  const recipe = data as Row | null;
  if (!recipe || !recipe.is_public || !recipe.image_url) return new Response("Not found", { status: 404 });

  const locale = (routing.locales as readonly string[]).includes(recipe.language ?? "") ? (recipe.language as string) : "en";
  const [t, tBrowse, colors] = await Promise.all([
    getTranslations({ locale }),
    getTranslations({ locale, namespace: "browse" }),
    dishColorsWithin(recipe.image_url, 2500),
  ]);
  const { stage, tint } = colors ?? FALLBACK;

  const { main, sub } = splitTitle(recipe.title);
  // Küche und Gang als kleine Zeile über dem Titel, in der Sprache des Rezepts.
  const keys = keysForTags((recipe.tags ?? []).map((tag) => String(tag).toLowerCase().trim()));
  const label = (group: "cuisine" | "course") => {
    const landing = LANDINGS.find((l) => l.group === group && keys.has(`${group}:${l.key}`));
    return landing ? tBrowse(`options.${group}.${landing.key}`) : null;
  };
  // Großbuchstaben hier statt per CSS: Die Schrift wird nur mit den Zeichen des
  // Textes geladen, per CSS erzeugte Großbuchstaben fehlten sonst darin.
  const kicker = [label("cuisine"), label("course")].filter(Boolean).join("  ·  ").toLocaleUpperCase(locale);

  const minutes = (recipe.cook_time ?? 0) + (recipe.prep_time ?? 0);
  const meta = [
    minutes > 0 ? t("recipeCard.minutes", { count: minutes }) : null,
    recipe.servings ? t("recipeCard.servings", { count: recipe.servings }) : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const family = isFamilyRecipe(recipe.user_id);
  const aiAssisted = !family && (recipe.pipeline_status != null || (recipeSourceLabel(recipe.user_id) === "Culinse" && recipe.source_type !== "imported"));
  const aiNote = aiAssisted ? t("hero.imageNote") : "";

  const photo = hasSizedVariants(recipe.image_url) ? sizedImageUrl(recipe.image_url, 1280) : recipe.image_url;

  // Schriftgröße des Titels nach Länge, damit auch lange Namen in drei Zeilen passen.
  const n = width(main);
  const titleSize = n <= 14 ? 108 : n <= 22 ? 92 : n <= 34 ? 78 : n <= 50 ? 66 : 56;

  const families = FONTS[locale] ?? LATIN;
  const titleText = main;
  const bodyText = `${kicker}${sub ?? ""}${meta}${aiNote}culinse.com ·…`;
  const [titleFont, textFont, textBold] = await Promise.all([
    googleFont(families.title, 600, titleText),
    googleFont(families.text, 400, bodyText),
    googleFont(families.text, 600, bodyText),
  ]);
  const fonts = [
    ...(titleFont ? [{ name: "PinTitle", data: titleFont, weight: 600 as const, style: "normal" as const }] : []),
    ...(textFont ? [{ name: "PinText", data: textFont, weight: 400 as const, style: "normal" as const }] : []),
    ...(textBold ? [{ name: "PinText", data: textBold, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", position: "relative", background: stage, fontFamily: "PinText, sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" width={W} height={PHOTO_H} style={{ position: "absolute", top: 0, left: 0, width: W, height: PHOTO_H, objectFit: "cover" }} />
        {/* Verlauf vom Foto in die Fläche; überdeckt den angeschnittenen Hinweis im Foto. */}
        <div style={{ position: "absolute", top: PHOTO_H - 360, left: 0, width: W, height: 360, display: "flex", backgroundImage: `linear-gradient(to bottom, ${stage}00 0%, ${stage}8c 30%, ${stage}f2 52%, ${stage} 64%)` }} />

        <div style={{ position: "absolute", top: PANEL_TOP, left: 0, width: W, height: H - PANEL_TOP, display: "flex", flexDirection: "column", padding: "0 72px 56px" }}>
          {kicker ? (
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, letterSpacing: 3, color: tint, opacity: 0.85, marginBottom: 18 }}>{kicker}</div>
          ) : null}
          <div style={{ display: "block", fontFamily: "PinTitle, PinText, serif", fontWeight: 600, fontSize: titleSize, lineHeight: 1.06, letterSpacing: -1, color: "#FFFFFF", lineClamp: 3 }}>{main}</div>
          {sub ? (
            <div style={{ display: "block", marginTop: 22, fontSize: 38, lineHeight: 1.25, color: tint, opacity: 0.92, lineClamp: 2 }}>{sub}</div>
          ) : null}

          <div style={{ display: "flex", flexGrow: 1 }} />

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: `2px solid ${tint}40`, paddingTop: 26 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {meta ? <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: "#FFFFFF" }}>{meta}</div> : null}
              {aiNote ? <div style={{ display: "flex", marginTop: 8, fontSize: 21, color: tint, opacity: 0.75 }}>{aiNote}</div> : null}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 40, fontWeight: 600 }}>
              <span style={{ color: "#FFFFFF" }}>culi</span>
              <span style={{ color: WORDMARK_ACCENT }}>nse</span>
              <span style={{ color: tint, opacity: 0.85, fontWeight: 400, fontSize: 30 }}>.com</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      ...(fonts.length ? { fonts } : {}),
      // Lange cachen: Die Grafik ändert sich nur, wenn sich das Rezept ändert.
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800" },
    },
  );
}

// Die Akzentfarbe des Gerichts ist für hellen Grund gerechnet; auf der dunklen
// Fläche trägt die Wortmarke die Markenfarbe in einer helleren Stufe.
const WORDMARK_ACCENT = "#F2A46C";
