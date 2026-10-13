import type { IconName } from "@/components/shared/icon";

export interface IndustryContent {
  slug: string;
  name: string;
  icon: IconName;
  summary: string;
  useCases: { title: string; detail: string }[];
  /** Module slugs from MODULES. */
  modules: string[];
  workflow: string[];
  /** Honest status note shown with every industry. */
  note: string;
}

export const INDUSTRIES: IndustryContent[] = [
  {
    slug: "retail",
    name: "Retail and e-commerce",
    icon: "store",
    summary: "Keep shelves, orders and customers in step so popular items do not sell out unnoticed.",
    useCases: [
      { title: "Low-stock awareness", detail: "Per-product thresholds warn you before best-sellers run out." },
      { title: "Order to invoice", detail: "Orders link to customers and invoices without re-typing." },
      { title: "Supplier reordering", detail: "Reorder tasks tie shortages to the supplier and the person responsible." },
      { title: "Sales by category", detail: "See which categories carry revenue this month." },
    ],
    modules: ["inventory", "sales", "finance", "analytics", "copilot"],
    workflow: ["Stock falls below threshold", "Reorder task created", "Supplier order received", "Stock adjusted"],
    note: "Storefront and marketplace connectors are planned, not available. The demo uses a workplace-equipment catalog.",
  },
  {
    slug: "professional-services",
    name: "Professional services",
    icon: "briefcase",
    summary: "Track client work, deadlines and billing so nothing falls between delivery and invoice.",
    useCases: [
      { title: "Client records", detail: "One profile per client with contacts, notes and follow-ups." },
      { title: "Work tracking", detail: "Tasks with owners and due dates tied to client projects." },
      { title: "Billing visibility", detail: "Invoices and receivables next to the work they relate to." },
      { title: "Capacity view", detail: "See who is overloaded before assigning more." },
    ],
    modules: ["crm", "projects", "finance", "team", "copilot"],
    workflow: ["New client", "Project and tasks", "Work delivered", "Invoice issued"],
    note: "Time tracking and retainer billing are not implemented in this proof of concept.",
  },
  {
    slug: "agencies",
    name: "Agencies and consulting",
    icon: "handshake",
    summary: "Move from lead to proposal to project to invoice in one workspace.",
    useCases: [
      { title: "Pipeline clarity", detail: "Leads by stage with deal value and next follow-up." },
      { title: "Proposal to project", detail: "Accepted quotations become orders and kick off project tasks." },
      { title: "Client onboarding", detail: "Reusable task lists keep onboarding consistent." },
      { title: "Receivables follow-up", detail: "Overdue invoices surface automatically so they get chased." },
    ],
    modules: ["crm", "sales", "projects", "finance", "automation"],
    workflow: ["Lead", "Proposal sent", "Project kicked off", "Invoice issued"],
    note: "A small agency can start with CRM, projects and invoicing and add modules later.",
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "factory",
    summary: "Connect orders, materials and suppliers; production-specific tooling arrives later.",
    useCases: [
      { title: "Material stock", detail: "Thresholds and supplier details for inputs and finished goods." },
      { title: "Order visibility", detail: "See which customer orders are waiting on stock." },
      { title: "Supplier follow-up", detail: "Tasks and reminders tied to purchase needs." },
      { title: "Cost and margin trends", detail: "Unit cost alongside price on every product." },
    ],
    modules: ["inventory", "sales", "projects", "analytics", "integrations"],
    workflow: ["Customer order", "Check material stock", "Reorder task", "Delivery planned"],
    note: "Bills of materials, work orders and production scheduling are not implemented. Manufacturing-specific processes are on the roadmap.",
  },
  {
    slug: "wholesale",
    name: "Wholesale and distribution",
    icon: "truck",
    summary: "Handle repeat buyers, large orders and many SKUs with stock-aware ordering. The demo workspace is a distributor.",
    useCases: [
      { title: "Stock-aware orders", detail: "Orders check available stock and reserve units when created." },
      { title: "Account terms", detail: "Invoice due dates follow payment terms; overdue accounts are flagged." },
      { title: "Repeat customers", detail: "Top customers and order history at a glance." },
      { title: "Fulfilment status", detail: "Pending, processing, shipped and delivered states." },
    ],
    modules: ["inventory", "sales", "finance", "crm", "analytics"],
    workflow: ["Order placed", "Stock reserved", "Invoice issued", "Payment tracked"],
    note: "Multi-location warehousing and EDI are planned, not available.",
  },
  {
    slug: "saas",
    name: "Technology and SaaS businesses",
    icon: "code",
    summary: "Run pipeline, customer success and finance operations from a single, lighter system.",
    useCases: [
      { title: "Pipeline to customer", detail: "Qualified leads, proposals and conversions in one funnel." },
      { title: "Customer follow-ups", detail: "Success tasks and renewal reminders tied to accounts." },
      { title: "Revenue trends", detail: "Monthly revenue and lead conversion in analytics." },
      { title: "Internal operations", detail: "Tasks, ownership and expenses for a growing team." },
    ],
    modules: ["crm", "projects", "analytics", "automation", "integrations"],
    workflow: ["Trial lead", "Qualified", "Proposal", "Customer onboarding"],
    note: "Subscription billing and product-usage data are not implemented; they would depend on integrations.",
  },
];

export const INDUSTRY_BY_SLUG = Object.fromEntries(INDUSTRIES.map((i) => [i.slug, i])) as Record<string, IndustryContent>;
