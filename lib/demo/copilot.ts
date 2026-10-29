/**
 * Deterministic "demo assistant" for the OrbitOS copilot.
 *
 * IMPORTANT: this is NOT a language model and makes no network calls. It maps a
 * question to one of a handful of supported intents with simple keyword scoring,
 * then builds the answer by running the same selectors that power the dashboard
 * over the supplied `DemoData`. Every name, number and date in an answer is read
 * from a record that is also visible somewhere in the UI.
 *
 * ---------------------------------------------------------------------------
 * FUTURE BACKEND NOTE
 * In the real product this module's role (intent -> structured query ->
 * grounded answer) moves behind a server route that calls a model with tool
 * access to the organisation's data. The `CopilotAnswer` shape below is the
 * contract the UI renders, so it can stay unchanged.
 * ---------------------------------------------------------------------------
 */
import { DEMO_TODAY, diffDays, formatShortDate, monthKey, relativeDay, type ISODate } from "./dates";
import type { MoneyFormatter } from "./format";
import { formatSignedPercent, usd } from "./format";
import {
  OPEN_STAGES,
  computeMetrics,
  daysOverdue,
  followUpsDue,
  indexById,
  isTaskOverdue,
  lowStockProducts,
  openOrdersAwaiting,
  overdueInvoices,
  overdueTasks,
  pipelineByStage,
  revenueByCategory,
  stageLabel,
  stockStatus,
  tasksDueToday,
  topCustomers,
} from "./selectors";
import type { DemoData, RecordRef } from "./types";

export type CopilotIntent =
  | "attention"
  | "overdue_invoices"
  | "low_stock"
  | "follow_ups"
  | "sales_summary"
  | "overdue_tasks"
  | "pipeline"
  | "top_customers"
  | "pending_orders"
  | "help";

export type Tone = "danger" | "warning" | "success" | "info" | "neutral";

export interface AnswerItem {
  primary: string;
  secondary?: string;
  meta?: string;
  tone?: Tone;
  /** Opens the record in the demo (when rendered inside /demo). */
  record?: RecordRef;
  href?: string;
}

export type AnswerBlock =
  | { type: "text"; text: string }
  | { type: "stats"; items: { label: string; value: string; hint?: string; tone?: Tone }[] }
  | { type: "list"; title?: string; items: AnswerItem[] };

export interface CopilotAnswer {
  intent: CopilotIntent;
  title: string;
  blocks: AnswerBlock[];
  actions: { label: string; href: string }[];
  followUps: string[];
}

export const SUGGESTED_PROMPTS: string[] = [
  "What needs my attention today?",
  "Which invoices are overdue?",
  "Which products are running low?",
  "Which leads need a follow-up?",
  "Summarize this month's sales.",
  "Show me tasks that are overdue.",
];

const EXTRA_PROMPTS = ["How does my sales pipeline look?", "Who are my top customers?", "Which orders are waiting to be processed?"];

interface IntentRule {
  id: CopilotIntent;
  patterns: [RegExp, number][];
}

const RULES: IntentRule[] = [
  {
    id: "attention",
    patterns: [[/attention|priorit|focus|urgent|important|what (needs|should|do i)|agenda|where (do|should) i start|morning|today.?s? (brief|plan)/, 4]],
  },
  {
    id: "overdue_invoices",
    patterns: [
      [/invoice|bill|receivable|owe|payment|unpaid|collect/, 3],
      [/overdue|late|past due|unpaid|outstanding|owe|chase/, 2],
    ],
  },
  {
    id: "low_stock",
    patterns: [
      [/stock|inventory|product|sku|reorder|supply|supplies|warehouse|item/, 3],
      [/low|running|below|short|out of|threshold|reorder|replenish/, 2],
    ],
  },
  {
    id: "follow_ups",
    patterns: [
      [/lead|follow.?up|prospect|crm|call back|reach out/, 3],
      [/follow.?up|need|contact|chase|reach/, 2],
    ],
  },
  {
    id: "sales_summary",
    patterns: [
      [/sales|revenue|summar|performance|how (are|is) (we|the business|business)|took in|earn/, 3],
      [/summar|month|total|overview|so far|mtd/, 2],
    ],
  },
  {
    id: "overdue_tasks",
    patterns: [
      [/task|to.?do|project|assignment|work items?/, 3],
      [/overdue|late|due|behind|slipp/, 2],
    ],
  },
  { id: "pipeline", patterns: [[/pipeline|opportunit|deals?|forecast/, 4]] },
  { id: "top_customers", patterns: [[/top customers?|best customers?|biggest customers?|key accounts?|who (buys|spends)/, 5]] },
  { id: "pending_orders", patterns: [[/orders?/, 3], [/pending|waiting|awaiting|process|unfulfilled|ship/, 2]] },
];

