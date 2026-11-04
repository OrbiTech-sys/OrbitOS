import { DEFAULT_CONTENT } from "./defaults";
import { SECTION_SCHEMAS, isSectionKey, type SiteContent } from "./schema";

/**
 * Builds the site's content from stored rows. A section with no row, or a row that no
 * longer fits its schema, falls back to the built-in default, so the site always renders.
 */
export function contentFromRows(rows: { key: string; data: unknown }[], onInvalid?: (key: string) => void): SiteContent {
  const content: Record<string, unknown> = { ...DEFAULT_CONTENT };
  for (const row of rows) {
    if (!isSectionKey(row.key)) continue;
    const parsed = SECTION_SCHEMAS[row.key].safeParse(row.data);
    if (parsed.success) content[row.key] = parsed.data;
    else onInvalid?.(row.key);
  }
  return content as SiteContent;
}
