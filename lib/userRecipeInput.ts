// ── User-recipe input sanitizer ──────────────────────────────────────────────
// Shared by POST /api/user-recipes and PUT /api/user-recipes/[id]. The editor
// sends free-form JSON; without caps a request could store megabytes per row,
// and URL fields could carry non-http schemes (e.g. javascript:) that would be
// dangerous once rendered as links on public recipe pages.

const MAX_INGREDIENTS = 100;
const MAX_INSTRUCTIONS = 60;
const MAX_TAGS = 20;

function str(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, maxLen) : null;
}

/** Only http(s) URLs pass; everything else (javascript:, data:, …) → null. */
export function httpUrl(v: unknown): string | null {
  const s = str(v, 2048);
  if (!s) return null;
  try {
    const u = new URL(s);
    return /^https?:$/.test(u.protocol) ? s : null;
  } catch {
    return null;
  }
}

function intInRange(v: unknown, min: number, max: number): number | null {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export interface SanitizedRecipeInput {
  title: string | null;
  description: string | null;
  image_url: string | null;
  image_position: string;
  video_url: string | null;
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: { step: number; text: string }[];
  cook_time: number | null;
  prep_time: number | null;
  servings: number | null;
  tags: string[];
}

export function sanitizeRecipeInput(body: Record<string, unknown>): SanitizedRecipeInput {
  const rawPosition = str(body.image_position, 24);
  const image_position =
    rawPosition && /^\d{1,3}% \d{1,3}%$/.test(rawPosition) ? rawPosition : "50% 50%";

  const ingredients = (Array.isArray(body.ingredients) ? body.ingredients : [])
    .slice(0, MAX_INGREDIENTS)
    .map((i) => {
      const o = (i && typeof i === "object" ? i : {}) as Record<string, unknown>;
      return {
        name: str(o.name, 200) ?? "",
        amount: str(o.amount, 32) ?? "",
        unit: str(o.unit, 32) ?? "",
      };
    })
    .filter((i) => i.name);

  const instructions = (Array.isArray(body.instructions) ? body.instructions : [])
    .slice(0, MAX_INSTRUCTIONS)
    .map((s, idx) => {
      const o = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
      return {
        step: intInRange(o.step, 1, MAX_INSTRUCTIONS) ?? idx + 1,
        text: str(o.text, 2000) ?? "",
      };
    })
    .filter((s) => s.text);

  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .slice(0, MAX_TAGS)
    .map((t) => str(t, 50))
    .filter((t): t is string => Boolean(t));

  return {
    title: str(body.title, 200),
    description: str(body.description, 2000),
    image_url: httpUrl(body.image_url),
    image_position,
    video_url: httpUrl(body.video_url),
    ingredients,
    instructions,
    cook_time: intInRange(body.cook_time, 0, 6000),
    prep_time: intInRange(body.prep_time, 0, 6000),
    servings: intInRange(body.servings, 1, 100),
    tags,
  };
}
