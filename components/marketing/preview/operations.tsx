"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, PriorityBadge } from "@/components/shared/badges";
import { DEMO_TODAY, relativeDay } from "@/lib/demo/dates";
import { SEED_DATA } from "@/lib/demo/seed";
import { indexById, isTaskOverdue } from "@/lib/demo/selectors";
import type { Task } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

function initialTasks(): Task[] {
  const open = SEED_DATA.tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, 7);
  const done = SEED_DATA.tasks.filter((t) => t.status === "done").slice(0, 1);
  return [...open, ...done];
}

export function PreviewOperations() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const team = useMemo(() => indexById(SEED_DATA.team), []);
  const projects = useMemo(() => indexById(SEED_DATA.projects), []);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const workload = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) if (t.status !== "done") map.set(t.assigneeId, (map.get(t.assigneeId) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [tasks]);
  const maxLoad = Math.max(1, ...workload.map(([, n]) => n));

  function toggle(id: string) {
    setTasks((list) =>
      list.map((t) =>
        t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done", completedDate: t.status === "done" ? null : DEMO_TODAY } : t,
      ),
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <div className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Tasks across projects</h4>
            <p className="text-xs text-muted-foreground">
              {doneCount} of {tasks.length} complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true">
              <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
            <Button variant="ghost" size="xs" onClick={() => setTasks(initialTasks())}>
              <RotateCcw /> Reset
            </Button>
          </div>
        </div>
        <ul className="divide-y">
          {tasks.map((t) => {
            const done = t.status === "done";
            const overdue = isTaskOverdue(t);
            const who = team.get(t.assigneeId)!;
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`Mark “${t.title}” as ${done ? "not done" : "done"}`}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-primary",
                  )}
                >
                  {done && <Check className="size-3.5" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {projects.get(t.projectId)?.name} ·{" "}
                    <span className={cn(!done && overdue && "font-medium text-danger")}>{done ? "Completed" : relativeDay(t.dueDate)}</span>
                  </p>
                </div>
                <span className="hidden sm:block">
                  <PriorityBadge priority={t.priority} />
                </span>
                <Avatar member={who} size="sm" />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-card">
        <h4 className="text-sm font-semibold text-foreground">Open work by person</h4>
        <p className="text-xs text-muted-foreground">Updates as you complete tasks</p>
        <ul className="mt-4 space-y-3.5">
          {workload.length === 0 && <li className="text-sm text-muted-foreground">Nothing open. Everything is done.</li>}
          {workload.map(([id, n]) => {
            const m = team.get(id)!;
            return (
              <li key={id} className="flex items-center gap-3">
                <Avatar member={m} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{m.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{n} open</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(n / maxLoad) * 100}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
