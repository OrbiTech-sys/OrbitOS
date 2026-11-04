import { z } from "zod";

import { ICON_NAMES } from "./icons";

/**
 * What the public website's content may look like. The super admin's editor saves
 * one section at a time; the server validates it here before it reaches the database,
 * and the site validates it again when reading, falling back to the built-in default
 * for a section that no longer fits. So a bad save can never take the site down.
 */

const COMPANY_MAX = 120;

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);
const required = (label: string, max = 200) => z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

const slug = z
  .string()
  .trim()
  .min(1, "A URL slug is required")
  .max(60, "A URL slug must be 60 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes");

/** Paths on this site, or full web and mail links. Blocks javascript: and other schemes that could run code. */
export function isSafeHref(value: string) {
  return /^\/(?!\/)/.test(value) || /^#/.test(value) || /^https?:\/\/[^\s]+$/i.test(value) || /^(mailto|tel):[^\s]+$/i.test(value);
}

const href = z.string().trim().max(300, "That link is too long").refine(isSafeHref, "Use a path like /pricing, or a full https:// or mailto: link");
const requiredHref = z.string().trim().min(1, "A link is required").max(300, "That link is too long").refine(isSafeHref, "Use a path like /pricing, or a full https:// or mailto: link");
const icon = z.enum(ICON_NAMES, "Choose an icon");
/** A list typed one item per line. Blank lines are dropped rather than refused. */
const lines = (max: number, each = 300) =>
  z
    .array(z.string().trim().max(each, `Keep each line under ${each} characters`))
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(z.string()).max(max, `Keep it to ${max} items or fewer`));

/** Refuses two items with the same value of a key, naming the duplicate. */
function uniqueBy<T>(key: keyof T & string, label: string) {
  return (items: T[], ctx: z.RefinementCtx) => {
    const seen = new Set<unknown>();
    items.forEach((item, i) => {
      if (seen.has(item[key])) ctx.addIssue({ code: "custom", message: `${label} "${String(item[key])}" is used twice`, path: [i, key] });
      seen.add(item[key]);
    });
  };
}

const heading = z.object({ eyebrow: text(60), title: required("Title", 200), description: text(600) });
const textBlock = z.object({ title: required("Title", 200), body: text(800) });

/* ---------------------------------------------------------------- Brand -- */

export const brandSchema = z.object({
  productName: required("Product name", 40),
  company: required("Company name", COMPANY_MAX),
  tagline: text(160),
  description: text(400),
  footerBlurb: text(400),
  copyright: text(200),
  footerNote: text(400),
  contactEmail: z.string().trim().max(254).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
});

/* ----------------------------------------------------------- Navigation -- */

export const NAV_KINDS = ["modules", "solutions", "link"] as const;

const navItem = z
  .object({
    id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/, "Invalid menu id"),
    kind: z.enum(NAV_KINDS),
    label: required("Menu label", 40),
    href: href.or(z.literal("")),
    visible: z.boolean(),
  })
  .superRefine((item, ctx) => {
    if (item.kind === "link" && !item.href) ctx.addIssue({ code: "custom", message: "A link needs somewhere to go", path: ["href"] });
  });

export const navSchema = z.object({
  items: z.array(navItem).min(1, "Keep at least one menu item").max(12, "Keep it to 12 menu items or fewer").superRefine(uniqueBy("id", "Menu id")),
  productMenuNote: text(160),
  demo: z.object({ label: required("Demo link label", 40), href: requiredHref, visible: z.boolean() }),
  signIn: z.object({ label: required("Sign-in label", 40), visible: z.boolean() }),
  cta: z.object({ label: required("Button label", 40), href: requiredHref, visible: z.boolean() }),
});

/* -------------------------------------------------- Modules and solutions -- */

export const AVAILABILITIES = ["Available", "Preview", "Planned"] as const;

const moduleItem = z.object({
  slug,
  name: required("Module name", 60),
  tagline: required("Tagline", 160),
  icon,
  problem: text(600),
  functionality: lines(12),
  benefit: text(600),
  availability: z.enum(AVAILABILITIES),
  demoHref: href.or(z.literal("")),
  note: text(600),
  visible: z.boolean(),
});

export const modulesSchema = z.array(moduleItem).max(30, "Keep it to 30 modules or fewer").superRefine(uniqueBy("slug", "URL slug"));

const solutionItem = z.object({
  slug,
  name: required("Solution name", 60),
  icon,
  tagline: required("Tagline", 160),
  headline: required("Headline", 200),
  description: text(800),
  outcomes: lines(12),
  modules: z.array(z.string()).max(20),
  demoHref: requiredHref,
  visible: z.boolean(),
});

export const solutionsSchema = z.array(solutionItem).max(30, "Keep it to 30 solutions or fewer").superRefine(uniqueBy("slug", "URL slug"));

const industryItem = z.object({
  slug,
  name: required("Industry name", 60),
  icon,
  summary: text(600),
  useCases: z.array(z.object({ title: required("Use case title", 120), detail: text(400) })).max(12),
  modules: z.array(z.string()).max(20),
  workflow: lines(10, 120),
  note: text(600),
  visible: z.boolean(),
});

export const industriesSchema = z.array(industryItem).max(30, "Keep it to 30 industries or fewer").superRefine(uniqueBy("slug", "URL slug"));

/* -------------------------------------------------------------- Pricing -- */

