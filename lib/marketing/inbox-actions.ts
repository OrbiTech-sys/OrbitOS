"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { canReadInbox } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InboxResult = { ok: true } | { ok: false; error: string };

/** The caller if they may use the inbox. RLS applies the same rule again in the database. */
async function inboxUser() {
  const user = await getCurrentUser();
  return user && canReadInbox(user) ? user : null;
}

export async function setSubmissionHandled(id: unknown, handled: boolean): Promise<InboxResult> {
  const user = await inboxUser();
  const parsed = z.uuid().safeParse(id);
  if (!user || !parsed.success) return { ok: false, error: "You don't have permission to do that." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_submissions")
    .update({ status: handled ? "handled" : "new", handled_at: handled ? new Date().toISOString() : null, handled_by: handled ? user.id : null })
    .eq("id", parsed.data);
  if (error) return { ok: false, error: "That couldn't be updated. Please try again." };

  refresh();
  return { ok: true };
}

export async function deleteSubmission(id: unknown): Promise<InboxResult> {
  const user = await inboxUser();
  const parsed = z.uuid().safeParse(id);
  if (!user || !parsed.success) return { ok: false, error: "You don't have permission to do that." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_submissions").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: "That couldn't be deleted. Please try again." };

  refresh();
  return { ok: true };
}
