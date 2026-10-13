import { DEMO_TODAY, formatShortDate, relativeDay, type ISODate } from "./dates";
import type { MoneyFormatter } from "./format";
import { usd } from "./format";
import {
  daysOverdue,
  followUpsDue,
  indexById,
  lowStockProducts,
  openOrdersAwaiting,
  overdueInvoices,
  overdueTasks,
  stockStatus,
  tasksDueToday,
} from "./selectors";
import type { DemoData, NotificationPrefs, RecordRef } from "./types";

export interface DemoNotification {
  /** Stable key: changes when the underlying situation changes. */
  id: string;
  category: keyof NotificationPrefs;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  record?: RecordRef;
}

/**
 * Notifications are derived from the data (and the user's local preferences),
 * so they appear and disappear as the records change.
 */
export function buildNotifications(
  data: DemoData,
  prefs: NotificationPrefs,
  money: MoneyFormatter = usd,
  today: ISODate = DEMO_TODAY,
): DemoNotification[] {
  const out: DemoNotification[] = [];
  const customers = indexById(data.contacts);

  if (prefs.overdueInvoices) {
    for (const inv of overdueInvoices(data, today).slice(0, 4)) {
      out.push({
        id: `inv:${inv.id}`,
        category: "overdueInvoices",
        tone: "danger",
        title: `${inv.number} is ${daysOverdue(inv, today)} days overdue`,
        detail: `${customers.get(inv.customerId)?.company ?? "Customer"} · ${money.full(inv.amount)}`,
        href: "/demo/finance",
        record: { kind: "invoice", id: inv.id },
      });
    }
  }
  if (prefs.lowStock) {
    for (const p of lowStockProducts(data).slice(0, 4)) {
      out.push({
        id: `stock:${p.id}:${p.stock}`,
        category: "lowStock",
        tone: stockStatus(p) === "out" ? "danger" : "warning",
        title: stockStatus(p) === "out" ? `${p.name} is out of stock` : `${p.name} is below threshold`,
        detail: `${p.stock} available · reorder level ${p.threshold}`,
        href: "/demo/inventory",
        record: { kind: "product", id: p.id },
      });
    }
  }
  if (prefs.followUps) {
    for (const c of followUpsDue(data, today).slice(0, 3)) {
      out.push({
        id: `fu:${c.id}:${c.followUpDate}`,
        category: "followUps",
        tone: "warning",
        title: `Follow up with ${c.company}`,
        detail: `${c.name} · due ${relativeDay(c.followUpDate!, today).toLowerCase()}`,
        href: "/demo/crm",
        record: { kind: "contact", id: c.id },
      });
    }
  }
  if (prefs.tasks) {
    const late = overdueTasks(data, today).length;
    const due = tasksDueToday(data, today).length;
    if (late + due > 0) {
      out.push({
        id: `tasks:${late}:${due}`,
        category: "tasks",
        tone: late ? "warning" : "info",
        title: `${due} task${due === 1 ? "" : "s"} due today, ${late} overdue`,
        detail: `As of ${formatShortDate(today)}`,
        href: "/demo/projects",
      });
    }
  }
  if (prefs.orders) {
    const pending = openOrdersAwaiting(data);
    if (pending.length > 0) {
      out.push({
        id: `orders:${pending.map((o) => o.id).join(",")}`,
        category: "orders",
        tone: "info",
        title: `${pending.length} order${pending.length === 1 ? "" : "s"} awaiting processing`,
        detail: pending.slice(0, 2).map((o) => o.number).join(", "),
        href: "/demo/orders",
      });
    }
  }
  return out;
}
