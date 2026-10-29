import { z } from "zod";

import { CURRENCIES } from "../demo/format";
import {
  CONTACT_STAGES,
  EXPENSE_CATEGORIES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  QUOTATION_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../demo/types";

/**
 * What a workspace record may look like. The server validates every record
 * against these before it reaches the database (the browser is never trusted),
 * and the loader uses them to ignore any row that no longer fits.
 *
 * The limits are generous on purpose: they exist to keep rows small and
 * well-formed, while the forms enforce the stricter product rules. Unknown
 * fields are dropped, not rejected.
 */

export const STORED_KINDS = ["team", "contact", "product", "order", "quotation", "invoice", "expense", "project", "task", "activity", "meta"] as const;
export type StoredKind = (typeof STORED_KINDS)[number];

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/);
const text = (max: number) => z.string().max(max);
const amount = z.number().min(0).max(1_000_000_000_000);
const count = z.number().int().min(0).max(1_000_000_000);

const lineItem = z.object({ productId: id, quantity: z.number().int().min(1).max(1_000_000_000), unitPrice: amount });
const lines = z.array(lineItem).min(1).max(200);

export const recordSchemas = {
  team: z.object({
    id,
    name: text(120),
    role: text(120),
    email: text(254),
    initials: text(4),
    tone: z.enum(["indigo", "sky", "emerald", "amber", "rose", "violet"]),
  }),
  contact: z.object({
    id,
    name: text(200),
    company: text(200),
    email: text(254),
    phone: text(60),
    jobTitle: text(120),
    stage: z.enum(CONTACT_STAGES),
    dealValue: amount,
    lastContact: isoDate,
    followUpDate: isoDate.nullable(),
    ownerId: id,
    source: text(120),
    notes: text(5000),
    createdAt: isoDate,
  }),
  product: z.object({
    id,
    sku: text(64),
    name: text(200),
    category: z.enum(PRODUCT_CATEGORIES),
    stock: count,
    threshold: count,
    unitPrice: amount,
    unitCost: amount,
    supplier: text(200),
  }),
  order: z.object({
    id,
    number: text(32),
    customerId: id,
    date: isoDate,
    status: z.enum(ORDER_STATUSES),
    lines,
    total: amount,
    invoiceId: id.nullable(),
    quotationId: id.nullable(),
    createdById: id,
    notes: text(2000),
  }),
  quotation: z.object({
    id,
    number: text(32),
    customerId: id,
    date: isoDate,
    validUntil: isoDate,
    status: z.enum(QUOTATION_STATUSES),
    lines,
    total: amount,
    orderId: id.nullable(),
  }),
  invoice: z.object({
    id,
    number: text(32),
    customerId: id,
    orderId: id.nullable(),
    issueDate: isoDate,
    dueDate: isoDate,
    amount,
    status: z.enum(["paid", "unpaid"]),
    paidDate: isoDate.nullable(),
  }),
  expense: z.object({
    id,
    date: isoDate,
    category: z.enum(EXPENSE_CATEGORIES),
    vendor: text(200),
    description: text(500),
    amount,
  }),
  project: z.object({
    id,
    name: text(200),
    customerId: id.nullable(),
    ownerId: id,
    status: z.enum(["active", "planning", "completed"]),
  }),
  task: z.object({
    id,
    title: text(300),
    projectId: id,
    assigneeId: id,
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    dueDate: isoDate,
    completedDate: isoDate.nullable(),
  }),
  activity: z.object({
    id,
    at: isoDateTime,
    kind: z.enum(["order", "invoice", "payment", "contact", "inventory", "task", "quotation", "expense", "system"]),
    message: text(500),
    actorId: id.nullable(),
    href: text(200).nullable(),
  }),
} as const;

/** The two "meta" records: preferences, and which notifications have been read. */
export const META_IDS = ["settings", "read"] as const;
export type MetaId = (typeof META_IDS)[number];

const bool = z.boolean();
export const settingsSchema = z.object({
  businessName: text(100),
  industry: text(100),
  contactEmail: text(254),
  location: text(100),
  currency: z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]),
  theme: z.enum(["light", "dark", "system"]),
  notifications: z.object({ overdueInvoices: bool, lowStock: bool, followUps: bool, tasks: bool, orders: bool }),
  modules: z.object({ copilot: bool, crm: bool, sales: bool, orders: bool, inventory: bool, finance: bool, projects: bool, team: bool, analytics: bool }),
});

export const READ_NOTIFICATIONS_LIMIT = 300;
export const readSchema = z.object({ ids: z.array(text(120)).max(READ_NOTIFICATIONS_LIMIT) });

export function schemaFor(kind: StoredKind, recordId: string) {
  if (kind !== "meta") return recordSchemas[kind];
  return recordId === "settings" ? settingsSchema : recordId === "read" ? readSchema : null;
}

/** Limits on one save request. */
export const MAX_CHANGES_PER_REQUEST = 100;

const kindSchema = z.enum(STORED_KINDS);
export const changesSchema = z.object({
  upserts: z.array(z.object({ kind: kindSchema, id, data: z.record(z.string(), z.unknown()) })).max(MAX_CHANGES_PER_REQUEST),
  deletes: z.array(z.object({ kind: kindSchema, id })).max(MAX_CHANGES_PER_REQUEST),
});
