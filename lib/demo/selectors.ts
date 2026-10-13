/**
 * Pure selector functions. Every number shown on a dashboard, chart or in the
 * AI copilot is derived here from the typed `DemoData` records, so the UI and
 * the assistant always agree with each other.
 *
 * ---------------------------------------------------------------------------
 * FUTURE BACKEND NOTE
 * These functions are the natural seam for SQL: each selector becomes a Drizzle
 * query (or a database view) in the next phase, e.g. `computeMetrics` becomes a
 * handful of aggregate queries scoped by `organizationId`.
 * ---------------------------------------------------------------------------
 */
import { DEMO_TODAY, diffDays, formatMonthShort, monthKey, shiftMonth, type ISODate } from "./dates";
import type {
  Contact,
  ContactStage,
  DemoData,
  EntityId,
  Invoice,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  StockStatus,
  Task,
} from "./types";
import { CONTACT_STAGES, ORDER_STATUSES, PRODUCT_CATEGORIES } from "./types";

/* ---------------------------------------------------------------- Lookup -- */

export function indexById<T extends { id: EntityId }>(items: readonly T[]): Map<EntityId, T> {
  return new Map(items.map((i) => [i.id, i]));
}

export const OPEN_STAGES: ContactStage[] = ["qualified", "proposal", "negotiation"];

/* ----------------------------------------------------------------- Stock -- */

/** Low stock = available units are BELOW the product's own reorder threshold. */
export function stockStatus(product: Pick<Product, "stock" | "threshold">): StockStatus {
  if (product.stock <= 0) return "out";
  if (product.stock < product.threshold) return "low";
  return "in_stock";
}

export function lowStockProducts(data: DemoData): Product[] {
  return data.products
    .filter((p) => stockStatus(p) !== "in_stock")
    .sort((a, b) => a.stock / a.threshold - b.stock / b.threshold);
}

/* -------------------------------------------------------------- Invoices -- */

export function isOverdue(invoice: Invoice, today: ISODate = DEMO_TODAY): boolean {
  return invoice.status === "unpaid" && invoice.dueDate < today;
}

export function daysOverdue(invoice: Invoice, today: ISODate = DEMO_TODAY): number {
  return Math.max(0, diffDays(today, invoice.dueDate));
}

export function overdueInvoices(data: DemoData, today: ISODate = DEMO_TODAY): Invoice[] {
  return data.invoices
    .filter((i) => isOverdue(i, today))
    .sort((a, b) => b.amount - a.amount);
}

export type InvoiceDisplayStatus = "paid" | "unpaid" | "overdue";
export function invoiceDisplayStatus(invoice: Invoice, today: ISODate = DEMO_TODAY): InvoiceDisplayStatus {
  if (invoice.status === "paid") return "paid";
  return isOverdue(invoice, today) ? "overdue" : "unpaid";
}

export interface AgingBucket {
  key: "current" | "d1_30" | "d31_60" | "d60_plus";
  label: string;
  amount: number;
  count: number;
}

export function invoiceAging(data: DemoData, today: ISODate = DEMO_TODAY): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { key: "current", label: "Not yet due", amount: 0, count: 0 },
    { key: "d1_30", label: "1–30 days late", amount: 0, count: 0 },
    { key: "d31_60", label: "31–60 days late", amount: 0, count: 0 },
    { key: "d60_plus", label: "60+ days late", amount: 0, count: 0 },
  ];
  for (const inv of data.invoices) {
    if (inv.status !== "unpaid") continue;
    const late = diffDays(today, inv.dueDate);
    const bucket = late <= 0 ? buckets[0] : late <= 30 ? buckets[1] : late <= 60 ? buckets[2] : buckets[3];
    bucket.amount += inv.amount;
    bucket.count += 1;
  }
  return buckets;
}

/* ----------------------------------------------------------------- Tasks -- */

export function isTaskOverdue(task: Task, today: ISODate = DEMO_TODAY): boolean {
  return task.status !== "done" && task.dueDate < today;
}

