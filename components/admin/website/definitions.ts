import { AVAILABILITIES, NAV_KINDS, RESOURCE_STATUSES, TRUST_STATUSES, type SectionKey } from "@/lib/content/schema";

/**
 * Describes the editing form for each section of the website. The form itself is
 * generic (fields.tsx), so changing what is editable means changing this list and the
 * matching schema in lib/content/schema.ts.
 */

type Base = { key: string; label: string; hint?: string; showIf?: (item: Record<string, unknown>) => boolean };

export type FieldDef =
  | (Base & { type: "text" | "href"; placeholder?: string; half?: boolean })
  | (Base & { type: "textarea"; rows?: number })
  | (Base & { type: "lines"; rows?: number })
  | (Base & { type: "switch" })
  | (Base & { type: "select"; options: readonly { value: string; label: string }[]; half?: boolean })
  | (Base & { type: "icon"; half?: boolean })
  | (Base & { type: "moduleRefs" })
  | (Base & { type: "tierRefs" })
  | ListDef
  | (Base & { type: "group"; fields: FieldDef[] });

export type ListDef = Base & {
  type: "list";
  /** What one item is called, for "Add a …" and the delete label. */
  itemLabel: string;
  titleKey: string;
  subtitleKey?: string;
  /** New items get this URL slug worked out from their title until someone types their own. */
  slugKey?: string;
  fields: FieldDef[];
  newItem: () => Record<string, unknown>;
};

export interface SectionDef {
  key: SectionKey;
  label: string;
  description: string;
  /** Where to see the result. */
  preview: string;
  /** Sections stored as a plain list edit that list; the others edit an object. */
  list?: ListDef;
  fields?: FieldDef[];
}

const shortId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
const choices = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const heading = (description = true): FieldDef[] => [
  { key: "eyebrow", label: "Small label above the title", type: "text", half: true },
  { key: "title", label: "Title", type: "text" },
  ...(description ? ([{ key: "description", label: "Description", type: "textarea", rows: 2 }] as FieldDef[]) : []),
];

const visible: FieldDef = { key: "visible", label: "Show on the website", type: "switch", hint: "When off, it disappears from every menu and its page returns “not found”." };

