"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, ListTodo, Plus, TriangleAlert } from "lucide-react";

import { AddTaskDialog } from "@/components/demo/projects/add-task-dialog";
import { useToast } from "@/components/demo/toast";
import { Card, DataTable, EmptyState, FilterChips, PageHeader, SearchField, SelectField, StatCard, type Column } from "@/components/demo/ui";
import { Avatar, PriorityBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEMO_TODAY, diffDays, formatDate, relativeDay } from "@/lib/demo/dates";
import { computeMetrics, isTaskOverdue } from "@/lib/demo/selectors";
import { useDemoActions, useDemoData, useDemoLookups, useOpenRecord } from "@/lib/demo/store";
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskStatus } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | TaskStatus;
const STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Done" };

export function ProjectsView() {
  const data = useDemoData();
  const lookups = useDemoLookups();
  const actions = useDemoActions();
  const toast = useToast();
  const openId = useOpenRecord("task");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [project, setProject] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const m = useMemo(() => computeMetrics(data), [data]);
  const openCount = data.tasks.filter((t) => t.status !== "done").length;
  const doneThisWeek = data.tasks.filter((t) => t.completedDate && diffDays(DEMO_TODAY, t.completedDate) <= 7).length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.tasks.length, todo: 0, in_progress: 0, done: 0 };
    for (const t of data.tasks) c[t.status] += 1;
    return c;
  }, [data.tasks]);

  const projectStats = useMemo(
    () =>
      data.projects.map((p) => {
        const tasks = data.tasks.filter((t) => t.projectId === p.id);
        return { project: p, total: tasks.length, done: tasks.filter((t) => t.status === "done").length };
      }),
    [data.projects, data.tasks],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (project !== "all" && t.projectId !== project) return false;
      if (assignee !== "all" && t.assigneeId !== assignee) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (overdueOnly && !isTaskOverdue(t)) return false;
      return !q || t.title.toLowerCase().includes(q) || (lookups.projects.get(t.projectId)?.name.toLowerCase().includes(q) ?? false);
    });
  }, [data.tasks, lookups.projects, query, status, project, assignee, priority, overdueOnly]);

  function setTaskStatus(task: Task, next: TaskStatus) {
    actions.setTaskStatus(task.id, next);
    if (next === "done") toast.success("Task completed", `“${task.title}” is done.`);
  }

  const columns: Column<Task>[] = [
    {
      key: "done",
      header: "Done",
      align: "center",
      cell: (t) => {
        const done = t.status === "done";
        return (
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={`${done ? "Reopen" : "Mark complete"}: ${t.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setTaskStatus(t, done ? "todo" : "done");
            }}
            className={cn(
              "mx-auto flex size-5 items-center justify-center rounded-md border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              done ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary",
            )}
          >
            {done && <Check className="size-3.5" strokeWidth={3} />}
          </button>
        );
      },
    },
    {
      key: "title",
      header: "Task",
      primary: true,
      sortValue: (t) => t.title,
      cell: (t) => (
        <span className="block max-w-[26rem]">
          <span className={cn("block", t.status === "done" && "text-muted-foreground line-through")}>{t.title}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{lookups.projects.get(t.projectId)?.name}</span>
        </span>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      hideBelow: "md",
      sortValue: (t) => lookups.team.get(t.assigneeId)?.name ?? "",
      cell: (t) => {
        const a = lookups.team.get(t.assigneeId);
        return a ? (
          <span className="flex items-center gap-2">
            <Avatar member={a} size="sm" /> <span className="hidden xl:inline">{a.name}</span>
          </span>
        ) : null;
      },
    },
    { key: "priority", header: "Priority", hideBelow: "sm", sortValue: (t) => TASK_PRIORITIES.indexOf(t.priority), cell: (t) => <PriorityBadge priority={t.priority} /> },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => TASK_STATUSES.indexOf(t.status),
      cell: (t) => (
        <>
          <label htmlFor={`status-${t.id}`} className="sr-only">
            Status for {t.title}
          </label>
          <select
            id={`status-${t.id}`}
            value={t.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setTaskStatus(t, e.target.value as TaskStatus)}
            className="h-8 rounded-lg border border-input bg-card px-2 text-xs font-medium shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </>
      ),
    },
    {
      key: "due",
      header: "Due",
      align: "right",
      // Open tasks sort by due date; completed tasks always sink to the bottom.
      sortValue: (t) => (t.status === "done" ? `z${t.dueDate}` : t.dueDate),
      cell: (t) => (
        <span className={cn("whitespace-nowrap", isTaskOverdue(t) ? "font-semibold text-danger" : t.dueDate === DEMO_TODAY && t.status !== "done" ? "font-semibold text-warning" : "text-muted-foreground")}>
          {t.status === "done" ? "Done" : relativeDay(t.dueDate)}
        </span>
      ),
    },
  ];

  const openTask = openId ? lookups.tasks.get(openId) : undefined;

  return (
    <>
      <PageHeader
        title="Projects & tasks"
        description="Plan work, assign owners and mark tasks complete. Dashboard counts and notifications follow along."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add task
          </Button>
        }
      />

      <section aria-label="Task summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open tasks" value={String(openCount)} hint={`${data.tasks.length} total`} icon={<ListTodo />} />
        <StatCard label="Due today" value={String(m.tasksDueToday)} hint="Not yet done" icon={<ClipboardCheck />} tone={m.tasksDueToday ? "warning" : "default"} />
        <StatCard label="Overdue" value={String(m.tasksOverdue)} hint="Past their due date" icon={<TriangleAlert />} tone={m.tasksOverdue ? "danger" : "success"} />
        <StatCard label="Completed this week" value={String(doneThisWeek)} hint="Last 7 days" tone="success" icon={<Check />} />
      </section>

      <section aria-label="Projects" className="mb-6">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {projectStats.map(({ project: p, total, done }) => {
            const active = project === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setProject(active ? "all" : p.id)}
                  className={cn(
                    "w-full rounded-xl border bg-card p-3.5 text-left shadow-card outline-none transition-[box-shadow,border-color] hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.customerId ? lookups.contacts.get(p.customerId)?.company : "Internal"} · {lookups.team.get(p.ownerId)?.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                      {done}/{total}
                    </span>
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span className="block h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Card bodyClassName="p-0">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchField label="Search tasks" value={query} onChange={setQuery} placeholder="Search tasks or projects…" className="lg:max-w-xs lg:flex-1" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
              <SelectField label="Project" value={project} onChange={setProject} className="lg:w-48" options={[{ value: "all", label: "All projects" }, ...data.projects.map((p) => ({ value: p.id, label: p.name }))]} />
              <SelectField label="Assignee" value={assignee} onChange={setAssignee} className="lg:w-40" options={[{ value: "all", label: "Everyone" }, ...data.team.map((t) => ({ value: t.id, label: t.name }))]} />
              <SelectField label="Priority" value={priority} onChange={setPriority} className="lg:w-36" options={[{ value: "all", label: "Any priority" }, ...TASK_PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))]} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips<StatusFilter>
              label="Filter by status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "todo", label: "To do", count: counts.todo },
                { value: "in_progress", label: "In progress", count: counts.in_progress },
                { value: "done", label: "Done", count: counts.done },
              ]}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="size-4 rounded border-input accent-[var(--primary)]" />
              Overdue only
            </label>
          </div>
        </div>
        <DataTable
          key={`${query}-${status}-${project}-${assignee}-${priority}-${overdueOnly}`}
          caption="Tasks"
          columns={columns}
          rows={rows}
          rowKey={(t) => t.id}
          onRowClick={(t) => actions.open("task", t.id)}
          selectedKey={openId}
          initialSort={{ key: "due", dir: "asc" }}
          pageSize={12}
          empty={
            <EmptyState
              icon={<ClipboardCheck />}
              title="No tasks match your filters"
              description="Change a filter, or add a new task."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setStatus("all");
                      setProject("all");
                      setAssignee("all");
                      setPriority("all");
                      setOverdueOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus /> Add task
                  </Button>
                </div>
              }
            />
          }
        />
      </Card>

      <Dialog open={!!openTask} onOpenChange={(o) => !o && actions.closeRecord()}>
        <DialogContent className="sm:max-w-md">
          {openTask && (
            <>
              <DialogHeader>
                <DialogTitle>{openTask.title}</DialogTitle>
                <DialogDescription>{lookups.projects.get(openTask.projectId)?.name}</DialogDescription>
              </DialogHeader>
              <dl className="divide-y rounded-xl border text-sm">
                {[
                  ["Status", STATUS_LABEL[openTask.status]],
                  ["Priority", openTask.priority],
                  ["Assignee", lookups.team.get(openTask.assigneeId)?.name ?? "—"],
                  ["Due", `${formatDate(openTask.dueDate)}${isTaskOverdue(openTask) ? " (overdue)" : ""}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 px-3.5 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-end gap-2">
                {openTask.status !== "done" ? (
                  <Button
                    onClick={() => {
                      setTaskStatus(openTask, "done");
                      actions.closeRecord();
                    }}
                  >
                    <Check /> Mark complete
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setTaskStatus(openTask, "todo")}>
                    Reopen
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} defaultProjectId={project !== "all" ? project : undefined} />
    </>
  );
}
