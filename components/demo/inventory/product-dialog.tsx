"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardPlus, Minus, Plus } from "lucide-react";

import { useToast } from "@/components/demo/toast";
import { DetailList } from "@/components/demo/ui";
import { StockStatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stockStatus } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoLookups } from "@/lib/demo/store";
import { stockAdjustSchema } from "@/lib/demo/schemas";
import type { Product } from "@/lib/demo/types";

const REASONS = ["Received shipment", "Cycle count correction", "Damaged or returned", "Sample / internal use", "Other"];

function Body({ product, onClose }: { product: Product; onClose: () => void }) {
  const actions = useDemoActions();
  const money = useMoney();
  const toast = useToast();
  const [delta, setDelta] = useState("10");
  const [reason, setReason] = useState(REASONS[0]);
  const [threshold, setThreshold] = useState(String(product.threshold));
  const [error, setError] = useState<string | null>(null);

  const parsedDelta = Number(delta);
  const valid = delta.trim() !== "" && Number.isInteger(parsedDelta) && parsedDelta !== 0;
  const preview = valid ? product.stock + parsedDelta : null;
  const previewStatus = preview !== null && preview >= 0 ? stockStatus({ stock: preview, threshold: product.threshold }) : null;

  function bump(n: number) {
    setDelta(String((valid ? parsedDelta : 0) + n));
    setError(null);
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const parsed = stockAdjustSchema.safeParse({ delta, reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid adjustment");
      return;
    }
    const result = actions.adjustStock(product.id, parsed.data.delta, parsed.data.reason);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const status = stockStatus(result.value);
    toast[status === "in_stock" ? "success" : "info"](
      `${product.name}: ${result.value.stock} in stock`,
      status === "in_stock" ? `Adjusted by ${parsed.data.delta > 0 ? "+" : ""}${parsed.data.delta}.` : `Warning: now below the threshold of ${product.threshold}.`,
    );
    setError(null);
    onClose();
  }

  function saveThreshold() {
    const n = Number(threshold);
    if (!Number.isInteger(n) || n < 0) {
      setError("Threshold must be a whole number, 0 or more.");
      return;
    }
    actions.setThreshold(product.id, n);
    setError(null);
    toast.success("Threshold updated", `${product.name} will warn below ${n} units.`);
  }

  function reorder() {
    const r = actions.createReorderTask(product.id);
    if (r.ok) toast.success("Reorder task created", `Assigned to Daniel Okafor, due ${r.value.dueDate}. See Projects.`);
    else toast.info("No new task created", r.error);
  }

  return (
    <div className="space-y-5">
      <DetailList
        items={[
          { label: "Status", value: <StockStatusBadge status={stockStatus(product)} /> },
          { label: "Available stock", value: <span className="text-base font-semibold tabular-nums">{product.stock}</span> },
          { label: "Category", value: product.category },
          { label: "Unit price / cost", value: `${money.full(product.unitPrice)} / ${money.full(product.unitCost)}` },
          { label: "Supplier", value: product.supplier },
        ]}
      />

      <form onSubmit={apply} className="space-y-3" noValidate>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Adjust stock</legend>
          <div className="flex flex-wrap items-center gap-2">
            {[-10, -1, 1, 10].map((n) => (
              <Button key={n} type="button" variant="outline" size="sm" onClick={() => bump(n)} aria-label={`${n > 0 ? "Add" : "Remove"} ${Math.abs(n)}`}>
                {n < 0 ? <Minus /> : <Plus />}
                {Math.abs(n)}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="adj-delta">Change by</Label>
              <Input id="adj-delta" inputMode="numeric" value={delta} onChange={(e) => { setDelta(e.target.value); setError(null); }} aria-invalid={!!error} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adj-reason">Reason</Label>
              <select
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {preview === null ? "Enter a whole number, positive to add stock and negative to remove it." : preview < 0 ? <span className="font-medium text-danger">Stock cannot go below zero.</span> : (
              <>
                New stock: <strong className="text-foreground tabular-nums">{preview}</strong>{" "}
                {previewStatus && previewStatus !== "in_stock" && (
                  <span className="ml-1 inline-flex items-center gap-1 font-medium text-warning">
                    <AlertTriangle className="size-3.5" aria-hidden="true" /> {previewStatus === "out" ? "out of stock" : `below threshold (${product.threshold})`}
                  </span>
                )}
              </>
            )}
          </p>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!valid}>
          Apply adjustment
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="adj-threshold">Reorder threshold</Label>
        <div className="flex flex-wrap gap-2">
          <Input id="adj-threshold" inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="max-w-28" />
          <Button type="button" variant="outline" onClick={saveThreshold}>
            Save threshold
          </Button>
          <Button type="button" variant="soft" onClick={reorder}>
            <ClipboardPlus /> Create reorder task
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Stock below this number triggers warnings across the workspace.</p>
      </div>

      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}

export function ProductDialog({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const lookups = useDemoLookups();
  const product = productId ? lookups.products.get(productId) : undefined;
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription className="font-mono text-xs">{product.sku}</DialogDescription>
            </DialogHeader>
            <Body key={`${product.id}-${product.stock}-${product.threshold}`} product={product} onClose={onClose} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