export function classifyQuestion(question: string): { intent: CopilotIntent; score: number } {
  const q = question.toLowerCase();
  let best: { intent: CopilotIntent; score: number } = { intent: "help", score: 0 };
  for (const rule of RULES) {
    let score = 0;
    for (const [re, weight] of rule.patterns) if (re.test(q)) score += weight;
    if (score > best.score) best = { intent: rule.id, score };
  }
  return best.score >= 3 ? best : { intent: "help", score: best.score };
}

interface Options {
  today?: ISODate;
  money?: MoneyFormatter;
  /** Describe the assistant as a demo reading sample data (default), or as reading the member's own records. */
  demo?: boolean;
}

export function answerQuestion(question: string, data: DemoData, options: Options = {}): CopilotAnswer {
  const today = options.today ?? DEMO_TODAY;
  const money = options.money ?? usd;
  const { intent } = classifyQuestion(question);
  switch (intent) {
    case "attention":
      return attentionAnswer(data, today, money);
    case "overdue_invoices":
      return overdueInvoicesAnswer(data, today, money);
    case "low_stock":
      return lowStockAnswer(data);
    case "follow_ups":
      return followUpsAnswer(data, today, money);
    case "sales_summary":
      return salesSummaryAnswer(data, today, money);
    case "overdue_tasks":
      return overdueTasksAnswer(data, today);
    case "pipeline":
      return pipelineAnswer(data, money);
    case "top_customers":
      return topCustomersAnswer(data, today, money);
    case "pending_orders":
      return pendingOrdersAnswer(data, money);
    default:
      return helpAnswer(options.demo ?? true);
  }
}

/* ------------------------------------------------------------ Answer fns -- */

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function attentionAnswer(data: DemoData, today: ISODate, money: MoneyFormatter): CopilotAnswer {
  const m = computeMetrics(data, today);
  const customers = indexById(data.contacts);
  const items: AnswerItem[] = [];

  const invoice = overdueInvoices(data, today)[0];
  if (invoice) {
    items.push({
      primary: `Invoice ${invoice.number} is ${plural(daysOverdue(invoice, today), "day")} overdue`,
      secondary: `${customers.get(invoice.customerId)?.company ?? "Customer"} · ${money.full(invoice.amount)} · due ${formatShortDate(invoice.dueDate)}`,
      tone: "danger",
      record: { kind: "invoice", id: invoice.id },
      href: "/demo/finance",
    });
  }
  const product = lowStockProducts(data)[0];
  if (product) {
    items.push({
      primary: `${product.name} ${stockStatus(product) === "out" ? "is out of stock" : "is below its stock threshold"}`,
      secondary: `${product.stock} available · threshold ${product.threshold} · ${product.supplier}`,
      tone: stockStatus(product) === "out" ? "danger" : "warning",
      record: { kind: "product", id: product.id },
      href: "/demo/inventory",
    });
  }
  const lead = followUpsDue(data, today)[0];
  if (lead) {
    items.push({
      primary: `${lead.company} needs a follow-up`,
      secondary: `${lead.name} · ${stageLabel(lead.stage)} · ${money.full(lead.dealValue)} · follow-up ${relativeDay(lead.followUpDate!, today).toLowerCase()}`,
      tone: "warning",
      record: { kind: "contact", id: lead.id },
      href: "/demo/crm",
    });
  }
  const task = overdueTasks(data, today)[0];
  if (task) {
    items.push({
      primary: `Task overdue: ${task.title}`,
      secondary: `Due ${formatShortDate(task.dueDate)} · priority ${task.priority}`,
      tone: "warning",
      record: { kind: "task", id: task.id },
      href: "/demo/projects",
    });
  }
  if (m.ordersAwaiting > 0) {
    items.push({
      primary: `${plural(m.ordersAwaiting, "order")} awaiting processing`,
      secondary: "Pending orders are not yet picked or packed.",
      tone: "info",
      href: "/demo/orders",
    });
  }

  return {
    intent: "attention",
    title: "Here is what needs your attention today",
    blocks: [
      {
        type: "stats",
        items: [
          { label: "Overdue invoices", value: money.compact(m.overdueTotal), hint: plural(m.overdueCount, "invoice"), tone: m.overdueCount ? "danger" : "success" },
          { label: "Low-stock products", value: String(m.lowStockCount), hint: `${m.outOfStockCount} out of stock`, tone: m.lowStockCount ? "warning" : "success" },
          { label: "Follow-ups due", value: String(m.followUpsDue), hint: "leads & contacts", tone: m.followUpsDue ? "warning" : "success" },
          { label: "Tasks due today", value: String(m.tasksDueToday), hint: `${m.tasksOverdue} overdue`, tone: m.tasksOverdue ? "warning" : "neutral" },
        ],
      },
      { type: "list", title: "Suggested priorities", items },
    ],
    actions: [
      { label: "Review receivables", href: "/demo/finance" },
      { label: "Check inventory", href: "/demo/inventory" },
      { label: "Open CRM follow-ups", href: "/demo/crm" },
    ],
    followUps: ["Which invoices are overdue?", "Which leads need a follow-up?"],
  };
}

