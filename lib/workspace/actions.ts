"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistChanges } from "./persist";
import type { SaveResult } from "./types";

/**
 * Saves a batch of the member's workspace changes. This is a public endpoint,
 * so it re-checks who is calling, validates every record, and writes through the
 * member's own session: the database decides what they may store.
 */
export async function saveWorkspaceChanges(input: unknown): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "auth", error: "Your session has ended. Sign in again to keep working." };
  if (!user.active) return { ok: false, code: "inactive", error: "Your account has been deactivated." };
  if (user.mustChangePassword) return { ok: false, code: "auth", error: "Choose a new password before continuing." };

  const supabase = await createSupabaseServerClient();
  return persistChanges(supabase, user.id, input);
}
