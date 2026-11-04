"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/components/demo/toast";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { teamMemberSchema, type TeamMemberFormInput } from "@/lib/demo/schemas";
import { useDemoActions } from "@/lib/demo/store";
import type { TeamMember } from "@/lib/demo/types";

function Form({ member, onDone }: { member?: TeamMember; onDone: () => void }) {
  const actions = useDemoActions();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TeamMemberFormInput>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: member ? { name: member.name, role: member.role, email: member.email } : { name: "", role: "", email: "" },
    mode: "onTouched",
  });

  function onSubmit(values: TeamMemberFormInput) {
    const r = member ? actions.updateTeamMember(member.id, values) : actions.addTeamMember(values);
    if (!r.ok) {
      setError("email", { message: r.error });
      return;
    }
    if (member) toast.success("Team member updated", `${r.value.name}'s details were saved.`);
    else toast.success("Team member added", `${r.value.name} can now own contacts, projects and tasks.`);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field id="tm-name" label="Name" error={errors.name?.message}>
        <Input id="tm-name" autoComplete="off" aria-invalid={!!errors.name} aria-describedby={describedBy("tm-name", errors.name?.message)} {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="tm-role" label="Role" optional error={errors.role?.message}>
          <Input id="tm-role" autoComplete="off" placeholder="e.g. Sales lead" {...register("role")} />
        </Field>
        <Field id="tm-email" label="Email" optional error={errors.email?.message}>
          <Input id="tm-email" type="email" autoComplete="off" aria-invalid={!!errors.email} aria-describedby={describedBy("tm-email", errors.email?.message)} {...register("email")} />
        </Field>
      </div>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{member ? "Save changes" : "Add to team"}</Button>
      </DialogFooter>
    </form>
  );
}

export function AddMemberDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (open: boolean) => void; member?: TeamMember }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? "Edit team member" : "Add team member"}</DialogTitle>
          <DialogDescription>For tracking who owns what. This doesn&apos;t create a sign-in; accounts are created by your administrator.</DialogDescription>
        </DialogHeader>
        {open && <Form key={member?.id ?? "new"} member={member} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
