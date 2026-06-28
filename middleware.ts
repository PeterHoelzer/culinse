import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// ─── next-intl locale middleware ─────────────────────────────────────────────
const intlMiddleware = createMiddleware(routing);

// Protected routes — without locale prefix (checked against pathname after stripping locale)
// NOTE: "/collections" is intentionally NOT a blanket prefix here. Its public
// sub-pages (/collections/explore and /collections/<id>) are server-rendered SEO
// landing pages listed in the sitemap and MUST stay reachable by anonymous users
// and crawlers. Only the user's own collections index is gated — see isProtected.
const PROTECTED_PATHS = [
  "/meal-planner",
  "/wochenplaner",
  "/planner",
  "/saved",
  "/profile",
  "/my-recipes",
  "/recipes/create",
  "/recipes",
];

async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale middleware for API routes and static files
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2)$/.test(pathname);
  // Skip locale middleware for SEO files (sitemap, robots) — must stay at root
  const isSeoFile = pathname === "/sitemap.xml" || pathname === "/robots.txt";
  // Skip locale middleware for the OAuth/magic-link callback. It lives at
  // /auth/callback (no locale); with localePrefix "always" next-intl would
  // otherwise redirect it to /en/auth/callback (which doesn't exist → 404),
  // so the login code would never be exchanged for a session.
  const isAuthRoute = pathname.startsWith("/auth/");

  // ─── next-intl: run first, capture headers it sets ──────────────────────────
  let intlHeaders: Headers | null = null;
  if (!isApiRoute && !isStaticFile && !isSeoFile && !isAuthRoute) {
    const intlResponse = intlMiddleware(request);
    // If it's a redirect (e.g. / → /en), return immediately
    if (intlResponse.status !== 200) {
      return intlResponse;
    }
    // intlMiddleware sets x-next-intl-locale (and possibly cookies) that server
    // components need to determine the locale via getTranslations().
    intlHeaders = intlResponse.headers;
  }

  // ─── Supabase auth / session ────────────────────────────────────────────────
  // Build request headers that include the intl locale headers so that
  // getTranslations() in server components can read the locale.
  const requestHeaders = new Headers(request.headers);
  if (intlHeaders) {
    intlHeaders.forEach((value, key) => {
      requestHeaders.set(key, value);
    });
  }

  // supabaseResponse is recreated in setAll() when Supabase refreshes the
  // session token.  We use a mutable reference so the updated version is
  // returned at the end of the function.
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write the refreshed token back onto the incoming request so that
          // downstream server components see the new session.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the Cookie header from the mutated request.cookies so the
          // forwarded request always carries the latest token.
          requestHeaders.set(
            "cookie",
            request.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join("; ")
          );
          // Recreate the response so it forwards the updated request headers.
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          // Set the new cookies on the response so the browser updates them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (keeps Supabase cookies alive)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Strip locale prefix (/en/collections → /collections) for route matching
  const localePattern = /^\/(en|de)(\/|$)/;
  const strippedPath = pathname.replace(localePattern, "/");

  // Gate only the user's OWN collections index (/collections or /collections/),
  // never the public sub-pages /collections/explore and /collections/<id>, which
  // must stay crawlable for SEO (they're in the sitemap and server-render their
  // own content; private collections are access-gated client-side).
  const isCollectionsIndex =
    strippedPath === "/collections" || strippedPath === "/collections/";

  const isProtected =
    isCollectionsIndex ||
    PROTECTED_PATHS.some((path) => strippedPath.startsWith(path));

  if (isProtected && !session) {
    // Detect locale from URL or default to "en"
    const localeMatch = pathname.match(/^\/(en|de)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
