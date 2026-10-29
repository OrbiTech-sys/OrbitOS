"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { useToast } from "@/components/demo/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { stockStatus } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import { useIsDemo } from "@/lib/workspace/context";
import { cn } from "@/lib/utils";

/**
 * Shared "create order" / "create quotation" flow.
 * Validates with Zod, creates the record through the demo store (which reserves
 * stock, links invoices and updates every dashboard metric), then confirms with a toast.
 */

type Mode = "order" | "quotation";

const lineSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  quantity: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Enter a whole number above 0")
    .transform(Number),
});

const docSchema = z.object({
  customerId: z.string().min(1, "Choose who this is for"),
  lines: z.array(lineSchema).min(1, "Add at least one product"),
});

interface DraftLine {
  key: number;
  productId: string;
  quantity: string;
}

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function Form({ mode, initialCustomerId, onDone }: { mode: Mode; initialCustomerId?: string; onDone: () => void }) {
  const demo = useIsDemo();
  const data = useDemoData();
  const actions = useDemoActions();
  const money = useMoney();
  const toast = useToast();

  const people = useMemo(
    () => (mode === "order" ? data.contacts.filter((c) => c.stage === "customer") : data.contacts.filter((c) => c.stage !== "lost")).sort((a, b) => a.company.localeCompare(b.company)),
    [data.contacts, mode],
  );
  const products = data.products;

  const [customerId, setCustomerId] = useState(initialCustomerId && people.some((p) => p.id === initialCustomerId) ? initialCustomerId : "");
  const [lines, setLines] = useState<DraftLine[]>([{ key: 1, productId: "", quantity: "1" }]);
  const [nextKey, setNextKey] = useState(2);
  const [notes, setNotes] = useState("");
  const [flag, setFlag] = useState(false);
  const [validDays, setValidDays] = useState("30");
  const [errors, setErrors] = useState<{ customer?: string; lines?: string; line: Record<number, { product?: string; qty?: string }>; form?: string }>({ line: {} });

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const total = lines.reduce((sum, l) => {
    const p = productMap.get(l.productId);
    const q = Number(l.quantity);
    return p && Number.isFinite(q) && q > 0 ? sum + p.unitPrice * q : sum;
  }, 0);

  // Which products would drop below their threshold if this order were placed (orders only)?
  const warnings = useMemo(() => {
    if (mode !== "order") return [];
    const wanted = new Map<string, number>();
    for (const l of lines) {
      const q = Number(l.quantity);
      if (l.productId && Number.isFinite(q) && q > 0) wanted.set(l.productId, (wanted.get(l.productId) ?? 0) + q);
    }
    return [...wanted.entries()].flatMap(([id, q]) => {
      const p = productMap.get(id);
      if (!p) return [];
      const after = { stock: p.stock - q, threshold: p.threshold };
      return stockStatus(p) === "in_stock" && after.stock >= 0 && stockStatus(after) !== "in_stock" ? [`${p.name} would drop to ${after.stock} (threshold ${p.threshold})`] : [];
    });
  }, [lines, mode, productMap]);

  function updateLine(key: number, patch: Partial<DraftLine>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = docSchema.safeParse({ customerId, lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) });
    if (!parsed.success) {
      const next: typeof errors = { line: {} };
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "customerId") next.customer = issue.message;
        else if (issue.path[0] === "lines" && issue.path.length === 1) next.lines = issue.message;
        else if (issue.path[0] === "lines") {
          const idx = Number(issue.path[1]);
          const key = lines[idx]?.key;
          if (key !== undefined) next.line[key] = { ...next.line[key], [issue.path[2] === "productId" ? "product" : "qty"]: issue.message };
        }
      }
      setErrors(next);
      return;
    }
    setErrors({ line: {} });
    if (mode === "order") {
      const result = actions.createOrder({
        customerId: parsed.data.customerId,
        lines: parsed.data.lines,
        notes,
        createInvoice: flag,
      });
      if (!result.ok) {
        setErrors({ line: {}, form: result.error });
        return;
      }
      toast.success(`Order ${result.value.number} created`, `${money.full(result.value.total)} · stock reserved${flag ? " · invoice issued" : ""}.`);
    } else {
      const result = actions.createQuotation({ customerId: parsed.data.customerId, lines: parsed.data.lines, validDays: Number(validDays), send: flag });
      if (!result.ok) {
        setErrors({ line: {}, form: result.error });
        return;
      }
      toast.success(`Quotation ${result.value.number} ${flag ? "marked as sent" : "saved as draft"}`, `${money.full(result.value.total)} · valid for ${validDays} days.`);
    }
    onDone();
  }

  const noun = mode === "order" ? "order" : "quotation";

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.form && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {errors.form}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="doc-customer">{mode === "order" ? "Customer" : "Customer or lead"}</Label>
        <select id="doc-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} aria-invalid={!!errors.customer} className={selectCls}>
          <option value="">Choose…</option>
          {people.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company} — {c.name}
            </option>
          ))}
        </select>
        {errors.customer && <p role="alert" className="text-xs font-medium text-danger">{errors.customer}</p>}
        {mode === "order" && <p className="text-xs text-muted-foreground">Orders can be placed for existing customers. Accept a quotation to convert a lead.</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Products</legend>
        {lines.map((l, i) => {
          const p = productMap.get(l.productId);
          const e = errors.line[l.key] ?? {};
          return (
            <div key={l.key} className="grid grid-cols-[1fr_5.5rem_auto] items-start gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
              <div className="space-y-1">
                <label htmlFor={`line-product-${l.key}`} className="sr-only">
                  Product {i + 1}
                </label>
                <select id={`line-product-${l.key}`} value={l.productId} onChange={(ev) => updateLine(l.key, { productId: ev.target.value })} aria-invalid={!!e.product} className={selectCls}>
                  <option value="">Choose a product…</option>
                  {products.map((pr) => (
                    <option key={pr.id} value={pr.id} disabled={mode === "order" && pr.stock <= 0}>
                      {pr.name} · {money.full(pr.unitPrice)}
                      {mode === "order" ? ` · ${pr.stock <= 0 ? "out of stock" : `${pr.stock} in stock`}` : ""}
                    </option>
                  ))}
                </select>
                {e.product && <p role="alert" className="text-xs font-medium text-danger">{e.product}</p>}
              </div>
              <div className="space-y-1">
                <label htmlFor={`line-qty-${l.key}`} className="sr-only">
                  Quantity {i + 1}
                </label>
                <Input id={`line-qty-${l.key}`} inputMode="numeric" value={l.quantity} onChange={(ev) => updateLine(l.key, { quantity: ev.target.value })} aria-invalid={!!e.qty} />
                {e.qty && <p role="alert" className="text-xs font-medium text-danger">{e.qty}</p>}
              </div>
              <p className="hidden h-9 items-center justify-end text-sm font-medium tabular-nums sm:flex">{p && Number(l.quantity) > 0 ? money.full(p.unitPrice * Number(l.quantity)) : "—"}</p>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove product ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
                <Trash2 />
              </Button>
            </div>
          );
        })}
        {errors.lines && <p role="alert" className="text-xs font-medium text-danger">{errors.lines}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLines((ls) => [...ls, { key: nextKey, productId: "", quantity: "1" }]);
            setNextKey((k) => k + 1);
          }}
        >
          <Plus /> Add product
        </Button>
      </fieldset>

      {warnings.length > 0 && (
        <div role="status" className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-xs text-warning">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5" aria-hidden="true" /> Stock warning after this order
          </p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {mode === "order" ? (
        <div className="space-y-2">
          <Label htmlFor="doc-notes">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea id="doc-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="doc-valid">Valid for</Label>
          <select id="doc-valid" value={validDays} onChange={(e) => setValidDays(e.target.value)} className={selectCls}>
            {["14", "30", "45"].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="mt-0.5 size-4 rounded border-input accent-[var(--primary)]" />
        <span>
          {mode === "order" ? "Issue an invoice straight away" : "Mark as sent"}
          <span className="block text-xs text-muted-foreground">{mode === "order" ? (demo ? "Demo only: no accounting entry or email is created." : "No email is sent.") : demo ? "Demo only: nothing is emailed." : "Nothing is emailed from OrbitOS yet."}</span>
        </span>
      </label>

      <DialogFooter className="flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Total <strong className={cn("ml-1 text-lg font-semibold text-foreground tabular-nums")}>{money.full(total)}</strong>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">Create {noun}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function SalesDocDialog({
  mode,
  open,
  onOpenChange,
  initialCustomerId,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomerId?: string;
}) {
  const demo = useIsDemo();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "order" ? "Create order" : "New quotation"}</DialogTitle>
          <DialogDescription>
            {mode === "order"
              ? demo ? "Stock is reserved when the order is created. Everything updates locally in this demo." : "Stock is reserved when the order is created."
              : "Quotations can be converted to an order once accepted. Nothing is sent."}
          </DialogDescription>
        </DialogHeader>
        {open && <Form mode={mode} initialCustomerId={initialCustomerId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
