import type { IconName } from "@/components/shared/icon";

/* ----------------------------------------------------------- Solutions --- */

export interface SolutionContent {
  slug: string;
  name: string;
  icon: IconName;
  tagline: string;
  headline: string;
  description: string;
  outcomes: string[];
  modules: string[];
  demoHref: string;
}

export const SOLUTIONS: SolutionContent[] = [
  {
    slug: "grow-sales",
    name: "Grow sales",
    icon: "target",
    tagline: "Leads, quotations and orders in one flow",
    headline: "Know which deals need you, and what to send next.",
    description:
      "Keep every lead, follow-up date and quotation visible, then turn accepted quotations into orders without re-entering anything.",
    outcomes: [
      "Follow-ups surface when they are due, not when someone remembers",
      "Quotations convert to orders and update related views",
      "Pipeline value and lead conversion are always current",
    ],
    modules: ["crm", "sales", "analytics", "copilot"],
    demoHref: "/demo/crm",
  },
  {
    slug: "control-inventory",
    name: "Control inventory",
    icon: "boxes",
    tagline: "Thresholds, adjustments and reorder prompts",
    headline: "See shortages before customers do.",
    description:
      "Set a reorder threshold per product, adjust stock with a reason, and let warnings flow to the dashboard, notifications and the copilot.",
    outcomes: [
      "Low-stock warnings use each product's own threshold",
      "Orders reserve stock and flag products that fall short",
      "Reorder tasks link a shortage to the person responsible",
    ],
    modules: ["inventory", "sales", "projects", "copilot"],
    demoHref: "/demo/inventory",
  },
  {
    slug: "financial-visibility",
    name: "Financial visibility",
    icon: "money",
    tagline: "Receivables, expenses and trends",
    headline: "Understand what is owed, what is due and what is coming.",
    description:
      "Follow invoices from issue to payment, see receivables by age, and compare revenue with expenses. Illustrative in this proof of concept: it is not accounting software.",
    outcomes: [
      "Overdue invoices stand out immediately",
      "Receivables summary and ageing in one view",
      "Revenue versus expense trend",
    ],
    modules: ["finance", "sales", "analytics", "copilot"],
    demoHref: "/demo/finance",
  },
  {
    slug: "team-coordination",
    name: "Team coordination",
    icon: "users",
    tagline: "Tasks, owners and deadlines",
    headline: "Everyone knows what they own and when it is due.",
    description:
      "Tasks, projects and account ownership share one workspace, so workload and deadlines are visible before they become problems.",
    outcomes: [
      "Due-today and overdue work is always one click away",
      "Ownership is visible on contacts and tasks",
      "Workload by person helps balance assignments",
    ],
    modules: ["projects", "team", "crm", "copilot"],
    demoHref: "/demo/projects",
  },
  {
    slug: "automate-busywork",
    name: "Automate busywork",
    icon: "workflow",
    tagline: "Connected records and rule-based hand-offs",
    headline: "Let one event update everything it should.",
    description:
      "When an order is created, stock, invoices, dashboard metrics and notifications follow. A configurable rule builder is the next step on the roadmap.",
    outcomes: [
      "One action updates related records",
      "Fewer copy-and-paste tasks between tools",
      "A visible activity log of what changed",
    ],
    modules: ["automation", "sales", "inventory", "finance"],
    demoHref: "/demo/orders",
  },
];

export const SOLUTION_BY_SLUG = Object.fromEntries(SOLUTIONS.map((s) => [s.slug, s])) as Record<string, SolutionContent>;

/* -------------------------------------------------------- Pain points --- */

export interface PainPoint {
  icon: IconName;
  title: string;
  consequence: string;
  solution: string;
}

