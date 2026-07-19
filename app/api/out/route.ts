import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Affiliate outbound redirect — the "turnstile".
 *
 * All affiliate links point here first (?u=<target>&s=<source>&r=<recipeId>).
 * We log the click to `affiliate_clicks` and 307-redirect to the target.
 * Logging must never block or break the redirect: on any error we still
 * forward the user.
 *
 * Security: strict host allowlist so this can never be abused as an open
 * redirect (e.g. for phishing links that appear to come from culinse.com).
 */

const ALLOWED_HOSTS = new Set([
  "www.amazon.de",
  "amazon.de",
  // future partners (Awin deep links etc.) get added here:
  "www.awin1.com",
]);

const ALLOWED_SOURCES = new Set([
  "recipe_ingredient",
  "recipe_tools",
  "shopping_list",
  "shopping_list_all",
  "blog",
  "planner",
  "newsletter",
]);

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("u");
  const source = req.nextUrl.searchParams.get("s") ?? "unknown";
  const recipeId = req.nextUrl.searchParams.get("r");

  // Validate target URL + allowlist
  let url: URL;
  try {
    url = new URL(target ?? "");
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Log the click — fire-and-forget semantics: failures never stop the redirect.
  try {
    await createAdminClient()
      .from("affiliate_clicks")
      .insert({
        target: url.toString(),
        source: ALLOWED_SOURCES.has(source) ? source : "unknown",
        recipe_id: recipeId ?? null,
        referer: req.headers.get("referer") ?? null,
      });
  } catch (e) {
    console.error("affiliate click log failed:", e);
  }

  return NextResponse.redirect(url, 307);
}
