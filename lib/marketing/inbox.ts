import "server-only";

import { canReadInbox } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Website enquiries, newest first. Read through the admin's own session, so RLS decides what comes back. */
export async function listSubmissions() {
  const user = await requireUser();
  if (!canReadInbox(user)) return { submissions: [], error: "Not allowed" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_submissions")
    .select("id, kind, name, email, company, topic, message, team_size, status, handled_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return { submissions: data ?? [], error: error?.message ?? null };
}

export type Submission = Awaited<ReturnType<typeof listSubmissions>>["submissions"][number];
