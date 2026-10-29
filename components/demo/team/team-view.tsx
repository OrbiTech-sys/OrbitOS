"use client";

import { useMemo, useState } from "react";
import { Briefcase, ClipboardList, Mail, TriangleAlert, UserPlus } from "lucide-react";

import { Card, DemoNotice, PageHeader } from "@/components/demo/ui";
import { AddMemberDialog } from "@/components/demo/team/add-member-dialog";
import { Avatar } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { monthKey } from "@/lib/demo/dates";
import { OPEN_STAGES, isTaskOverdue } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoData } from "@/lib/demo/store";
import { useIsDemo, useToday } from "@/lib/workspace/context";

export function TeamView() {
  const data = useDemoData();
  const money = useMoney();
  const today = useToday();
  const demo = useIsDemo();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(
    () =>
      data.team.map((member) => {
        const tasks = data.tasks.filter((t) => t.assigneeId === member.id);
        const open = tasks.filter((t) => t.status !== "done");
        const accounts = data.contacts.filter((c) => c.ownerId === member.id && c.stage === "customer");
        const deals = data.contacts.filter((c) => c.ownerId === member.id && OPEN_STAGES.includes(c.stage));
        const orders = data.orders.filter((o) => o.createdById === member.id && o.status !== "cancelled" && monthKey(o.date) === monthKey(today));
        return {
          member,
          open: open.length,
          overdue: tasks.filter((t) => isTaskOverdue(t, today)).length,
          accounts: accounts.length,
          deals: deals.length,
          dealValue: deals.reduce((s, c) => s + c.dealValue, 0),
          orders: orders.length,
          orderValue: orders.reduce((s, o) => s + o.total, 0),
          projects: data.projects.filter((p) => p.ownerId === member.id).length,
        };
      }),
    [data, today],
  );
  const maxOpen = Math.max(1, ...stats.map((s) => s.open));

  return (
    <>
      <PageHeader title="Team" description={`Who owns what: accounts, deals, projects and tasks, calculated from ${demo ? "the sample" : "your"} records.`}
        actions={
          !demo && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus /> Add team member
            </Button>
          )
        }
      />
      {demo && <DemoNotice className="mb-6">Roles and permissions are not implemented in this proof of concept. This is a read-only overview of ownership and workload.</DemoNotice>}

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <li key={s.member.id}>
            <article className="h-full rounded-2xl border bg-card p-5 shadow-card">
              <header className="flex items-center gap-3.5">
                <Avatar member={s.member} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{s.member.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{s.member.role}</p>
                </div>
              </header>
              <a href={`mailto:${s.member.email}`} className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{s.member.email}</span>
              </a>

              <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-muted/60 px-2 py-2.5">
                  <dt className="text-[0.6875rem] font-medium text-muted-foreground">Accounts</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.accounts}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 px-2 py-2.5">
                  <dt className="text-[0.6875rem] font-medium text-muted-foreground">Open deals</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.deals}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 px-2 py-2.5">
                  <dt className="text-[0.6875rem] font-medium text-muted-foreground">Projects</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.projects}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ClipboardList className="size-3.5 text-muted-foreground" aria-hidden="true" /> Open tasks
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.open}
                    {s.overdue > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 font-semibold text-danger">
                        <TriangleAlert className="size-3" aria-hidden="true" />
                        {s.overdue} overdue
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${s.open} open tasks, ${s.overdue} overdue`}>
                  <div className="flex h-full" style={{ width: `${(s.open / maxOpen) * 100}%` }}>
                    <span className="h-full bg-primary" style={{ width: `${s.open ? ((s.open - s.overdue) / s.open) * 100 : 0}%` }} />
                    <span className="h-full bg-danger" style={{ width: `${s.open ? (s.overdue / s.open) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
                <Briefcase className="size-3.5" aria-hidden="true" />
                {s.deals > 0 ? `${money.compact(s.dealValue)} open pipeline` : "No open pipeline"} · {s.orders} order{s.orders === 1 ? "" : "s"} this month ({money.compact(s.orderValue)})
              </p>
            </article>
          </li>
        ))}
      </ul>

      <Card className="mt-6" title="Workload at a glance" description="Open tasks per person">
        <ul className="space-y-3">
          {[...stats]
            .sort((a, b) => b.open - a.open)
            .map((s) => (
              <li key={s.member.id} className="flex items-center gap-3">
                <Avatar member={s.member} size="sm" />
                <span className="w-32 truncate text-sm font-medium">{s.member.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(s.open / maxOpen) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">{s.open}</span>
              </li>
            ))}
        </ul>
      </Card>

      {!demo && <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />}
    </>
  );
}
