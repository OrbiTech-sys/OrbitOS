"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import type { MoneyFormatter } from "@/lib/demo/format";
import type { MonthlyPoint } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";

/** True after hydration. Charts render a skeleton first so layout never jumps and Recharts never measures 0px. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ChartFrame({
  height,
  children,
  className,
  label,
}: {
  height: number;
  children: React.ReactElement;
  className?: string;
  /** Accessible summary of what the chart shows. */
  label: string;
}) {
  const ready = useIsClient();
  return (
    <div className={cn("w-full", className)} style={{ height }} role="img" aria-label={label}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 560, height }}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="skeleton-shimmer h-full w-full rounded-xl bg-muted" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Tooltip ---- */

export interface TooltipRow {
  name: string;
  color: string;
  value: string;
}

export function TooltipCard({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2.5 text-xs shadow-elevated">
      {title && <p className="mb-1.5 font-semibold text-foreground">{title}</p>}
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />
              {r.name}
            </span>
            <span className="font-semibold text-foreground tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Build a Recharts tooltip renderer from a row formatter. */
export function makeTooltip(rowsFor: (payload: Record<string, unknown>, label: string | number | undefined) => { title?: string; rows: TooltipRow[] } | null) {
  function ChartTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    const first = payload[0]?.payload as Record<string, unknown> | undefined;
    if (!first) return null;
    const res = rowsFor(first, label);
    return res ? <TooltipCard title={res.title} rows={res.rows} /> : null;
  }
  return ChartTooltip;
}

/* --------------------------------------------------------- Trend charts ---- */

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

/** Monthly revenue (area) with optional expense line. Used on dashboards and previews. */
export function RevenueTrendChart({
  points,
  money,
  height = 260,
  showExpenses = false,
  id = "rev",
}: {
  points: MonthlyPoint[];
  money: MoneyFormatter;
  height?: number;
  showExpenses?: boolean;
  id?: string;
}) {
  const tooltip = makeTooltip((p) => {
    const pt = p as unknown as MonthlyPoint;
    const rows: TooltipRow[] = [{ name: "Revenue", color: "var(--chart-1)", value: money.full(pt.revenue) }];
    if (showExpenses) {
      rows.push({ name: "Expenses", color: "var(--chart-4)", value: money.full(pt.expenses) });
      rows.push({ name: "Net", color: "var(--chart-3)", value: money.full(pt.net) });
    } else {
      rows.push({ name: "Orders", color: "var(--chart-2)", value: String(pt.orders) });
    }
    return { title: pt.partial ? `${pt.label} (month to date)` : pt.label, rows };
  });

  // The current month is incomplete, so it is drawn as a separate dashed "month to date" segment
  // instead of letting the line plunge as if revenue had collapsed.
  const plot = points.map((p, i) => ({
    ...p,
    full: p.partial ? null : p.revenue,
    expensesFull: p.partial ? null : p.expenses,
    mtd: p.partial || points[i + 1]?.partial ? p.revenue : null,
  }));

  const Chart = showExpenses ? ComposedChart : AreaChart;
  return (
    <ChartFrame
      height={height}
      label={`Monthly revenue${showExpenses ? " and expenses" : ""} for the last ${points.length} months. The latest month is month-to-date.`}
    >
      <Chart data={plot} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} interval="preserveStartEnd" minTickGap={12} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={52} tickFormatter={(v: number) => money.compact(v)} />
        <Tooltip content={tooltip} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey="full" stroke="var(--chart-1)" strokeWidth={2.25} fill={`url(#${id}-fill)`} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} isAnimationActive={false} />
        <Line
          type="linear"
          dataKey="mtd"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeDasharray="3 4"
          dot={(props: { cx?: number; cy?: number; payload?: { partial?: boolean }; index?: number }) =>
            props.payload?.partial && props.cx !== undefined && props.cy !== undefined ? (
              <circle key={`mtd-${props.index}`} cx={props.cx} cy={props.cy} r={5} fill="var(--card)" stroke="var(--chart-1)" strokeWidth={2} />
            ) : (
              <g key={`mtd-${props.index}`} />
            )
          }
          activeDot={false}
          isAnimationActive={false}
        />
        {showExpenses && (
          <Line type="monotone" dataKey="expensesFull" stroke="var(--chart-4)" strokeWidth={2} dot={false} strokeDasharray="5 4" isAnimationActive={false} />
        )}
      </Chart>
    </ChartFrame>
  );
}
