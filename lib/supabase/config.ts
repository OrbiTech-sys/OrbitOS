import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Supabase settings shared by the proxy and server code. Nothing here is
 * `NEXT_PUBLIC_`: every auth call goes through Server Actions, so the browser
 * never needs a Supabase key, and the session cookies can be httpOnly.
 */
export function isSupabaseConfigured() {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY;
}

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example).");
  }
  // Origin only: a pasted ".../rest/v1/" would break every client path.
  return { url: new URL(url).origin, publishableKey };
}

export const cookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
