/**
 * Domain types for the OrbitOS demo dataset.
 *
 * ---------------------------------------------------------------------------
 * FUTURE BACKEND NOTE
 * Each interface below maps 1:1 to a table in the planned Drizzle ORM schema
 * (see the README section "Next phase: Drizzle ORM and a real backend"). IDs are plain
 * strings so they can later become UUIDs/cuid2 without touching the UI.
 * Foreign keys are expressed as `...Id` fields; money is stored as a plain
 * number in the base currency and should become integer minor units (cents)
 * in the real schema.
 * ---------------------------------------------------------------------------
 */
import type { ISODate } from "./dates";

export type { ISODate };

export type EntityId = string;

/* ----------------------------------------------------------------- Team -- */

export interface TeamMember {
  id: EntityId;
  name: string;
  role: string;
  email: string;
  initials: string;
  /** Tailwind-friendly tone key used for the avatar colour. */
  tone: "indigo" | "sky" | "emerald" | "amber" | "rose" | "violet";
}

/* ------------------------------------------------------------------ CRM -- */

export const CONTACT_STAGES = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "customer",
  "lost",
] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];

export interface Contact {
  id: EntityId;
  name: string;
  company: string;
  email: string;
  phone: string;
  jobTitle: string;
  stage: ContactStage;
  /** Expected (open stages) or realised (customer) deal value. */
  dealValue: number;
  lastContact: ISODate;
  followUpDate: ISODate | null;
  ownerId: EntityId;
  source: string;
  notes: string;
  createdAt: ISODate;
}

/* ------------------------------------------------------------ Inventory -- */

export const PRODUCT_CATEGORIES = [
  "Furniture",
  "Electronics",
  "Accessories",
  "Lighting",
  "Storage",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: EntityId;
  sku: string;
  name: string;
  category: ProductCategory;
  /** Units currently available to sell. */
  stock: number;
  /** Reorder threshold: stock below this value triggers a warning. */
  threshold: number;
  unitPrice: number;
  unitCost: number;
  supplier: string;
}

export type StockStatus = "in_stock" | "low" | "out";

/* ---------------------------------------------------------------- Sales -- */

export interface LineItem {
  productId: EntityId;
  quantity: number;
  unitPrice: number;
}

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: EntityId;
  number: string;
  customerId: EntityId;
  date: ISODate;
  status: OrderStatus;
  lines: LineItem[];
  total: number;
  invoiceId: EntityId | null;
  quotationId: EntityId | null;
  createdById: EntityId;
  notes: string;
}

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export interface Quotation {
  id: EntityId;
  number: string;
  customerId: EntityId;
  date: ISODate;
  validUntil: ISODate;
  status: QuotationStatus;
  lines: LineItem[];
  total: number;
  orderId: EntityId | null;
}

/* -------------------------------------------------------------- Finance -- */

export type InvoiceStatus = "paid" | "unpaid";

export interface Invoice {
  id: EntityId;
  number: string;
  customerId: EntityId;
  orderId: EntityId | null;
  issueDate: ISODate;
  dueDate: ISODate;
  amount: number;
  status: InvoiceStatus;
  paidDate: ISODate | null;
}

export const EXPENSE_CATEGORIES = [
  "Inventory purchases",
  "Payroll",
  "Rent & utilities",
  "Shipping",
  "Marketing",
  "Software",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: EntityId;
  date: ISODate;
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amount: number;
}

/* ------------------------------------------------------------- Projects -- */

export type ProjectStatus = "active" | "planning" | "completed";

export interface Project {
  id: EntityId;
  name: string;
  customerId: EntityId | null;
  ownerId: EntityId;
  status: ProjectStatus;
}

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: EntityId;
  title: string;
  projectId: EntityId;
  assigneeId: EntityId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: ISODate;
  completedDate: ISODate | null;
}

/* ------------------------------------------------------------- Activity -- */

export type ActivityKind =
  | "order"
  | "invoice"
  | "payment"
  | "contact"
  | "inventory"
  | "task"
  | "quotation"
  | "expense"
  | "system";

export interface Activity {
  id: EntityId;
  /** ISO date-time, e.g. 2026-10-13T14:32 (simulated clock). */
  at: string;
  kind: ActivityKind;
  message: string;
  actorId: EntityId | null;
  /** Demo route this activity relates to. */
  href: string | null;
}

/* ----------------------------------------------------------- Aggregates -- */

export interface DemoData {
  team: TeamMember[];
  contacts: Contact[];
  products: Product[];
  orders: Order[];
  quotations: Quotation[];
  invoices: Invoice[];
  expenses: Expense[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

/* ------------------------------------------------------------- Settings -- */

export const MODULE_KEYS = [
  "copilot",
  "crm",
  "sales",
  "orders",
  "inventory",
  "finance",
  "projects",
  "team",
  "analytics",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ThemePreference = "light" | "dark" | "system";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "AED" | "INR" | "PKR";

export interface NotificationPrefs {
  overdueInvoices: boolean;
  lowStock: boolean;
  followUps: boolean;
  tasks: boolean;
  orders: boolean;
}

/** Local, browser-only demo preferences. NOT real account settings. */
export interface DemoSettings {
  businessName: string;
  industry: string;
  contactEmail: string;
  location: string;
  currency: CurrencyCode;
  theme: ThemePreference;
  notifications: NotificationPrefs;
  modules: Record<ModuleKey, boolean>;
}

/** Kinds of records that can be opened from search, notifications or the copilot. */
export type RecordKind = "contact" | "order" | "invoice" | "product" | "task" | "quotation";
export interface RecordRef {
  kind: RecordKind;
  id: EntityId;
}
