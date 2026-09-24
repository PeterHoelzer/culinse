import { NextRequest, NextResponse } from "next/server";
import { translateSearchQuery } from "@/lib/translateSearchQuery";
import { isAirfryerQuery, AIRFRYER_TAG, AIRFRYER_TITLE_OR } from "@/lib/searchSynonyms";
import { createAdminClient } from "@/lib/supabase/admin";
import { recipeSourceLabel } from "@/lib/culinse";
import { optimizedImageUrl } from "@/lib/imageUrl";

// ─── Nur noch eigene Rezepte (13.09.2026) ────────────────────────────────────
// culinse.com zeigt ausschliesslich Rezepte aus user_recipes: den Culinse-
// Korpus (Agent/Seed) und Community-Rezepte. Die frueheren externen Provider
// (Spoonacular / TheMealDB / Edamam) sind bewusst abgeklemmt — Entscheid
// 13.09., siehe Brain: Entscheidungs-Log. Der fruehere Failsafe-Pfad
// "eigener Katalog" ist damit der Hauptpfad; leer kann das Ergebnis nur noch
// bei einer Suche ohne Treffer sein.

interface Row {
  id: string;
  user_id: string | null;
  title: string;
  image_url: string | null;
  image_position: string | null;
  cook_time: number | null;
  servings: number | null;
  tags: string[] | null;
  created_at: string | null;
}

function mapRow(r: Row) {
  return {
    id: `user_${r.id}`,
    title: r.title,
    image: optimizedImageUrl(r.image_url, 640) ?? r.image_url,
    source: recipeSourceLabel(r.user_id),
    sourceUrl: "#",
    time: r.cook_time ? `${r.cook_time} min` : "—",
    servings: r.servings ?? null,
    rating: null,
    imagePosition: r.image_position ?? "50% 50%",
  };
}

// Kategorie-Chips der Startseite → Tag-Kandidaten im Korpus (DE + EN).
const CATEGORY_TAGS: Record<string, string[]> = {
  Breakfast: ["breakfast", "frühstück", "fruehstueck"],
  Dessert: ["dessert", "nachtisch", "kuchen"],
  Soup: ["soup", "suppe", "eintopf"],
  Pasta: ["pasta", "nudeln"],
  Seafood: ["seafood", "fisch", "fish"],
  Asian: ["asian", "asiatisch"],
  Korean: ["korean", "koreanisch"],
  Italian: ["italian", "italienisch"],
  Mexican: ["mexican", "mexikanisch"],
  German: ["deutschland"],
  // Korpus-Erweiterung (24.09.26): Chips für die starken Tags des 1368er-
  // Korpus; Salad/Pizza zusätzlich per Tag statt nur Titel-Fallback.
  "Main Dishes": ["hauptgericht", "main course", "main dish"],
  Vegetarian: ["vegetarisch", "vegetarian", "vegan"],
  Quick: ["schnell", "quick"],
  "Sides & Snacks": ["beilage", "side dish", "snack", "snacks", "fingerfood"],
  Festive: ["festlich", "festive"],
  Salad: ["salat", "salad"],
  Pizza: ["pizza"],
  // Heißluftfritteuse (19.09.26): sprachunabhängig vererbter Korpus-Tag;
  // Chip "Air Fryer" auf der Startseite (messages categories[2]).
  "Air Fryer": [AIRFRYER_TAG, "airfryer", "air fryer"],
};

// Bundesland-Filter (19.09.26): ASCII-URL-Werte -> deutsche Tags im Korpus.
const REGION_TAGS: Record<string, string[]> = {
  "baden-wuerttemberg": ["baden-württemberg"],
  bayern: ["bayern"],
  berlin: ["berlin"],
  brandenburg: ["brandenburg"],
  bremen: ["bremen"],
  hamburg: ["hamburg"],
  hessen: ["hessen"],
  "mecklenburg-vorpommern": ["mecklenburg-vorpommern"],
  niedersachsen: ["niedersachsen"],
  "nordrhein-westfalen": ["nordrhein-westfalen"],
  "rheinland-pfalz": ["rheinland-pfalz"],
  saarland: ["saarland"],
  sachsen: ["sachsen"],
  "sachsen-anhalt": ["sachsen-anhalt"],
  "schleswig-holstein": ["schleswig-holstein"],
  thueringen: ["thüringen"],
};

const DIET_TAGS: Record<string, string[]> = {
  vegetarian: ["vegetarian", "vegetarisch", "vegan"],
  vegan: ["vegan"],
  "gluten free": ["gluten free", "glutenfrei"],
};

// Tages-Seed: Standard-Ansicht rotiert einmal pro Tag, bleibt tagsueber
// stabil und damit cachebar.
function daySeed() {
  const t = new Date();
  return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
}

