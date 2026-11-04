import type { SiteContent } from "./schema";

/**
 * What the public actually sees: anything switched off is gone, and references to a
 * module that no longer exists (or is hidden) are dropped so no page can break on them.
 */
export function publishedContent(content: SiteContent): SiteContent {
  const modules = content.modules.filter((m) => m.visible);
  const slugs = new Set(modules.map((m) => m.slug));
  const known = (list: string[]) => list.filter((slug) => slugs.has(slug));

  const tiers = content.pricing.tiers.filter((t) => t.visible);
  const tierIds = new Set(tiers.map((t) => t.id));

  return {
    ...content,
    nav: { ...content.nav, items: content.nav.items.filter((i) => i.visible) },
    modules,
    solutions: content.solutions.filter((s) => s.visible).map((s) => ({ ...s, modules: known(s.modules) })),
    industries: content.industries.filter((i) => i.visible).map((i) => ({ ...i, modules: known(i.modules) })),
    pricing: {
      ...content.pricing,
      tiers,
      comparison: content.pricing.comparison.map((row) => ({ ...row, included: row.included.filter((id) => tierIds.has(id)) })),
    },
    resources: { ...content.resources, items: content.resources.items.filter((r) => r.visible) },
  };
}

/** Finds one item by its URL slug. */
export const bySlug = <T extends { slug: string }>(items: T[], slug: string) => items.find((item) => item.slug === slug);
