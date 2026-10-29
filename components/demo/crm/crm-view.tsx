"use client";

import { useMemo, useState } from "react";
import { CalendarClock, UserPlus, UsersRound } from "lucide-react";

import { AddContactDialog } from "@/components/demo/crm/add-contact-dialog";
import { ContactDrawer } from "@/components/demo/crm/contact-drawer";
import { Card, DataTable, EmptyState, FilterChips, PageHeader, SearchField, StatCard, type Column } from "@/components/demo/ui";
import { Avatar, StageBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { relativeDay } from "@/lib/demo/dates";
import { OPEN_STAGES, followUpsDue, stageLabel } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useDemoLookups, useOpenRecord } from "@/lib/demo/store";
import { CONTACT_STAGES, type Contact, type ContactStage } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { useIsDemo, useToday } from "@/lib/workspace/context";

type StageFilter = "all" | ContactStage;

export function CrmView() {
  const data = useDemoData();
  const lookups = useDemoLookups();
  const money = useMoney();
  const today = useToday();
  const demo = useIsDemo();
  const actions = useDemoActions();
  const openId = useOpenRecord("contact");

  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.contacts.length };
    for (const x of data.contacts) c[x.stage] = (c[x.stage] ?? 0) + 1;
    return c;
  }, [data.contacts]);

  const due = useMemo(() => followUpsDue(data, today), [data, today]);
  const pipeline = data.contacts.filter((c) => OPEN_STAGES.includes(c.stage)).reduce((s, c) => s + c.dealValue, 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dueIds = new Set(due.map((d) => d.id));
    return data.contacts.filter((c) => {
      if (stage !== "all" && c.stage !== stage) return false;
      if (dueOnly && !dueIds.has(c.id)) return false;
      if (!q) return true;
      return [c.name, c.company, c.email, c.jobTitle].some((f) => f.toLowerCase().includes(q));
    });
  }, [data.contacts, due, query, stage, dueOnly]);

  const columns: Column<Contact>[] = [
    {
      key: "name",
      header: "Contact",
      primary: true,
      sortValue: (c) => c.name,
      cell: (c) => (
        <span className="block">
          <span className="block">{c.name}</span>
          <span className="block max-w-[14rem] truncate text-xs font-normal text-muted-foreground">{c.email}</span>
        </span>
      ),
    },
    { key: "company", header: "Company", hideBelow: "sm", sortValue: (c) => c.company, cell: (c) => c.company },
    { key: "stage", header: "Lead status", sortValue: (c) => CONTACT_STAGES.indexOf(c.stage), cell: (c) => <StageBadge stage={c.stage} /> },
    { key: "value", header: "Deal value", align: "right", hideBelow: "md", sortValue: (c) => c.dealValue, cell: (c) => (c.dealValue ? money.full(c.dealValue) : "—") },
    { key: "last", header: "Last contact", hideBelow: "lg", sortValue: (c) => c.lastContact, cell: (c) => <span className="text-muted-foreground">{relativeDay(c.lastContact, today)}</span> },
    {
      key: "follow",
      header: "Follow-up",
      hideBelow: "md",
      sortValue: (c) => c.followUpDate ?? "9999",
      cell: (c) =>
        c.followUpDate && c.stage !== "lost" ? (
          <span className={cn("inline-flex items-center gap-1.5", c.followUpDate <= today ? "font-medium text-warning" : "text-muted-foreground")}>
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {relativeDay(c.followUpDate, today)}
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        ),
    },
    { key: "owner", header: "Owner", hideBelow: "lg", sortValue: (c) => lookups.team.get(c.ownerId)?.name ?? "", cell: (c) => (lookups.team.get(c.ownerId) ? <Avatar member={lookups.team.get(c.ownerId)!} size="sm" /> : null) },
  ];

  return (
    <>
      <PageHeader
        title="CRM"
        description={demo ? "Contacts, leads and follow-ups. Search, filter by stage, update a lead's status or add a new contact; everything saves locally." : "Contacts, leads and follow-ups. Search, filter by stage, update a lead's status or add a new contact."}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus /> Add contact
          </Button>
        }
      />

      <section aria-label="CRM summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Contacts" value={String(data.contacts.length)} hint={`${counts.customer ?? 0} customers`} icon={<UsersRound />} />
        <StatCard label="Open opportunities" value={String(OPEN_STAGES.reduce((s, st) => s + (counts[st] ?? 0), 0))} hint={`${money.compact(pipeline)} pipeline`} />
        <StatCard label="Follow-ups due" value={String(due.length)} hint="Today or overdue" tone={due.length ? "warning" : "success"} icon={<CalendarClock />} />
        <StatCard label="New leads" value={String(counts.new ?? 0)} hint="Not yet qualified" />
      </section>

      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchField label="Search contacts" value={query} onChange={setQuery} placeholder="Search name, company or email…" className="sm:max-w-sm sm:flex-1" />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} className="size-4 rounded border-input accent-[var(--primary)]" />
              Follow-up due ({due.length})
            </label>
          </div>
          <FilterChips<StageFilter>
            label="Filter by lead stage"
            value={stage}
            onChange={setStage}
            options={[{ value: "all", label: "All", count: counts.all }, ...CONTACT_STAGES.map((s) => ({ value: s as StageFilter, label: stageLabel(s), count: counts[s] ?? 0 }))]}
          />
        </div>
        <DataTable
          key={`${stage}-${query}-${dueOnly}`}
          caption="CRM contacts"
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={(c) => actions.open("contact", c.id)}
          selectedKey={openId}
          initialSort={{ key: "follow", dir: "asc" }}
          empty={
            <EmptyState
              title="No contacts match"
              description="Try a different stage or search term, or add a new contact."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setStage("all");
                      setDueOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                  <Button onClick={() => setAddOpen(true)}>
                    <UserPlus /> Add contact
                  </Button>
                </div>
              }
            />
          }
        />
      </Card>

      <ContactDrawer contactId={openId} onClose={actions.closeRecord} />
      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
