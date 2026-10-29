import "server-only";

import { isAdminRole, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Every profile, for admins. RLS already limits members to their own row; the
 * role check here keeps the intent explicit. The timing doubles as a live
 * connection check for the admin dashboard.
 */
export async function listAccounts() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) return { accounts: [], error: "Not allowed", latencyMs: 0 };

  const supabase = await createSupabaseServerClient();
  const started = performance.now();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, must_change_password, created_at")
    .order("created_at")
    .limit(100);

  return {
    accounts: data ?? [],
    error: error?.message ?? null,
    latencyMs: Math.round(performance.now() - started),
  };
}
