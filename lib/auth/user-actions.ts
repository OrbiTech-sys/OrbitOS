"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ROLES, canChangeRole, canManageUser, canResetPassword, canSetStorageLimit, canViewUsage, rolesActorCanAssign } from "@/lib/auth/permissions";
import { addUserSchema, type UserActionState } from "@/lib/auth/schemas";
import { ROLE_LABELS, getCurrentUser, isAdminRole, type CurrentUser } from "@/lib/auth/session";
import { generateTempPassword } from "@/lib/auth/temp-password";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * User management. Every action re-reads the caller's session and checks
 * lib/auth/permissions.ts before touching the secret-key client; ids and roles
 * coming from the browser are treated as untrusted input.
 */

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const LAST_SUPER_ADMIN = "P0001";
const BAN_FOREVER = "876000h"; // ~100 years; Supabase's way to disable sign-in

const fail = (error: string): UserActionState => ({ ok: false, error });

async function currentActor() {
  const actor = await getCurrentUser();
  if (!actor) redirect("/sign-in?reason=session");
  return actor;
}

async function audit(
  admin: AdminClient,
  actor: CurrentUser,
  action: string,
  target: { id: string; email: string },
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.from("audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action,
    target_id: target.id,
    target_email: target.email,
    details,
  });
  // The change itself already happened; don't report it as failed.
  if (error) console.error(`audit_log insert failed for ${action}: ${error.message}`);
}

type Capability = "lifecycle" | "role" | "password" | "storageLimit";
const CAN = { lifecycle: canManageUser, role: canChangeRole, password: canResetPassword, storageLimit: canSetStorageLimit } as const;
const DENIED = { ok: false, error: "You don't have permission to do that." } as const;

/** Resolves the target of a manage action, or explains why the caller can't. */
async function authorizeManage(userId: unknown, capability: Capability) {
  const actor = await currentActor();
  const id = z.uuid().safeParse(userId);
  // Non-admins learn nothing about who exists.
  if (!id.success || !actor.active || !isAdminRole(actor.role)) return DENIED;

  const admin = createSupabaseAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, email, full_name, role, deactivated_at")
    .eq("id", id.data)
    .maybeSingle();
  if (!target) return { ok: false, error: "That user no longer exists." } as const;
  if (!CAN[capability](actor, target)) return DENIED;
  return { ok: true, actor, admin, target } as const;
}

const nameOf = (t: { full_name: string | null; email: string }) => t.full_name ?? t.email;

export async function addUser(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await currentActor();
  // Echoed back on failure so the form keeps what was typed.
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const parsed = addUserSchema.safeParse(values);
  if (!parsed.success) return { ok: false, values, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { fullName, email, role } = parsed.data;
  if (!rolesActorCanAssign(actor).includes(role)) return { ok: false, values, error: "You can't add users with that role." };

  const admin = createSupabaseAdminClient();
  const tempPassword = generateTempPassword();
  const { data, error } = await admin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { ok: false, values, fieldErrors: { email: ["An account with this email already exists"] } };
    }
    return { ok: false, values, error: "The user couldn't be created. Please try again." };
  }

  const target = { id: data.user.id, email };
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName, role, must_change_password: true })
    .eq("id", target.id);
  if (profileError) {
    // Don't leave a half-configured account that could sign in as a member.
    await admin.auth.admin.deleteUser(target.id);
    return { ok: false, values, error: "The user couldn't be created. Please try again." };
  }

  await audit(admin, actor, "user.created", target, { role });
  refresh();
  return { ok: true, message: `${fullName} was added as ${ROLE_LABELS[role].toLowerCase()}.`, email, tempPassword };
}

export async function changeUserRole(userId: string, _prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const auth = await authorizeManage(userId, "role");
  if (!auth.ok) return fail(auth.error);
  const { actor, admin, target } = auth;

  const role = z.enum(ROLES).safeParse(formData.get("role"));
  if (!role.success) return fail("Choose a role.");
  if (role.data === target.role) return { ok: true, message: "No change." };

  const { error } = await admin.from("profiles").update({ role: role.data }).eq("id", target.id);
  if (error) return fail(error.code === LAST_SUPER_ADMIN ? "OrbitOS needs at least one active super admin." : "The role couldn't be changed.");

  await audit(admin, actor, "user.role_changed", target, { from: target.role, to: role.data });
  refresh();
  return { ok: true, message: `${nameOf(target)} is now ${ROLE_LABELS[role.data].toLowerCase()}.` };
}

