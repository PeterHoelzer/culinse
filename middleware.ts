import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// ─── next-intl locale middleware ─────────────────────────────────────────────
const intlMiddleware = createMiddleware(routing);

// Protected routes — without locale prefix (checked against pathname after stripping locale)
const PROTECTED_PATHS = [
  "/collections",
  "/meal-planner",
  "/wochenplaner",
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

  // ─── next-intl: run first, capture headers it sets ──────────────────────────
  let intlHeaders: Headers | null = null;
  if (!isApiRoute && !isStaticFile && !isSeoFile) {
    const intlResponse = intlMiddleware(request);
    // If it's a redirect (e.g. / → /en), return immediately
    if (intlResponse.status !== 200) {
      return intlResponse;
    }
    // Save the response headers so we can forward them.
    // intlMiddleware sets x-next-intl-locale (and cookies) that server
    // components need to determine the locale via getTranslations().
    intlHeaders = intlResponse.headers;
  }

  // ─── Supabase auth / session ────────────────────────────────────────────────
  // Build enriched request headers: copy intl headers (x-next-intl-locale etc.)
  // so that getTranslations() in server components can read the locale via
  // headers() from next/headers.
  const requestHeaders = new Headers(request.headers);
  if (intlHeaders) {
    intlHeaders.forEach((value, key) => {
      requestHeaders.set(key, value);
    });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  // Also forward intl headers on the response side (belt-and-suspenders)
  if (intlHeaders) {
    intlHeaders.forEach((value, key) => {
      supabaseResponse.headers.set(key, value);
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          // Re-forward intl headers whenever supabaseResponse is recreated
          if (intlHeaders) {
            intlHeaders.forEach((value, key) => {
              supabaseResponse.headers.set(key, value);
            });
          }
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

  const isProtected = PROTECTED_PATHS.some((path) =>
    strippedPath.startsWith(path)
  );

  if (isProtected && !session) {
    // Detect locale from URL or default to "en"
    const localeMatch = pathname.match(/^\/(en|de)\//);
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
