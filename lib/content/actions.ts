"use server";

import { updateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT } from "./defaults";
import { SECTION_SCHEMAS, isSectionKey, type SectionKey } from "./schema";
import { SITE_CONTENT_TAG } from "./store";

export type SaveSectionResult = { ok: true; data: unknown; message: string } | { ok: false; error: string; issues?: { path: string; message: string }[] };

const NOT_ALLOWED = "Only a super admin can edit the website.";

/** The caller, if they are an active super admin who has replaced any temporary password. */
async function superAdmin() {
  const user = await getCurrentUser();
  return user?.active && !user.mustChangePassword && user.role === "super_admin" ? user : null;
}

async function record(actor: { id: string; email: string }, action: string, section: SectionKey) {
  // The change itself already happened; don't report it as failed.
  try {
    const { error } = await createSupabaseAdminClient().from("audit_log").insert({ actor_id: actor.id, actor_email: actor.email, action, target_email: section, details: { section } });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error(`audit_log insert failed for ${action}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Saves one section of the website. Writes through the super admin's own session, so
 * Row Level Security has the final say on who may change the public site.
 */
export async function saveSiteSection(section: unknown, input: unknown): Promise<SaveSectionResult> {
  const actor = await superAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  if (!isSectionKey(section)) return { ok: false, error: "That part of the website doesn't exist." };

  const parsed = SECTION_SCHEMAS[section].safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted problems and save again.",
      issues: parsed.error.issues.slice(0, 20).map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_content").upsert({ key: section, data: parsed.data, updated_by: actor.id });
  if (error) {
    console.error(`site_content save failed: ${error.code ?? ""} ${error.message}`);
    return { ok: false, error: error.code === "42501" ? NOT_ALLOWED : "The change couldn't be saved. Please try again." };
  }

  await record(actor, "site.content_updated", section);
  updateTag(SITE_CONTENT_TAG);
  return { ok: true, data: parsed.data, message: "Saved. The website has been updated." };
}

/** Returns one section to its built-in default. */
export async function resetSiteSection(section: unknown): Promise<SaveSectionResult> {
  const actor = await superAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  if (!isSectionKey(section)) return { ok: false, error: "That part of the website doesn't exist." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_content").delete().eq("key", section);
  if (error) {
    console.error(`site_content reset failed: ${error.code ?? ""} ${error.message}`);
    return { ok: false, error: error.code === "42501" ? NOT_ALLOWED : "The section couldn't be reset. Please try again." };
  }

  await record(actor, "site.content_reset", section);
  updateTag(SITE_CONTENT_TAG);
  return { ok: true, data: DEFAULT_CONTENT[section], message: "Reset to the default. The website has been updated." };
}
