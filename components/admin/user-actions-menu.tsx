"use client";

import { useActionState, useState } from "react";
import { KeyRound, Loader2, MoreHorizontal, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";

import { ROLE_OPTIONS, selectClass } from "@/components/admin/add-user-dialog";
import { TempPasswordNotice } from "@/components/admin/temp-password-notice";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ROLES } from "@/lib/auth/permissions";
import type { UserActionState } from "@/lib/auth/schemas";
import { changeUserRole, deleteUser, resetUserPassword, setUserActive } from "@/lib/auth/user-actions";
import type { AppRole } from "@/lib/supabase/database.types";

export type ManagedUser = { id: string; name: string; email: string; role: AppRole; active: boolean };
type Step = { user: ManagedUser; onDone: () => void };

function ErrorNote({ state }: { state: UserActionState }) {
  if (!state || state.ok || !state.error) return null;
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
      {state.error}
    </p>
  );
}

function Footer({ pending, label, destructive, onCancel }: { pending: boolean; label: string; destructive?: boolean; onCancel: () => void }) {
  return (
    <DialogFooter className="border-t pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant={destructive ? "destructive" : "navy"} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} {label}
      </Button>
    </DialogFooter>
  );
}

function ChangeRole({ user, onDone }: Step) {
  const [state, formAction, pending] = useActionState(async (prev: UserActionState, formData: FormData) => {
    const result = await changeUserRole(user.id, prev, formData);
    if (result?.ok) onDone();
    return result;
  }, undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change role</DialogTitle>
        <DialogDescription>
          {user.name} · {user.email}
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <ErrorNote state={state} />
        <Field id="cr-role" label="Role">
          <select id="cr-role" name="role" defaultValue={user.role} className={selectClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_OPTIONS[r]}
              </option>
            ))}
          </select>
        </Field>
        <Footer pending={pending} label="Save role" onCancel={onDone} />
      </form>
    </>
  );
}

function ResetPassword({ user, onDone }: Step) {
  const [state, formAction, pending] = useActionState(() => resetUserPassword(user.id), undefined);

  if (state?.ok) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Password reset</DialogTitle>
        </DialogHeader>
        <TempPasswordNotice message={state.message} email={state.email ?? user.email} password={state.tempPassword ?? ""} onDone={onDone} />
      </>
    );
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset password?</DialogTitle>
        <DialogDescription>
          {user.name}&apos;s current password stops working. You&apos;ll get a temporary one to share, and they must change it at their next sign-in.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <ErrorNote state={state} />
        <Footer pending={pending} label="Reset password" onCancel={onDone} />
      </form>
    </>
  );
}

function ToggleActive({ user, onDone }: Step) {
  const [state, formAction, pending] = useActionState(async () => {
    const result = await setUserActive(user.id, !user.active);
    if (result?.ok) onDone();
    return result;
  }, undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{user.active ? "Deactivate account?" : "Reactivate account?"}</DialogTitle>
        <DialogDescription>
          {user.active
            ? `${user.name} won't be able to sign in, and loses admin access immediately. Their account and history are kept.`
            : `${user.name} will be able to sign in again with their current password.`}
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <ErrorNote state={state} />
        <Footer pending={pending} label={user.active ? "Deactivate" : "Reactivate"} destructive={user.active} onCancel={onDone} />
      </form>
    </>
  );
}

function DeleteUser({ user, onDone }: Step) {
  const [state, formAction, pending] = useActionState(async () => {
    const result = await deleteUser(user.id);
    if (result?.ok) onDone();
    return result;
  }, undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {user.name}?</DialogTitle>
        <DialogDescription>
          This permanently removes {user.email} and can&apos;t be undone. To keep their account but block sign-in, deactivate it instead.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <ErrorNote state={state} />
        <Footer pending={pending} label="Delete user" destructive onCancel={onDone} />
      </form>
    </>
  );
}

const STEPS = { role: ChangeRole, reset: ResetPassword, toggle: ToggleActive, delete: DeleteUser };

export function UserActionsMenu({ user }: { user: ManagedUser }) {
  const [step, setStep] = useState<keyof typeof STEPS | null>(null);
  const close = () => setStep(null);
  const Step = step ? STEPS[step] : null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Manage ${user.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setStep("role")}>
            <ShieldCheck /> Change role
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setStep("reset")}>
            <KeyRound /> Reset password
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setStep("toggle")}>
            {user.active ? <UserX /> : <UserCheck />} {user.active ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setStep("delete")}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={Step !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">{Step && <Step user={user} onDone={close} />}</DialogContent>
      </Dialog>
    </>
  );
}