export const SECTIONS: SectionDef[] = [
  {
    key: "nav",
    label: "Navigation",
    description: "The menu bar at the top of every public page: what it contains, the order, the wording and where the buttons go.",
    preview: "/",
    fields: [
      {
        key: "items",
        label: "Menu items",
        type: "list",
        hint: "The order here is the order on the site. Product and Solutions open drop-down menus built from the sections below.",
        itemLabel: "menu item",
        titleKey: "label",
        newItem: () => ({ id: shortId("link"), kind: "link", label: "New link", href: "/", visible: true }),
        fields: [
          { key: "label", label: "Label", type: "text", half: true },
          {
            key: "kind",
            label: "What it does",
            type: "select",
            half: true,
            options: NAV_KINDS.map((value) => ({ value, label: value === "modules" ? "Opens the Product menu" : value === "solutions" ? "Opens the Solutions menu" : "Goes to a page" })),
          },
          { key: "href", label: "Goes to", type: "href", placeholder: "/pricing", hint: "A page on this site such as /pricing, or a full https:// link.", showIf: (item) => item.kind === "link" },
          { key: "visible", label: "Show in the menu", type: "switch" },
        ],
      },
      { key: "productMenuNote", label: "Note at the bottom of the Product menu", type: "text" },
      {
        key: "cta",
        label: "Main button",
        type: "group",
        fields: [
          { key: "label", label: "Label", type: "text", half: true },
          { key: "href", label: "Goes to", type: "href", half: true },
          { key: "visible", label: "Show this button", type: "switch" },
        ],
      },
      {
        key: "signIn",
        label: "Sign-in link",
        type: "group",
        fields: [
          { key: "label", label: "Label", type: "text", half: true },
          { key: "visible", label: "Show this link", type: "switch", hint: "People can still sign in at /sign-in." },
        ],
      },
      {
        key: "demo",
        label: "Live demo link",
        type: "group",
        fields: [
          { key: "label", label: "Label", type: "text", half: true },
          { key: "href", label: "Goes to", type: "href", half: true },
          { key: "visible", label: "Show this link", type: "switch" },
        ],
      },
    ],
  },
  {
    key: "modules",
    label: "Product",
    description: "The modules in the Product menu. Each has its own page, and appears on the homepage and in the footer.",
    preview: "/#modules",
    list: {
      key: "",
      label: "Modules",
      type: "list",
      itemLabel: "module",
      titleKey: "name",
      subtitleKey: "availability",
      slugKey: "slug",
      newItem: () => ({ slug: "", name: "New module", tagline: "One line that says what it does", icon: "sparkles", problem: "", functionality: [], benefit: "", availability: "Planned", demoHref: "", note: "", visible: true }),
      fields: [
        { key: "name", label: "Name", type: "text", half: true },
        { key: "slug", label: "Page address", type: "text", half: true, hint: "Lowercase, for /product/this-part" },
        { key: "tagline", label: "One-line summary", type: "text", hint: "Shown in the menu." },
        { key: "icon", label: "Icon", type: "icon", half: true },
        { key: "availability", label: "Status", type: "select", half: true, options: choices(AVAILABILITIES) },
        { key: "problem", label: "The problem", type: "textarea", rows: 2 },
        { key: "functionality", label: "What it does", type: "lines", hint: "One per line." },
        { key: "benefit", label: "The benefit", type: "textarea", rows: 2 },
        { key: "note", label: "Good to know", type: "textarea", rows: 2, hint: "Shown on the module's page. Leave empty to hide it." },
        { key: "demoHref", label: "Link to try it", type: "href", placeholder: "/demo/crm", hint: "Leave empty for no demo button." },
        visible,
      ],
    },
  },
  {
    key: "solutions",
    label: "Solutions",
    description: "The outcomes in the Solutions menu. Each has its own page.",
    preview: "/solutions/grow-sales",
    list: {
      key: "",
      label: "Solutions",
      type: "list",
      itemLabel: "solution",
      titleKey: "name",
      slugKey: "slug",
      newItem: () => ({ slug: "", name: "New solution", icon: "sparkles", tagline: "One line that says what it does", headline: "A headline for the page", description: "", outcomes: [], modules: [], demoHref: "/demo", visible: true }),
      fields: [
        { key: "name", label: "Name", type: "text", half: true },
        { key: "slug", label: "Page address", type: "text", half: true, hint: "Lowercase, for /solutions/this-part" },
        { key: "tagline", label: "One-line summary", type: "text", hint: "Shown in the menu." },
        { key: "icon", label: "Icon", type: "icon", half: true },
        { key: "demoHref", label: "Link to try it", type: "href", half: true },
        { key: "headline", label: "Page headline", type: "text" },
        { key: "description", label: "Description", type: "textarea", rows: 3 },
        { key: "outcomes", label: "What changes", type: "lines", hint: "One per line." },
        { key: "modules", label: "Modules involved", type: "moduleRefs" },
        visible,
      ],
    },
  },
  {
    key: "industries",
    label: "Industries",
    description: "The industry pages, listed under Industries and in the footer.",
    preview: "/industries",
    list: {
      key: "",
      label: "Industries",
      type: "list",
      itemLabel: "industry",
      titleKey: "name",
      slugKey: "slug",
      newItem: () => ({ slug: "", name: "New industry", icon: "building", summary: "", useCases: [], modules: [], workflow: [], note: "", visible: true }),
      fields: [
        { key: "name", label: "Name", type: "text", half: true },
        { key: "slug", label: "Page address", type: "text", half: true, hint: "Lowercase, for /industries/this-part" },
        { key: "icon", label: "Icon", type: "icon", half: true },
        { key: "summary", label: "Summary", type: "textarea", rows: 2 },
        {
          key: "useCases",
          label: "Typical use cases",
          type: "list",
          itemLabel: "use case",
          titleKey: "title",
          newItem: () => ({ title: "New use case", detail: "" }),
          fields: [
            { key: "title", label: "Title", type: "text" },
            { key: "detail", label: "Detail", type: "textarea", rows: 2 },
          ],
        },
        { key: "modules", label: "Recommended modules", type: "moduleRefs" },
        { key: "workflow", label: "A typical flow", type: "lines", hint: "One step per line." },
        { key: "note", label: "Good to know", type: "textarea", rows: 2, hint: "Leave empty to hide it." },
        visible,
      ],
    },
  },
  {
    key: "pricing",
    label: "Pricing",
    description: "The plans, their prices and what each includes. Used on the Pricing page and the homepage.",
    preview: "/pricing",
    fields: [
      {
        key: "tiers",
        label: "Plans",
        type: "list",
        hint: "Prices are text, so “$49”, “PKR 5,000” and “Custom” all work.",
        itemLabel: "plan",
        titleKey: "name",
        subtitleKey: "price",
        newItem: () => ({ id: shortId("plan"), name: "New plan", audience: "", price: "$0", priceNote: "per user / month", cta: "Request access", ctaHref: "/waitlist", featured: false, visible: true, features: [] }),
        fields: [
          { key: "name", label: "Plan name", type: "text", half: true },
          { key: "audience", label: "Who it's for", type: "text", half: true },
          { key: "price", label: "Price", type: "text", half: true, placeholder: "$49" },
          { key: "priceNote", label: "Price note", type: "text", half: true, placeholder: "per user / month" },
          { key: "cta", label: "Button label", type: "text", half: true },
          { key: "ctaHref", label: "Button goes to", type: "href", half: true },
          { key: "features", label: "What's included", type: "lines", hint: "One per line." },
          { key: "featured", label: "Highlight this plan", type: "switch" },
          { key: "visible", label: "Show this plan", type: "switch" },
        ],
      },
      {
        key: "comparison",
        label: "Comparison table",
        type: "list",
        hint: "The table on the Pricing page: one row per feature, ticked for each plan that includes it.",
        itemLabel: "row",
        titleKey: "feature",
        newItem: () => ({ feature: "New feature", included: [] }),
        fields: [
          { key: "feature", label: "Feature", type: "text" },
          { key: "included", label: "Included in", type: "tierRefs" },
        ],
      },
      ...heading(),
      { key: "homeTitle", label: "Title on the homepage", type: "text" },
      { key: "homeDescription", label: "Description on the homepage", type: "textarea", rows: 2 },
      { key: "notice", label: "Notice above the plans", type: "textarea", rows: 2, hint: "Leave empty to hide it." },
      { key: "featuredBadge", label: "Badge on the highlighted plan", type: "text" },
      { key: "comparisonTitle", label: "Title above the comparison table", type: "text" },
      {
        key: "closing",
        label: "Banner at the bottom of the page",
        type: "group",
        fields: [
          { key: "title", label: "Title", type: "text", hint: "Leave empty to hide the banner." },
          { key: "body", label: "Text", type: "text" },
          { key: "primaryLabel", label: "First button", type: "text", half: true },
          { key: "primaryHref", label: "First button goes to", type: "href", half: true },
          { key: "secondaryLabel", label: "Second button", type: "text", half: true },
          { key: "secondaryHref", label: "Second button goes to", type: "href", half: true },
        ],
      },
    ],
  },
  {
    key: "home",
    label: "Homepage",
    description: "The headline, the section introductions, the problems, the straight answers and the FAQ.",
    preview: "/",
    fields: [
      {
        key: "hero",
        label: "Top of the page",
        type: "group",
        fields: [
          { key: "badge", label: "Small badge", type: "text", half: true },
          { key: "badgeText", label: "Text beside the badge", type: "text", half: true },
          { key: "titleLine1", label: "Headline, first line", type: "text" },
          { key: "titleLine2", label: "Headline, second line", type: "text" },
          { key: "description", label: "Description", type: "textarea", rows: 2 },
          { key: "primaryLabel", label: "Main button", type: "text", half: true },
          { key: "primaryHref", label: "Main button goes to", type: "href", half: true },
          { key: "secondaryLabel", label: "Second button", type: "text", half: true },
          { key: "secondaryHref", label: "Second button goes to", type: "href", half: true },
          { key: "note", label: "Small print under the buttons", type: "text" },
          { key: "benefits", label: "Benefits", type: "lines", hint: "Up to four, one per line." },
        ],
      },
      {
        key: "problems",
        label: "The problems section",
        type: "group",
        fields: [
          ...heading(),
          { key: "solutionLabel", label: "Label above each answer", type: "text", half: true },
          {
            key: "items",
            label: "Problems",
            type: "list",
            itemLabel: "problem",
            titleKey: "title",
            newItem: () => ({ icon: "alert", title: "New problem", consequence: "", solution: "" }),
            fields: [
              { key: "title", label: "Title", type: "text" },
              { key: "icon", label: "Icon", type: "icon", half: true },
              { key: "consequence", label: "What it costs you", type: "textarea", rows: 2 },
              { key: "solution", label: "The answer", type: "textarea", rows: 2 },
            ],
          },
        ],
      },
      { key: "modules", label: "The modules section", type: "group", fields: heading() },
      { key: "industries", label: "The industries section", type: "group", fields: heading() },
      {
        key: "trust",
        label: "The straight answers section",
        type: "group",
        fields: [
          ...heading(),
          {
            key: "items",
            label: "Answers",
            type: "list",
            itemLabel: "answer",
            titleKey: "title",
            subtitleKey: "status",
            newItem: () => ({ icon: "shield", title: "New answer", status: "Planned", body: "" }),
            fields: [
              { key: "title", label: "Title", type: "text" },
              { key: "icon", label: "Icon", type: "icon", half: true },
              { key: "status", label: "Status", type: "select", half: true, options: choices(TRUST_STATUSES) },
              { key: "body", label: "Text", type: "textarea", rows: 2 },
            ],
          },
        ],
      },
      {
        key: "faq",
        label: "Frequently asked questions",
        type: "group",
        fields: [
          { key: "eyebrow", label: "Small label above the title", type: "text", half: true },
          { key: "title", label: "Title", type: "text" },
          {
            key: "items",
            label: "Questions",
            type: "list",
            itemLabel: "question",
            titleKey: "q",
            newItem: () => ({ q: "New question", a: "The answer" }),
            fields: [
              { key: "q", label: "Question", type: "text" },
              { key: "a", label: "Answer", type: "textarea", rows: 4 },
            ],
          },
        ],
      },
      {
        key: "finalCta",
        label: "Banner at the bottom of the page",
        type: "group",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Text", type: "textarea", rows: 2 },
          { key: "primaryLabel", label: "First button", type: "text", half: true },
          { key: "primaryHref", label: "First button goes to", type: "href", half: true },
          { key: "secondaryLabel", label: "Second button", type: "text", half: true },
          { key: "secondaryHref", label: "Second button goes to", type: "href", half: true },
          { key: "tertiaryLabel", label: "Third button", type: "text", half: true },
          { key: "tertiaryHref", label: "Third button goes to", type: "href", half: true },
        ],
      },
    ],
  },
  {
    key: "resources",
    label: "Resources",
    description: "The Resources page: its cards, the demo guide and what is coming next.",
    preview: "/resources",
    fields: [
      ...heading(),
      {
        key: "items",
        label: "Cards",
        type: "list",
        itemLabel: "card",
        titleKey: "title",
        subtitleKey: "status",
        newItem: () => ({ icon: "file", title: "New resource", body: "", href: "/", status: "Available", visible: true }),
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "icon", label: "Icon", type: "icon", half: true },
          { key: "status", label: "Status", type: "select", half: true, options: choices(RESOURCE_STATUSES) },
          { key: "body", label: "Text", type: "textarea", rows: 2 },
          { key: "href", label: "Goes to", type: "href" },
          { key: "visible", label: "Show this card", type: "switch" },
        ],
      },
      {
        key: "guide",
        label: "Demo guide",
        type: "group",
        fields: [
          { key: "visible", label: "Show the demo guide", type: "switch" },
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Text", type: "textarea", rows: 2 },
          {
            key: "steps",
            label: "Steps",
            type: "list",
            itemLabel: "step",
            titleKey: "title",
            newItem: () => ({ title: "New step", body: "" }),
            fields: [
              { key: "title", label: "Title", type: "text" },
              { key: "body", label: "Text", type: "textarea", rows: 2 },
            ],
          },
          { key: "linkLabel", label: "Link", type: "text", half: true },
          { key: "linkHref", label: "Link goes to", type: "href", half: true },
        ],
      },
      {
        key: "roadmap",
        label: "What's coming next",
        type: "group",
        fields: [
          { key: "visible", label: "Show this section", type: "switch" },
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Text", type: "textarea", rows: 2 },
          { key: "items", label: "Items", type: "lines", hint: "One per line." },
        ],
      },
    ],
  },
  {
    key: "contact",
    label: "Contact pages",
    description: "The wording around the contact and access-request forms. What people send arrives in the Inbox tab.",
    preview: "/contact",
    fields: [
      {
        key: "contact",
        label: "Contact page",
        type: "group",
        fields: [
          ...heading(),
          {
            key: "notes",
            label: "Notes beside the form",
            type: "list",
            itemLabel: "note",
            titleKey: "title",
            newItem: () => ({ icon: "mail", title: "New note", body: "" }),
            fields: [
              { key: "title", label: "Title", type: "text" },
              { key: "icon", label: "Icon", type: "icon", half: true },
              { key: "body", label: "Text", type: "textarea", rows: 2 },
            ],
          },
          { key: "successTitle", label: "Confirmation title", type: "text" },
          { key: "successBody", label: "Confirmation text", type: "textarea", rows: 2 },
        ],
      },
      {
        key: "waitlist",
        label: "Request access page",
        type: "group",
        fields: [
          ...heading(),
          { key: "pointsTitle", label: "Title beside the form", type: "text" },
          { key: "points", label: "Points beside the form", type: "lines", hint: "One per line." },
          { key: "successTitle", label: "Confirmation title", type: "text" },
          { key: "successBody", label: "Confirmation text", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    key: "legal",
    label: "Legal pages",
    description: "The Privacy and Terms pages. Have these reviewed by your own legal adviser.",
    preview: "/privacy",
    fields: (["privacy", "terms"] as const).map((key) => ({
      key,
      label: key === "privacy" ? "Privacy" : "Terms",
      type: "group",
      fields: [
        { key: "title", label: "Title", type: "text", half: true },
        { key: "updated", label: "Last updated", type: "text", half: true, placeholder: "4 November 2026" },
        { key: "intro", label: "Introduction", type: "textarea", rows: 2 },
        {
          key: "sections",
          label: "Sections",
          type: "list",
          itemLabel: "section",
          titleKey: "heading",
          newItem: () => ({ heading: "New section", body: "Text" }),
          fields: [
            { key: "heading", label: "Heading", type: "text" },
            { key: "body", label: "Text", type: "textarea", rows: 5 },
          ],
        },
      ],
    })),
  },
  {
    key: "brand",
    label: "Brand & footer",
    description: "The product and company name, the description search engines see, and the footer's wording.",
    preview: "/",
    fields: [
      { key: "productName", label: "Product name", type: "text", half: true, hint: "Shown in the logo, the footer and the browser tab." },
      { key: "company", label: "Company name", type: "text", half: true },
      { key: "tagline", label: "Tagline", type: "text", hint: "Shown in the browser tab on the homepage." },
      { key: "description", label: "Description for search engines", type: "textarea", rows: 2 },
      { key: "footerBlurb", label: "Text under the logo in the footer", type: "textarea", rows: 2 },
      { key: "contactEmail", label: "Email address in the footer", type: "text", hint: "Leave empty to hide it." },
      { key: "copyright", label: "Copyright line", type: "text" },
      { key: "footerNote", label: "Small print in the footer", type: "textarea", rows: 2 },
    ],
  },
];