export const PAIN_POINTS: PainPoint[] = [
  {
    icon: "layers",
    title: "Disconnected software and scattered data",
    consequence: "The same customer appears in four places with four versions of the truth, and nobody trusts any of them.",
    solution: "One shared record per customer, order and invoice, visible from every module.",
  },
  {
    icon: "repeat",
    title: "Repetitive manual data entry",
    consequence: "Quotes are retyped into orders, orders into invoices. Time is lost and typos creep in.",
    solution: "Convert a quotation to an order and issue the invoice from it, with no re-keying.",
  },
  {
    icon: "analytics",
    title: "Slow and confusing reporting",
    consequence: "Answering a simple question means exporting spreadsheets and reconciling them by hand.",
    solution: "Dashboards and a copilot that read the same live records you work in.",
  },
  {
    icon: "bell",
    title: "Missed follow-ups and approvals",
    consequence: "Leads go cold, invoices go unchased and approvals wait in someone's inbox.",
    solution: "Follow-up dates, overdue flags and notifications that surface what is due today.",
  },
  {
    icon: "boxes",
    title: "Poor visibility into stock, costs and receivables",
    consequence: "Shortages, margin and overdue payments are discovered after they have already cost you.",
    solution: "Per-product thresholds, receivables ageing and expense trends in one place.",
  },
  {
    icon: "rocket",
    title: "Complicated onboarding and fragmented workflows",
    consequence: "New hires learn five tools, and each process lives in a different one.",
    solution: "Start with the modules you need, in one interface, and add more when you are ready.",
  },
];

/* --------------------------------------------------------------- FAQ ---- */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "Is OrbitOS available today?",
    a: "No. OrbitOS is a proof of concept and a working placeholder name. There is no production service, no sign-up and no paid plan yet. You can explore the interactive demo and join the waitlist to hear about early access.",
  },
  {
    q: "Where does the demo data come from, and is anything saved?",
    a: "All demo records are fictional and generated locally in your browser. Changes you make stay in memory for the session; refreshing the page restores the sample data. Display preferences you choose in Settings are stored in your browser's local storage only.",
  },
  {
    q: "Is the AI copilot a real AI model?",
    a: "Not in this proof of concept. The demo assistant is deterministic: it recognises a set of business questions and answers them by reading the sample dataset on your device. A real copilot is planned to use a language model with access to your organisation's data, with the same grounding principle.",
  },
  {
    q: "How will data security and permissions work?",
    a: "Security is a design goal, not a claim today. The planned product includes role-based access, audit trails and encryption in transit and at rest. We are not asserting any certification or compliance status. Those depend on the production architecture and independent assessment.",
  },
  {
    q: "Which integrations will be supported?",
    a: "Planned categories include email and calendar, accounting, payments and storefronts, plus a documented API. None exist yet. The integrations module in the demo describes intent only.",
  },
  {
    q: "Can OrbitOS be customised for my industry?",
    a: "The goal is a modular core with industry-specific templates. This proof of concept shows how modules combine for six sectors, but deep industry processes (such as manufacturing work orders) are not implemented.",
  },
  {
    q: "What would implementation look like?",
    a: "The intent is self-serve setup for small teams: choose a business type, pick modules and configure the workspace in a few steps, as previewed in “How it works”. Guided data import and migration support have not been designed yet.",
  },
  {
    q: "How will pricing work?",
    a: "The pricing page shows illustrative tiers to explain how modules might be packaged. The numbers are placeholders, not an offer. Final pricing has not been set.",
  },
  {
    q: "Is the finance module real accounting software?",
    a: "No. It is an illustrative interface for receivables, expenses and trends. It does not process payments, connect to banks, calculate taxes or produce certified accounting records.",
  },
];

/* --------------------------------------------------------- Trust cards --- */

export interface TrustItem {
  icon: IconName;
  title: string;
  status: "Design goal" | "Planned" | "Demo only" | "Not available";
  body: string;
}

