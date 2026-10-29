import "server-only";

import { isAdminRole, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Admin read models. Reads go through the signed-in user's session, so RLS
 * decides what comes back; the role checks only make the intent explicit.
 */

/** Every profile with its storage use, for admins. The timing doubles as a live connection check. */
export async function listAccounts() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) return { accounts: [], error: "Not allowed", latencyMs: 0 };

  const supabase = await createSupabaseServerClient();
  const started = performance.now();
  const [profiles, usage] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, must_change_password, deactivated_at, storage_quota_bytes, created_at")
      .order("created_at")
      .limit(500),
    supabase.from("workspace_usage").select("owner_id, records, bytes, last_write_at").limit(500),
  ]);
  const latencyMs = Math.round(performance.now() - started);

  const usageByOwner = new Map((usage.data ?? []).map((u) => [u.owner_id, u]));
  const accounts = (profiles.data ?? []).map((p) => {
    const u = usageByOwner.get(p.id);
    return {
      ...p,
      storage_quota_bytes: Number(p.storage_quota_bytes),
      records: u?.records ?? 0,
      bytes: Number(u?.bytes ?? 0),
      last_write_at: u?.last_write_at ?? null,
    };
  });

  return { accounts, error: profiles.error?.message ?? usage.error?.message ?? null, latencyMs };
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

export type AuditEntry = Awaited<ReturnType<typeof listAuditLog>>[number];