function overdueInvoicesAnswer(data: DemoData, today: ISODate, money: MoneyFormatter): CopilotAnswer {
  const overdue = overdueInvoices(data, today);
  const customers = indexById(data.contacts);
  const m = computeMetrics(data, today);
  if (overdue.length === 0) {
    return {
      intent: "overdue_invoices",
      title: "No invoices are overdue",
      blocks: [{ type: "text", text: `Every unpaid invoice is still within its payment terms. ${money.full(m.outstandingTotal)} is outstanding across ${plural(m.outstandingCount, "invoice")}.` }],
      actions: [{ label: "Open Finance", href: "/demo/finance" }],
      followUps: ["What needs my attention today?"],
    };
  }
  return {
    intent: "overdue_invoices",
    title: `${plural(overdue.length, "invoice")} overdue · ${money.full(m.overdueTotal)}`,
    blocks: [
      {
        type: "text",
        text: `${money.full(m.outstandingTotal)} is outstanding in total; ${money.full(m.overdueTotal)} of it is past its due date. Largest first:`,
      },
      {
        type: "list",
        items: overdue.map((inv) => ({
          primary: `${inv.number} · ${customers.get(inv.customerId)?.company ?? "Customer"}`,
          secondary: `Due ${formatShortDate(inv.dueDate)} · ${plural(daysOverdue(inv, today), "day")} overdue`,
          meta: money.full(inv.amount),
          tone: daysOverdue(inv, today) > 30 ? "danger" : "warning",
          record: { kind: "invoice", id: inv.id },
          href: "/demo/finance",
        })),
      },
    ],
    actions: [{ label: "Open Finance", href: "/demo/finance" }, { label: "See customers in CRM", href: "/demo/crm" }],
    followUps: ["What needs my attention today?", "Summarize this month's sales."],
  };
}

function lowStockAnswer(data: DemoData): CopilotAnswer {
  const low = lowStockProducts(data);
  if (low.length === 0) {
    return {
      intent: "low_stock",
      title: "All products are above their thresholds",
      blocks: [{ type: "text", text: "No product is below its configured reorder threshold right now." }],
      actions: [{ label: "Open Inventory", href: "/demo/inventory" }],
      followUps: ["What needs my attention today?"],
    };
  }
  return {
    intent: "low_stock",
    title: `${plural(low.length, "product")} below the reorder threshold`,
    blocks: [
      {
        type: "text",
        text: "These products have fewer units available than the threshold set on the product. Most urgent first:",
      },
      {
        type: "list",
        items: low.map((p) => ({
          primary: p.name,
          secondary: `${p.sku} · supplier: ${p.supplier}`,
          meta: stockStatus(p) === "out" ? "Out of stock" : `${p.stock} of ${p.threshold}`,
          tone: stockStatus(p) === "out" ? "danger" : "warning",
          record: { kind: "product", id: p.id },
          href: "/demo/inventory",
        })),
      },
    ],
    actions: [{ label: "Open Inventory", href: "/demo/inventory" }, { label: "See restock tasks", href: "/demo/projects" }],
    followUps: ["Show me tasks that are overdue.", "What needs my attention today?"],
  };
}

