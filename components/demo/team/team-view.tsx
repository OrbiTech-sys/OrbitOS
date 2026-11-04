"use client";

import { useMemo, useState } from "react";
import { Briefcase, ClipboardList, Mail, Pencil, Trash2, TriangleAlert, UserPlus } from "lucide-react";

import { ConfirmDialog } from "@/components/demo/confirm-dialog";
import { useToast } from "@/components/demo/toast";
import { Card, DemoNotice, PageHeader } from "@/components/demo/ui";
import { AddMemberDialog } from "@/components/demo/team/add-member-dialog";
import { Avatar } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { monthKey } from "@/lib/demo/dates";
import { OPEN_STAGES, isTaskOverdue } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import { useIsDemo, useToday, useWorkspaceEnv } from "@/lib/workspace/context";

export function TeamView() {
  const data = useDemoData();
  const money = useMoney();
  const today = useToday();
  const demo = useIsDemo();
  const { selfId } = useWorkspaceEnv();
  const actions = useDemoActions();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editing = data.team.find((t) => t.id === editingId);
  const deleting = data.team.find((t) => t.id === deletingId);

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
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus /> Add team member
          </Button>
        }
      />
      {demo && <DemoNotice className="mb-6">Changes here last until you refresh the page. In a real workspace, team members are the people you track work against; sign-ins are created separately by an administrator.</DemoNotice>}

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
              {s.member.email ? (
                <a href={`mailto:${s.member.email}`} className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{s.member.email}</span>
                </a>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" /> No email added
                </p>
              )}

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
              {s.member.id === selfId ? (
                <p className="mt-3 text-xs text-muted-foreground">{demo ? "This is you in the demo." : "This is you. Change your name under Settings → Account."}</p>
              ) : (
                <div className="mt-3 flex justify-end gap-1">
                  <Button variant="ghost" size="xs" aria-label={`Edit ${s.member.name}`} onClick={() => setEditingId(s.member.id)}>
                    <Pencil /> Edit
                  </Button>
                  <Button variant="ghost" size="xs" className="text-danger hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${s.member.name}`} onClick={() => setDeletingId(s.member.id)}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              )}
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

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />
      <AddMemberDialog open={!!editing} onOpenChange={(o) => !o && setEditingId(null)} member={editing} />
      <ConfirmDialog
        open={!!deleting}
        title={`Remove ${deleting?.name ?? "this person"}?`}
        description="They come off the team, and anything they own (contacts, projects and tasks) passes to you. It can't be undone."
        confirmLabel="Remove from team"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (deleting) {
            const r = actions.deleteTeamMember(deleting.id);
            if (r.ok) toast.info("Team member removed", `${deleting.name}'s work has passed to you.`);
            else toast.error("Could not remove them", r.error);
          }
          setDeletingId(null);
        }}
      />
    </>
  );
}