export async function resetUserPassword(userId: string): Promise<UserActionState> {
  const auth = await authorizeManage(userId, "password");
  if (!auth.ok) return fail(auth.error);
  const { actor, admin, target } = auth;

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(target.id, { password: tempPassword });
  if (error) return fail("The password couldn't be reset.");
  // After the update: the on_auth_user_updated trigger clears the flag whenever the hash changes.
  await admin.from("profiles").update({ must_change_password: true }).eq("id", target.id);

  await audit(admin, actor, "user.password_reset", target);
  refresh();
  return { ok: true, message: `New temporary password for ${nameOf(target)}.`, email: target.email, tempPassword };
}

export async function setUserActive(userId: string, active: boolean): Promise<UserActionState> {
  const auth = await authorizeManage(userId, "lifecycle");
  if (!auth.ok) return fail(auth.error);
  const { actor, admin, target } = auth;
  if (active === (target.deactivated_at === null)) return { ok: true, message: "No change." };

  if (active) {
    const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: "none" });
    if (error) return fail("The account couldn't be reactivated.");
    await admin.from("profiles").update({ deactivated_at: null }).eq("id", target.id);
  } else {
    // Profile first: RLS drops their access immediately, and the guard can refuse it.
    const { error } = await admin.from("profiles").update({ deactivated_at: new Date().toISOString() }).eq("id", target.id);
    if (error) return fail(error.code === LAST_SUPER_ADMIN ? "OrbitOS needs at least one active super admin." : "The account couldn't be deactivated.");
    const ban = await admin.auth.admin.updateUserById(target.id, { ban_duration: BAN_FOREVER });
    if (ban.error) {
      await admin.from("profiles").update({ deactivated_at: null }).eq("id", target.id);
      return fail("The account couldn't be deactivated.");
    }
  }

  await audit(admin, actor, active ? "user.reactivated" : "user.deactivated", target);
  refresh();
  return { ok: true, message: `${nameOf(target)} was ${active ? "reactivated" : "deactivated"}.` };
}

export async function deleteUser(userId: string): Promise<UserActionState> {
  const auth = await authorizeManage(userId, "lifecycle");
  if (!auth.ok) return fail(auth.error);
  const { actor, admin, target } = auth;

  const { error } = await admin.auth.admin.deleteUser(target.id);
  if (error) return fail("The user couldn't be deleted. If they're the last super admin, add another first.");

  await audit(admin, actor, "user.deleted", target, { role: target.role });
  refresh();
  return { ok: true, message: `${nameOf(target)} was deleted.` };
}

export async function setStorageLimit(userId: string, _prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const auth = await authorizeManage(userId, "storageLimit");
  if (!auth.ok) return fail(auth.error);
  const { actor, admin, target } = auth;

  const megabytes = z.coerce.number().int().min(1).max(10_240).safeParse(formData.get("megabytes"));
  if (!megabytes.success) return { ok: false, fieldErrors: { megabytes: ["Enter a whole number between 1 and 10,240"] } };

  const { error } = await admin
    .from("profiles")
    .update({ storage_quota_bytes: megabytes.data * 1024 * 1024 })
    .eq("id", target.id);
  if (error) return fail("The storage limit couldn't be changed.");

  await audit(admin, actor, "user.storage_limit_changed", target, { megabytes: megabytes.data });
  refresh();
  return { ok: true, message: `${nameOf(target)} can now store up to ${megabytes.data} MB.` };
}

export type UsageBreakdown = { ok: true; rows: { kind: string; records: number; bytes: number }[] } | { ok: false; error: string };

/** Records and storage per module for one member: sizes only, never contents. */
export async function getUsageBreakdown(userId: string): Promise<UsageBreakdown> {
  const actor = await currentActor();
  const id = z.uuid().safeParse(userId);
  if (!id.success || !canViewUsage(actor)) return { ok: false, error: "You don't have permission to do that." };

  // Called as the admin: the database function checks the role again and returns aggregates only.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("workspace_usage_breakdown", { p_owner: id.data });
  if (error) return { ok: false, error: "Usage couldn't be loaded." };
  return { ok: true, rows: data.map((r) => ({ kind: r.kind, records: Number(r.records), bytes: Number(r.bytes) })) };
}