const pricingTier = z.object({
  id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/, "Invalid tier id"),
  name: required("Plan name", 60),
  audience: text(200),
  price: required("Price", 40),
  priceNote: text(100),
  cta: required("Button label", 40),
  ctaHref: requiredHref,
  featured: z.boolean(),
  visible: z.boolean(),
  features: lines(20),
});

export const pricingSchema = z.object({
  eyebrow: text(60),
  title: required("Title", 200),
  description: text(600),
  homeTitle: required("Homepage title", 200),
  homeDescription: text(600),
  notice: text(400),
  featuredBadge: text(60),
  tiers: z.array(pricingTier).max(8, "Keep it to 8 plans or fewer").superRefine(uniqueBy("id", "Plan id")),
  comparisonTitle: text(200),
  comparison: z.array(z.object({ feature: required("Feature", 120), included: z.array(z.string()).max(8) })).max(40, "Keep it to 40 rows or fewer"),
  closing: z.object({
    title: text(200),
    body: text(400),
    primaryLabel: text(40),
    primaryHref: href.or(z.literal("")),
    secondaryLabel: text(40),
    secondaryHref: href.or(z.literal("")),
  }),
});

/* ------------------------------------------------------------- Homepage -- */

export const TRUST_STATUSES = ["Available", "In progress", "Planned", "Not available"] as const;

export const homeSchema = z.object({
  hero: z.object({
    badge: text(40),
    badgeText: text(100),
    titleLine1: required("Headline", 100),
    titleLine2: text(100),
    description: text(600),
    primaryLabel: required("Button label", 40),
    primaryHref: requiredHref,
    secondaryLabel: text(40),
    secondaryHref: href.or(z.literal("")),
    note: text(200),
    benefits: lines(4, 80),
  }),
  problems: heading.extend({
    items: z.array(z.object({ icon, title: required("Problem title", 120), consequence: text(400), solution: text(400) })).max(12),
    solutionLabel: text(40),
  }),
  modules: heading,
  industries: heading,
  trust: heading.extend({
    items: z.array(z.object({ icon, title: required("Title", 120), status: z.enum(TRUST_STATUSES), body: text(500) })).max(18),
  }),
  faq: z.object({
    eyebrow: text(60),
    title: required("Title", 200),
    items: z.array(z.object({ q: required("Question", 200), a: required("Answer", 1200) })).max(30),
  }),
  finalCta: z.object({
    title: required("Title", 200),
    body: text(400),
    primaryLabel: required("Button label", 40),
    primaryHref: requiredHref,
    secondaryLabel: text(40),
    secondaryHref: href.or(z.literal("")),
    tertiaryLabel: text(40),
    tertiaryHref: href.or(z.literal("")),
  }),
});

/* ------------------------------------------------------------ Resources -- */

export const RESOURCE_STATUSES = ["Available", "In progress"] as const;

export const resourcesSchema = heading.extend({
  items: z
    .array(z.object({ icon, title: required("Title", 120), body: text(400), href: requiredHref, status: z.enum(RESOURCE_STATUSES), visible: z.boolean() }))
    .max(18),
  guide: z.object({
    title: required("Title", 120),
    body: text(600),
    steps: z.array(textBlock).max(12),
    linkLabel: text(40),
    linkHref: href.or(z.literal("")),
    visible: z.boolean(),
  }),
  roadmap: z.object({ title: required("Title", 120), body: text(600), items: lines(12), visible: z.boolean() }),
});

/* ----------------------------------------------------- Contact and access -- */

export const contactPagesSchema = z.object({
  contact: heading.extend({
    notes: z.array(z.object({ icon, title: required("Title", 120), body: text(400) })).max(6),
    successTitle: required("Confirmation title", 120),
    successBody: text(400),
  }),
  waitlist: heading.extend({
    pointsTitle: text(120),
    points: lines(10),
    successTitle: required("Confirmation title", 120),
    successBody: text(400),
  }),
});

/* ---------------------------------------------------------------- Legal -- */

const legalPage = z.object({
  title: required("Title", 80),
  intro: text(600),
  updated: text(60),
  sections: z.array(z.object({ heading: required("Heading", 120), body: required("Text", 4000) })).max(30),
});

export const legalSchema = z.object({ privacy: legalPage, terms: legalPage });

/* -------------------------------------------------------------- Sections -- */

export const SECTION_SCHEMAS = {
  brand: brandSchema,
  nav: navSchema,
  modules: modulesSchema,
  solutions: solutionsSchema,
  industries: industriesSchema,
  pricing: pricingSchema,
  home: homeSchema,
  resources: resourcesSchema,
  contact: contactPagesSchema,
  legal: legalSchema,
} as const;

export type SectionKey = keyof typeof SECTION_SCHEMAS;
export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS) as SectionKey[];

export type SiteContent = { [K in SectionKey]: z.output<(typeof SECTION_SCHEMAS)[K]> };

export type Brand = SiteContent["brand"];
export type NavContent = SiteContent["nav"];
export type NavItem = NavContent["items"][number];
export type ModuleContent = SiteContent["modules"][number];
export type SolutionContent = SiteContent["solutions"][number];
export type IndustryContent = SiteContent["industries"][number];
export type PricingContent = SiteContent["pricing"];
export type PricingTier = PricingContent["tiers"][number];
export type HomeContent = SiteContent["home"];
export type ResourcesContent = SiteContent["resources"];
export type ContactPages = SiteContent["contact"];
export type LegalContent = SiteContent["legal"];
export type LegalPageContent = LegalContent["privacy"];

export const isSectionKey = (value: unknown): value is SectionKey => typeof value === "string" && value in SECTION_SCHEMAS;