export const TRUST: TrustItem[] = [
  {
    icon: "shield",
    title: "Data security",
    status: "Design goal",
    body: "This demo has no backend and collects nothing. In production we intend encryption in transit and at rest, but we make no certification or compliance claims.",
  },
  {
    icon: "lock",
    title: "Permissions",
    status: "Planned",
    body: "Role-based access, so people see only what they need, is planned. The demo shows a single sample user.",
  },
  {
    icon: "plug",
    title: "Integrations",
    status: "Planned",
    body: "Connectors for email, accounting, payments and storefronts are on the roadmap. None exist yet.",
  },
  {
    icon: "settings",
    title: "Customization",
    status: "Demo only",
    body: "You can toggle modules and preferences in the demo. Custom fields and workflows are future work.",
  },
  {
    icon: "rocket",
    title: "Implementation",
    status: "Planned",
    body: "A short, guided setup is the goal. Data migration tooling has not been built.",
  },
  {
    icon: "bot",
    title: "AI capabilities",
    status: "Demo only",
    body: "The demo assistant is rule-based and runs entirely in your browser. It calls no AI service.",
  },
  {
    icon: "factory",
    title: "Industry support",
    status: "Planned",
    body: "Six sectors are illustrated. Deep, industry-specific processes will be introduced progressively.",
  },
  {
    icon: "money",
    title: "Pricing",
    status: "Not available",
    body: "Tiers on the pricing page are illustrative. Nothing can be purchased.",
  },
  {
    icon: "alert",
    title: "Product availability",
    status: "Not available",
    body: "OrbitOS is a proof of concept. Join the waitlist and we will share progress honestly.",
  },
];

/* --------------------------------------------------------------- Pricing -- */

export interface PricingTier {
  id: string;
  name: string;
  audience: string;
  price: string;
  priceNote: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

export const PRICING: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    audience: "Solo operators and small agencies",
    price: "$19",
    priceNote: "per user / month, illustrative",
    cta: "Join the waitlist",
    features: ["CRM and contacts", "Projects and tasks", "Quotations and invoices", "Core dashboard", "Community support"],
  },
  {
    id: "growth",
    name: "Growth",
    audience: "Growing teams that sell and stock products",
    price: "$49",
    priceNote: "per user / month, illustrative",
    cta: "Request early access",
    featured: true,
    features: [
      "Everything in Starter",
      "Orders and inventory",
      "Finance overview",
      "Analytics and reporting",
      "AI copilot (early access)",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    audience: "Multi-team and multi-location organisations",
    price: "Custom",
    priceNote: "to be discussed, illustrative",
    cta: "Talk to the team",
    features: [
      "Everything in Growth",
      "Multiple locations",
      "Advanced permissions",
      "Workflow automation",
      "Integration support",
      "Guided onboarding",
    ],
  },
];

/* ---------------------------------------------------------- Business types -- */

export interface BusinessTypeOption {
  id: string;
  name: string;
  icon: IconName;
  blurb: string;
  /** Recommended module slugs. */
  modules: string[];
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { id: "retail", name: "Retail and e-commerce", icon: "store", blurb: "Sell products and track stock", modules: ["sales", "inventory", "finance", "analytics"] },
  { id: "services", name: "Professional services", icon: "briefcase", blurb: "Manage clients and billable work", modules: ["crm", "projects", "finance", "team"] },
  { id: "agency", name: "Agency or consulting", icon: "handshake", blurb: "Run pipeline, projects and invoicing", modules: ["crm", "projects", "finance", "copilot"] },
  { id: "manufacturing", name: "Manufacturing", icon: "factory", blurb: "Connect orders, materials and suppliers", modules: ["inventory", "sales", "projects", "analytics"] },
  { id: "wholesale", name: "Wholesale and distribution", icon: "truck", blurb: "Handle big orders and many SKUs", modules: ["inventory", "sales", "finance", "crm"] },
  { id: "saas", name: "Technology or SaaS", icon: "code", blurb: "Track pipeline and customer success", modules: ["crm", "projects", "analytics", "copilot"] },
];
