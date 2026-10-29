"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";

import { Card, PageHeader } from "@/components/demo/ui";
import { ChartFrame, TooltipCard, makeTooltip } from "@/components/shared/charts";
import { formatSignedPercent } from "@/lib/demo/format";
import { leadFunnel, monthlyTrend, ordersByStatus, revenueByCategory } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoData } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useToday } from "@/lib/workspace/context";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--chart-4)",
  processing: "var(--chart-2)",
  shipped: "var(--chart-1)",
  delivered: "var(--chart-3)",
  cancelled: "var(--chart-5)",
};

function Segmented<T extends string | number>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-lg border bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const data = useDemoData();
  const money = useMoney();
  const today = useToday();

  const [months, setMonths] = useState<3 | 6 | 12>(12);
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [catMonths, setCatMonths] = useState<3 | 12>(12);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const trend = useMemo(() => monthlyTrend(data, months, today).map((p) => ({ ...p, expensesFull: p.partial ? null : p.expenses })), [data, months, today]);
  const statuses = useMemo(() => ordersByStatus(data).filter((s) => s.count > 0), [data]);
  const categories = useMemo(() => revenueByCategory(data, catMonths, today), [data, catMonths, today]);
  const funnel = useMemo(() => leadFunnel(data), [data]);
  const totalOrders = statuses.reduce((s, x) => s + x.count, 0);

  const first = trend.find((p) => !p.partial) ?? trend[0];
  const lastFull = [...trend].reverse().find((p) => !p.partial) ?? trend.at(-1)!;
  const change = first && lastFull && first.revenue > 0 && first !== lastFull ? ((lastFull.revenue - first.revenue) / first.revenue) * 100 : null;

  const trendTooltip = makeTooltip((p) => {
    const pt = p as unknown as (typeof trend)[number];
    return {
      title: pt.partial ? `${pt.label} (month to date)` : pt.label,
      rows: [
        { name: "Revenue", color: "var(--chart-1)", value: money.full(pt.revenue) },
        { name: "Orders", color: "var(--chart-2)", value: String(pt.orders) },
        { name: "Avg order", color: "var(--chart-3)", value: pt.orders ? money.full(pt.revenue / pt.orders) : "—" },
      ],
    };
  });

  const categoryTooltip = makeTooltip((p) => {
    const c = p as unknown as (typeof categories)[number];
    const total = categories.reduce((s, x) => s + x.revenue, 0);
    return {
      title: c.category,
      rows: [
        { name: "Revenue", color: "var(--chart-1)", value: money.full(c.revenue) },
        { name: "Units sold", color: "var(--chart-2)", value: c.units.toLocaleString("en-US") },
        { name: "Share", color: "var(--chart-3)", value: total ? `${((c.revenue / total) * 100).toFixed(0)}%` : "—" },
      ],
    };
  });

  const funnelTooltip = makeTooltip((p) => {
    const f = p as unknown as (typeof funnel.steps)[number];
    return { title: f.label, rows: [{ name: "Contacts reached", color: "var(--chart-1)", value: String(f.count) }, { name: "Deal value", color: "var(--chart-2)", value: money.full(f.value) }] };
  });

  return (
    <>
      <PageHeader title="Analytics" description="Interactive charts built from the same records as the rest of the workspace. Hover or tap a point for details." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          className="xl:col-span-2"
          title="Sales trends"
          description={
            change !== null
              ? `Revenue changed ${formatSignedPercent(change, 0)} between ${first.label} and ${lastFull.label} (full months only).`
              : "Revenue and orders by month. The latest month is month-to-date."
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Metric" value={metric} onChange={setMetric} options={[{ value: "revenue", label: "Revenue" }, { value: "orders", label: "Orders" }]} />
              <Segmented label="Time range" value={months} onChange={setMonths} options={[{ value: 3, label: "3M" }, { value: 6, label: "6M" }, { value: 12, label: "12M" }]} />
            </div>
          }
        >
          <ChartFrame height={300} label={`Monthly ${metric} for the last ${months} months`}>
            <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} width={52} tickFormatter={(v: number) => (metric === "revenue" ? money.compact(v) : String(v))} />
              <Tooltip content={trendTooltip} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey={metric} radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false}>
                {trend.map((p) => (
                  <Cell key={p.key} fill="var(--chart-1)" fillOpacity={p.partial ? 0.45 : 1} />
                ))}
              </Bar>
              {metric === "revenue" && <Line type="monotone" dataKey="expensesFull" stroke="var(--chart-4)" strokeWidth={2} dot={false} strokeDasharray="5 4" isAnimationActive={false} />}
            </ComposedChart>
          </ChartFrame>
          <p className="mt-3 text-xs text-muted-foreground">
            {metric === "revenue" ? "Bars show revenue; the dashed line shows expenses. " : ""}The lighter bar is the current month so far.
          </p>
        </Card>

        <Card title="Orders by status" description={`${totalOrders} orders in total. Select a status to highlight it.`}>
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ChartFrame height={230} label={`Orders by status: ${statuses.map((s) => `${s.status} ${s.count}`).join(", ")}`}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const s = payload[0].payload as (typeof statuses)[number];
                    return <TooltipCard title={s.status[0].toUpperCase() + s.status.slice(1)} rows={[{ name: "Orders", color: STATUS_COLOR[s.status], value: String(s.count) }, { name: "Value", color: "var(--chart-2)", value: money.full(s.value) }]} />;
                  }}
                />
                <Pie data={statuses} dataKey="count" nameKey="status" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
                  {statuses.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLOR[s.status]} fillOpacity={activeStatus && activeStatus !== s.status ? 0.25 : 1} />
                  ))}
                </Pie>
              </PieChart>
            </ChartFrame>
            <ul className="space-y-1.5">
              {statuses.map((s) => (
                <li key={s.status}>
                  <button
                    type="button"
                    aria-pressed={activeStatus === s.status}
                    onClick={() => setActiveStatus((a) => (a === s.status ? null : s.status))}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                      activeStatus === s.status && "bg-muted",
                    )}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[s.status] }} aria-hidden="true" />
                    <span className="flex-1 capitalize">{s.status}</span>
                    <span className="font-semibold tabular-nums">{s.count}</span>
                    <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">{money.compact(s.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card
          title="Revenue by category"
          description="Product categories ranked by booked revenue"
          action={<Segmented label="Time range" value={catMonths} onChange={setCatMonths} options={[{ value: 3, label: "3M" }, { value: 12, label: "12M" }]} />}
        >
          <ChartFrame height={260} label={`Revenue by product category over the last ${catMonths} months`}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 56, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v: number) => money.compact(v)} />
              <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} tick={{ ...AXIS, fill: "var(--foreground)" }} width={86} />
              <Tooltip content={categoryTooltip} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28} fill="var(--chart-1)" isAnimationActive={false}>
                <LabelList dataKey="revenue" position="right" formatter={(v) => money.compact(Number(v))} style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              </Bar>
            </BarChart>
          </ChartFrame>
        </Card>

        <Card
          className="xl:col-span-2"
          title="Lead conversion overview"
          description={funnel.conversionPct === null ? undefined : `${funnel.conversionPct.toFixed(0)}% of all contacts ever created became customers · ${funnel.lost} lost`}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ChartFrame height={240} label={`Lead funnel: ${funnel.steps.map((s) => `${s.label} ${s.count}`).join(", ")}`}>
              <BarChart data={funnel.steps} layout="vertical" margin={{ top: 0, right: 40, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ ...AXIS, fill: "var(--foreground)" }} width={92} />
                <Tooltip content={funnelTooltip} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30} isAnimationActive={false}>
                  {funnel.steps.map((s, i) => (
                    <Cell key={s.stage} fill="var(--chart-1)" fillOpacity={1 - i * 0.16} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                </Bar>
              </BarChart>
            </ChartFrame>
            <div className="space-y-3 self-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Each bar counts contacts that reached <em>at least</em> that stage. Moving a lead between stages in CRM, or accepting a quotation, updates this funnel instantly.
              </p>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">Conversion</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums">{funnel.conversionPct === null ? "—" : `${funnel.conversionPct.toFixed(0)}%`}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">Customers</dt>
                  <dd className="mt-0.5 text-xl font-semibold tabular-nums">{funnel.steps.at(-1)?.count ?? 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
