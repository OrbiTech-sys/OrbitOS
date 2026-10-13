import type { MoneyFormatter } from "./format";
import { usd } from "./format";
import { indexById } from "./selectors";
import type { DemoData, RecordRef } from "./types";

export interface SearchResult {
  ref: RecordRef;
  title: string;
  subtitle: string;
  /** Route the record lives on. */
  href: string;
  score: number;
}

export const SEARCH_GROUP_LABEL: Record<RecordRef["kind"], string> = {
  contact: "Contacts",
  order: "Orders",
  invoice: "Invoices",
  product: "Products",
  task: "Tasks",
  quotation: "Quotations",
};

export const RECORD_ROUTE: Record<RecordRef["kind"], string> = {
  contact: "/demo/crm",
  order: "/demo/orders",
  invoice: "/demo/finance",
  product: "/demo/inventory",
  task: "/demo/projects",
  quotation: "/demo/sales",
};

function score(haystacks: string[], query: string): number {
  let best = 0;
  for (const h of haystacks) {
    const text = h.toLowerCase();
    if (text === query) best = Math.max(best, 100);
    else if (text.startsWith(query)) best = Math.max(best, 80);
    else if (text.split(/[\s\-_/&]+/).some((w) => w.startsWith(query))) best = Math.max(best, 60);
    else if (text.includes(query)) best = Math.max(best, 40);
  }
  return best;
}

/** Global search across the demo dataset (client side, in-memory). */
export function searchAll(data: DemoData, rawQuery: string, money: MoneyFormatter = usd, limitPerGroup = 4): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 2) return [];
  const customers = indexById(data.contacts);
  const results: SearchResult[] = [];

  for (const c of data.contacts) {
    const s = score([c.name, c.company, c.email], query);
    if (s) results.push({ ref: { kind: "contact", id: c.id }, title: c.name, subtitle: `${c.company} · ${c.stage}`, href: RECORD_ROUTE.contact, score: s });
  }
  for (const o of data.orders) {
    const customer = customers.get(o.customerId)?.company ?? "";
    const s = score([o.number, customer], query);
    if (s) results.push({ ref: { kind: "order", id: o.id }, title: o.number, subtitle: `${customer} · ${money.full(o.total)}`, href: RECORD_ROUTE.order, score: s });
  }
  for (const i of data.invoices) {
    const customer = customers.get(i.customerId)?.company ?? "";
    const s = score([i.number, customer], query);
    if (s) results.push({ ref: { kind: "invoice", id: i.id }, title: i.number, subtitle: `${customer} · ${money.full(i.amount)} · ${i.status}`, href: RECORD_ROUTE.invoice, score: s });
  }
  for (const p of data.products) {
    const s = score([p.name, p.sku, p.category], query);
    if (s) results.push({ ref: { kind: "product", id: p.id }, title: p.name, subtitle: `${p.sku} · ${p.stock} in stock`, href: RECORD_ROUTE.product, score: s });
  }
  for (const t of data.tasks) {
    const s = score([t.title], query);
    if (s) results.push({ ref: { kind: "task", id: t.id }, title: t.title, subtitle: `Due ${t.dueDate} · ${t.status.replace("_", " ")}`, href: RECORD_ROUTE.task, score: s });
  }
  for (const q of data.quotations) {
    const customer = customers.get(q.customerId)?.company ?? "";
    const s = score([q.number, customer], query);
    if (s) results.push({ ref: { kind: "quotation", id: q.id }, title: q.number, subtitle: `${customer} · ${money.full(q.total)} · ${q.status}`, href: RECORD_ROUTE.quotation, score: s });
  }

  // Keep the best few per group, grouped in a stable order.
  const order: RecordRef["kind"][] = ["contact", "order", "invoice", "quotation", "product", "task"];
  return order.flatMap((kind) =>
    results
      .filter((r) => r.ref.kind === kind)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limitPerGroup),
  );
}