export function overdueTasks(data: DemoData, today: ISODate = DEMO_TODAY): Task[] {
  return data.tasks.filter((t) => isTaskOverdue(t, today)).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function tasksDueToday(data: DemoData, today: ISODate = DEMO_TODAY): Task[] {
  return data.tasks.filter((t) => t.status !== "done" && t.dueDate === today);
}

/* -------------------------------------------------------------- Contacts -- */

export function customers(data: DemoData): Contact[] {
  return data.contacts.filter((c) => c.stage === "customer");
}

export function openOpportunities(data: DemoData): Contact[] {
  return data.contacts.filter((c) => OPEN_STAGES.includes(c.stage));
}

/** Leads/contacts whose follow-up date has arrived (today or earlier). */
export function followUpsDue(data: DemoData, today: ISODate = DEMO_TODAY): Contact[] {
  return data.contacts
    .filter((c) => c.stage !== "lost" && c.followUpDate !== null && c.followUpDate <= today)
    .sort((a, b) => b.dealValue - a.dealValue);
}

export function pipelineByStage(data: DemoData): { stage: ContactStage; count: number; value: number }[] {
  return CONTACT_STAGES.map((stage) => {
    const rows = data.contacts.filter((c) => c.stage === stage);
    return { stage, count: rows.length, value: rows.reduce((s, c) => s + c.dealValue, 0) };
  });
}

/* ---------------------------------------------------------------- Orders -- */

export function activeOrders(data: DemoData): Order[] {
  return data.orders.filter((o) => o.status !== "cancelled");
}

export function openOrdersAwaiting(data: DemoData): Order[] {
  return data.orders.filter((o) => o.status === "pending");
}

export function ordersByStatus(data: DemoData): { status: OrderStatus; count: number; value: number }[] {
  return ORDER_STATUSES.map((status) => {
    const rows = data.orders.filter((o) => o.status === status);
    return { status, count: rows.length, value: rows.reduce((s, o) => s + o.total, 0) };
  });
}

export function topCustomers(data: DemoData, limit = 5, since?: ISODate): { customer: Contact; revenue: number; orders: number }[] {
  const byCustomer = new Map<EntityId, { revenue: number; orders: number }>();
  for (const o of activeOrders(data)) {
    if (since && o.date < since) continue;
    const cur = byCustomer.get(o.customerId) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    byCustomer.set(o.customerId, cur);
  }
  const contactMap = indexById(data.contacts);
  return [...byCustomer.entries()]
    .map(([id, v]) => ({ customer: contactMap.get(id)!, ...v }))
    .filter((r) => r.customer)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/* --------------------------------------------------------------- Metrics -- */

export interface Metrics {
  revenueMonth: number;
  revenuePrevMonthToDate: number;
  revenueGrowthPct: number | null;
  ordersMonth: number;
  outstandingTotal: number;
  outstandingCount: number;
  overdueTotal: number;
  overdueCount: number;
  openOppCount: number;
  openOppValue: number;
  ordersAwaiting: number;
  lowStockCount: number;
  outOfStockCount: number;
  tasksDueToday: number;
  tasksOverdue: number;
  followUpsDue: number;
}

export function computeMetrics(data: DemoData, today: ISODate = DEMO_TODAY): Metrics {
  const thisMonth = monthKey(today);
  const prevMonth = shiftMonth(thisMonth, -1);
  const dayOfMonth = Number(today.slice(8, 10));

  let revenueMonth = 0;
  let ordersMonth = 0;
  let revenuePrev = 0;
  for (const o of activeOrders(data)) {
    const key = monthKey(o.date);
    if (key === thisMonth) {
      revenueMonth += o.total;
      ordersMonth += 1;
    } else if (key === prevMonth && Number(o.date.slice(8, 10)) <= dayOfMonth) {
      revenuePrev += o.total;
    }
  }

  const unpaid = data.invoices.filter((i) => i.status === "unpaid");
  const overdue = unpaid.filter((i) => isOverdue(i, today));
  const open = openOpportunities(data);

  return {
    revenueMonth,
    revenuePrevMonthToDate: revenuePrev,
    revenueGrowthPct: revenuePrev > 0 ? ((revenueMonth - revenuePrev) / revenuePrev) * 100 : null,
    ordersMonth,
    outstandingTotal: unpaid.reduce((s, i) => s + i.amount, 0),
    outstandingCount: unpaid.length,
    overdueTotal: overdue.reduce((s, i) => s + i.amount, 0),
    overdueCount: overdue.length,
    openOppCount: open.length,
    openOppValue: open.reduce((s, c) => s + c.dealValue, 0),
    ordersAwaiting: data.orders.filter((o) => o.status === "pending").length,
    lowStockCount: data.products.filter((p) => stockStatus(p) !== "in_stock").length,
    outOfStockCount: data.products.filter((p) => stockStatus(p) === "out").length,
    tasksDueToday: tasksDueToday(data, today).length,
    tasksOverdue: overdueTasks(data, today).length,
    followUpsDue: followUpsDue(data, today).length,
  };
}

/* ---------------------------------------------------------------- Trends -- */

export interface MonthlyPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  expenses: number;
  net: number;
  /** True for the current, still-incomplete month. */
  partial: boolean;
}

export function monthlyTrend(data: DemoData, months = 12, today: ISODate = DEMO_TODAY): MonthlyPoint[] {
  const current = monthKey(today);
  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = shiftMonth(current, -i);
    points.push({
      key,
      label: formatMonthShort(key),
      revenue: 0,
      orders: 0,
      expenses: 0,
      net: 0,
      partial: key === current,
    });
  }
  const byKey = new Map(points.map((p) => [p.key, p]));
  for (const o of activeOrders(data)) {
    const p = byKey.get(monthKey(o.date));
    if (p) {
      p.revenue += o.total;
      p.orders += 1;
    }
  }
  for (const e of data.expenses) {
    const p = byKey.get(monthKey(e.date));
    if (p) p.expenses += e.amount;
  }
  for (const p of points) p.net = p.revenue - p.expenses;
  return points;
}

