import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { cookieOptions, isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase session cookie and gates the admin area. It only runs
 * on auth routes, so the marketing site and demo stay static and untouched.
 * Pages and Server Actions still verify the user themselves; this is the first
 * line, not the only one.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isSupabaseConfigured()) {
    // Nobody can be signed in yet; the sign-in page explains what's missing.
    return pathname.startsWith("/admin") ? NextResponse.redirect(new URL("/sign-in", request.url)) : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Verifies the JWT (locally when the project uses asymmetric signing keys).
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims?.sub;

  if (pathname.startsWith("/admin") && !signedIn) {
    const target = new URL("/sign-in", request.url);
    target.searchParams.set("next", pathname);
    return redirectKeepingCookies(target, response);
  }
  if (pathname === "/sign-in" && signedIn) {
    return redirectKeepingCookies(new URL("/admin", request.url), response);
  }
  return response;
}

function redirectKeepingCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key === "cache-control" || key === "expires" || key === "pragma") redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  matcher: ["/admin/:path*", "/sign-in"],
};
