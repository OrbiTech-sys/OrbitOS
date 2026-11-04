import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";
import { DEFAULT_CONTENT } from "./defaults";
import { contentFromRows } from "./merge";
import { publishedContent } from "./published";
import type { SiteContent } from "./schema";

export const SITE_CONTENT_TAG = "site-content";

/**
 * Reads the stored sections with the publishable key, as an anonymous visitor would:
 * no cookies involved, so this can be cached and prerendered. Returns null when the
 * database can't be reached.
 */
async function readRows(): Promise<{ key: string; data: unknown }[] | null> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { url, publishableKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/site_content?select=key,data`, { headers: { apikey: publishableKey } });
    if (!response.ok) {
      console.error(`Could not read site content: HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as { key: string; data: unknown }[];
  } catch (error) {
    console.error(`Could not read site content: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const warnInvalid = (key: string) => console.error(`Site content section "${key}" is not valid; using the default.`);

/**
 * The published website content, for marketing pages. Cached until the super admin
 * saves a change (lib/content/actions.ts expires the tag), and re-checked hourly so
 * every server catches up even without a shared cache. If the database is unreachable
 * the site still renders from the defaults, and that result is kept only briefly.
 */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SITE_CONTENT_TAG);
  const rows = await readRows();
  if (!rows) {
    cacheLife({ stale: 60, revalidate: 60, expire: 600 });
    return publishedContent(DEFAULT_CONTENT);
  }
  cacheLife("hours");
  return publishedContent(contentFromRows(rows, warnInvalid));
}

/** Everything, including what is switched off, always fresh: for the super admin's editor. */
export async function getEditableContent(): Promise<{ content: SiteContent; edited: string[]; error: boolean }> {
  const rows = await readRows();
  if (!rows) return { content: DEFAULT_CONTENT, edited: [], error: true };
  return { content: contentFromRows(rows, warnInvalid), edited: rows.map((r) => r.key), error: false };
}