function seededShuffle<T>(arr: T[], seedInit: number): T[] {
  let seed = seedInit;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim();
  const category = searchParams.get("category") || "";
  const region = searchParams.get("region") || "";
  const number = Math.min(Math.max(Math.floor(Number(searchParams.get("number")) || 6), 1), 24);
  const maxTime = Math.floor(Number(searchParams.get("maxTime")) || 0);
  const diet = (searchParams.get("diet") || "").toLowerCase();
  const lang = (searchParams.get("lang") || "en").toLowerCase();
  const l = lang === "de" ? "de" : lang === "es" ? "es" : lang === "fr" ? "fr" : lang === "it" ? "it" : lang === "pl" ? "pl" : lang === "tr" ? "tr" : lang === "nl" ? "nl" : lang === "cs" ? "cs" : "en";

  try {
    const supabase = createAdminClient();
    const base = () => {
      let q = supabase
        .from("user_recipes")
        .select("id, user_id, title, image_url, image_position, cook_time, servings, tags, created_at")
        .eq("is_public", true)
        .not("image_url", "is", null)
        .or(`language.eq.${l},language.is.null`);
      if (maxTime > 0) q = q.lte("cook_time", maxTime);
      if (diet && DIET_TAGS[diet]) q = q.overlaps("tags", DIET_TAGS[diet]);
      return q;
    };

    let rows: Row[] = [];
    let hasMore = false;

    if (query) {
      // Suche: erst Original-Begriff, dann Uebersetzung (DE-Nutzer suchen
      // "Nudeln", englische Korpus-Titel sagen "pasta") — wie im alten
      // Failsafe, nur ohne dritten Ungefiltert-Pass: eine Suche ohne Treffer
      // darf ehrlich leer sein.
      const run = async (term: string) => {
        const { data } = await base()
          .ilike("title", `%${term}%`)
          .order("created_at", { ascending: false })
          .limit(number + 1);
        return (data ?? []) as Row[];
      };
      // Heißluftfritteuse (19.09.26): "airfryer", "Heißluftfritteuse" und
      // gängige Tippfehler (heissluftfriteuse, Luftfritteuse …) treffen per
      // Tag statt nur über den Titel — die Titel variieren je Sprache.
      if (isAirfryerQuery(query)) {
        const { data } = await base()
          .or(`tags.ov.{${AIRFRYER_TAG}},${AIRFRYER_TITLE_OR}`)
          .order("created_at", { ascending: false })
          .limit(number + 1);
        rows = (data ?? []) as Row[];
      } else {
        rows = await run(query);
      }
      if (!rows.length) {
        const translated = await translateSearchQuery(query, l === "de" ? "DE" : "EN");
        if (translated && translated.toLowerCase() !== query.toLowerCase()) {
          rows = await run(translated);
        }
      }
      hasMore = rows.length > number;
      rows = rows.slice(0, number);
    } else if (region && REGION_TAGS[region]) {
      // Ein Bundesland gewinnt vor category (German laeuft sonst als overlaps deutschland).
      const { data } = await base()
        .overlaps("tags", REGION_TAGS[region])
        .order("created_at", { ascending: false })
        .limit(number + 1);
      rows = (data ?? []) as Row[];
      hasMore = rows.length > number;
      rows = rows.slice(0, number);
    } else if (category && category !== "All") {
      const tags = CATEGORY_TAGS[category];
      if (tags) {
        const { data } = await base()
          .overlaps("tags", tags)
          .order("created_at", { ascending: false })
          .limit(number + 1);
        rows = (data ?? []) as Row[];
      }
      if (!rows.length) {
        const { data } = await base()
          .ilike("title", `%${category}%`)
          .order("created_at", { ascending: false })
          .limit(number + 1);
        rows = (data ?? []) as Row[];
      }
      hasMore = rows.length > number;
      rows = rows.slice(0, number);
    } else {
      // Standard-Ansicht (Trending, 24.09.26): taeglich rotierende Auswahl
      // aus dem GESAMTEN Korpus. order by id = stabile Quasi-Zufallsfolge
      // (uuid v4), der Tages-Offset wandert durch alle Rezepte — deutsch und
      // international gemischt, tagsueber stabil und damit cachebar.
      let cq = supabase
        .from("user_recipes")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true)
        .not("image_url", "is", null)
        .or(`language.eq.${l},language.is.null`);
      if (maxTime > 0) cq = cq.lte("cook_time", maxTime);
      if (diet && DIET_TAGS[diet]) cq = cq.overlaps("tags", DIET_TAGS[diet]);
      const { count } = await cq;
      const total = count ?? 0;
      const offset = total > 120 ? daySeed() % (total - 119) : 0;
      const { data } = await base()
        .order("id", { ascending: true })
        .range(offset, offset + 119);
      const pool = (data ?? []) as Row[];
      rows = seededShuffle(pool, daySeed()).slice(0, number);
      hasMore = pool.length > number;
    }

    return NextResponse.json(
      { recipes: rows.map(mapRow), hasMore },
      {
        headers: {
          "Cache-Control": query
            ? "no-store"
            : "s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}
