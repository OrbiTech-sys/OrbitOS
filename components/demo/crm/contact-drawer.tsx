"use client";

import { useState } from "react";
import { CalendarClock, CheckCheck, FileText, Mail, Phone, ShoppingCart } from "lucide-react";

import { SalesDocDialog } from "@/components/demo/sales-doc-dialog";
import { useToast } from "@/components/demo/toast";
import { DetailList } from "@/components/demo/ui";
import { useRecordNav } from "@/components/demo/use-record-nav";
import { Avatar, OrderStatusBadge, QuotationStatusBadge, StageBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, relativeDay } from "@/lib/demo/dates";
import { stageLabel } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useDemoLookups } from "@/lib/demo/store";
import { CONTACT_STAGES, type ContactStage } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { useToday } from "@/lib/workspace/context";

export function ContactDrawer({ contactId, onClose }: { contactId: string | null; onClose: () => void }) {
  const data = useDemoData();
  const lookups = useDemoLookups();
  const actions = useDemoActions();
  const money = useMoney();
  const today = useToday();
  const toast = useToast();
  const openRecord = useRecordNav();
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [orderFor, setOrderFor] = useState<string | null>(null);

  const contact = contactId ? lookups.contacts.get(contactId) : undefined;
  const owner = contact ? lookups.team.get(contact.ownerId) : undefined;
  const orders = contact ? data.orders.filter((o) => o.customerId === contact.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4) : [];
  const quotes = contact ? data.quotations.filter((q) => q.customerId === contact.id) : [];
  const followOverdue = !!contact?.followUpDate && contact.followUpDate < today && contact.stage !== "lost";
  const history = contact
    ? data.activities.filter((a) => a.message.includes(contact.company) || a.message.includes(contact.name)).slice(0, 4)
    : [];

  return (
    <>
      <Sheet open={!!contact} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          {contact && (
            <>
              <SheetHeader className="border-b p-6 pr-14">
                <div className="flex flex-wrap items-center gap-2.5">
                  <SheetTitle className="text-xl font-semibold tracking-tight">{contact.name}</SheetTitle>
                  <StageBadge stage={contact.stage} />
                </div>
                <SheetDescription>
                  {contact.jobTitle ? `${contact.jobTitle} · ` : ""}
                  {contact.company}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 p-6">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { actions.logContactActivity(contact.id); toast.success("Contact logged", "Last contact set to today; next follow-up in 7 days."); }}>
                    <CheckCheck /> Log contact
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuoteFor(contact.id)} disabled={contact.stage === "lost"}>
                    <FileText /> New quotation
                  </Button>
                  {contact.stage === "customer" && (
                    <Button size="sm" onClick={() => setOrderFor(contact.id)}>
                      <ShoppingCart /> Create order
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cd-stage">Lead status</Label>
                    <select
                      id="cd-stage"
                      value={contact.stage}
                      onChange={(e) => {
                        actions.setContactStage(contact.id, e.target.value as ContactStage);
                        toast.success("Status updated", `${contact.company} moved to ${stageLabel(e.target.value as ContactStage)}.`);
                      }}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      {CONTACT_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd-follow" className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden="true" /> Follow-up date
                    </Label>
                    <Input
                      id="cd-follow"
                      type="date"
                      value={contact.followUpDate ?? ""}
                      disabled={contact.stage === "lost"}
                      aria-invalid={followOverdue}
                      onChange={(e) => actions.updateContact(contact.id, { followUpDate: e.target.value || null })}
                    />
                    {followOverdue && <p className="text-xs font-medium text-warning">Overdue · was due {relativeDay(contact.followUpDate!, today).toLowerCase()}</p>}
                  </div>
                </div>

                <DetailList
                  items={[
                    {
                      label: "Email",
                      value: (
                        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                          <Mail className="size-3.5" aria-hidden="true" />
                          {contact.email}
                        </a>
                      ),
                    },
                    {
                      label: "Phone",
                      value: contact.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                          {contact.phone}
                        </span>
                      ) : (
                        "—"
                      ),
                    },
                    { label: contact.stage === "customer" ? "Lifetime sales" : "Deal value", value: <span className="font-semibold tabular-nums">{money.full(contact.dealValue)}</span> },
                    { label: "Last contact", value: `${relativeDay(contact.lastContact, today)} (${formatDate(contact.lastContact)})` },
                    { label: "Owner", value: owner ? <span className="inline-flex items-center gap-2"><Avatar member={owner} size="sm" />{owner.name}</span> : "—" },
                    { label: "Source", value: contact.source },
                    { label: "Created", value: formatDate(contact.createdAt) },
                  ]}
                />

                <div className="space-y-2">
                  <Label htmlFor="cd-notes">Notes</Label>
                  <textarea
                    id="cd-notes"
                    key={contact.id}
                    defaultValue={contact.notes}
                    onBlur={(e) => e.target.value !== contact.notes && actions.updateContact(contact.id, { notes: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  />
                  <p className="text-xs text-muted-foreground">Saved when you click away.</p>
                </div>

                {(orders.length > 0 || quotes.length > 0) && (
                  <section aria-labelledby="cd-related">
                    <h3 id="cd-related" className="mb-2 text-sm font-semibold">
                      Related records
                    </h3>
                    <ul className="divide-y rounded-xl border bg-card text-sm">
                      {quotes.map((q) => (
                        <li key={q.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <span>
                            <span className="font-medium">{q.number}</span>
                            <span className="ml-2 text-xs text-muted-foreground">quotation · {money.full(q.total)}</span>
                          </span>
                          <QuotationStatusBadge status={q.status} />
                        </li>
                      ))}
                      {orders.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => openRecord({ kind: "order", id: o.id }, "/demo/orders")}
                            className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left outline-none hover:bg-muted/60 focus-visible:bg-muted"
                          >
                            <span>
                              <span className="font-medium">{o.number}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {formatDate(o.date)} · {money.full(o.total)}
                              </span>
                            </span>
                            <OrderStatusBadge status={o.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {history.length > 0 && (
                  <section aria-labelledby="cd-history">
                    <h3 id="cd-history" className="mb-2 text-sm font-semibold">
                      Recent activity
                    </h3>
                    <ul className="space-y-2.5">
                      {history.map((a) => (
                        <li key={a.id} className={cn("flex gap-2.5 text-[0.8125rem] leading-snug text-foreground")}>
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          {a.message}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <SalesDocDialog mode="quotation" open={!!quoteFor} onOpenChange={(o) => !o && setQuoteFor(null)} initialCustomerId={quoteFor ?? undefined} />
      <SalesDocDialog mode="order" open={!!orderFor} onOpenChange={(o) => !o && setOrderFor(null)} initialCustomerId={orderFor ?? undefined} />
    </>
  );
}
