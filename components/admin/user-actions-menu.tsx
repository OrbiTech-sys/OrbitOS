"use client";

import { useActionState, useEffect, useState } from "react";
import { HardDrive, KeyRound, Loader2, MoreHorizontal, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";

import { ROLE_OPTIONS, selectClass } from "@/components/admin/add-user-dialog";
import { TempPasswordNotice } from "@/components/admin/temp-password-notice";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ROLES, type TargetCapabilities } from "@/lib/auth/permissions";
import type { UserActionState } from "@/lib/auth/schemas";
import { changeUserRole, deleteUser, getUsageBreakdown, resetUserPassword, setStorageLimit, setUserActive, type UsageBreakdown } from "@/lib/auth/user-actions";
import type { AppRole } from "@/lib/supabase/database.types";
import { formatBytes, usagePercent } from "@/lib/workspace/format";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  active: boolean;
  bytes: number;
  records: number;
  quotaBytes: number;
};
type Step = { user: ManagedUser; onDone: () => void };

const MODULE_LABELS: Record<string, string> = {
  contact: "Contacts (CRM)",
  product: "Products (Inventory)",
  order: "Orders",
  quotation: "Quotations",
  invoice: "Invoices",
  expense: "Expenses",
  project: "Projects",
  task: "Tasks",
  team: "Team",
  activity: "Activity log",
  meta: "Settings",
};

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
            ? `${user.name} won't be able to sign in, and loses access to their workspace immediately. Their data is kept and comes back if you reactivate them.`
            : `${user.name} will be able to sign in again with their current password, and their data is exactly as they left it.`}
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
          This permanently removes {user.email} <strong>and everything in their workspace</strong> ({formatBytes(user.bytes)}, {user.records.toLocaleString("en-US")} records). It can&apos;t be undone. To
          keep their data but block sign-in, deactivate the account instead.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <ErrorNote state={state} />
        <Footer pending={pending} label="Delete user and data" destructive onCancel={onDone} />
      </form>
    </>
  );
}

function StorageLimit({ user, onDone }: Step) {
  const [state, formAction, pending] = useActionState(async (prev: UserActionState, formData: FormData) => {
    const result = await setStorageLimit(user.id, prev, formData);
    if (result?.ok) onDone();
    return result;
  }, undefined);
  const error = state && !state.ok ? state.fieldErrors?.megabytes?.[0] : undefined;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Storage limit</DialogTitle>
        <DialogDescription>
          {user.name} is using {formatBytes(user.bytes)} of {formatBytes(user.quotaBytes)}. When they reach the limit they can no longer add records until they delete some.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} noValidate className="space-y-4">
        <ErrorNote state={state} />
        <Field id="sl-mb" label="Limit in megabytes" error={error} hint="Between 1 and 10,240 MB.">
          <Input
            id="sl-mb"
            name="megabytes"
            inputMode="numeric"
            defaultValue={Math.round(user.quotaBytes / 1024 / 1024)}
            aria-invalid={!!error}
            aria-describedby={describedBy("sl-mb", error, "hint")}
          />
        </Field>
        <Footer pending={pending} label="Save limit" onCancel={onDone} />
      </form>
    </>
  );
}

function Usage({ user, onDone }: Step) {
  const [result, setResult] = useState<UsageBreakdown | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getUsageBreakdown(user.id).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const pct = usagePercent(user.bytes, user.quotaBytes);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Storage used by {user.name}</DialogTitle>
        <DialogDescription>How much room their records take, by module. Only sizes are shown; what the records contain stays private to them.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>
              <strong className="text-lg font-semibold tabular-nums">{formatBytes(user.bytes)}</strong>
              <span className="text-muted-foreground"> of {formatBytes(user.quotaBytes)}</span>
            </span>
            <span className="text-xs text-muted-foreground">{user.records.toLocaleString("en-US")} records</span>
          </div>
          <div role="progressbar" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className={pct >= 90 ? "h-full bg-danger" : pct >= 75 ? "h-full bg-warning" : "h-full bg-primary"} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {!result ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading…
          </p>
        ) : !result.ok ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {result.error}
          </p>
        ) : result.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing stored yet.</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">Storage by module</caption>
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="pb-2 font-medium">Module</th>
                <th scope="col" className="pb-2 text-right font-medium">Records</th>
                <th scope="col" className="pb-2 text-right font-medium">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.rows.map((r) => (
                <tr key={r.kind}>
                  <td className="py-2">{MODULE_LABELS[r.kind] ?? r.kind}</td>
                  <td className="py-2 text-right tabular-nums">{r.records.toLocaleString("en-US")}</td>
                  <td className="py-2 text-right tabular-nums">{formatBytes(r.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

const STEPS = { usage: Usage, quota: StorageLimit, role: ChangeRole, reset: ResetPassword, toggle: ToggleActive, delete: DeleteUser };

export function UserActionsMenu({ user, can }: { user: ManagedUser; can: TargetCapabilities }) {
  const [step, setStep] = useState<keyof typeof STEPS | null>(null);
  const close = () => setStep(null);
  const Step = step ? STEPS[step] : null;
  const anyChange = can.role || can.password || can.lifecycle;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Manage ${user.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {can.usage && (
            <DropdownMenuItem onSelect={() => setStep("usage")}>
              <HardDrive /> View storage
            </DropdownMenuItem>
          )}
          {can.storageLimit && (
            <DropdownMenuItem onSelect={() => setStep("quota")}>
              <HardDrive /> Set storage limit
            </DropdownMenuItem>
          )}
          {can.usage && anyChange && <DropdownMenuSeparator />}
          {can.role && (
            <DropdownMenuItem onSelect={() => setStep("role")}>
              <ShieldCheck /> Change role
            </DropdownMenuItem>
          )}
          {can.password && (
            <DropdownMenuItem onSelect={() => setStep("reset")}>
              <KeyRound /> Reset password
            </DropdownMenuItem>
          )}
          {can.lifecycle && (
            <DropdownMenuItem onSelect={() => setStep("toggle")}>
              {user.active ? <UserX /> : <UserCheck />} {user.active ? "Deactivate" : "Reactivate"}
            </DropdownMenuItem>
          )}
          {can.lifecycle && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setStep("delete")}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={Step !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">{Step && <Step user={user} onDone={close} />}</DialogContent>
      </Dialog>
    </>
  );
}
