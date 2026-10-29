"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/components/demo/toast";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { projectSchema, type ProjectFormInput, type ProjectFormOutput } from "@/lib/demo/schemas";
import { useDemoActions, useDemoData } from "@/lib/demo/store";

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function Form({ onDone }: { onDone: (projectId?: string) => void }) {
  const data = useDemoData();
  const actions = useDemoActions();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", customerId: "", status: "active" },
    mode: "onTouched",
  });

  function onSubmit(values: ProjectFormOutput) {
    const r = actions.addProject({ name: values.name, customerId: values.customerId || null, status: values.status });
    if (!r.ok) {
      setError("name", { message: r.error });
      return;
    }
    toast.success("Project created", `“${r.value.name}” is ready for tasks.`);
    onDone(r.value.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field id="ap-pname" label="Project name" error={errors.name?.message}>
        <Input id="ap-pname" autoComplete="off" placeholder="e.g. Website relaunch" aria-invalid={!!errors.name} aria-describedby={describedBy("ap-pname", errors.name?.message)} {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ap-pcustomer" label="Customer" optional>
          <select id="ap-pcustomer" className={selectCls} {...register("customerId")}>
            <option value="">Internal project</option>
            {data.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ap-pstatus" label="Status">
          <select id="ap-pstatus" className={selectCls} {...register("status")}>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
          </select>
        </Field>
      </div>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={() => onDone()}>
          Cancel
        </Button>
        <Button type="submit">Create project</Button>
      </DialogFooter>
    </form>
  );
}

export function AddProjectDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated?: (projectId: string) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Projects group tasks. You can assign tasks to anyone on your team.</DialogDescription>
        </DialogHeader>
        {open && (
          <Form
            onDone={(id) => {
              onOpenChange(false);
              if (id) onCreated?.(id);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
