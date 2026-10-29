"use client";

import { Link } from "@/components/demo/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, ClipboardCheck, PackageOpen, Plus, Receipt, Target, UserPlus } from "lucide-react";

import { AddContactDialog } from "@/components/demo/crm/add-contact-dialog";
import { InsightsPanel } from "@/components/demo/insights-panel";
import { SalesDocDialog } from "@/components/demo/sales-doc-dialog";
import { Card, PageHeader, StatCard } from "@/components/demo/ui";
import { useRecordNav } from "@/components/demo/use-record-nav";
import { Avatar, OrderStatusBadge } from "@/components/shared/badges";
import { RevenueTrendChart } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { formatDate, formatShortDate, relativeActivity } from "@/lib/demo/dates";
import { computeMetrics, indexById, monthlyTrend } from "@/lib/demo/selectors";
import { useMoney, useSettings } from "@/lib/demo/settings";
import { useDemoData } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useToday, useWorkspaceEnv } from "@/lib/workspace/context";

const KIND_DOT: Record<string, string> = {
  order: "bg-primary",
  payment: "bg-success",
  invoice: "bg-info",
  inventory: "bg-warning",
  contact: "bg-violet-500",
  quotation: "bg-sky-500",
  task: "bg-slate-400",
  expense: "bg-slate-400",
  system: "bg-slate-400",
};

export function OverviewView() {
  const data = useDemoData();
  const money = useMoney();
  const settings = useSettings();
  const today = useToday();
  const { mode, selfId } = useWorkspaceEnv();
  const openRecord = useRecordNav();
  const [range, setRange] = useState<6 | 12>(12);
  const [orderOpen, setOrderOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const m = useMemo(() => computeMetrics(data, today), [data, today]);
  const points = useMemo(() => monthlyTrend(data, range, today), [data, range, today]);
  const people = useMemo(() => indexById(data.contacts), [data.contacts]);
  const team = useMemo(() => indexById(data.team), [data.team]);
  const recentOrders = useMemo(() => [...data.orders].sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1)).slice(0, 6), [data.orders]);
  const first = data.team.find((t) => t.id === selfId)?.name.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${first}`}
        description={
          <>
            Here is how {settings.businessName} is doing on {formatDate(today)}. Every figure is calculated from {mode === "demo" ? "the sample" : "your"} records.
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setContactOpen(true)}>
              <UserPlus /> Add contact
            </Button>
            <Button onClick={() => setOrderOpen(true)}>
              <Plus /> Create order
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Revenue this month" value={money.full(m.revenueMonth)} delta={m.revenueGrowthPct} hint="vs same days last month" icon={<CircleDollarSign />} href="/demo/analytics" />
        <StatCard
          label="Outstanding invoices"
          value={money.full(m.outstandingTotal)}
          hint={m.overdueCount ? `${m.overdueCount} overdue · ${money.compact(m.overdueTotal)}` : "None overdue"}
          icon={<Receipt />}
          tone={m.overdueCount ? "danger" : "success"}
          href="/demo/finance"
        />
        <StatCard label="Open sales opportunities" value={String(m.openOppCount)} hint={`${money.compact(m.openOppValue)} pipeline`} icon={<Target />} href="/demo/sales" />
        <StatCard
          label="Orders awaiting processing"
          value={String(m.ordersAwaiting)}
          hint={m.ordersAwaiting ? "Pending orders" : "All processed"}
          icon={<PackageOpen />}
          tone={m.ordersAwaiting ? "warning" : "success"}
          href="/demo/orders"
        />
        <StatCard
          label="Low-stock products"
          value={String(m.lowStockCount)}
          hint={m.lowStockCount ? `${m.outOfStockCount} out of stock` : "All above threshold"}
          icon={m.lowStockCount ? <AlertTriangle /> : <Boxes />}
          tone={m.lowStockCount ? "warning" : "success"}
          href="/demo/inventory"
        />
        <StatCard
          label="Tasks due today"
          value={String(m.tasksDueToday)}
          hint={m.tasksOverdue ? `${m.tasksOverdue} overdue` : "Nothing overdue"}
          icon={<ClipboardCheck />}
          tone={m.tasksOverdue ? "warning" : "default"}
          href="/demo/projects"
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <Card
            title="Revenue trend"
            description="Booked orders by month. The latest month is month-to-date."
            action={
              <div role="group" aria-label="Time range" className="flex rounded-lg border bg-muted p-0.5">
                {([6, 12] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={range === r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      range === r ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}M
                  </button>
                ))}
              </div>
            }
          >
            <RevenueTrendChart points={points} money={money} height={270} id="ov-rev" />
          </Card>

          <Card title="Recent orders" action={<Link href="/demo/orders" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">View all <ArrowRight className="size-3" aria-hidden="true" /></Link>} bodyClassName="px-0 pb-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Most recent orders</caption>
                <thead>
                  <tr className="border-y bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-5 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Customer</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Date</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/40">
                      <td className="px-5 py-2.5">
                        <button type="button" onClick={() => openRecord({ kind: "order", id: o.id }, "/demo/orders")} className="rounded font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                          {o.number}
                        </button>
                      </td>
                      <td className="max-w-[10rem] truncate px-3 py-2.5 text-muted-foreground">{people.get(o.customerId)?.company}</td>
                      <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">{formatShortDate(o.date)}</td>
                      <td className="px-3 py-2.5">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{money.full(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <InsightsPanel />
          <Card title="Recent activity" description="Updates across the workspace">
            <ul className="space-y-4">
              {data.activities.slice(0, 7).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[a.kind])} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] leading-snug text-foreground">{a.message}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {a.actorId && team.get(a.actorId) && <Avatar member={team.get(a.actorId)!} size="sm" className="size-4 text-[0.5rem]" />}
                      {relativeActivity(a.at, today)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <SalesDocDialog mode="order" open={orderOpen} onOpenChange={setOrderOpen} />
      <AddContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