function followUpsAnswer(data: DemoData, today: ISODate, money: MoneyFormatter): CopilotAnswer {
  const due = followUpsDue(data, today);
  if (due.length === 0) {
    return {
      intent: "follow_ups",
      title: "No follow-ups are due",
      blocks: [{ type: "text", text: "Every lead and contact with a follow-up date is scheduled for the future." }],
      actions: [{ label: "Open CRM", href: "/demo/crm" }],
      followUps: ["How does my sales pipeline look?"],
    };
  }
  const value = due.reduce((s, c) => s + (OPEN_STAGES.includes(c.stage) ? c.dealValue : 0), 0);
  return {
    intent: "follow_ups",
    title: `${plural(due.length, "contact")} need a follow-up`,
    blocks: [
      {
        type: "text",
        text: `Follow-up dates have arrived or passed. ${money.full(value)} of open deal value is involved. Highest value first:`,
      },
      {
        type: "list",
        items: due.map((c) => ({
          primary: `${c.company} · ${c.name}`,
          secondary: `${stageLabel(c.stage)} · last contact ${relativeDay(c.lastContact, today).toLowerCase()} · follow-up ${relativeDay(c.followUpDate!, today).toLowerCase()}`,
          meta: c.dealValue > 0 ? money.full(c.dealValue) : undefined,
          tone: c.followUpDate! < today ? "warning" : "info",
          record: { kind: "contact", id: c.id },
          href: "/demo/crm",
        })),
      },
    ],
    actions: [{ label: "Open CRM", href: "/demo/crm" }, { label: "See quotations", href: "/demo/sales" }],
    followUps: ["How does my sales pipeline look?", "What needs my attention today?"],
  };
}

function salesSummaryAnswer(data: DemoData, today: ISODate, money: MoneyFormatter): CopilotAnswer {
  const m = computeMetrics(data, today);
  const thisMonth = monthKey(today);
  const monthOrders = data.orders.filter((o) => monthKey(o.date) === thisMonth && o.status !== "cancelled");
  const monthStart = `${thisMonth}-01`;
  const top = topCustomers(data, 3, monthStart);
  const topCategory = revenueByCategory(data, 1, today)[0];
  const delivered = monthOrders.filter((o) => o.status === "delivered").length;
  const growth = m.revenueGrowthPct;

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(`${thisMonth}-01T00:00:00Z`));

  return {
    intent: "sales_summary",
    title: `${monthName} sales so far`,
    blocks: [
      {
        type: "stats",
        items: [
          { label: "Revenue (MTD)", value: money.full(m.revenueMonth), hint: growth === null ? undefined : `${formatSignedPercent(growth, 1)} vs same days last month`, tone: growth !== null && growth < 0 ? "warning" : "success" },
          { label: "Orders", value: String(m.ordersMonth), hint: `${delivered} delivered` },
          { label: "Open pipeline", value: money.compact(m.openOppValue), hint: plural(m.openOppCount, "opportunity", "opportunities") },
        ],
      },
      {
        type: "text",
        text: `${plural(m.ordersMonth, "order")} booked this month for ${money.full(m.revenueMonth)}${
          topCategory && topCategory.revenue > 0 ? `; ${topCategory.category} is the strongest category (${money.full(topCategory.revenue)})` : ""
        }. ${m.ordersAwaiting > 0 ? `${plural(m.ordersAwaiting, "order")} still await processing.` : "All orders have been processed."}`,
      },
      {
        type: "list",
        title: "Top customers this month",
        items: top.map((t) => ({
          primary: t.customer.company,
          secondary: plural(t.orders, "order"),
          meta: money.full(t.revenue),
          tone: "neutral" as const,
          record: { kind: "contact" as const, id: t.customer.id },
          href: "/demo/crm",
        })),
      },
    ],
    actions: [{ label: "Open Analytics", href: "/demo/analytics" }, { label: "View orders", href: "/demo/orders" }],
    followUps: ["Who are my top customers?", "Which orders are waiting to be processed?"],
  };
}

