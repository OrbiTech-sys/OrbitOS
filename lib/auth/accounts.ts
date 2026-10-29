import "server-only";

import { isAdminRole, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Admin read models. Reads go through the signed-in user's session, so RLS
 * decides what comes back; the role checks only make the intent explicit.
 */

/** Every profile, for admins. The timing doubles as a live connection check. */
export async function listAccounts() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) return { accounts: [], error: "Not allowed", latencyMs: 0 };

  const supabase = await createSupabaseServerClient();
  const started = performance.now();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, must_change_password, deactivated_at, created_at")
    .order("created_at")
    .limit(500);

  return {
    accounts: data ?? [],
    error: error?.message ?? null,
    latencyMs: Math.round(performance.now() - started),
  };
}

export type Account = Awaited<ReturnType<typeof listAccounts>>["accounts"][number];

/** Most recent admin actions, for super admins. */
export async function listAuditLog(limit = 15) {
  const user = await requireUser();
  if (user.role !== "super_admin") return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, target_email, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
