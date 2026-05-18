import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/collections",
  "/meal-planner",
  "/wochenplaner",
  "/saved",
  "/profile",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const isProtected = PROTECTED_ROUTES.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );
  if (!isProtected) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/collections/:path*",
    "/meal-planner/:path*",
    "/wochenplaner/:path*",
    "/saved/:path*",
    "/profile/:path*",
  ],
};
