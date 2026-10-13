"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Plus } from "lucide-react";

import { OrderDrawer } from "@/components/demo/orders/order-drawer";
import { SalesDocDialog } from "@/components/demo/sales-doc-dialog";
import { Card, DataTable, EmptyState, FilterChips, PageHeader, SearchField, SelectField, type Column } from "@/components/demo/ui";
import { OrderStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { DEMO_TODAY, addDays, formatDate, monthKey } from "@/lib/demo/dates";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useDemoLookups, useOpenRecord } from "@/lib/demo/store";
import type { Order, OrderStatus } from "@/lib/demo/types";

type StatusFilter = "all" | OrderStatus;
type DateFilter = "all" | "month" | "30d";

export function OrdersView() {
  const data = useDemoData();
  const lookups = useDemoLookups();
  const money = useMoney();
  const actions = useDemoActions();
  const openId = useOpenRecord("order");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [range, setRange] = useState<DateFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.orders.length };
    for (const o of data.orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data.orders]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (range === "month" && monthKey(o.date) !== monthKey(DEMO_TODAY)) return false;
      if (range === "30d" && o.date < addDays(DEMO_TODAY, -30)) return false;
      if (!q) return true;
      return o.number.toLowerCase().includes(q) || (lookups.contacts.get(o.customerId)?.company.toLowerCase().includes(q) ?? false);
    });
  }, [data.orders, lookups.contacts, query, status, range]);

  const columns: Column<Order>[] = [
    { key: "number", header: "Order", primary: true, cell: (o) => o.number, sortValue: (o) => o.number },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => lookups.contacts.get(o.customerId)?.company ?? "",
      cell: (o) => (
        <span className="block">
          <span className="block">{lookups.contacts.get(o.customerId)?.company ?? "—"}</span>
          <span className="mt-1 block sm:hidden">
            <OrderStatusBadge status={o.status} />
          </span>
        </span>
      ),
    },
    { key: "date", header: "Date", hideBelow: "sm", cell: (o) => formatDate(o.date), sortValue: (o) => `${o.date}${o.number}` },
    { key: "items", header: "Items", hideBelow: "lg", align: "right", cell: (o) => o.lines.reduce((s, l) => s + l.quantity, 0), sortValue: (o) => o.lines.reduce((s, l) => s + l.quantity, 0) },
    { key: "status", header: "Status", hideBelow: "sm", cell: (o) => <OrderStatusBadge status={o.status} />, sortValue: (o) => o.status },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-semibold">{money.full(o.total)}</span>, sortValue: (o) => o.total },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Create, track and fulfil customer orders. Creating an order reserves stock and updates the dashboard."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Create order
          </Button>
        }
      />

      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchField label="Search orders" value={query} onChange={setQuery} placeholder="Search by order number or customer…" className="sm:max-w-sm sm:flex-1" />
            <SelectField
              label="Date range"
              value={range}
              onChange={(v) => setRange(v as DateFilter)}
              className="sm:w-48"
              options={[
                { value: "all", label: "All time" },
                { value: "month", label: "This month" },
                { value: "30d", label: "Last 30 days" },
              ]}
            />
          </div>
          <FilterChips<StatusFilter>
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "pending", label: "Pending", count: counts.pending ?? 0 },
              { value: "processing", label: "Processing", count: counts.processing ?? 0 },
              { value: "shipped", label: "Shipped", count: counts.shipped ?? 0 },
              { value: "delivered", label: "Delivered", count: counts.delivered ?? 0 },
              { value: "cancelled", label: "Cancelled", count: counts.cancelled ?? 0 },
            ]}
          />
        </div>
        <DataTable
          key={`${status}-${range}-${query}`}
          caption="Customer orders"
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={(o) => actions.open("order", o.id)}
          selectedKey={openId}
          initialSort={{ key: "date", dir: "desc" }}
          empty={
            <EmptyState
              icon={<PackageSearch />}
              title="No orders match your filters"
              description="Try a different status or search term, or create a new order."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setRange("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          }
        />
      </Card>

      <OrderDrawer orderId={openId} onClose={actions.closeRecord} />
      <SalesDocDialog mode="order" open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
