import type { AppRole } from "@/lib/supabase/database.types";

/**
 * Who may do what to whom. Pure functions shared by the UI (to show or hide
 * controls) and the Server Actions (which enforce them).
 *
 * - Super admins add users with any role, and change roles, reset passwords,
 *   deactivate, reactivate and delete anyone except themselves.
 * - Admins add members only.
 * - Members manage nothing.
 * Nobody acts on their own account here; your own password lives at /admin/password.
 */

export const ROLES: readonly AppRole[] = ["member", "admin", "super_admin"];

type Actor = { id: string; role: AppRole; active: boolean };

export function rolesActorCanAssign(actor: Actor): AppRole[] {
  if (!actor.active) return [];
  if (actor.role === "super_admin") return [...ROLES];
  if (actor.role === "admin") return ["member"];
  return [];
}

export const canAddUsers = (actor: Actor) => rolesActorCanAssign(actor).length > 0;

export const canManageUser = (actor: Actor, targetId: string) =>
  actor.active && actor.role === "super_admin" && actor.id !== targetId;
