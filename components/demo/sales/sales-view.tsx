"use client";

import { Link } from "@/components/demo/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CircleCheck, FilePlus2, Plus, Send, Target, XCircle } from "lucide-react";

import { SalesDocDialog } from "@/components/demo/sales-doc-dialog";
import { useToast } from "@/components/demo/toast";
import { Card, DataTable, EmptyState, FilterChips, PageHeader, SearchField, StatCard, type Column } from "@/components/demo/ui";
import { useRecordNav } from "@/components/demo/use-record-nav";
import { OrderStatusBadge, QuotationStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, monthKey, relativeDay } from "@/lib/demo/dates";
import { OPEN_STAGES, computeMetrics, stageLabel } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useDemoLookups, useOpenRecord } from "@/lib/demo/store";
import { QUOTATION_STATUSES, type ContactStage, type Quotation, type QuotationStatus } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { useIsDemo, useToday } from "@/lib/workspace/context";

type StatusFilter = "all" | QuotationStatus;
const BOARD: ContactStage[] = ["new", "qualified", "proposal", "negotiation"];

export function SalesView() {
  const data = useDemoData();
  const lookups = useDemoLookups();
  const money = useMoney();
  const today = useToday();
  const actions = useDemoActions();
  const toast = useToast();
  const demo = useIsDemo();
  const openRecord = useRecordNav();
  const focusedQuoteId = useOpenRecord("quotation");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [orderOpen, setOrderOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const m = useMemo(() => computeMetrics(data, today), [data, today]);
  const sentQuotes = data.quotations.filter((q) => q.status === "sent");
  const decided = data.quotations.filter((q) => ["accepted", "declined", "expired"].includes(q.status));
  const winRate = decided.length ? (decided.filter((q) => q.status === "accepted").length / decided.length) * 100 : null;
  const monthOrders = data.orders.filter((o) => o.status !== "cancelled" && monthKey(o.date) === monthKey(today));
  const avgOrder = monthOrders.length ? monthOrders.reduce((s, o) => s + o.total, 0) / monthOrders.length : 0;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.quotations.length };
    for (const s of QUOTATION_STATUSES) c[s] = 0;
    for (const q of data.quotations) c[q.status] += 1;
    return c;
  }, [data.quotations]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (focusedQuoteId) return data.quotations.filter((x) => x.id === focusedQuoteId);
    return data.quotations.filter((x) => (status === "all" || x.status === status) && (!q || x.number.toLowerCase().includes(q) || (lookups.contacts.get(x.customerId)?.company.toLowerCase().includes(q) ?? false)));
  }, [data.quotations, lookups.contacts, query, status, focusedQuoteId]);

  const recentOrders = useMemo(() => [...data.orders].sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1)).slice(0, 5), [data.orders]);

  function accept(q: Quotation) {
    const r = actions.convertQuotationToOrder(q.id);
    if (r.ok) toast.success(`${q.number} accepted`, `Order ${r.value.number} created and stock reserved. Find it in Orders.`);
    else toast.error("Could not create the order", r.error);
  }

  const columns: Column<Quotation>[] = [
    { key: "number", header: "Quotation", primary: false, sortValue: (q) => q.number, cell: (q) => <span className="font-medium">{q.number}</span> },
    {
      key: "customer",
      header: "Customer / lead",
      sortValue: (q) => lookups.contacts.get(q.customerId)?.company ?? "",
      cell: (q) => {
        const c = lookups.contacts.get(q.customerId);
        return (
          <span className="block">
            <span className="block">{c?.company}</span>
            <span className="block text-xs text-muted-foreground">{c?.name}</span>
          </span>
        );
      },
    },
    { key: "date", header: "Date", hideBelow: "lg", sortValue: (q) => q.date, cell: (q) => <span className="text-muted-foreground">{formatDate(q.date)}</span> },
    {
      key: "valid",
      header: "Valid until",
      hideBelow: "md",
      sortValue: (q) => q.validUntil,
      cell: (q) => <span className={cn(q.status === "sent" && q.validUntil < today ? "font-medium text-danger" : "text-muted-foreground")}>{formatDate(q.validUntil)}</span>,
    },
    { key: "status", header: "Status", sortValue: (q) => q.status, cell: (q) => <QuotationStatusBadge status={q.status} /> },
    { key: "total", header: "Total", align: "right", sortValue: (q) => q.total, cell: (q) => <span className="font-semibold">{money.full(q.total)}</span> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (q) => {
        if (q.status === "draft")
          return (
            <Button variant="outline" size="sm" onClick={() => { actions.setQuotationStatus(q.id, "sent"); toast.success(`${q.number} marked as sent`, demo ? "Demo only: nothing was emailed." : "Nothing is emailed from OrbitOS yet."); }}>
              <Send /> Send
            </Button>
          );
        if (q.status === "sent")
          return (
            <div className="flex justify-end gap-1.5">
              <Button size="sm" onClick={() => accept(q)}>
                <CircleCheck /> <span className="hidden xl:inline">Accept &amp;</span> order
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Decline ${q.number}`} onClick={() => { actions.setQuotationStatus(q.id, "declined"); toast.info(`${q.number} declined`); }}>
                <XCircle />
              </Button>
            </div>
          );
        if (q.orderId)
          return (
            <Button variant="ghost" size="sm" onClick={() => openRecord({ kind: "order", id: q.orderId! }, "/demo/orders")}>
              {lookups.orders.get(q.orderId)?.number} <ArrowRight />
            </Button>
          );
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Sales"
        description="Quotations, pipeline and recent orders. Accepting a quotation creates an order, reserves stock and turns a lead into a customer."
        actions={
          <>
            <Button variant="outline" onClick={() => setQuoteOpen(true)}>
              <FilePlus2 /> New quotation
            </Button>
            <Button onClick={() => setOrderOpen(true)}>
              <Plus /> Create order
            </Button>
          </>
        }
      />

      <section aria-label="Sales summary" className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Open pipeline" value={money.compact(m.openOppValue)} hint={`${m.openOppCount} opportunities`} icon={<Target />} />
        <StatCard label="Quotations awaiting reply" value={String(sentQuotes.length)} hint={money.compact(sentQuotes.reduce((s, q) => s + q.total, 0))} icon={<Send />} />
        <StatCard label="Quotation win rate" value={winRate === null ? "—" : `${winRate.toFixed(0)}%`} hint={`${decided.length} decided`} tone="success" icon={<CircleCheck />} />
        <StatCard label="Orders this month" value={String(m.ordersMonth)} hint={money.compact(m.revenueMonth)} />
        <StatCard label="Average order value" value={money.full(avgOrder)} hint="This month" />
      </section>

      <Card bodyClassName="p-0">
        <Tabs defaultValue="quotations" className="gap-0">
          <div className="border-b px-4 pt-3">
            <TabsList variant="line" className="h-auto gap-4 p-0">
              <TabsTrigger value="quotations" className="h-10 flex-none px-1 data-[state=active]:text-primary data-[state=active]:after:bg-primary">
                Quotations
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="h-10 flex-none px-1 data-[state=active]:text-primary data-[state=active]:after:bg-primary">
                Pipeline
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quotations" className="outline-none">
            {focusedQuoteId && (
              <div role="status" className="flex items-center justify-between gap-3 border-b bg-accent/60 px-4 py-2.5 text-sm">
                <span>
                  Showing <strong>{lookups.quotations.get(focusedQuoteId)?.number}</strong> from your search.
                </span>
                <Button variant="outline" size="sm" onClick={actions.closeRecord}>
                  Show all quotations
                </Button>
              </div>
            )}
            <div className="space-y-3 border-b p-4">
              <SearchField label="Search quotations" value={query} onChange={setQuery} placeholder="Search quotation number or customer…" className="sm:max-w-sm" />
              <FilterChips<StatusFilter>
                label="Filter by quotation status"
                value={status}
                onChange={setStatus}
                options={[{ value: "all", label: "All", count: counts.all }, ...QUOTATION_STATUSES.map((s) => ({ value: s as StatusFilter, label: s[0].toUpperCase() + s.slice(1), count: counts[s] }))]}
              />
            </div>
            <DataTable
              key={`${query}-${status}-${focusedQuoteId}`}
              caption="Quotations"
              columns={columns}
              rows={rows}
              rowKey={(q) => q.id}
              initialSort={{ key: "date", dir: "desc" }}
              empty={<EmptyState title="No quotations match" description="Try a different status, or create a new quotation." action={<Button onClick={() => setQuoteOpen(true)}><FilePlus2 /> New quotation</Button>} />}
            />
          </TabsContent>

          <TabsContent value="pipeline" className="p-4 outline-none">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {BOARD.map((stage) => {
                const cards = data.contacts.filter((c) => c.stage === stage).sort((a, b) => b.dealValue - a.dealValue);
                return (
                  <section key={stage} aria-label={stageLabel(stage)} className="rounded-xl border bg-muted/40 p-2.5">
                    <header className="flex items-center justify-between px-1.5 py-1">
                      <h3 className="text-sm font-semibold">{stageLabel(stage)}</h3>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {cards.length} · {money.compact(cards.reduce((s, c) => s + c.dealValue, 0))}
                      </span>
                    </header>
                    <ul className="mt-2 space-y-2">
                      {cards.length === 0 && <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No deals in this stage</li>}
                      {cards.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => openRecord({ kind: "contact", id: c.id }, "/demo/crm")}
                            className="w-full rounded-lg border bg-card p-3 text-left shadow-card outline-none transition-shadow hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <span className="block truncate text-sm font-semibold">{c.company}</span>
                            <span className="block truncate text-xs text-muted-foreground">{c.name}</span>
                            <span className="mt-2 flex items-center justify-between text-xs">
                              <span className="font-semibold tabular-nums">{money.full(c.dealValue)}</span>
                              {c.followUpDate && (
                                <span className={cn("inline-flex items-center gap-1", c.followUpDate <= today ? "font-medium text-warning" : "text-muted-foreground")}>
                                  <CalendarClock className="size-3" aria-hidden="true" />
                                  {relativeDay(c.followUpDate, today)}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Open stages for the pipeline value: {OPEN_STAGES.map(stageLabel).join(", ")}. Change a lead&apos;s status in{" "}
              <Link href="/demo/crm" className="font-medium text-primary hover:underline">
                CRM
              </Link>
              .
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <Card
        className="mt-6"
        title="Recent orders"
        action={
          <Link href="/demo/orders" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            All orders <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        }
      >
        <ul className="divide-y">
          {recentOrders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => openRecord({ kind: "order", id: o.id }, "/demo/orders")}
                className="flex w-full items-center gap-4 rounded-lg px-1 py-2.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-24 text-sm font-medium">{o.number}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{lookups.contacts.get(o.customerId)?.company}</span>
                <OrderStatusBadge status={o.status} />
                <span className="w-24 text-right text-sm font-semibold tabular-nums">{money.full(o.total)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <SalesDocDialog mode="order" open={orderOpen} onOpenChange={setOrderOpen} />
      <SalesDocDialog mode="quotation" open={quoteOpen} onOpenChange={setQuoteOpen} />
    </>
  );
}
