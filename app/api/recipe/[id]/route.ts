import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { computeUserRecipeNutrition } from "@/lib/userRecipeNutrition";
import { recipeSourceLabel } from "@/lib/culinse";
import { httpUrl } from "@/lib/userRecipeInput";
import { optimizedImageUrl } from "@/lib/imageUrl";




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

      const recipe = {
        id,
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
        aiAssisted: r.pipeline_status != null || (recipeSourceLabel(r.user_id) === "Culinse" && r.source_type !== "imported"),
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
