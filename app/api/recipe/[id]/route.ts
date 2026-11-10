import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { computeUserRecipeNutrition } from "@/lib/userRecipeNutrition";
import { isFamilyRecipe, recipeSourceLabel } from "@/lib/culinse";
import { httpUrl } from "@/lib/userRecipeInput";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { routing } from "@/i18n/routing";

const LOCALES: readonly string[] = routing.locales;




export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── User-created (community) recipe ──────────────────────────────────────────
  if (id.startsWith("user_")) {
    const uuid = id.replace("user_", "");
    try {
      const supabase = createAdminClient();
      const { data: r, error } = await supabase
        .from("user_recipes")
        .select("*")
        .eq("id", uuid)
        .single();

      if (error || !r) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Public recipes are visible to everyone; a private draft is visible only
      // to its owner (so creators can preview before publishing).
      if (!r.is_public) {
        const sb = await createServerClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user || user.id !== r.user_id) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }

      const ingredients = ((r.ingredients || []) as { name?: string; amount?: string; unit?: string }[])
        .filter((i) => i && i.name)
        .map((i, idx) => ({
          id: idx,
          name: i.name || "",
          amount: i.amount ? Number(i.amount) || 0 : 0,
          unit: i.unit || "",
          original: [i.amount, i.unit, i.name].filter(Boolean).join(" ").trim(),
        }));

      const instructions = ((r.instructions || []) as { step?: number; text?: string }[])
        .filter((s) => s && s.text)
        .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
        .map((s, idx) => ({ number: s.step ?? idx + 1, step: s.text || "" }));

      const totalTime = (r.cook_time || 0) + (r.prep_time || 0);

      // Nutrition: use the cached value, or compute it once (lazy) and store it.
      let nutrition = (r.nutrition as { calories: number; protein: number | null; fat: number | null; carbs: number | null } | null) ?? null;
      if (!nutrition && Array.isArray(r.ingredients) && r.ingredients.length) {
        nutrition = await computeUserRecipeNutrition(r.servings, r.ingredients);
        if (nutrition) {
          await supabase.from("user_recipes").update({ nutrition }).eq("id", uuid);
        }
      }

      // Sprachfassungen desselben Gerichts: jede Sprache hat eine eigene Zeile
      // mit eigener ID, verbunden über translation_group. Die Rezeptseite baut
      // daraus hreflang und leitet eine Adresse mit falscher Sprache auf die
      // richtige Fassung um. Zeilen ohne Sprache (alte Community-Rezepte)
      // bekommen eine leere Liste.
      const language = typeof r.language === "string" && LOCALES.includes(r.language) ? r.language : null;
      const translations: Record<string, string> = {};
      // Schlagworte für die Verweise auf Küche, Region und Gang: maßgeblich sind die
      // deutschen (dort sind Regionen gepflegt); ältere Übersetzungen tragen englische.
      let topicTags: string[] = Array.isArray(r.tags) ? (r.tags as string[]) : [];
      if (language && r.is_public) {
        if (r.translation_group) {
          const { data: siblings } = await supabase
            .from("user_recipes")
            .select("id, language, tags")
            .eq("translation_group", r.translation_group)
            .eq("is_public", true)
            .order("id", { ascending: true });
          for (const s of (siblings ?? []) as { id: string; language: string | null; tags: string[] | null }[]) {
            if (s.language && LOCALES.includes(s.language) && !translations[s.language]) {
              translations[s.language] = `user_${s.id}`;
              if (s.language === "de" && Array.isArray(s.tags)) topicTags = s.tags;
            }
          }
        }
        translations[language] = id;
      }
      const family = isFamilyRecipe(r.user_id);

      const recipe = {
        id,
        language,
        translations,
        topicTags,
        // Familienrezept: selbst gekocht, nicht mit KI erstellt (siehe lib/culinse.ts).
        family,
        // Redaktionell verantwortet (eigene und Familienrezepte), nicht bei fremden Community-Rezepten.
        editorial: family || recipeSourceLabel(r.user_id) === "Culinse",
        title: r.title,
        // URL columns pass the http(s) filter before rendering as src/href —
        // stored javascript:/data: values must never reach visitors' browsers.
        image: optimizedImageUrl(httpUrl(r.image_url), 1200),
        // Galerie (falls gepflegt): geordnete Liste, Cover an Position 0.
        images: (Array.isArray(r.images) ? (r.images as unknown[]) : [])
          .map((u) => optimizedImageUrl(httpUrl(u), 1200))
          .filter((u): u is string => Boolean(u)),
        imagePosition: r.image_position || "50% 50%",
        // Freiwillige KI-Kennzeichnung (AI Act Art. 50): Korpus-Rezepte laufen
        // durch die Agent-Pipeline (pipeline_status gesetzt) und sind redaktionell
        // geprueft; manuelle Community-Rezepte haben hier NULL.
        // Doppelt abgesichert: Pipeline-Merkmal ODER strukturell (alles, was unter
        // dem Culinse-Label laeuft und nicht importiert ist, ist KI-unterstuetzt).
        aiAssisted: !family && (r.pipeline_status != null || (recipeSourceLabel(r.user_id) === "Culinse" && r.source_type !== "imported")),
        videoUrl: httpUrl(r.video_url),
        // Imported recipes carry their original site name + link for attribution;
        // created recipes are labelled Culinse (owner) or Community (other members).
        source: r.source_type === "imported" ? (r.source_name || "Community") : recipeSourceLabel(r.user_id),
        sourceUrl: httpUrl(r.source_url) ?? "",
        time: totalTime > 0 ? `${totalTime} min` : null,
        prepTime: r.prep_time || null,
        cookTime: r.cook_time || null,
        datePublished: r.created_at || null,
        servings: r.servings || null,
        summary: r.description || null,
        ingredients,
        instructions,
        diets: Array.isArray(r.tags) ? r.tags : [],
        dishTypes: [],
        nutrition,
      };

      return NextResponse.json({ recipe }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
    }
  }

  // ── Externe Provider (13.09.2026 entfernt) ──────────────────────────────────
  // Spoonacular / TheMealDB / Edamam / Tasty sind abgeklemmt — es gibt nur
  // noch eigene + Community-Rezepte (user_-IDs). Alte Provider-URLs → echtes
  // 404; die Seite uebersetzt das in notFound() (Soft-404-Fix 17.08. bleibt).
  return NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "Cache-Control": "s-maxage=86400" } }
  );
}
