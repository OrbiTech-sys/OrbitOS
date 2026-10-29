"use client";

/**
 * Lightweight workspace state container, shared by the public demo and a
 * signed-in member's own workspace.
 *
 * - One external store per <DemoProvider>, read through useSyncExternalStore.
 * - State changes are expressed as pure "transitions" (state => state), which
 *   keeps every business rule (stock reservation, invoice creation, activity
 *   log, ...) in one testable place and lets actions return a result
 *   synchronously (e.g. the created order number for a toast).
 * - What differs between the two uses is a StoreConfig: the demo runs on a
 *   fixed date with counter ids and saves nothing (refreshing restores the
 *   seed data); a member's workspace uses the real clock and unique ids, and
 *   reports every change through `onChange` so it can be saved to the database
 *   (see lib/workspace). UI *preferences* live separately in `settings.ts`.
 */
import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { DEMO_TODAY, addDays, type ISODate } from "./dates";
import { SEED_DATA, sumLines } from "./seed";
import { RECORD_ROUTE } from "./search";
import { indexById, stockStatus } from "./selectors";
import type {
  Activity,
  ActivityKind,
  Contact,
  ContactStage,
  DemoData,
  EntityId,
  Expense,
  ExpenseCategory,
  Invoice,
  LineItem,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Project,
  ProjectStatus,
  Quotation,
  QuotationStatus,
  RecordKind,
  RecordRef,
  Task,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from "./types";

/* ------------------------------------------------------------------ State -- */

type CounterKey = "contact" | "order" | "invoice" | "quotation" | "product" | "task" | "expense" | "activity" | "project" | "team";

export interface DemoState {
  data: DemoData;
  counters: Record<CounterKey, number>;
  /** Simulated clock: minutes elapsed since 17:00 on the demo date (after the latest seeded activity). */
  tick: number;
  readNotifications: string[];
  /** Record currently opened in a drawer/sheet (set by search, notifications, copilot). */
  openRecord: RecordRef | null;
}

/** What differs between the demo and a member's workspace. */
export interface StoreConfig {
  /** Today's date, for the dates on new records. */
  today(): ISODate;
  /** Timestamp for a new activity-log entry, or null to use the demo's simulated clock. */
  now(): string | null;
  /** Id for a new record (and the counters after taking it). */
  newId(state: DemoState, key: CounterKey, prefix: string): { id: string; counters: DemoState["counters"] };
  /** Team members that records are attributed to. */
  actors: { default: EntityId; finance: EntityId; inventory: EntityId };
  /** Whether "reset" may restore the starting data (the demo only). */
  resettable: boolean;
  /** True for the public demo: its log entries carry "demo only" caveats that a real workspace must not. */
  demo: boolean;
}

function maxSuffix(ids: string[]): number {
  return ids.reduce((max, id) => Math.max(max, Number(id.split("-").pop()) || 0), 0);
}

export function createInitialState(data: DemoData = SEED_DATA, readNotifications: string[] = []): DemoState {
  const d = data;
  return {
    data: d,
    counters: {
      contact: maxSuffix(d.contacts.map((c) => c.id)),
      order: maxSuffix(d.orders.map((o) => o.id)),
      invoice: maxSuffix(d.invoices.map((i) => i.id)),
      quotation: maxSuffix(d.quotations.map((q) => q.id)),
      product: maxSuffix(d.products.map((p) => p.id)),
      task: maxSuffix(d.tasks.map((t) => t.id)),
      expense: maxSuffix(d.expenses.map((e) => e.id)),
      activity: maxSuffix(d.activities.map((a) => a.id)),
      project: maxSuffix(d.projects.map((p) => p.id)),
      team: maxSuffix(d.team.map((t) => t.id)),
    },
    tick: 0,
    readNotifications,
    openRecord: null,
  };
}

const pad = (n: number, w = 3) => String(n).padStart(w, "0");
const MAX_ACTIVITIES = 40;

function counterId(state: DemoState, key: CounterKey, prefix: string): { id: string; counters: DemoState["counters"] } {
  const n = state.counters[key] + 1;
  return { id: `${prefix}-${pad(n)}`, counters: { ...state.counters, [key]: n } };
}

/** The public demo: fixed date, counter ids, three fictional teammates, resettable. */
export const DEMO_CONFIG: StoreConfig = {
  today: () => DEMO_TODAY,
  now: () => null,
  newId: counterId,
  actors: { default: "tm-alex", finance: "tm-sofia", inventory: "tm-daniel" },
  resettable: true,
  demo: true,
};

function nextNumber(items: { number: string }[], prefix: string, base: number): string {
  const max = items.reduce((m, i) => Math.max(m, Number(i.number.replace(/\D/g, "")) || 0), base - 1);
  return `${prefix}-${max + 1}`;
}

function withActivity(
  state: DemoState,
  kind: ActivityKind,
  message: string,
  href: string | null,
  actorId: EntityId | null,
  config: StoreConfig,
): DemoState {
  const tick = state.tick + 1;
  const minutes = 17 * 60 + tick;
  const at = config.now() ?? `${DEMO_TODAY}T${pad(Math.floor(minutes / 60), 2)}:${pad(minutes % 60, 2)}`;
  const { id, counters } = config.newId(state, "activity", "act");
  const activity: Activity = { id, at, kind, message, actorId, href };
  return {
    ...state,
    tick,
    counters,
    data: { ...state.data, activities: [activity, ...state.data.activities].slice(0, MAX_ACTIVITIES) },
  };
}

/* ------------------------------------------------------------------ Store -- */

type Transition = (state: DemoState) => DemoState;

export interface DemoStore {
  getState: () => DemoState;
  subscribe: (listener: () => void) => () => void;
  update: (transition: Transition) => void;
}

/** Exported for tests and the provider; screens use the hooks below. */
export function createStore(initial: DemoState, onChange?: (prev: DemoState, next: DemoState) => void): DemoStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(transition) {
      const prev = state;
      const next = transition(prev);
      if (next === prev) return;
      state = next;
      listeners.forEach((l) => l());
      onChange?.(prev, next);
    },
  };
}

