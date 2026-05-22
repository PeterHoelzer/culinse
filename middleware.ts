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
];

async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale middleware for API routes and static files
  const isApiRoute = pathname.startsWith("/api/");
  const isStaticFile = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2)$/.test(pathname);

  if (!isApiRoute && !isStaticFile) {
    // Run intl middleware first (handles locale redirect + sets locale cookie)
    const intlResponse = intlMiddleware(request);

    // If intl middleware issued a redirect (e.g. / → /en), return it immediately
    if (intlResponse.status !== 200) {
      return intlResponse;
    }
  }

  // ─── Supabase auth / session ────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
