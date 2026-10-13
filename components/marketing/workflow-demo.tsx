"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FastForward, Info, RotateCcw } from "lucide-react";

import { InvoiceStatusBadge, OrderStatusBadge, StatusBadge } from "@/components/shared/badges";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { usd } from "@/lib/demo/format";
import { relativeActivity } from "@/lib/demo/dates";
import { computeMetrics, indexById, invoiceDisplayStatus, lowStockProducts, stockStatus } from "@/lib/demo/selectors";
import { DemoProvider, useDemoActions, useDemoData } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

/** The same transitions and business rules as /demo, running in an isolated store. */

interface Ids {
  contactId?: string;
  quotationId?: string;
  orderId?: string;
}

const STEPS = [
  { title: "New lead", detail: "A prospect arrives from your website form.", action: "Create sample lead" },
  { title: "Customer", detail: "The lead is qualified and becomes a customer record.", action: "Convert to customer" },
  { title: "Sales quotation", detail: "A quotation is prepared from your product catalog.", action: "Create quotation" },
  { title: "Order", detail: "The accepted quotation becomes an order and reserves stock.", action: "Accept & create order" },
  { title: "Invoice", detail: "An invoice is issued from the order (demo only).", action: "Issue invoice" },
  { title: "Business dashboard", detail: "Every connected view now reflects the change.", action: "Review the dashboard" },
] as const;

const SAMPLE_LEAD = {
  name: "Priya Raman",
  company: "Lumen Outdoor Co.",
  email: "priya.raman@lumenoutdoor.example",
  phone: "+1 555 0199",
  jobTitle: "Operations Manager",
  stage: "new" as const,
  dealValue: 11874,
  followUpDate: null,
  ownerId: "tm-priya",
  source: "Website form",
  notes: "Fitting out a new regional office.",
};

