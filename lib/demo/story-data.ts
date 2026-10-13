import { DEMO_TODAY, diffDays, formatShortDate } from "./dates";
import { usd } from "./format";
import { SEED_DATA } from "./seed";
import {
  computeMetrics,
  customers,
  daysOverdue,
  highlightRecords,
  monthlyTrend,
  stageLabel,
  tasksDueToday,
} from "./selectors";

/**
 * Plain, serialisable facts used by the homepage animation. They are computed
 * on the server from the same sample dataset as the /demo app, so the story and
 * the product always tell the same, internally consistent numbers.
 */
export interface StoryData {
  company: string;
  asOf: string;
  revenueMonth: string;
  ordersMonth: number;
  customers: number;
  openDeals: number;
  outstanding: string;
  overdueCount: number;
  lowStockCount: number;
  invoice: { number: string; customer: string; amount: string; daysOverdue: number; due: string };
  product: { name: string; sku: string; stock: number; threshold: number };
  lead: { company: string; contact: string; value: string; stage: string; followUpDays: number };
  trend: number[];
  tasks: { title: string; done: boolean }[];
  kpis: { label: string; value: string; hint: string }[];
}

export function buildStoryData(): StoryData {
  const data = SEED_DATA;
  const m = computeMetrics(data);
  const h = highlightRecords(data);
  const dueToday = tasksDueToday(data).slice(0, 3);

  const invoice = h.invoice!;
  const product = h.product!;
  const lead = h.lead!;
  const doneTask = data.tasks.find((t) => t.status === "done" && t.completedDate && diffDays(DEMO_TODAY, t.completedDate) <= 7);

  return {
    company: "Meridian Workspace Supply",
    asOf: formatShortDate(DEMO_TODAY),
    revenueMonth: usd.compact(m.revenueMonth),
    ordersMonth: m.ordersMonth,
    customers: customers(data).length,
    openDeals: m.openOppCount,
    outstanding: usd.compact(m.outstandingTotal),
    overdueCount: m.overdueCount,
    lowStockCount: m.lowStockCount,
    invoice: {
      number: invoice.number,
      customer: h.invoiceCustomer?.company ?? "A customer",
      amount: usd.full(invoice.amount),
      daysOverdue: daysOverdue(invoice),
      due: formatShortDate(invoice.dueDate),
    },
    product: { name: product.name, sku: product.sku, stock: product.stock, threshold: product.threshold },
    lead: {
      company: lead.company,
      contact: lead.name,
      value: usd.full(lead.dealValue),
      stage: stageLabel(lead.stage),
      followUpDays: lead.followUpDate ? Math.max(0, diffDays(DEMO_TODAY, lead.followUpDate)) : 0,
    },
    trend: monthlyTrend(data, 9)
      .filter((p) => !p.partial)
      .map((p) => Math.round(p.revenue / 100)),
    tasks: [
      ...dueToday.map((t) => ({ title: t.title, done: false })),
      ...(doneTask ? [{ title: doneTask.title, done: true }] : []),
    ].slice(0, 3),
    kpis: [
      { label: "Revenue this month", value: usd.compact(m.revenueMonth), hint: `${m.ordersMonth} orders` },
      { label: "Outstanding invoices", value: usd.compact(m.outstandingTotal), hint: `${m.overdueCount} overdue` },
      { label: "Open opportunities", value: String(m.openOppCount), hint: usd.compact(m.openOppValue) },
      { label: "Low-stock products", value: String(m.lowStockCount), hint: `${m.outOfStockCount} out of stock` },
    ],
  };
}
