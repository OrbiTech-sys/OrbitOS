"use client";

import { Link } from "@/components/demo/link";
import { useState } from "react";
import { ArrowRight, Check, FileText, Receipt, Truck, XCircle } from "lucide-react";

import { DetailList } from "@/components/demo/ui";
import { useToast } from "@/components/demo/toast";
import { InvoiceStatusBadge, OrderStatusBadge, orderStatusLabel } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/demo/dates";
import { invoiceDisplayStatus, stockStatus } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoLookups } from "@/lib/demo/store";
import type { OrderStatus } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { useIsDemo, useToday } from "@/lib/workspace/context";

const FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { pending: "processing", processing: "shipped", shipped: "delivered" };

export function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const lookups = useDemoLookups();
  const actions = useDemoActions();
  const money = useMoney();
  const today = useToday();
  const toast = useToast();
  const demo = useIsDemo();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const order = orderId ? lookups.orders.get(orderId) : undefined;
  const customer = order ? lookups.contacts.get(order.customerId) : undefined;
  const invoice = order?.invoiceId ? lookups.invoices.get(order.invoiceId) : undefined;
  const next = order ? NEXT[order.status] : undefined;
  const currentIdx = order ? FLOW.indexOf(order.status) : -1;

  return (
    <Sheet
      open={!!order}
      onOpenChange={(o) => {
        if (!o) {
          setConfirmCancel(false);
          onClose();
        }
      }}
    >
      <SheetContent side="right" className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {order && (
          <>
            <SheetHeader className="border-b p-6 pr-14">
              <div className="flex flex-wrap items-center gap-2.5">
                <SheetTitle className="text-xl font-semibold tracking-tight">{order.number}</SheetTitle>
                <OrderStatusBadge status={order.status} />
              </div>
              <SheetDescription>
                {customer?.company} · placed {formatDate(order.date)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 p-6">
              {order.status !== "cancelled" ? (
                <ol aria-label="Order progress" className="flex items-center gap-1.5">
                  {FLOW.map((s, i) => (
                    <li key={s} className="flex flex-1 items-center gap-1.5">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold",
                          i < currentIdx && "border-primary bg-primary text-primary-foreground",
                          i === currentIdx && "border-primary bg-accent text-accent-foreground",
                          i > currentIdx && "text-muted-foreground",
                        )}
                        aria-current={i === currentIdx ? "step" : undefined}
                      >
                        {i < currentIdx ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn("hidden text-xs font-medium sm:block", i === currentIdx ? "text-foreground" : "text-muted-foreground")}>{orderStatusLabel(s)}</span>
                      {i < FLOW.length - 1 && <span className={cn("h-px flex-1", i < currentIdx ? "bg-primary" : "bg-border")} aria-hidden="true" />}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  <XCircle className="size-4" aria-hidden="true" /> This order was cancelled and its stock was returned to inventory.
                </p>
              )}

              <section aria-labelledby="od-items">
                <h3 id="od-items" className="mb-2 text-sm font-semibold">
                  Items
                </h3>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Order line items</caption>
                    <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Product</th>
                        <th className="px-3 py-2 text-right font-medium">Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.lines.map((l) => {
                        const p = lookups.products.get(l.productId);
                        return (
                          <tr key={l.productId}>
                            <td className="px-3 py-2.5">
                              <p className="font-medium">{p?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {money.full(l.unitPrice)} each
                                {p && order.status !== "cancelled" && stockStatus(p) !== "in_stock" && <span className="ml-2 font-medium text-warning">· stock low</span>}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{l.quantity}</td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums">{money.full(l.quantity * l.unitPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={2} className="px-3 py-2.5 text-right text-sm font-semibold">
                          Total
                        </td>
                        <td className="px-3 py-2.5 text-right text-base font-semibold tabular-nums">{money.full(order.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <DetailList
                items={[
                  {
                    label: "Customer",
                    value: customer ? (
                      <Link href="/demo/crm" className="text-primary hover:underline">
                        {customer.company}
                      </Link>
                    ) : (
                      "—"
                    ),
                  },
                  { label: "Contact", value: customer ? `${customer.name}` : "—" },
                  { label: "Created by", value: lookups.team.get(order.createdById)?.name ?? "—" },
                  { label: "From quotation", value: order.quotationId ? (lookups.quotations.get(order.quotationId)?.number ?? "—") : "Direct order" },
                  ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
                ]}
              />

              <section aria-labelledby="od-invoice">
                <h3 id="od-invoice" className="mb-2 text-sm font-semibold">
                  Invoice
                </h3>
                {invoice ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                    <InvoiceStatusBadge status={invoiceDisplayStatus(invoice, today)} />
                  </div>
                ) : order.status === "cancelled" ? (
                  <p className="text-sm text-muted-foreground">No invoice, because the order was cancelled.</p>
                ) : (
                  <div className="rounded-xl border border-dashed px-3.5 py-3">
                    <p className="text-sm text-muted-foreground">No invoice has been issued yet.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2.5"
                      onClick={() => {
                        const r = actions.createInvoiceForOrder(order.id);
                        if (r.ok) toast.success(`Invoice ${r.value.number} created`, demo ? "Linked to this order. Demo only: no accounting entry was made." : "Linked to this order.");
                        else toast.error("Could not create invoice", r.error);
                      }}
                    >
                      <Receipt /> Create invoice
                    </Button>
                  </div>
                )}
              </section>
            </div>

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t p-4">
                {confirmCancel ? (
                  <div className="flex w-full flex-wrap items-center justify-between gap-2" role="alert">
                    <p className="text-sm font-medium">Cancel this order and return stock?</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>
                        Keep order
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const r = actions.setOrderStatus(order.id, "cancelled");
                          setConfirmCancel(false);
                          if (r.ok) toast.info(`${order.number} cancelled`, "Stock was returned to inventory.");
                          else toast.error("Could not cancel", r.error);
                        }}
                      >
                        Yes, cancel order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirmCancel(true)}>
                      Cancel order
                    </Button>
                    {next && (
                      <Button
                        onClick={() => {
                          const r = actions.setOrderStatus(order.id, next);
                          if (r.ok) toast.success(`${order.number} is now ${orderStatusLabel(next).toLowerCase()}`);
                          else toast.error("Could not update the order", r.error);
                        }}
                      >
                        {next === "shipped" ? <Truck /> : null}
                        Mark as {orderStatusLabel(next).toLowerCase()} <ArrowRight />
                      </Button>
                    )}
                  </>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
