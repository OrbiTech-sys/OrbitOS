import type { AppRole } from "@/lib/supabase/database.types";

/**
 * Who may do what to whom. Pure functions shared by the UI (to show or hide
 * controls) and the Server Actions (which enforce them).
 *
 * - Super admins add users with any role, and edit, change roles, reset passwords,
 *   set storage limits, deactivate, reactivate and delete anyone except themselves.
 *   Only they edit the public website.
 * - Admins add members; edit, deactivate, reactivate and delete members; and read the
 *   website's enquiries. They can see how much storage a member uses (never what the
 *   records contain).
 * - Members manage nothing.
 * Nobody acts on their own account here; your own password lives at /account/password.
 */

export const ROLES: readonly AppRole[] = ["member", "admin", "super_admin"];

type Actor = { id: string; role: AppRole; active: boolean; mustChangePassword?: boolean };
type Target = { id: string; role: AppRole };

/** An account on a temporary password has to replace it before it can do anything else. */
const canAct = (actor: Actor) => actor.active && !actor.mustChangePassword;

export function rolesActorCanAssign(actor: Actor): AppRole[] {
  if (!canAct(actor)) return [];
  if (actor.role === "super_admin") return [...ROLES];
  if (actor.role === "admin") return ["member"];
  return [];
}

export const canAddUsers = (actor: Actor) => rolesActorCanAssign(actor).length > 0;

const isAdmin = (actor: Actor) => canAct(actor) && (actor.role === "super_admin" || actor.role === "admin");
const isSuperAdmin = (actor: Actor) => canAct(actor) && actor.role === "super_admin";

/** Edit details, deactivate, reactivate and delete. */
export const canManageUser = (actor: Actor, target: Target) =>
  actor.id !== target.id && (isSuperAdmin(actor) || (isAdmin(actor) && target.role === "member"));

export const canChangeRole = (actor: Actor, target: Target) => isSuperAdmin(actor) && actor.id !== target.id;
export const canResetPassword = (actor: Actor, target: Target) => isSuperAdmin(actor) && actor.id !== target.id;
export const canSetStorageLimit = (actor: Actor, target: Target) => isSuperAdmin(actor) && actor.id !== target.id;

/** Every admin may look at storage use, including their own. */
export const canViewUsage = (actor: Actor) => isAdmin(actor);

/** Website enquiries hold personal data, so they stay with administrators. */
export const canReadInbox = (actor: Actor) => isAdmin(actor);

export const canEditWebsite = (actor: Actor) => isSuperAdmin(actor);

export interface TargetCapabilities {
  lifecycle: boolean;
  role: boolean;
  password: boolean;
  storageLimit: boolean;
  usage: boolean;
}

export function capabilitiesFor(actor: Actor, target: Target): TargetCapabilities {
  return {
    lifecycle: canManageUser(actor, target),
    role: canChangeRole(actor, target),
    password: canResetPassword(actor, target),
    storageLimit: canSetStorageLimit(actor, target),
    usage: canViewUsage(actor),
  };
}