function WorkflowInner({ onReset }: { onReset: () => void }) {
  const data = useDemoData();
  const actions = useDemoActions();
  const [done, setDone] = useState(0);
  const [ids, setIds] = useState<Ids>({});
  const [auto, setAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Snapshot of the metrics when the demo mounted, so changes can be shown as deltas.
  const [baseline] = useState(() => ({ ...computeMetrics(data), customers: data.contacts.filter((c) => c.stage === "customer").length }));
  const metrics = computeMetrics(data);
  const customerCount = data.contacts.filter((c) => c.stage === "customer").length;
  const customers = useMemo(() => indexById(data.contacts), [data.contacts]);

  const run = useCallback(() => {
    setError(null);
    if (done === 0) {
      const r = actions.addContact(SAMPLE_LEAD);
      if (r.ok) setIds((i) => ({ ...i, contactId: r.value.id }));
      else setError(r.error);
      if (r.ok) setDone(1);
    } else if (done === 1 && ids.contactId) {
      actions.setContactStage(ids.contactId, "customer");
      setDone(2);
    } else if (done === 2 && ids.contactId) {
      const monitor = data.products.find((p) => p.sku === "ELC-MN-110");
      const desk = data.products.find((p) => p.sku === "FRN-SD-100");
      if (!monitor || !desk) return;
      const r = actions.createQuotation({
        customerId: ids.contactId,
        lines: [
          { productId: monitor.id, quantity: 20 },
          { productId: desk.id, quantity: 6 },
        ],
        validDays: 30,
        send: true,
      });
      if (r.ok) {
        setIds((i) => ({ ...i, quotationId: r.value.id }));
        setDone(3);
      } else setError(r.error);
    } else if (done === 3 && ids.quotationId) {
      const r = actions.convertQuotationToOrder(ids.quotationId);
      if (r.ok) {
        setIds((i) => ({ ...i, orderId: r.value.id }));
        setDone(4);
      } else setError(r.error);
    } else if (done === 4 && ids.orderId) {
      const r = actions.createInvoiceForOrder(ids.orderId);
      if (r.ok) setDone(5);
      else setError(r.error);
    } else if (done === 5) {
      setDone(6);
    }
  }, [actions, data.products, done, ids]);

  // "Run all" advances one step at a time so each change is visible.
  useEffect(() => {
    if (!auto || done >= STEPS.length) return;
    const t = window.setTimeout(run, 1000);
    return () => window.clearTimeout(t);
  }, [auto, done, run]);

  const finished = done >= STEPS.length;
  const autoActive = auto && !finished;

  const orders = [...data.orders].sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1)).slice(0, 4);
  const invoices = [...data.invoices].sort((a, b) => (a.issueDate === b.issueDate ? (a.number < b.number ? 1 : -1) : a.issueDate < b.issueDate ? 1 : -1)).slice(0, 4);
  const lowStock = lowStockProducts(data).slice(0, 4);

  const kpis = [
    { label: "Revenue this month", value: usd.full(metrics.revenueMonth), delta: metrics.revenueMonth - baseline.revenueMonth, money: true },
    { label: "Orders this month", value: String(metrics.ordersMonth), delta: metrics.ordersMonth - baseline.ordersMonth },
    { label: "Awaiting processing", value: String(metrics.ordersAwaiting), delta: metrics.ordersAwaiting - baseline.ordersAwaiting },
    { label: "Outstanding invoices", value: usd.full(metrics.outstandingTotal), delta: metrics.outstandingTotal - baseline.outstandingTotal, money: true },
    { label: "Customers", value: String(customerCount), delta: customerCount - baseline.customers },
    { label: "Low-stock products", value: String(metrics.lowStockCount), delta: metrics.lowStockCount - baseline.lowStockCount },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* Steps */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const state = i < done ? "done" : i === done ? "current" : "todo";
            return (
              <li key={s.title} className="relative flex gap-3.5 pb-4 last:pb-0">
                {i < STEPS.length - 1 && <span className={cn("absolute top-8 bottom-0 left-[0.9375rem] w-px", i < done ? "bg-primary/40" : "bg-border")} aria-hidden="true" />}
                <span
                  className={cn(
                    "relative z-10 flex size-[1.875rem] shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-accent text-accent-foreground ring-4 ring-primary/10",
                    state === "todo" && "bg-card text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={cn("text-sm font-semibold", state === "todo" ? "text-muted-foreground" : "text-foreground")}>{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                  {state === "current" && (
                    <Button size="sm" className="mt-2.5" onClick={run} disabled={autoActive}>
                      {s.action}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => setAuto(true)} disabled={finished || autoActive}>
            <FastForward /> Run all steps
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw /> Reset
          </Button>
        </div>
        <p role="status" className="mt-3 min-h-4 text-xs text-danger">
          {error}
        </p>
      </div>

      {/* Connected views */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-3.5 shadow-card">
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={k.value}
                    className="text-xl font-semibold tracking-tight text-foreground tabular-nums"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {k.value}
                  </motion.span>
                </AnimatePresence>
                {k.delta !== 0 && (
                  <StatusBadge tone={k.label === "Low-stock products" || k.label === "Awaiting processing" ? "warning" : "primary"} dot={false} className="h-5 px-1.5 text-[0.6875rem]">
                    {k.delta > 0 ? "+" : "−"}
                    {k.money ? usd.compact(Math.abs(k.delta)) : Math.abs(k.delta)}
                  </StatusBadge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Orders" highlight={done >= 4 && done < 6}>
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {orders.map((o) => (
                  <motion.li
                    key={o.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: "var(--accent)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 1.2 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{o.number}</p>
                      <p className="truncate text-xs text-muted-foreground">{customers.get(o.customerId)?.company}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="w-16 text-right text-sm font-semibold tabular-nums">{usd.compact(o.total)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Panel>

          <Panel title="Invoices" highlight={done >= 5 && done < 6}>
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {invoices.map((inv) => (
                  <motion.li
                    key={inv.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: "var(--accent)" }}
                    animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                    transition={{ duration: 1.2 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{inv.number}</p>
                      <p className="truncate text-xs text-muted-foreground">{customers.get(inv.customerId)?.company}</p>
                    </div>
                    <InvoiceStatusBadge status={invoiceDisplayStatus(inv)} />
                    <span className="w-16 text-right text-sm font-semibold tabular-nums">{usd.compact(inv.amount)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </Panel>

          <Panel title="Inventory alerts" highlight={done >= 4 && done < 6}>
            <ul className="divide-y">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.stock} left · threshold {p.threshold}
                    </p>
                  </div>
                  <StatusBadge tone={stockStatus(p) === "out" ? "danger" : "warning"}>{stockStatus(p) === "out" ? "Out" : "Low"}</StatusBadge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Activity" highlight={false}>
            <ul className="divide-y">
              {data.activities.slice(0, 4).map((a) => (
                <motion.li key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-2.5">
                  <p className="text-[0.8125rem] leading-snug text-foreground">{a.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{relativeActivity(a.at)}</p>
                </motion.li>
              ))}
            </ul>
          </Panel>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Simulated in your browser using local state. No emails are sent, no accounting entries are created and no payments are processed.
        </p>
      </div>
    </div>
  );
}

function Panel({ title, highlight, children }: { title: string; highlight: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card shadow-card transition-shadow duration-500", highlight && "ring-2 ring-primary/30")}>
      <h3 className="border-b bg-muted/50 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function WorkflowDemo() {
  // Changing the key remounts the provider, which restores the original sample data.
  const [run, setRun] = useState(0);

  return (
    <Section id="workflow" labelledBy="workflow-title" tone="muted">
      <SectionHeading
        id="workflow-title"
        eyebrow="Connected workflow"
        title="One business event, every related view updated"
        description="Walk a sample lead all the way to the dashboard. Each step runs the same rules as the live demo: stock is reserved, the invoice is linked, and metrics follow."
      />
      <div className="mt-12">
        <DemoProvider key={run}>
          <WorkflowInner onReset={() => setRun((r) => r + 1)} />
        </DemoProvider>
      </div>
    </Section>
  );
}
