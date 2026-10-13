"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { RevenueTrendChart } from "@/components/shared/charts";
import { relativeActivity } from "@/lib/demo/dates";
import { formatSignedPercent, usd } from "@/lib/demo/format";
import { SEED_DATA } from "@/lib/demo/seed";
import { computeMetrics, indexById, monthlyTrend } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";

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

export function PreviewOverview() {
  const [range, setRange] = useState<6 | 12>(12);
  const m = useMemo(() => computeMetrics(SEED_DATA), []);
  const points = useMemo(() => monthlyTrend(SEED_DATA, range), [range]);
  const team = useMemo(() => indexById(SEED_DATA.team), []);

  const kpis = [
    { label: "Revenue this month", value: usd.full(m.revenueMonth), delta: m.revenueGrowthPct, hint: "vs same days last month" },
    { label: "Outstanding invoices", value: usd.full(m.outstandingTotal), delta: null, hint: `${m.overdueCount} overdue` },
    { label: "Open opportunities", value: String(m.openOppCount), delta: null, hint: `${usd.compact(m.openOppValue)} pipeline` },
    { label: "Low-stock products", value: String(m.lowStockCount), delta: null, hint: `${m.outOfStockCount} out of stock` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3.5 shadow-card">
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl">{k.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {k.delta !== null && (
                <span className={cn("inline-flex items-center gap-0.5 font-semibold", k.delta >= 0 ? "text-success" : "text-warning")}>
                  {k.delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {formatSignedPercent(k.delta, 1)}
                </span>
              )}
              {k.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Revenue trend</h4>
              <p className="text-xs text-muted-foreground">Booked orders per month, latest is month to date</p>
            </div>
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
          </div>
          <RevenueTrendChart points={points} money={usd} height={230} id="pv-rev" />
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-card">
          <h4 className="text-sm font-semibold text-foreground">Recent activity</h4>
          <ul className="mt-3 space-y-3">
            {SEED_DATA.activities.slice(0, 5).map((a) => (
              <li key={a.id} className="flex gap-2.5">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[a.kind])} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] leading-snug text-foreground">{a.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {relativeActivity(a.at)}
                    {a.actorId && team.get(a.actorId) ? ` · ${team.get(a.actorId)!.name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
