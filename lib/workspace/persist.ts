import type { SupabaseClient } from "@supabase/supabase-js";

import { SELF_ID } from "./records";
import { changesSchema, schemaFor } from "./schemas";
import type { Rejected, SaveResult } from "./types";

/**
 * Validates a batch of changes from the browser and applies it to the
 * database as the signed-in member. Takes the member's own Supabase client, so
 * Row Level Security and the storage quota are enforced by the database no
 * matter what is sent.
 */
export async function persistChanges(supabase: SupabaseClient, userId: string, input: unknown): Promise<SaveResult> {
  const parsed = changesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "failed", error: "The changes were not in the expected format." };

  const rejected: Rejected[] = [];
  const upserts = new Map<string, { kind: string; id: string; data: unknown }>();
  for (const u of parsed.data.upserts) {
    const reject = (reason: string) => rejected.push({ kind: u.kind, id: u.id, reason });
    const schema = schemaFor(u.kind, u.id);
    if (!schema) {
      reject("Unknown record");
      continue;
    }
    if (u.kind === "team" && u.id === SELF_ID) {
      reject("Reserved record");
      continue;
    }
    const result = schema.safeParse(u.data);
    if (!result.success) {
      reject(result.error.issues[0]?.message ?? "Invalid record");
      continue;
    }
    if (u.kind !== "meta" && (result.data as { id: string }).id !== u.id) {
      reject("Record id does not match");
      continue;
    }
    upserts.set(`${u.kind}:${u.id}`, { kind: u.kind, id: u.id, data: result.data });
  }

  // The last instruction for a record wins.
  const deletes = new Map<string, { kind: string; id: string }>();
  for (const d of parsed.data.deletes) {
    if (d.kind === "meta" || (d.kind === "team" && d.id === SELF_ID)) continue;
    const key = `${d.kind}:${d.id}`;
    if (!upserts.has(key)) deletes.set(key, { kind: d.kind, id: d.id });
  }

  if (upserts.size > 0 || deletes.size > 0) {
    const { error } = await supabase.rpc("workspace_apply", { p_upserts: [...upserts.values()], p_deletes: [...deletes.values()] });
    if (error) {
      if (error.message.includes("storage limit")) {
        return { ok: false, code: "quota", error: "Your storage limit has been reached. Delete some records, or ask your administrator to raise the limit." };
      }
      if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
        return { ok: false, code: "inactive", error: "Your account can no longer save changes." };
      }
      console.error(`workspace_apply failed: ${error.code ?? ""} ${error.message}`);
      return { ok: false, code: "failed", error: "Your changes couldn't be saved. We'll keep trying." };
    }
  }

  const [usage, profile] = await Promise.all([
    supabase.from("workspace_usage").select("records, bytes").eq("owner_id", userId).maybeSingle(),
    supabase.from("profiles").select("storage_quota_bytes").eq("id", userId).maybeSingle(),
  ]);
  return {
    ok: true,
    rejected,
    usage: {
      records: usage.data?.records ?? 0,
      bytes: Number(usage.data?.bytes ?? 0),
      quotaBytes: Number(profile.data?.storage_quota_bytes ?? 0),
    },
  };
}
