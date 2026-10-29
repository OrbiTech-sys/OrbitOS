import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS, isAdminRole } from "@/lib/auth/session";
import type { DemoData, DemoSettings } from "@/lib/demo/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceProfile } from "./context";
import { SELF_ID, rowsToWorkspace, selfMember } from "./records";
import { fetchAllRecords } from "./rows";
import type { UsageNumbers } from "./types";

/** Everything the workspace shell needs to start, in a form that can be sent to the browser. */
export interface WorkspaceBootstrap {
  data: DemoData;
  settings: DemoSettings;
  readNotifications: string[];
  usage: UsageNumbers;
  /** The server's date, so the first render matches the page; the browser's own date takes over. */
  today: string;
  selfId: string;
  profile: WorkspaceProfile;
}

/** Loads the signed-in member's whole workspace. Row Level Security limits every query to their own rows. */
export async function loadWorkspace(user: CurrentUser): Promise<WorkspaceBootstrap> {
  const supabase = await createSupabaseServerClient();
  const rows = await fetchAllRecords(supabase, user.id);
  const { data: usage } = await supabase.from("workspace_usage").select("records, bytes").eq("owner_id", user.id).maybeSingle();

  const loaded = rowsToWorkspace(rows, selfMember(user));
  if (loaded.skipped > 0) console.warn(`Skipped ${loaded.skipped} unreadable workspace record(s) for ${user.id}`);

  return {
    data: loaded.data,
    settings: loaded.settings,
    readNotifications: loaded.readNotifications,
    usage: { records: usage?.records ?? 0, bytes: Number(usage?.bytes ?? 0), quotaBytes: user.storageQuotaBytes },
    today: new Date().toISOString().slice(0, 10),
    selfId: SELF_ID,
    profile: {
      name: loaded.data.team[0].name,
      email: user.email,
      roleLabel: ROLE_LABELS[user.role],
      isAdmin: isAdminRole(user.role),
    },
  };
}
