import { Bell, Boxes, FileSpreadsheet, Receipt, Users } from "lucide-react";

import type { StoryData } from "@/lib/demo/story-data";
import { cn } from "@/lib/utils";
import type { CardId } from "./layout";

/**
 * Miniature "tool" cards used by the story. In the fragmented scene they look
 * like separate tools with stale or conflicting data; in the connected scene the
 * same cards become modules of one workspace and show figures from the shared
 * sample dataset. Sizes are fixed by the parent (absolute, logical pixels).
 */

export type CardMode = "fragmented" | "connected";

const shell =
  "h-full w-full overflow-hidden rounded-xl border bg-white p-2.5 text-left shadow-elevated ring-1 ring-black/[0.02]";

function Header({ icon, title, tone = "slate" }: { icon: React.ReactNode; title: string; tone?: "slate" | "indigo" | "emerald" | "amber" | "sky" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
  } as const;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("flex size-5 items-center justify-center rounded-md [&_svg]:size-3", tones[tone])}>{icon}</span>
      <span className="truncate text-[11px] font-semibold text-slate-800">{title}</span>
    </div>
  );
}

function StatusDot({ tone }: { tone: "ok" | "warn" | "bad" | "idle" }) {
  const color = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", idle: "bg-slate-300" }[tone];
  return <span className={cn("inline-block size-1.5 shrink-0 rounded-full", color)} aria-hidden="true" />;
}

export function StoryCard({ id, mode, data }: { id: CardId; mode: CardMode; data: StoryData }) {
  const connected = mode === "connected";
  switch (id) {
    case "sheet":
      return (
        <div className={shell}>
          <Header icon={<FileSpreadsheet />} title={connected ? "Sales" : "orders_final_v3.xlsx"} tone={connected ? "indigo" : "emerald"} />
          {connected ? (
            <div className="mt-2">
              <p className="text-[19px] leading-none font-semibold tracking-tight text-slate-900">{data.revenueMonth}</p>
              <p className="mt-1 text-[10px] text-slate-500">{data.ordersMonth} orders this month</p>
              <div className="mt-2 flex h-5 items-end gap-[3px]" aria-hidden="true">
                {data.trend.map((v, i) => {
                  const max = Math.max(...data.trend);
                  return <span key={i} className="flex-1 rounded-sm bg-indigo-200" style={{ height: `${Math.max(18, (v / max) * 100)}%` }} />;
                })}
              </div>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-4 gap-px overflow-hidden rounded border border-slate-200 bg-slate-200 text-[9px]">
              {["Cust.", "Qty", "Total", "Paid", "Brightl", "8", "5,656", "?", "Cedar", "4", "#REF!", "Y", "Helio", "12", "9,324", ""].map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "truncate bg-white px-1 py-0.5",
                    i < 4 && "bg-slate-50 font-semibold text-slate-500",
                    c === "#REF!" && "bg-rose-50 font-semibold text-rose-600",
                    c === "?" && "text-amber-600",
                  )}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case "crm":
      return (
        <div className={shell}>
          <Header icon={<Users />} title={connected ? "Customers" : "Contacts"} tone={connected ? "indigo" : "sky"} />
          {connected ? (
            <div className="mt-2">
              <p className="text-[19px] leading-none font-semibold tracking-tight text-slate-900">{data.customers}</p>
              <p className="mt-1 text-[10px] text-slate-500">customers · {data.openDeals} open deals</p>
              <div className="mt-2 flex gap-1">
                {["bg-indigo-400", "bg-indigo-300", "bg-indigo-200", "bg-emerald-300"].map((c, i) => (
                  <span key={i} className={cn("h-1.5 flex-1 rounded-full", c)} aria-hidden="true" />
                ))}
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-1 text-[10px]">
              {[
                { n: data.lead.contact, s: "follow up?", t: "warn" as const },
                { n: "Hannah E.", s: "last call: ?", t: "idle" as const },
                { n: "Amara O.", s: "dup. entry", t: "bad" as const },
              ].map((r) => (
                <li key={r.n} className="flex items-center justify-between gap-1 rounded bg-slate-50 px-1.5 py-1">
                  <span className="truncate font-medium text-slate-700">{r.n}</span>
                  <span className="flex shrink-0 items-center gap-1 text-slate-400">
                    <StatusDot tone={r.t} />
                    {r.s}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "invoice":
      return (
        <div className={shell}>
          <Header icon={<Receipt />} title={connected ? "Finance" : "Invoices"} tone={connected ? "indigo" : "amber"} />
          {connected ? (
            <div className="mt-2">
              <p className="text-[19px] leading-none font-semibold tracking-tight text-slate-900">{data.outstanding}</p>
              <p className="mt-1 text-[10px] text-slate-500">outstanding · {data.overdueCount} overdue</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <span className="block h-full w-[82%] rounded-full bg-indigo-300" />
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-1 text-[10px]">
              {[
                { n: data.invoice.number, s: "unpaid?", t: "bad" as const },
                { n: "INV-2171", s: "sent?", t: "warn" as const },
                { n: "INV-2182", s: "paid?", t: "idle" as const },
              ].map((r) => (
                <li key={r.n} className="flex items-center justify-between rounded bg-slate-50 px-1.5 py-1">
                  <span className="font-medium text-slate-700">{r.n}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <StatusDot tone={r.t} />
                    {r.s}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "inventory":
      return (
        <div className={shell}>
          <Header icon={<Boxes />} title={connected ? "Inventory" : "Stock count"} tone={connected ? "indigo" : "emerald"} />
          {connected ? (
            <div className="mt-2">
              <p className="text-[19px] leading-none font-semibold tracking-tight text-slate-900">{data.lowStockCount}</p>
              <p className="mt-1 text-[10px] text-slate-500">products below threshold</p>
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {[70, 40, 85, 30, 60].map((w, i) => (
                  <span key={i} className={cn("h-1.5 flex-1 rounded-full", w < 45 ? "bg-amber-300" : "bg-indigo-200")} />
                ))}
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-1 text-[10px]">
              {[
                { n: data.product.sku, s: String(data.product.stock + 4), t: "warn" as const },
                { n: "ELC-WC-140", s: "?", t: "bad" as const },
                { n: "ACC-MA-220", s: "42", t: "idle" as const },
              ].map((r) => (
                <li key={r.n} className="flex items-center justify-between rounded bg-slate-50 px-1.5 py-1">
                  <span className="font-medium text-slate-700">{r.n}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <StatusDot tone={r.t} />
                    {r.s} <em className="not-italic">· 3w ago</em>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "notif":
      return (
        <div className={shell}>
          <Header icon={<Bell />} title={connected ? "Activity" : "Notifications"} tone={connected ? "indigo" : "slate"} />
          {connected ? (
            <p className="mt-2 text-[10px] leading-snug text-slate-500">
              <span className="font-semibold text-slate-800">One feed</span> for orders, payments, stock and follow-ups.
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-[10px]">
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">12</span>
              <span className="truncate text-slate-500">unread · 3 missed</span>
            </div>
          )}
        </div>
      );
  }
}

export const CARD_LABEL: Record<CardId, string> = {
  crm: "Customers",
  sheet: "Sales",
  invoice: "Finance",
  inventory: "Inventory",
  notif: "Activity",
};
