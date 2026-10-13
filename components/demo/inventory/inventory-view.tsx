"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, ClipboardPlus, PackagePlus, SlidersHorizontal } from "lucide-react";

import { AddProductDialog } from "@/components/demo/inventory/add-product-dialog";
import { ProductDialog } from "@/components/demo/inventory/product-dialog";
import { useToast } from "@/components/demo/toast";
import { Card, DataTable, EmptyState, FilterChips, PageHeader, SearchField, SelectField, StatCard, type Column } from "@/components/demo/ui";
import { StockStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { lowStockProducts, stockStatus } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useOpenRecord } from "@/lib/demo/store";
import { PRODUCT_CATEGORIES, type Product, type StockStatus } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | StockStatus;

export function InventoryView() {
  const data = useDemoData();
  const money = useMoney();
  const actions = useDemoActions();
  const toast = useToast();
  const openId = useOpenRecord("product");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);

  const low = useMemo(() => lowStockProducts(data), [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.products.length, in_stock: 0, low: 0, out: 0 };
    for (const p of data.products) c[stockStatus(p)] += 1;
    return c;
  }, [data.products]);
  const units = data.products.reduce((s, p) => s + p.stock, 0);
  const value = data.products.reduce((s, p) => s + p.stock * p.unitCost, 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status !== "all" && stockStatus(p) !== status) return false;
      if (!q) return true;
      return [p.name, p.sku, p.supplier].some((f) => f.toLowerCase().includes(q));
    });
  }, [data.products, query, category, status]);

  function reorderAll() {
    let created = 0;
    for (const p of low) if (actions.createReorderTask(p.id).ok) created += 1;
    if (created > 0) toast.success(`${created} reorder task${created === 1 ? "" : "s"} created`, "Find them in Projects under “Q4 inventory restock”.");
    else toast.info("Nothing new to create", "Reorder tasks already exist for every low-stock product.");
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      primary: true,
      sortValue: (p) => p.name,
      cell: (p) => (
        <span className="block">
          <span className="block">{p.name}</span>
          <span className="block font-mono text-xs font-normal text-muted-foreground">{p.sku}</span>
        </span>
      ),
    },
    { key: "category", header: "Category", hideBelow: "md", sortValue: (p) => p.category, cell: (p) => p.category },
    {
      key: "stock",
      header: "Available stock",
      sortValue: (p) => p.stock / Math.max(1, p.threshold),
      cell: (p) => {
        const s = stockStatus(p);
        const pct = Math.min(100, (p.stock / Math.max(1, p.threshold * 2)) * 100);
        return (
          <div className="flex items-center gap-3">
            <span className={cn("w-9 text-right font-semibold tabular-nums", s !== "in_stock" && "text-warning", s === "out" && "text-danger")}>{p.stock}</span>
            <div className="relative hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true">
              <div className={cn("h-full rounded-full", s === "in_stock" ? "bg-success" : s === "low" ? "bg-warning" : "bg-danger")} style={{ width: `${pct}%` }} />
              <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
            </div>
          </div>
        );
      },
    },
    { key: "threshold", header: "Threshold", align: "right", hideBelow: "lg", sortValue: (p) => p.threshold, cell: (p) => p.threshold },
    { key: "price", header: "Unit price", align: "right", hideBelow: "md", sortValue: (p) => p.unitPrice, cell: (p) => money.full(p.unitPrice) },
    { key: "status", header: "Status", sortValue: (p) => stockStatus(p), cell: (p) => <StockStatusBadge status={stockStatus(p)} /> },
    {
      key: "actions",
      header: "Adjust",
      align: "right",
      cell: (p) => (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); actions.open("product", p.id); }} aria-label={`Adjust stock for ${p.name}`}>
          <SlidersHorizontal /> <span className="hidden sm:inline">Adjust</span>
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Products, stock levels and reorder thresholds. Adjust a product's stock to see warnings, notifications and the dashboard react."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <PackagePlus /> Add product
          </Button>
        }
      />

      {low.length > 0 ? (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-warning sm:flex-row sm:items-start">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {low.length} product{low.length === 1 ? " is" : "s are"} below the stock threshold
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {low.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => actions.open("product", p.id)} className="rounded font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    {p.name}
                  </button>{" "}
                  ({p.stock}/{p.threshold})
                </li>
              ))}
            </ul>
          </div>
          <Button variant="outline" size="sm" onClick={reorderAll} className="shrink-0 bg-card text-foreground">
            <ClipboardPlus /> Create reorder tasks
          </Button>
        </div>
      ) : (
        <p role="status" className="mb-6 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          All products are at or above their stock thresholds.
        </p>
      )}

      <section aria-label="Inventory summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={String(data.products.length)} hint={`${PRODUCT_CATEGORIES.length} categories`} icon={<Boxes />} />
        <StatCard label="Units on hand" value={units.toLocaleString("en-US")} hint="Across all products" />
        <StatCard label="Stock value (at cost)" value={money.compact(value)} hint="Units × unit cost" />
        <StatCard label="Below threshold" value={String(low.length)} hint={`${counts.out} out of stock`} tone={low.length ? "warning" : "success"} icon={<AlertTriangle />} />
      </section>

      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchField label="Search products" value={query} onChange={setQuery} placeholder="Search name, SKU or supplier…" className="sm:max-w-sm sm:flex-1" />
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              className="sm:w-52"
              options={[{ value: "all", label: "All categories" }, ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <FilterChips<StatusFilter>
            label="Filter by stock status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "in_stock", label: "In stock", count: counts.in_stock },
              { value: "low", label: "Low stock", count: counts.low },
              { value: "out", label: "Out of stock", count: counts.out },
            ]}
          />
        </div>
        <DataTable
          key={`${query}-${category}-${status}`}
          caption="Product inventory"
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={(p) => actions.open("product", p.id)}
          selectedKey={openId}
          initialSort={{ key: "stock", dir: "asc" }}
          pageSize={12}
          empty={
            <EmptyState
              title="No products match"
              description="Adjust your filters or add a new product."
              action={
                <Button variant="outline" onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }}>
                  Clear filters
                </Button>
              }
            />
          }
        />
      </Card>

      <ProductDialog productId={openId} onClose={actions.closeRecord} />
      <AddProductDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