export function revenueByCategory(
  data: DemoData,
  months = 12,
  today: ISODate = DEMO_TODAY,
): { category: ProductCategory; revenue: number; units: number }[] {
  const since = `${shiftMonth(monthKey(today), -(months - 1))}-01`;
  const productMap = indexById(data.products);
  const totals = new Map<ProductCategory, { revenue: number; units: number }>(
    PRODUCT_CATEGORIES.map((c) => [c, { revenue: 0, units: 0 }]),
  );
  for (const o of activeOrders(data)) {
    if (o.date < since) continue;
    for (const line of o.lines) {
      const product = productMap.get(line.productId);
      if (!product) continue;
      const t = totals.get(product.category)!;
      t.revenue += line.quantity * line.unitPrice;
      t.units += line.quantity;
    }
  }
  return PRODUCT_CATEGORIES.map((category) => ({ category, ...totals.get(category)! })).sort(
    (a, b) => b.revenue - a.revenue,
  );
}

export interface FunnelStep {
  stage: ContactStage;
  label: string;
  count: number;
  value: number;
}

const STAGE_LABEL: Record<ContactStage, string> = {
  new: "New lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  customer: "Customer",
  lost: "Lost",
};
export const stageLabel = (stage: ContactStage) => STAGE_LABEL[stage];

/** Cumulative funnel: everyone who reached at least this stage (lost excluded from "reached"). */
export function leadFunnel(data: DemoData): { steps: FunnelStep[]; conversionPct: number | null; lost: number } {
  const order: ContactStage[] = ["new", "qualified", "proposal", "negotiation", "customer"];
  const counts = new Map<ContactStage, { count: number; value: number }>();
  for (const stage of CONTACT_STAGES) counts.set(stage, { count: 0, value: 0 });
  for (const c of data.contacts) {
    const entry = counts.get(c.stage)!;
    entry.count += 1;
    entry.value += c.dealValue;
  }
  const steps: FunnelStep[] = order.map((stage, idx) => {
    const reached = order.slice(idx);
    return {
      stage,
      label: STAGE_LABEL[stage],
      count: reached.reduce((s, st) => s + counts.get(st)!.count, 0),
      value: reached.reduce((s, st) => s + counts.get(st)!.value, 0),
    };
  });
  const lost = counts.get("lost")!.count;
  const pool = steps[0].count + lost;
  const customersCount = counts.get("customer")!.count;
  return { steps, lost, conversionPct: pool > 0 ? (customersCount / pool) * 100 : null };
}

/* --------------------------------------------------------- Hot-spot picks -- */

/** The records the product story and AI insights highlight, always computed from data. */
export function highlightRecords(data: DemoData, today: ISODate = DEMO_TODAY) {
  const customerMap = indexById(data.contacts);
  const invoice = overdueInvoices(data, today)[0] ?? null;
  const lowStock = lowStockProducts(data);
  const product = lowStock.find((p) => stockStatus(p) === "low") ?? lowStock[0] ?? null;
  const due = followUpsDue(data, today);
  const lead = due.find((c) => OPEN_STAGES.includes(c.stage)) ?? due[0] ?? null;
  return {
    invoice,
    invoiceCustomer: invoice ? (customerMap.get(invoice.customerId) ?? null) : null,
    product,
    lead,
  };
}
