import type { IconName } from "@/components/shared/icon";

export type Availability = "Interactive demo" | "Concept preview" | "Planned";

export interface ModuleContent {
  slug: string;
  name: string;
  /** One line used in menus. */
  tagline: string;
  icon: IconName;
  problem: string;
  functionality: string[];
  benefit: string;
  availability: Availability;
  /** Where the module can be tried in the demo (if anywhere). */
  demoHref: string | null;
  /** Honest note about what is and is not implemented in this proof of concept. */
  pocNote: string;
}

export const MODULES: ModuleContent[] = [
  {
    slug: "crm",
    name: "CRM",
    tagline: "Contacts, leads and follow-ups in one place",
    icon: "users",
    problem: "Customer details live in inboxes, spreadsheets and memory, so follow-ups quietly slip.",
    functionality: [
      "Contacts and companies with deal value and lead stage",
      "Follow-up dates with overdue flags",
      "Notes and contact history on every record",
      "Search and stage filters",
    ],
    benefit: "A shared view of every relationship and what to do next.",
    availability: "Interactive demo",
    demoHref: "/demo/crm",
    pocNote: "Add, search, filter and update contacts in the live demo. Data stays in your browser.",
  },
  {
    slug: "sales",
    name: "Sales & orders",
    tagline: "From quotation to order without re-typing",
    icon: "cart",
    problem: "Quotes, orders and invoices are re-keyed between tools, and each hand-off invites mistakes.",
    functionality: [
      "Quotations that convert to orders in one step",
      "Order statuses from pending to delivered",
      "Orders linked to customers, stock and invoices",
      "Create-order flow with stock checks",
    ],
    benefit: "One record flows from quote to order to invoice without re-entry.",
    availability: "Interactive demo",
    demoHref: "/demo/orders",
    pocNote: "Create orders and convert quotations in the demo; stock and dashboard metrics update immediately.",
  },
  {
    slug: "inventory",
    name: "Inventory",
    tagline: "Stock levels that warn you before you run out",
    icon: "boxes",
    problem: "Stock counts are out of date by the time anyone checks them, so shortages arrive as surprises.",
    functionality: [
      "Products with SKU, category, price and supplier",
      "Per-product reorder thresholds",
      "Stock adjustments with a reason",
      "Low-stock and out-of-stock warnings",
    ],
    benefit: "Spot shortages before they turn into missed orders.",
    availability: "Interactive demo",
    demoHref: "/demo/inventory",
    pocNote: "Adjust stock and watch warnings, dashboards and the copilot respond to each product's own threshold.",
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Receivables, expenses and cash trends at a glance",
    icon: "wallet",
    problem: "Receivables and expenses are scattered, so knowing what is owed or due feels like guesswork.",
    functionality: [
      "Invoices with paid, unpaid and overdue states",
      "Receivables summary and ageing",
      "Expense tracking by category",
      "Revenue versus expense trend",
    ],
    benefit: "See what is owed and what is coming without a month-end scramble.",
    availability: "Interactive demo",
    demoHref: "/demo/finance",
    pocNote:
      "Illustrative finance views only. No payments, bank connections, tax calculations or certified accounting are implemented.",
  },
  {
    slug: "projects",
    name: "Projects & tasks",
    tagline: "Clear owners and deadlines for every piece of work",
    icon: "projects",
    problem: "Work is assigned in chat threads and forgotten, so deadlines are discovered when they are missed.",
    functionality: [
      "Tasks with assignee, priority and due date",
      "Projects tied to customers",
      "Filters for overdue and due-today work",
      "One-click completion",
    ],
    benefit: "Clear ownership and visible deadlines for the whole team.",
    availability: "Interactive demo",
    demoHref: "/demo/projects",
    pocNote: "Create and complete tasks in the demo; dashboard counts and notifications update accordingly.",
  },
  {
    slug: "team",
    name: "Team management",
    tagline: "Who owns what, and who has capacity",
    icon: "building",
    problem: "Nobody is quite sure who owns an account, a task or a follow-up, or who has room for more.",
    functionality: [
      "Team directory with roles",
      "Workload by person: tasks, accounts, open deals",
      "Ownership shown on contacts and tasks",
    ],
    benefit: "Balanced workloads and clear accountability.",
    availability: "Interactive demo",
    demoHref: "/demo/team",
    pocNote: "A read-only team overview computed from the sample data. Roles and permissions are not implemented.",
  },
  {
    slug: "automation",
    name: "Workflow automation",
    tagline: "Let routine hand-offs happen on their own",
    icon: "workflow",
    problem: "Repetitive hand-offs, such as chasing an invoice or reordering stock, consume hours every week.",
    functionality: [
      "Trigger-and-action rules, for example: invoice overdue → create a follow-up task",
      "Automatic status updates when related records change",
      "A visible log of what was automated",
    ],
    benefit: "Fewer manual steps and more consistent follow-through.",
    availability: "Concept preview",
    demoHref: null,
    pocNote:
      "The connected-workflow demo on the homepage shows records updating each other. A configurable rule builder is not part of this proof of concept.",
  },
  {
    slug: "analytics",
    name: "Analytics & reporting",
    tagline: "Answers from the same data you work in",
    icon: "analytics",
    problem: "Reports are assembled by hand from several tools, so by the time they are ready they are out of date.",
    functionality: [
      "Sales and order trends",
      "Revenue by category",
      "Lead conversion overview",
      "Filters for time range and metric",
    ],
    benefit: "Answers when you ask, without exporting to a spreadsheet first.",
    availability: "Interactive demo",
    demoHref: "/demo/analytics",
    pocNote: "Interactive charts built from the demo dataset. Scheduled and exportable reports are not implemented.",
  },
  {
    slug: "copilot",
    name: "AI business copilot",
    tagline: "Ask a question, get an answer grounded in your records",
    icon: "bot",
    problem: "Finding what matters means digging through several screens and remembering what to check.",
    functionality: [
      "Plain-language questions about invoices, stock, leads, tasks and sales",
      "Answers that cite the actual records, with links to act",
      "Proactive insights on the dashboard",
    ],
    benefit: "A shorter path from “what is going on?” to “here is what to do”.",
    availability: "Interactive demo",
    demoHref: "/demo/copilot",
    pocNote:
      "The demo assistant is deterministic and rule-based: it reads the sample dataset locally and does not call an AI model.",
  },
  {
    slug: "integrations",
    name: "Integrations",
    tagline: "Keep the tools you already like",
    icon: "plug",
    problem: "Your business already runs on other tools, and re-keying data between them is where errors creep in.",
    functionality: [
      "Planned connectors for email, calendar, accounting, payments and storefronts",
      "A documented API for custom connections",
    ],
    benefit: "Keep the tools you like and stop copying data between them.",
    availability: "Planned",
    demoHref: null,
    pocNote: "No integrations exist yet. This describes the intended direction, not available functionality.",
  },
];

export const MODULE_BY_SLUG = Object.fromEntries(MODULES.map((m) => [m.slug, m])) as Record<string, ModuleContent>;
