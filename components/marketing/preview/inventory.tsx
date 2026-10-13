"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockStatusBadge } from "@/components/shared/badges";
import { usd } from "@/lib/demo/format";
import { SEED_DATA } from "@/lib/demo/seed";
import { stockStatus } from "@/lib/demo/selectors";
import type { Product } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

const PREVIEW_SKUS = ["FRN-CH-210", "ELC-DK-120", "ELC-WC-140", "ACC-LS-250", "FRN-SD-100", "ELC-MN-110", "ACC-MA-220", "ACC-KB-230"];

function initialProducts(): Product[] {
  return PREVIEW_SKUS.map((sku) => SEED_DATA.products.find((p) => p.sku === sku)).filter((p): p is Product => !!p);
}

export function PreviewInventory() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const low = useMemo(() => products.filter((p) => stockStatus(p) !== "in_stock"), [products]);

  function adjust(id: string, delta: number) {
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)));
  }

  return (
    <div className="space-y-4">
      <div
        role="status"
        className={cn(
          "flex items-start gap-3 rounded-xl border p-3.5 text-sm",
          low.length ? "border-warning/30 bg-warning-soft text-warning" : "border-success/30 bg-success-soft text-success",
        )}
      >
        {low.length ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {low.length ? `${low.length} of ${products.length} products are below their stock threshold` : "Every product is above its threshold"}
          </p>
          <p className="mt-0.5 text-xs opacity-90">
            {low.length ? low.map((p) => p.name).join(" · ") : "Try reducing a product's stock to see the warning appear."}
          </p>
        </div>
        <Button variant="ghost" size="xs" onClick={() => setProducts(initialProducts())} className="shrink-0 text-current hover:bg-black/5">
          <RotateCcw /> Reset
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Stock vs threshold</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Unit price</th>
                <th className="px-4 py-2.5 text-right font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => {
                const status = stockStatus(p);
                const pct = Math.min(100, (p.stock / Math.max(1, p.threshold * 2)) * 100);
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 text-right font-semibold tabular-nums">{p.stock}</span>
                        <div className="relative h-2 w-28 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                          <div
                            className={cn("h-full rounded-full transition-[width] duration-300", status === "in_stock" ? "bg-success" : status === "low" ? "bg-warning" : "bg-danger")}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: "50%" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">min {p.threshold}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StockStatusBadge status={status} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{usd.full(p.unitPrice)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon-sm" aria-label={`Remove 5 units of ${p.name}`} onClick={() => adjust(p.id, -5)}>
                          <Minus />
                        </Button>
                        <Button variant="outline" size="icon-sm" aria-label={`Add 5 units of ${p.name}`} onClick={() => adjust(p.id, 5)}>
                          <Plus />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
