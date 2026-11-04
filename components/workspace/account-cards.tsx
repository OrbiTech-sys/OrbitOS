"use client";

import { useActionState, useState } from "react";
import { HardDrive, KeyRound, Loader2, LogOut, Pencil, UserRound } from "lucide-react";

import { Link } from "@/components/demo/link";
import { Card } from "@/components/demo/ui";
import { useSignOut } from "@/components/workspace/sign-out";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOwnName } from "@/lib/auth/actions";
import type { UserActionState } from "@/lib/auth/schemas";
import { useDemoActions } from "@/lib/demo/store";
import { formatBytes, usagePercent } from "@/lib/workspace/format";
import { useWorkspaceEnv } from "@/lib/workspace/context";
import { useWorkspaceSync } from "@/lib/workspace/sync-context";
import { cn } from "@/lib/utils";

/** Settings cards that only make sense in a signed-in member's workspace. */

export function StorageCard() {
  const sync = useWorkspaceSync();
  if (!sync) return null;
  const { usage, status, pending } = sync;
  const pct = usagePercent(usage.bytes, usage.quotaBytes);

  return (
    <Card title="Your storage" description="Everything you add is saved to your account" action={<HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>
          <strong className="text-lg font-semibold tabular-nums">{formatBytes(usage.bytes)}</strong>
          <span className="text-muted-foreground"> of {formatBytes(usage.quotaBytes)}</span>
        </span>
        <span className="text-xs text-muted-foreground">{usage.records.toLocaleString("en-US")} records</span>
      </div>
      <div
        role="progressbar"
        aria-label="Storage used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full transition-[width]", pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {status === "error"
          ? "Some changes haven't been saved yet."
          : status === "saving" || pending > 0
            ? "Saving your latest changes…"
            : "All changes are saved."}{" "}
        Your administrator can see how much storage you use, but not what your records contain.
      </p>
    </Card>
  );
}

function EditName({ name, onDone }: { name: string; onDone: () => void }) {
  const { selfId } = useWorkspaceEnv();
  const actions = useDemoActions();
  const [state, formAction, pending] = useActionState(async (prev: UserActionState, formData: FormData) => {
    const result = await updateOwnName(prev, formData);
    if (result?.ok) {
      // Your own team entry comes from your account, so update what is on screen too.
      actions.updateTeamMember(selfId, { name: result.message });
      onDone();
    }
    return result;
  }, undefined);
  const error = state && !state.ok ? state.fieldErrors?.fullName?.[0] : undefined;
  const failure = state && !state.ok ? state.error : undefined;

  return (
    <form action={formAction} noValidate className="space-y-3" aria-label="Edit your name">
      {failure && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {failure}
        </p>
      )}
      <Field id="acc-name" label="Your name" error={error}>
        <Input id="acc-name" name="fullName" autoComplete="name" defaultValue={name} aria-invalid={!!error} aria-describedby={describedBy("acc-name", error)} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save name
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AccountCard() {
  const { profile } = useWorkspaceEnv();
  const { signOut, pending } = useSignOut();
  const [editing, setEditing] = useState(false);
  if (!profile) return null;

  return (
    <Card title="Account" description="Who you're signed in as" action={<UserRound className="size-4 text-muted-foreground" aria-hidden="true" />}>
      {editing ? (
        <EditName name={profile.name} onDone={() => setEditing(false)} />
      ) : (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="truncate font-medium">{profile.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{profile.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{profile.roleLabel}</dd>
          </div>
        </dl>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!editing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Edit name
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href="/account/password">
            <KeyRound /> Change password
          </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={signOut}>
          <LogOut /> Sign out
        </Button>
      </div>
      {profile.isAdmin && (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;re an administrator.{" "}
          <Link href="/demo/settings/users" className="font-medium text-foreground underline-offset-4 hover:underline">
            Manage users and storage
          </Link>
        </p>
      )}
    </Card>
  );
}