/* ---------------------------------------------------------------- Actions -- */

export type ActionResult<T = undefined> = { ok: true; value: T } | { ok: false; error: string };
const ok = <T,>(value: T): ActionResult<T> => ({ ok: true, value });
const fail = <T = undefined,>(error: string): ActionResult<T> => ({ ok: false, error });

export interface NewContactInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  jobTitle: string;
  stage: ContactStage;
  dealValue: number;
  followUpDate: string | null;
  ownerId: EntityId;
  source: string;
  notes: string;
}

export interface NewProductInput {
  name: string;
  sku: string;
  category: ProductCategory;
  stock: number;
  threshold: number;
  unitPrice: number;
  unitCost: number;
  supplier: string;
}

export interface NewTaskInput {
  title: string;
  projectId: EntityId;
  assigneeId: EntityId;
  priority: TaskPriority;
  dueDate: string;
}

export interface NewProjectInput {
  name: string;
  customerId: EntityId | null;
  status: ProjectStatus;
}

export interface NewTeamMemberInput {
  name: string;
  role: string;
  email: string;
}

export interface NewExpenseInput {
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amount: number;
}

export interface NewOrderInput {
  customerId: EntityId;
  lines: { productId: EntityId; quantity: number }[];
  notes?: string;
  quotationId?: EntityId | null;
  /** Also issue an invoice immediately (used by the connected-workflow flows). */
  createInvoice?: boolean;
}

export interface NewQuotationInput {
  customerId: EntityId;
  lines: { productId: EntityId; quantity: number }[];
  validDays: number;
  send: boolean;
}

export interface DemoActions {
  addContact(input: NewContactInput): ActionResult<Contact>;
  setContactStage(id: EntityId, stage: ContactStage): void;
  updateContact(id: EntityId, patch: Partial<Pick<Contact, "followUpDate" | "notes" | "dealValue">>): void;
  logContactActivity(id: EntityId): void;

