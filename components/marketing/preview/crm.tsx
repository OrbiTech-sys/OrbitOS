"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, CalendarClock, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/shared/badges";
import { DEMO_TODAY, relativeDay } from "@/lib/demo/dates";
import { usd } from "@/lib/demo/format";
import { SEED_DATA } from "@/lib/demo/seed";
import { stageLabel } from "@/lib/demo/selectors";
import type { Contact, ContactStage } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

const COLUMNS: ContactStage[] = ["new", "qualified", "proposal", "negotiation"];
const NEXT: Partial<Record<ContactStage, ContactStage>> = {
  new: "qualified",
  qualified: "proposal",
  proposal: "negotiation",
  negotiation: "customer",
};

function initialDeals(): Contact[] {
  const picked: Contact[] = [];
  for (const stage of COLUMNS) {
    picked.push(...SEED_DATA.contacts.filter((c) => c.stage === stage).sort((a, b) => b.dealValue - a.dealValue).slice(0, 3));
  }
  return picked;
}

export function PreviewCrm() {
  const [deals, setDeals] = useState<Contact[]>(initialDeals);
  const [selectedId, setSelectedId] = useState<string | null>(() => initialDeals().find((c) => c.stage === "negotiation")?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = deals.find((d) => d.id === selectedId) ?? null;
  const totals = useMemo(
    () => COLUMNS.map((stage) => ({ stage, rows: deals.filter((d) => d.stage === stage) })),
    [deals],
  );

  function advance(contact: Contact) {
    const next = NEXT[contact.stage];
    if (!next) return;
    if (next === "customer") {
      setDeals((d) => d.filter((x) => x.id !== contact.id));
      setSelectedId(null);
      setMessage(`${contact.company} is now a customer. In the full demo this also unlocks orders and invoices.`);
      return;
    }
    setDeals((d) => d.map((x) => (x.id === contact.id ? { ...x, stage: next, followUpDate: DEMO_TODAY } : x)));
    setMessage(`${contact.company} moved to ${stageLabel(next)}.`);
  }

  function reset() {
    const fresh = initialDeals();
    setDeals(fresh);
    setSelectedId(fresh.find((c) => c.stage === "negotiation")?.id ?? null);
    setMessage(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Select a deal, then move it forward. Everything updates locally.</p>
          <Button variant="ghost" size="xs" onClick={reset}>
            <RotateCcw /> Reset
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {totals.map(({ stage, rows }) => (
            <div key={stage} className="flex min-h-40 flex-col rounded-xl border bg-muted/50 p-2">
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-xs font-semibold text-foreground">{stageLabel(stage)}</span>
                <span className="text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                  {rows.length} · {usd.compact(rows.reduce((s, r) => s + r.dealValue, 0))}
                </span>
              </div>
              <ul className="mt-1.5 flex flex-1 flex-col gap-2">
                {rows.length === 0 && <li className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Nothing here</li>}
                {rows.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={selectedId === c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "w-full rounded-lg border bg-card p-2.5 text-left shadow-card outline-none transition-[box-shadow,border-color] hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50",
                        selectedId === c.id && "border-primary ring-2 ring-primary/20",
                      )}
                    >
                      <span className="block truncate text-[0.8125rem] font-semibold text-foreground">{c.company}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{c.name}</span>
                      <span className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground tabular-nums">{usd.full(c.dealValue)}</span>
                        {c.followUpDate && c.followUpDate <= DEMO_TODAY && <span className="font-medium text-warning">Follow up</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <aside aria-label="Selected deal" className="rounded-xl border bg-card p-4 shadow-card">
        {selected ? (
          <div className="space-y-3">
            <div>
              <StageBadge stage={selected.stage} />
              <h4 className="mt-2 text-base font-semibold text-foreground">{selected.company}</h4>
              <p className="text-sm text-muted-foreground">
                {selected.name} · {selected.jobTitle}
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Deal value</dt>
                <dd className="font-semibold tabular-nums">{usd.full(selected.dealValue)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Last contact</dt>
                <dd>{relativeDay(selected.lastContact)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="size-3.5" /> Follow-up
                </dt>
                <dd className={cn(selected.followUpDate && selected.followUpDate < DEMO_TODAY && "font-medium text-warning")}>
                  {selected.followUpDate ? relativeDay(selected.followUpDate) : "None"}
                </dd>
              </div>
            </dl>
            <p className="rounded-lg bg-muted p-2.5 text-xs leading-relaxed text-muted-foreground">{selected.notes}</p>
            <Button className="w-full" onClick={() => advance(selected)}>
              {NEXT[selected.stage] === "customer" ? (
                <>
                  <BadgeCheck /> Mark as won
                </>
              ) : (
                <>
                  Move to {stageLabel(NEXT[selected.stage]!)} <ArrowRight />
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Select a deal to see its details and next step.</p>
        )}
        <p role="status" className="mt-3 min-h-4 text-xs text-success">
          {message}
        </p>
      </aside>
    </div>
  );
}
