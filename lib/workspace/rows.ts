import type { SupabaseClient } from "@supabase/supabase-js";

import type { StoredRecord } from "./records";

const PAGE = 1000; // the API returns at most this many rows per request

/** Reads every record of one member's workspace, a page at a time. Row Level Security limits it to what the caller may see. */
export async function fetchAllRecords(supabase: SupabaseClient, ownerId: string): Promise<StoredRecord[]> {
  const rows: StoredRecord[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("workspace_records")
      .select("kind, id, data")
      .eq("owner_id", ownerId)
      .order("kind")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Could not load the workspace: ${error.message}`);
    rows.push(...(data as StoredRecord[]));
    if (data.length < PAGE) return rows;
  }
}
