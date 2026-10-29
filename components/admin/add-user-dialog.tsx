"use client";

import { useActionState, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { TempPasswordNotice } from "@/components/admin/temp-password-notice";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addUser } from "@/lib/auth/user-actions";
import type { AppRole } from "@/lib/supabase/database.types";

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive";

export const ROLE_OPTIONS: Record<AppRole, string> = {
  member: "Member: signs in, no admin access",
  admin: "Admin: can add members",
  super_admin: "Super admin: full control",
};

function AddUserForm({ roles, onDone }: { roles: AppRole[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(addUser, undefined);

  if (state?.ok) {
    return <TempPasswordNotice message={state.message} email={state.email ?? ""} password={state.tempPassword ?? ""} onDone={onDone} />;
  }

  const errors = state?.fieldErrors ?? {};
  const values = state?.values ?? {};

  return (
    <form action={formAction} noValidate className="space-y-4" aria-label="Add user">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <Field id="au-name" label="Full name" error={errors.fullName?.[0]}>
        <Input id="au-name" name="fullName" autoComplete="off" defaultValue={values.fullName} aria-invalid={!!errors.fullName} aria-describedby={describedBy("au-name", errors.fullName?.[0])} />
      </Field>
      <Field id="au-email" label="Email" error={errors.email?.[0]}>
        <Input id="au-email" name="email" type="email" autoComplete="off" defaultValue={values.email} aria-invalid={!!errors.email} aria-describedby={describedBy("au-email", errors.email?.[0])} />
      </Field>
      <Field id="au-role" label="Role" error={errors.role?.[0]}>
        <select id="au-role" name="role" className={selectClass} defaultValue={values.role || roles[0]} aria-invalid={!!errors.role}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_OPTIONS[r]}
            </option>
          ))}
        </select>
      </Field>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="navy" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Add user
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddUserDialog({ roles }: { roles: AppRole[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="navy">
          <UserPlus /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>They get a temporary password and choose their own when they first sign in.</DialogDescription>
        </DialogHeader>
        {open && <AddUserForm roles={roles} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
