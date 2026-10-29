import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppRole } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
  mustChangePassword: boolean;
  /** False once a super admin deactivates the account; RLS already denies them elevated access. */
  active: boolean;
};

/**
 * Data access layer: the signed-in user and their profile, or null.
 * Deduplicated per request, and narrowed so no tokens reach components.
 * Call it behind a <Suspense> boundary (it reads cookies).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;
  // Request time only: Supabase checks token expiry against the clock, which
  // Next.js refuses inside (runtime) prerenders and prefetches.
  await connection();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role, must_change_password, deactivated_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return null;

  return {
    id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    mustChangePassword: profile.must_change_password,
    active: profile.deactivated_at === null,
  };
});

/**
 * A signed-in, active user who has replaced any temporary password; redirects
 * otherwise. The ?reason flag stops the proxy bouncing a stale session (for
 * example a deleted account whose token hasn't expired) straight back here.
 */
export async function requireUser({ allowTemporaryPassword = false } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?reason=session");
  if (!user.active) redirect("/admin/deactivated");
  if (user.mustChangePassword && !allowTemporaryPassword) redirect("/admin/password");
  return user;
}

export const isAdminRole = (role: AppRole) => role === "super_admin" || role === "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  member: "Member",
};
