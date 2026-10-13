"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/components/demo/toast";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DEMO_TODAY, addDays } from "@/lib/demo/dates";
import { taskSchema, type TaskFormInput, type TaskFormOutput } from "@/lib/demo/schemas";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import { TASK_PRIORITIES } from "@/lib/demo/types";

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function Form({ onDone, defaultProjectId }: { onDone: () => void; defaultProjectId?: string }) {
  const data = useDemoData();
  const actions = useDemoActions();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<TaskFormInput, unknown, TaskFormOutput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      projectId: defaultProjectId ?? data.projects[0]?.id ?? "",
      assigneeId: "tm-alex",
      priority: "medium",
      dueDate: addDays(DEMO_TODAY, 3),
    },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  function onSubmit(values: TaskFormOutput) {
    const r = actions.addTask(values);
    if (!r.ok) {
      toast.error("Could not add task", r.error);
      return;
    }
    toast.success("Task added", `“${r.value.title}” is due ${r.value.dueDate}.`);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Please fix the {errorCount} highlighted field{errorCount === 1 ? "" : "s"}.
        </p>
      )}
      <Field id="at-title" label="Task" error={errors.title?.message}>
        <Input id="at-title" autoComplete="off" placeholder="e.g. Send revised quote to Kestrel" aria-invalid={!!errors.title} aria-describedby={describedBy("at-title", errors.title?.message)} {...register("title")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="at-project" label="Project" error={errors.projectId?.message}>
          <select id="at-project" className={selectCls} {...register("projectId")}>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="at-assignee" label="Assignee" error={errors.assigneeId?.message}>
          <select id="at-assignee" className={selectCls} {...register("assigneeId")}>
            {data.team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="at-priority" label="Priority" error={errors.priority?.message}>
          <select id="at-priority" className={selectCls} {...register("priority")}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="at-due" label="Due date" error={errors.dueDate?.message}>
          <Input id="at-due" type="date" aria-invalid={!!errors.dueDate} aria-describedby={describedBy("at-due", errors.dueDate?.message)} {...register("dueDate")} />
        </Field>
      </div>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Add task</Button>
      </DialogFooter>
    </form>
  );
}

export function AddTaskDialog({ open, onOpenChange, defaultProjectId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultProjectId?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
          <DialogDescription>New tasks start as “To do” and count toward the dashboard.</DialogDescription>
        </DialogHeader>
        {open && <Form onDone={() => onOpenChange(false)} defaultProjectId={defaultProjectId} />}
      </DialogContent>
    </Dialog>
  );
}