  createOrder(input: NewOrderInput): ActionResult<Order>;
  setOrderStatus(id: EntityId, status: OrderStatus): ActionResult;
  createInvoiceForOrder(orderId: EntityId): ActionResult<Invoice>;

  createQuotation(input: NewQuotationInput): ActionResult<Quotation>;
  setQuotationStatus(id: EntityId, status: QuotationStatus): void;
  convertQuotationToOrder(id: EntityId): ActionResult<Order>;

  markInvoicePaid(id: EntityId): void;
  addExpense(input: NewExpenseInput): ActionResult<Expense>;

  addProduct(input: NewProductInput): ActionResult<Product>;
  adjustStock(productId: EntityId, delta: number, reason: string): ActionResult<Product>;
  setThreshold(productId: EntityId, threshold: number): void;
  createReorderTask(productId: EntityId): ActionResult<Task>;

  addProject(input: NewProjectInput): ActionResult<Project>;
  addTeamMember(input: NewTeamMemberInput): ActionResult<TeamMember>;
  addTask(input: NewTaskInput): ActionResult<Task>;
  setTaskStatus(id: EntityId, status: TaskStatus): void;

  markNotificationsRead(ids: string[]): void;
  open(kind: RecordKind, id: EntityId): void;
  closeRecord(): void;
  /** Close the open record if it does not belong to the page now showing (e.g. after browser Back). */
  syncRecordToRoute(pathname: string): void;
  reset(): void;
}

const TERMS_DAYS = 30;

function buildLines(state: DemoState, inputs: { productId: EntityId; quantity: number }[]): ActionResult<LineItem[]> {
  const products = indexById(state.data.products);
  const merged = new Map<EntityId, number>();
  for (const l of inputs) {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) return fail("Quantities must be whole numbers greater than zero.");
    merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);
  }
  if (merged.size === 0) return fail("Add at least one product.");
  const lines: LineItem[] = [];
  for (const [productId, quantity] of merged) {
    const product = products.get(productId);
    if (!product) return fail("A selected product no longer exists.");
    lines.push({ productId, quantity, unitPrice: product.unitPrice });
  }
  return ok(lines);
}

