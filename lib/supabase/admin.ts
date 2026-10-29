import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Secret-key client. It bypasses RLS, so only import it from Server Actions that
 * have already verified the caller (lib/auth/user-actions.ts). Never NEXT_PUBLIC_.
 */
export function createSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set; user management needs it (see .env.example).");
  return createClient<Database>(supabaseConfig().url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