function overdueTasksAnswer(data: DemoData, today: ISODate): CopilotAnswer {
  const overdue = overdueTasks(data, today);
  const dueToday = tasksDueToday(data, today);
  const team = indexById(data.team);
  const projects = indexById(data.projects);
  if (overdue.length === 0) {
    return {
      intent: "overdue_tasks",
      title: "No tasks are overdue",
      blocks: [{ type: "text", text: `${plural(dueToday.length, "task")} ${dueToday.length === 1 ? "is" : "are"} due today.` }],
      actions: [{ label: "Open Projects", href: "/demo/projects" }],
      followUps: ["What needs my attention today?"],
    };
  }
  return {
    intent: "overdue_tasks",
    title: `${plural(overdue.length, "task")} overdue`,
    blocks: [
      {
        type: "text",
        text: `${plural(dueToday.length, "more task")} ${dueToday.length === 1 ? "is" : "are"} due today. Oldest overdue first:`,
      },
      {
        type: "list",
        items: overdue.map((t) => ({
          primary: t.title,
          secondary: `${projects.get(t.projectId)?.name ?? "Project"} · ${team.get(t.assigneeId)?.name ?? "Unassigned"}`,
          meta: `${diffDays(today, t.dueDate)}d late`,
          tone: t.priority === "high" ? "danger" : "warning",
          record: { kind: "task" as const, id: t.id },
          href: "/demo/projects",
        })),
      },
    ],
    actions: [{ label: "Open Projects", href: "/demo/projects" }, { label: "See the team", href: "/demo/team" }],
    followUps: ["What needs my attention today?", "Which products are running low?"],
  };
}

function pipelineAnswer(data: DemoData, money: MoneyFormatter): CopilotAnswer {
  const m = computeMetrics(data);
  const stages = pipelineByStage(data).filter((s) => OPEN_STAGES.includes(s.stage) || s.stage === "new");
  return {
    intent: "pipeline",
    title: `${plural(m.openOppCount, "open opportunity", "open opportunities")} · ${money.full(m.openOppValue)}`,
    blocks: [
      {
        type: "list",
        title: "By stage",
        items: stages.map((s) => ({
          primary: stageLabel(s.stage),
          secondary: plural(s.count, "contact"),
          meta: money.full(s.value),
          tone: "neutral" as const,
        })),
      },
    ],
    actions: [{ label: "Open Sales pipeline", href: "/demo/sales" }, { label: "Open CRM", href: "/demo/crm" }],
    followUps: ["Which leads need a follow-up?"],
  };
}

function topCustomersAnswer(data: DemoData, today: ISODate, money: MoneyFormatter): CopilotAnswer {
  const since = `${monthKey(today).slice(0, 4)}-01-01`;
  const top = topCustomers(data, 5, since);
  return {
    intent: "top_customers",
    title: "Top customers this year",
    blocks: [
      {
        type: "list",
        items: top.map((t, i) => ({
          primary: `${i + 1}. ${t.customer.company}`,
          secondary: plural(t.orders, "order"),
          meta: money.full(t.revenue),
          tone: "neutral" as const,
          record: { kind: "contact" as const, id: t.customer.id },
          href: "/demo/crm",
        })),
      },
    ],
    actions: [{ label: "Open CRM", href: "/demo/crm" }],
    followUps: ["Summarize this month's sales."],
  };
}

