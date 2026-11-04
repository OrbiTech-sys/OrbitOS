import type { IconName } from "./icons";
import type { HomeContent, PricingContent, SolutionContent } from "./schema";

/* ----------------------------------------------------------- Solutions --- */

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
    visible: true,
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
    visible: true,
  },
  {
    slug: "financial-visibility",
    name: "Financial visibility",
    icon: "money",
    tagline: "Receivables, expenses and trends",
    headline: "Understand what is owed, what is due and what is coming.",
    description:
      "Follow invoices from issue to payment, see receivables by age, and compare revenue with expenses. It keeps your records and shows your numbers; it is not accounting software.",
    outcomes: [
      "Overdue invoices stand out immediately",
      "Receivables summary and ageing in one view",
      "Revenue versus expense trend",
    ],
    modules: ["finance", "sales", "analytics", "copilot"],
    demoHref: "/demo/finance",
    visible: true,
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
    visible: true,
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
    visible: true,
  },
];

/* ------------------------------------------------------------- Homepage -- */

const PAIN_POINTS: HomeContent["problems"]["items"] = [
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

const FAQ: HomeContent["faq"]["items"] = [
  {
    q: "Is OrbitOS available today?",
    a: "Yes, by invitation. Accounts are created by an administrator, so there is no public sign-up: request access and tell us about your business. You can explore the live demo without an account.",
  },
  {
    q: "Where does the demo data come from, and is anything saved?",
    a: "All demo records are fictional and generated in your browser, and refreshing the page restores them. In your own workspace it is the opposite: everything you add is saved to your account and is there the next time you sign in.",
  },
  {
    q: "Is the AI copilot a real AI model?",
    a: "Not yet. The assistant is rule-based: it recognises a set of business questions and answers them by reading your records on your device, so your data is not sent to an AI service. Connecting it to a language model is on the roadmap.",
  },
  {
    q: "How is my data kept secure?",
    a: "Every workspace is private to its account, and the database itself enforces that, not just the screens. Administrators can see how much storage an account uses but never what its records contain. Passwords are hashed, data is encrypted in transit and at rest, and administrator actions are recorded in an audit log. We do not claim any certification.",
  },
  {
    q: "Who can do what?",
    a: "Members use their own workspace. Admins also add and manage members and read website enquiries. Super admins manage everyone, set storage limits and edit this website, including its menus and prices.",
  },
  {
    q: "Which integrations will be supported?",
    a: "Planned categories include email and calendar, accounting, payments and storefronts, plus a documented API. None exist yet.",
  },
  {
    q: "Can OrbitOS be customised for my industry?",
    a: "The core is modular, and you can hide the modules you do not need. Six sectors are described on this site, but deep industry processes (such as manufacturing work orders) are not implemented yet.",
  },
  {
    q: "What does getting started look like?",
    a: "An administrator creates your account and gives you a temporary password. You choose your own when you first sign in, then start adding your customers, products and work. Guided data import and migration are not available yet.",
  },
  {
    q: "How does pricing work?",
    a: "The pricing page lists the current plans. There is no online checkout yet, so talk to the team to get set up.",
  },
  {
    q: "Is the finance module real accounting software?",
    a: "No. It keeps your invoices and expenses and shows receivables and trends. It does not process payments, connect to banks, calculate taxes or produce certified accounting records.",
  },
];

const TRUST: HomeContent["trust"]["items"] = [
  {
    icon: "shield",
    title: "Data security",
    status: "Available",
    body: "Each workspace is private to its account, enforced in the database. Data is encrypted in transit and at rest. We make no certification or compliance claims.",
  },
  {
    icon: "lock",
    title: "Permissions",
    status: "Available",
    body: "Three roles: member, admin and super admin. Administrator actions are recorded in an audit log. Finer per-module permissions are planned.",
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
    status: "Available",
    body: "Toggle modules and set your own preferences and currency display. Custom fields and workflows are future work.",
  },
  {
    icon: "rocket",
    title: "Implementation",
    status: "In progress",
    body: "An administrator can set up an account in moments. Guided data migration has not been built yet.",
  },
  {
    icon: "bot",
    title: "AI capabilities",
    status: "Available",
    body: "The assistant is rule-based and runs on your device. It calls no AI service, so nothing leaves your workspace.",
  },
  {
    icon: "factory",
    title: "Industry support",
    status: "In progress",
    body: "Six sectors are described. Deep, industry-specific processes will be introduced progressively.",
  },
  {
    icon: "money",
    title: "Payments",
    status: "Not available",
    body: "There is no online checkout, and OrbitOS does not process payments for you. Invoices and “mark as paid” are records only.",
  },
  {
    icon: "alert",
    title: "Service commitments",
    status: "Not available",
    body: "We do not publish uptime guarantees or support response times yet, and we will say so plainly until we do.",
  },
];

export const HOME: HomeContent = {
  hero: {
    badge: "By The OrbiTech Solution",
    badgeText: "An AI-powered business operating system",
    titleLine1: "Stop managing tools.",
    titleLine2: "Start running your business.",
    description: "Connect your operations, automate repetitive work, and understand what needs attention — all from one intelligent workspace.",
    primaryLabel: "Explore the Live Demo",
    primaryHref: "/demo",
    secondaryLabel: "See How It Works",
    secondaryHref: "#how-it-works",
    note: "No sign-up needed. The demo runs in your browser with fictional sample data.",
    benefits: ["One workspace for your operations", "Start small, add modules later", "Answers grounded in your own records", "Less re-typing between tools"],
  },
  problems: {
    eyebrow: "The everyday friction",
    title: "Six problems that quietly slow a growing business",
    description: "Most teams do not have a software problem. They have a connection problem. Here is what that looks like in practice, and how a connected workspace responds.",
    items: PAIN_POINTS,
    solutionLabel: "With OrbitOS",
  },
  modules: {
    eyebrow: "Modules",
    title: "Start with what you need. Expand when you're ready.",
    description: "Building blocks that share one set of records. A small agency can begin with CRM, projects and invoicing; a retailer with sales and inventory.",
  },
  industries: {
    eyebrow: "Industry solutions",
    title: "The same core, shaped around how you work",
    description: "Pick an industry to see typical use cases and which modules fit. Deep, industry-specific processes arrive progressively, and this page says plainly where they are not built yet.",
  },
  trust: {
    eyebrow: "Straight answers",
    title: "What is real today, and what is not",
    description: "We would rather be clear than impressive. No customer logos, testimonials, certifications or uptime promises appear here because none exist yet.",
    items: TRUST,
  },
  faq: { eyebrow: "FAQ", title: "Questions you are probably asking", items: FAQ },
  finalCta: {
    title: "Your business deserves a simpler way to work.",
    body: "See a connected workspace in action, then tell us what you would want it to do for you.",
    primaryLabel: "Explore the demo",
    primaryHref: "/demo",
    secondaryLabel: "Request access",
    secondaryHref: "/waitlist",
    tertiaryLabel: "Contact the team",
    tertiaryHref: "/contact",
  },
};

/* --------------------------------------------------------------- Pricing -- */

const yes = ["starter", "growth", "business"];
const growthUp = ["growth", "business"];
const businessOnly = ["business"];

export const PRICING: PricingContent = {
  eyebrow: "Pricing",
  title: "Simple plans that grow with you",
  description: "Start with the modules you need and move up when you are ready. Talk to the team to get set up.",
  homeTitle: "Simple plans that grow with you",
  homeDescription: "Start with what you need. Compare what each plan includes, or talk to the team.",
  notice: "",
  featuredBadge: "Most likely fit for growing teams",
  tiers: [
    {
      id: "starter",
      name: "Starter",
      audience: "Solo operators and small agencies",
      price: "$19",
      priceNote: "per user / month",
      cta: "Request access",
      ctaHref: "/waitlist",
      featured: false,
      visible: true,
      features: ["CRM and contacts", "Projects and tasks", "Quotations and invoices", "Core dashboard", "Community support"],
    },
    {
      id: "growth",
      name: "Growth",
      audience: "Growing teams that sell and stock products",
      price: "$49",
      priceNote: "per user / month",
      cta: "Request access",
      ctaHref: "/waitlist",
      featured: true,
      visible: true,
      features: ["Everything in Starter", "Orders and inventory", "Finance overview", "Analytics and reporting", "AI copilot (early access)", "Email support"],
    },
    {
      id: "business",
      name: "Business",
      audience: "Multi-team and multi-location organisations",
      price: "Custom",
      priceNote: "talk to us",
      cta: "Talk to the team",
      ctaHref: "/contact",
      featured: false,
      visible: true,
      features: ["Everything in Growth", "Multiple locations", "Advanced permissions", "Workflow automation", "Integration support", "Guided onboarding"],
    },
  ],
  comparisonTitle: "Compare what each plan includes",
  comparison: [
    { feature: "CRM and contacts", included: yes },
    { feature: "Projects and tasks", included: yes },
    { feature: "Quotations and invoices", included: yes },
    { feature: "Orders and inventory", included: growthUp },
    { feature: "Finance overview", included: growthUp },
    { feature: "Analytics and reporting", included: growthUp },
    { feature: "AI copilot", included: growthUp },
    { feature: "Multiple locations", included: businessOnly },
    { feature: "Advanced permissions", included: businessOnly },
    { feature: "Workflow automation", included: businessOnly },
    { feature: "Integration support", included: businessOnly },
  ],
  closing: {
    title: "Not sure which plan fits?",
    body: "Tell us how your team works and which modules matter most.",
    primaryLabel: "Request access",
    primaryHref: "/waitlist",
    secondaryLabel: "Contact the team",
    secondaryHref: "/contact",
  },
};

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