export function createActions(store: DemoStore, config: StoreConfig): DemoActions {
  const get = () => store.getState();
  const { actors } = config;
  const today = () => config.today();
  const newId = (state: DemoState, key: CounterKey, prefix: string) => config.newId(state, key, prefix);
  const act = (state: DemoState, kind: ActivityKind, message: string, href: string | null, actorId: EntityId | null = actors.default) =>
    withActivity(state, kind, message, href, actorId, config);
  const customerName = (state: DemoState, id: EntityId) => state.data.contacts.find((c) => c.id === id)?.company ?? "customer";

  /** Insert an order (and optionally its invoice), reserving stock. Pure helper. */
  function placeOrder(state: DemoState, input: NewOrderInput, lines: LineItem[]): { state: DemoState; order: Order } {
    const { id, counters } = newId(state, "order", "ord");
    let next: DemoState = { ...state, counters };
    const order: Order = {
      id,
      number: nextNumber(state.data.orders, "ORD", 1001),
      customerId: input.customerId,
      date: today(),
      status: "pending",
      lines,
      total: sumLines(lines),
      invoiceId: null,
      quotationId: input.quotationId ?? null,
      createdById: actors.default,
      notes: input.notes?.trim() ?? "",
    };
    const reserved = new Map(lines.map((l) => [l.productId, l.quantity]));
    next = {
      ...next,
      data: {
        ...next.data,
        orders: [...next.data.orders, order],
        products: next.data.products.map((p) =>
          reserved.has(p.id) ? { ...p, stock: p.stock - (reserved.get(p.id) ?? 0) } : p,
        ),
      },
    };
    next = act(next, "order", `Order ${order.number} created for ${customerName(next, order.customerId)}`, "/demo/orders");
    // Stock warnings caused by this order are surfaced in the activity log.
    for (const l of lines) {
      const before = state.data.products.find((p) => p.id === l.productId)!;
      const after = next.data.products.find((p) => p.id === l.productId)!;
      if (stockStatus(before) === "in_stock" && stockStatus(after) !== "in_stock") {
        next = act(next, "inventory", `Stock alert: ${after.name} fell below its threshold (${after.stock} left)`, "/demo/inventory", null);
      }
    }
    return { state: next, order };
  }

  function issueInvoice(state: DemoState, orderId: EntityId): { state: DemoState; invoice: Invoice } | null {
    const order = state.data.orders.find((o) => o.id === orderId);
    if (!order || order.invoiceId || order.status === "cancelled") return null;
    const { id, counters } = newId(state, "invoice", "inv");
    const invoice: Invoice = {
      id,
      number: nextNumber(state.data.invoices, "INV", 2001),
      customerId: order.customerId,
      orderId: order.id,
      issueDate: today(),
      dueDate: addDays(today(), TERMS_DAYS),
      amount: order.total,
      status: "unpaid",
      paidDate: null,
    };
    let next: DemoState = {
      ...state,
      counters,
      data: {
        ...state.data,
        invoices: [...state.data.invoices, invoice],
        orders: state.data.orders.map((o) => (o.id === orderId ? { ...o, invoiceId: id } : o)),
      },
    };
    next = act(next, "invoice", `Invoice ${invoice.number} created for ${order.number}${config.demo ? " (demo, no accounting entry)" : ""}`, "/demo/finance", actors.finance);
    return { state: next, invoice };
  }

  return {
    addContact(input) {
      let created: Contact | null = null;
      store.update((state) => {
        const { id, counters } = newId(state, "contact", "ctc");
        created = {
          id,
          name: input.name.trim(),
          company: input.company.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          jobTitle: input.jobTitle.trim(),
          stage: input.stage,
          dealValue: input.dealValue,
          lastContact: today(),
          followUpDate: input.followUpDate,
          ownerId: input.ownerId,
          source: input.source.trim() || "Manual entry",
          notes: input.notes.trim(),
          createdAt: today(),
        };
        const next: DemoState = { ...state, counters, data: { ...state.data, contacts: [created, ...state.data.contacts] } };
        return act(next, "contact", `New contact added: ${created.name} (${created.company})`, "/demo/crm");
      });
      return created ? ok(created as Contact) : fail("Could not add the contact.");
    },

    setContactStage(id, stage) {
      store.update((state) => {
        const contact = state.data.contacts.find((c) => c.id === id);
        if (!contact || contact.stage === stage) return state;
        const next: DemoState = {
          ...state,
          data: {
            ...state.data,
            contacts: state.data.contacts.map((c) =>
              c.id === id ? { ...c, stage, followUpDate: stage === "lost" ? null : c.followUpDate } : c,
            ),
          },
        };
        return act(next, "contact", `${contact.company} moved from ${contact.stage} to ${stage}`, "/demo/crm");
      });
    },

    updateContact(id, patch) {
      store.update((state) => ({
        ...state,
        data: { ...state.data, contacts: state.data.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
      }));
    },

    logContactActivity(id) {
      store.update((state) => {
        const contact = state.data.contacts.find((c) => c.id === id);
        if (!contact) return state;
        const next: DemoState = {
          ...state,
          data: {
            ...state.data,
            contacts: state.data.contacts.map((c) =>
              c.id === id
                ? {
                    ...c,
                    lastContact: today(),
                    followUpDate: c.stage === "lost" ? null : addDays(today(), 7),
                  }
                : c,
            ),
          },
        };
        return act(next, "contact", `Contact logged with ${contact.name} (${contact.company}); next follow-up in 7 days`, "/demo/crm");
      });
    },

    createOrder(input) {
      const state = get();
      const customer = state.data.contacts.find((c) => c.id === input.customerId);
      if (!customer) return fail("Choose a customer.");
      const built = buildLines(state, input.lines);
      if (!built.ok) return fail(built.error);
      const products = indexById(state.data.products);
      for (const l of built.value) {
        const p = products.get(l.productId)!;
        if (l.quantity > p.stock) {
          return fail(`Only ${p.stock} unit${p.stock === 1 ? "" : "s"} of ${p.name} available.`);
        }
      }
      let created: Order | null = null;
      store.update((s) => {
        const placed = placeOrder(s, input, built.value);
        let next = placed.state;
        created = placed.order;
        if (input.createInvoice) {
          const issued = issueInvoice(next, placed.order.id);
          if (issued) {
            next = issued.state;
            created = next.data.orders.find((o) => o.id === placed.order.id) ?? placed.order;
          }
        }
        return next;
      });
      return created ? ok(created as Order) : fail("Could not create the order.");
    },

    setOrderStatus(id, status) {
      const state = get();
      const order = state.data.orders.find((o) => o.id === id);
      if (!order) return fail("Order not found.");
      if (order.status === "cancelled") return fail("Cancelled orders cannot be changed.");
      if (order.status === status) return ok(undefined);
      store.update((s) => {
        const restock = status === "cancelled" ? new Map(order.lines.map((l) => [l.productId, l.quantity])) : null;
        const next: DemoState = {
          ...s,
          data: {
            ...s.data,
            orders: s.data.orders.map((o) => (o.id === id ? { ...o, status } : o)),
            products: restock
              ? s.data.products.map((p) => (restock.has(p.id) ? { ...p, stock: p.stock + (restock.get(p.id) ?? 0) } : p))
              : s.data.products,
          },
        };
        return act(
          next,
          "order",
          status === "cancelled" ? `Order ${order.number} cancelled; stock returned to inventory` : `Order ${order.number} marked ${status}`,
          "/demo/orders",
        );
      });
      return ok(undefined);
    },

    createInvoiceForOrder(orderId) {
      let created: Invoice | null = null;
      store.update((s) => {
        const issued = issueInvoice(s, orderId);
        if (!issued) return s;
        created = issued.invoice;
        return issued.state;
      });
      return created ? ok(created as Invoice) : fail("An invoice cannot be created for this order.");
    },

    createQuotation(input) {
      const state = get();
      const customer = state.data.contacts.find((c) => c.id === input.customerId);
      if (!customer) return fail("Choose a contact.");
      const built = buildLines(state, input.lines);
      if (!built.ok) return fail(built.error);
      let created: Quotation | null = null;
      store.update((s) => {
        const { id, counters } = newId(s, "quotation", "quo");
        const quotation: Quotation = {
          id,
          number: nextNumber(s.data.quotations, "QUO", 3001),
          customerId: input.customerId,
          date: today(),
          validUntil: addDays(today(), input.validDays),
          status: input.send ? "sent" : "draft",
          lines: built.value,
          total: sumLines(built.value),
          orderId: null,
        };
        created = quotation;
        const next: DemoState = { ...s, counters, data: { ...s.data, quotations: [quotation, ...s.data.quotations] } };
        return act(next, "quotation", `Quotation ${quotation.number} ${input.send ? "sent to" : "drafted for"} ${customer.company}`, "/demo/sales");
      });
      return created ? ok(created as Quotation) : fail("Could not create the quotation.");
    },

    setQuotationStatus(id, status) {
      store.update((state) => {
        const q = state.data.quotations.find((x) => x.id === id);
        if (!q || q.status === status) return state;
        const next: DemoState = {
          ...state,
          data: { ...state.data, quotations: state.data.quotations.map((x) => (x.id === id ? { ...x, status } : x)) },
        };
        return act(next, "quotation", `Quotation ${q.number} marked ${status}`, "/demo/sales");
      });
    },

    convertQuotationToOrder(id) {
      const state = get();
      const q = state.data.quotations.find((x) => x.id === id);
      if (!q) return fail("Quotation not found.");
      if (q.orderId) return fail("This quotation has already been converted to an order.");
      const customer = state.data.contacts.find((c) => c.id === q.customerId);
      if (!customer) return fail("Customer not found.");
      const products = indexById(state.data.products);
      for (const l of q.lines) {
        const p = products.get(l.productId);
        if (!p) return fail("A product on this quotation no longer exists.");
        if (l.quantity > p.stock) return fail(`Only ${p.stock} unit${p.stock === 1 ? "" : "s"} of ${p.name} available for this order.`);
      }
      let created: Order | null = null;
      store.update((s) => {
        // Accepting a quotation from a lead also converts the lead into a customer.
        let working: DemoState = s;
        if (customer.stage !== "customer") {
          working = {
            ...working,
            data: {
              ...working.data,
              contacts: working.data.contacts.map((c) => (c.id === customer.id ? { ...c, stage: "customer" as const } : c)),
            },
          };
          working = act(working, "contact", `${customer.company} became a customer`, "/demo/crm");
        }
        const placed = placeOrder(working, { customerId: q.customerId, lines: q.lines, quotationId: q.id }, q.lines.map((l) => ({ ...l })));
        created = placed.order;
        return {
          ...placed.state,
          data: {
            ...placed.state.data,
            quotations: placed.state.data.quotations.map((x) =>
              x.id === id ? { ...x, status: "accepted" as const, orderId: placed.order.id } : x,
            ),
          },
        };
      });
      return created ? ok(created as Order) : fail("Could not create the order.");
    },

    markInvoicePaid(id) {
      store.update((state) => {
        const inv = state.data.invoices.find((i) => i.id === id);
        if (!inv || inv.status === "paid") return state;
        const next: DemoState = {
          ...state,
          data: {
            ...state.data,
            invoices: state.data.invoices.map((i) => (i.id === id ? { ...i, status: "paid" as const, paidDate: today() } : i)),
          },
        };
        return act(next, "payment", `Invoice ${inv.number} marked as paid${config.demo ? " (demo only, no payment processed)" : ""}`, "/demo/finance", actors.finance);
      });
    },

    addExpense(input) {
      let created: Expense | null = null;
      store.update((state) => {
        const { id, counters } = newId(state, "expense", "exp");
        created = { id, ...input, vendor: input.vendor.trim(), description: input.description.trim() };
        const next: DemoState = { ...state, counters, data: { ...state.data, expenses: [created, ...state.data.expenses] } };
        return act(next, "expense", `Expense recorded: ${input.vendor.trim()} (${input.category})`, "/demo/finance", actors.finance);
      });
      return created ? ok(created as Expense) : fail("Could not add the expense.");
    },

    addProduct(input) {
      const state = get();
      if (state.data.products.some((p) => p.sku.toLowerCase() === input.sku.trim().toLowerCase())) {
        return fail(`SKU ${input.sku.trim()} already exists.`);
      }
      let created: Product | null = null;
      store.update((s) => {
        const { id, counters } = newId(s, "product", "prd");
        created = { id, ...input, name: input.name.trim(), sku: input.sku.trim().toUpperCase(), supplier: input.supplier.trim() || "Unassigned" };
        const next: DemoState = { ...s, counters, data: { ...s.data, products: [...s.data.products, created] } };
        return act(next, "inventory", `Product added: ${created.name} (${created.sku})`, "/demo/inventory", actors.inventory);
      });
      return created ? ok(created as Product) : fail("Could not add the product.");
    },

    adjustStock(productId, delta, reason) {
      const state = get();
      const product = state.data.products.find((p) => p.id === productId);
      if (!product) return fail("Product not found.");
      if (!Number.isInteger(delta) || delta === 0) return fail("Enter a non-zero whole number.");
      if (product.stock + delta < 0) return fail(`Stock cannot go below zero (currently ${product.stock}).`);
      let updated: Product = product;
      store.update((s) => {
        updated = { ...product, stock: product.stock + delta };
        let next: DemoState = {
          ...s,
          data: { ...s.data, products: s.data.products.map((p) => (p.id === productId ? updated : p)) },
        };
        next = act(
          next,
          "inventory",
          `Stock adjusted: ${product.name} ${delta > 0 ? "+" : ""}${delta}${reason ? ` (${reason})` : ""}, now ${updated.stock}`,
          "/demo/inventory",
          actors.inventory,
        );
        if (stockStatus(product) === "in_stock" && stockStatus(updated) !== "in_stock") {
          next = act(next, "inventory", `Stock alert: ${product.name} fell below its threshold (${updated.stock} left)`, "/demo/inventory", null);
        }
        return next;
      });
      return ok(updated);
    },

    setThreshold(productId, threshold) {
      if (!Number.isInteger(threshold) || threshold < 0) return;
      store.update((state) => ({
        ...state,
        data: { ...state.data, products: state.data.products.map((p) => (p.id === productId ? { ...p, threshold } : p)) },
      }));
    },

    createReorderTask(productId) {
      const state = get();
      const product = state.data.products.find((p) => p.id === productId);
      if (!product) return fail("Product not found.");
      if (state.data.tasks.some((t) => t.status !== "done" && t.title === `Reorder ${product.name}`)) {
        return fail(`A reorder task for ${product.name} already exists.`);
      }
      let created: Task | null = null;
      store.update((s0) => {
        // Reorders live in a restock project; a workspace that has none yet gets one.
        let s = s0;
        let restock = s.data.projects.find((p) => p.name === "Q4 inventory restock") ?? s.data.projects.find((p) => p.name === "Inventory restock") ?? s.data.projects[0];
        if (!restock) {
          const made = newId(s, "project", "prj");
          restock = { id: made.id, name: "Inventory restock", customerId: null, ownerId: actors.inventory, status: "active" };
          s = { ...s, counters: made.counters, data: { ...s.data, projects: [...s.data.projects, restock] } };
        }
        const { id, counters } = newId(s, "task", "tsk");
        created = {
          id,
          title: `Reorder ${product.name}`,
          projectId: restock.id,
          assigneeId: actors.inventory,
          status: "todo",
          priority: stockStatus(product) === "out" ? "high" : "medium",
          dueDate: addDays(today(), 2),
          completedDate: null,
        };
        const next: DemoState = { ...s, counters, data: { ...s.data, tasks: [created, ...s.data.tasks] } };
        return act(next, "task", `Reorder task created for ${product.name}`, "/demo/projects", actors.inventory);
      });
      return created ? ok(created as Task) : fail("Could not create the task.");
    },

    addProject(input) {
      const name = input.name.trim();
      if (!name) return fail("Give the project a name.");
      if (get().data.projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) return fail(`A project called ${name} already exists.`);
      let created: Project | null = null;
      store.update((state) => {
        const { id, counters } = newId(state, "project", "prj");
        created = { id, name, customerId: input.customerId, ownerId: actors.default, status: input.status };
        const next: DemoState = { ...state, counters, data: { ...state.data, projects: [...state.data.projects, created] } };
        return act(next, "task", `Project created: ${name}`, "/demo/projects");
      });
      return created ? ok(created as Project) : fail("Could not add the project.");
    },

    addTeamMember(input) {
      const name = input.name.trim();
      if (!name) return fail("Enter a name.");
      const email = input.email.trim();
      if (email && get().data.team.some((t) => t.email.toLowerCase() === email.toLowerCase())) return fail(`${email} is already on the team.`);
      let created: TeamMember | null = null;
      store.update((state) => {
        const { id, counters } = newId(state, "team", "tm");
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
        const tones = ["indigo", "sky", "emerald", "amber", "rose", "violet"] as const;
        created = { id, name, role: input.role.trim() || "Team member", email, initials, tone: tones[state.data.team.length % tones.length] };
        const next: DemoState = { ...state, counters, data: { ...state.data, team: [...state.data.team, created] } };
        return act(next, "system", `${name} was added to the team`, "/demo/team");
      });
      return created ? ok(created as TeamMember) : fail("Could not add the team member.");
    },

    addTask(input) {
      let created: Task | null = null;
      store.update((state) => {
        const { id, counters } = newId(state, "task", "tsk");
        created = { id, ...input, title: input.title.trim(), status: "todo", completedDate: null };
        const next: DemoState = { ...state, counters, data: { ...state.data, tasks: [created, ...state.data.tasks] } };
        return act(next, "task", `Task added: ${created.title}`, "/demo/projects");
      });
      return created ? ok(created as Task) : fail("Could not add the task.");
    },

    setTaskStatus(id, status) {
      store.update((state) => {
        const task = state.data.tasks.find((t) => t.id === id);
        if (!task || task.status === status) return state;
        const next: DemoState = {
          ...state,
          data: {
            ...state.data,
            tasks: state.data.tasks.map((t) =>
              t.id === id ? { ...t, status, completedDate: status === "done" ? today() : null } : t,
            ),
          },
        };
        return status === "done"
          ? act(next, "task", `Task completed: ${task.title}`, "/demo/projects")
          : next;
      });
    },

    markNotificationsRead(ids) {
      store.update((state) => ({
        ...state,
        readNotifications: [...new Set([...state.readNotifications, ...ids])],
      }));
    },

    open(kind, id) {
      store.update((state) => ({ ...state, openRecord: { kind, id } }));
    },
    closeRecord() {
      store.update((state) => (state.openRecord ? { ...state, openRecord: null } : state));
    },
    syncRecordToRoute(pathname) {
      store.update((state) =>
        state.openRecord && !pathname.startsWith(RECORD_ROUTE[state.openRecord.kind]) ? { ...state, openRecord: null } : state,
      );
    },
    reset() {
      if (config.resettable) store.update(() => createInitialState());
    },
  };
}

/* ---------------------------------------------------------------- Context -- */

interface DemoContextValue {
  store: DemoStore;
  actions: DemoActions;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export interface DemoProviderProps {
  children: React.ReactNode;
  /** Starting records and read notifications. Defaults to the demo's seed data. */
  initial?: { data: DemoData; readNotifications?: string[] };
  /** Defaults to the public demo's rules. */
  config?: StoreConfig;
  /** Called after every change, with the state before and after (a workspace saves the difference). */
  onChange?: (prev: DemoState, next: DemoState) => void;
}

export function DemoProvider({ children, initial, config = DEMO_CONFIG, onChange }: DemoProviderProps) {
  // The store is created once per mount; later changes to the props are ignored on purpose.
  const [value] = useState<DemoContextValue>(() => {
    const store = createStore(createInitialState(initial?.data, initial?.readNotifications), onChange);
    return { store, actions: createActions(store, config) };
  });
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Demo hooks must be used inside <DemoProvider>.");
  return ctx;
}

function useDemoState(): DemoState {
  const { store } = useDemoContext();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** All records of the demo workspace. Re-renders on any change. */
export function useDemoData(): DemoData {
  return useDemoState().data;
}

export function useDemoActions(): DemoActions {
  return useDemoContext().actions;
}

export function useReadNotifications(): string[] {
  return useDemoState().readNotifications;
}

/** Id of the record of `kind` currently opened in a drawer (if any). */
export function useOpenRecord(kind: RecordKind): string | null {
  const open = useDemoState().openRecord;
  return open && open.kind === kind ? open.id : null;
}

export function useDemoLookups() {
  const data = useDemoData();
  return useMemo(
    () => ({
      contacts: indexById(data.contacts),
      products: indexById(data.products),
      orders: indexById(data.orders),
      invoices: indexById(data.invoices),
      quotations: indexById(data.quotations),
      tasks: indexById(data.tasks),
      team: indexById(data.team),
      projects: indexById(data.projects),
    }),
    [data],
  );
}