function pendingOrdersAnswer(data: DemoData, money: MoneyFormatter): CopilotAnswer {
  const pending = openOrdersAwaiting(data);
  const customers = indexById(data.contacts);
  if (pending.length === 0) {
    return {
      intent: "pending_orders",
      title: "No orders are waiting",
      blocks: [{ type: "text", text: "All orders have moved past the pending stage." }],
      actions: [{ label: "Open Orders", href: "/demo/orders" }],
      followUps: ["Summarize this month's sales."],
    };
  }
  return {
    intent: "pending_orders",
    title: `${plural(pending.length, "order")} awaiting processing`,
    blocks: [
      {
        type: "list",
        items: pending.map((o) => ({
          primary: `${o.number} · ${customers.get(o.customerId)?.company ?? "Customer"}`,
          secondary: `Placed ${formatShortDate(o.date)} · no invoice yet`,
          meta: money.full(o.total),
          tone: "info" as const,
          record: { kind: "order" as const, id: o.id },
          href: "/demo/orders",
        })),
      },
    ],
    actions: [{ label: "Open Orders", href: "/demo/orders" }],
    followUps: ["What needs my attention today?"],
  };
}

function helpAnswer(demo: boolean): CopilotAnswer {
  return {
    intent: "help",
    title: demo ? "I can help with your sample business data" : "I can help with your business records",
    blocks: [
      {
        type: "text",
        text: `I'm a ${demo ? "demo" : "rule-based"} assistant, so I only understand a set of business questions about the records in this workspace: invoices, stock, leads, sales, tasks, orders and customers. Try one of these:`,
      },
      {
        type: "list",
        items: [...SUGGESTED_PROMPTS, ...EXTRA_PROMPTS].map((p) => ({ primary: p, tone: "neutral" as const })),
      },
    ],
    actions: [],
    followUps: SUGGESTED_PROMPTS.slice(0, 3),
  };
}

/* ---------------------------------------------------------------- Insights -- */

export interface Insight {
  id: string;
  tone: Tone;
  title: string;
  detail: string;
  action: { label: string; href: string };
  record?: RecordRef;
}

/** Proactive insights for the dashboard panel, computed from the same records. */
export function getInsights(data: DemoData, options: Options = {}): Insight[] {
  const today = options.today ?? DEMO_TODAY;
  const money = options.money ?? usd;
  const m = computeMetrics(data, today);
  const customers = indexById(data.contacts);
  const insights: Insight[] = [];

  const invoice = overdueInvoices(data, today)[0];
  if (invoice) {
    insights.push({
      id: "overdue-invoice",
      tone: "danger",
      title: `${plural(m.overdueCount, "invoice")} overdue (${money.compact(m.overdueTotal)})`,
      detail: `${invoice.number} for ${customers.get(invoice.customerId)?.company ?? "a customer"} is ${plural(daysOverdue(invoice, today), "day")} late. Consider sending a reminder.`,
      action: { label: "Review receivables", href: "/demo/finance" },
      record: { kind: "invoice", id: invoice.id },
    });
  }
  const product = lowStockProducts(data)[0];
  if (product) {
    insights.push({
      id: "low-stock",
      tone: stockStatus(product) === "out" ? "danger" : "warning",
      title: `${plural(m.lowStockCount, "product")} below threshold`,
      detail: `${product.name}: ${product.stock} left, reorder level is ${product.threshold}.`,
      action: { label: "Open inventory", href: "/demo/inventory" },
      record: { kind: "product", id: product.id },
    });
  }
  const lead = followUpsDue(data, today).find((c) => OPEN_STAGES.includes(c.stage)) ?? followUpsDue(data, today)[0];
  if (lead) {
    insights.push({
      id: "lead-follow-up",
      tone: "warning",
      title: `High-value lead needs a follow-up`,
      detail: `${lead.company} (${money.full(lead.dealValue)}, ${stageLabel(lead.stage).toLowerCase()}) — follow-up ${relativeDay(lead.followUpDate!, today).toLowerCase()}.`,
      action: { label: "Open in CRM", href: "/demo/crm" },
      record: { kind: "contact", id: lead.id },
    });
  }
  if (m.tasksDueToday + m.tasksOverdue > 0) {
    const first = overdueTasks(data, today)[0] ?? tasksDueToday(data, today)[0];
    insights.push({
      id: "tasks",
      tone: "info",
      title: `${m.tasksDueToday} due today, ${m.tasksOverdue} overdue`,
      detail: first && isTaskOverdue(first, today) ? `Oldest: “${first.title}”.` : `Next up: “${first?.title ?? ""}”.`,
      action: { label: "Open tasks", href: "/demo/projects" },
      record: first ? { kind: "task", id: first.id } : undefined,
    });
  }
  return insights;
}
