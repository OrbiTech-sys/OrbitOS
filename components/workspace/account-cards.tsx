"use client";

import { HardDrive, KeyRound, LogOut, UserRound } from "lucide-react";

import { Link } from "@/components/demo/link";
import { Card } from "@/components/demo/ui";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
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

export function AccountCard() {
  const { profile } = useWorkspaceEnv();
  if (!profile) return null;

  return (
    <Card title="Account" description="Who you're signed in as" action={<UserRound className="size-4 text-muted-foreground" aria-hidden="true" />}>
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
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href="/account/password">
            <KeyRound /> Change password
          </a>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut /> Sign out
          </Button>
        </form>
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
