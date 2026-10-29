import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { cookieOptions, supabaseConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Per-request Supabase client for Server Components, Server Actions and Route
 * Handlers. It uses the publishable key plus the signed-in user's session, so
 * every query runs under Row Level Security. Never share one across requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
