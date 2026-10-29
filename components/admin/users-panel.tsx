import { Database, History, ShieldCheck } from "lucide-react";

import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { UserActionsMenu } from "@/components/admin/user-actions-menu";
import { StatusBadge } from "@/components/shared/badges";
import type { Account, AuditEntry } from "@/lib/auth/accounts";
import { capabilitiesFor, rolesActorCanAssign } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { formatBytes, usagePercent } from "@/lib/workspace/format";

/**
 * Settings → Users & access, for admins: who has an account, what they can do,
 * how much storage each uses, and the controls to add, deactivate, reactivate and
 * delete them. Presentational: the page fetches the data.
 */

const added = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const saved = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const ACTION_LABELS: Record<string, string> = {
  "user.created": "added",
  "user.role_changed": "changed the role of",
  "user.password_reset": "reset the password of",
  "user.deactivated": "deactivated",
  "user.reactivated": "reactivated",
  "user.deleted": "deleted",
  "user.storage_limit_changed": "changed the storage limit of",
};

function AccountStatus({ account }: { account: Account }) {
  if (account.deactivated_at) return <StatusBadge tone="neutral">Deactivated</StatusBadge>;
  if (account.must_change_password) return <StatusBadge tone="warning">Temporary password</StatusBadge>;
  return <StatusBadge tone="success">Active</StatusBadge>;
}

function StorageCell({ account }: { account: Account }) {
  const pct = usagePercent(account.bytes, account.storage_quota_bytes);
  return (
    <div className="min-w-36">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-foreground tabular-nums">{formatBytes(account.bytes)}</span>
        <span className="text-muted-foreground">of {formatBytes(account.storage_quota_bytes)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Storage used by ${account.full_name ?? account.email}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[0.6875rem] text-muted-foreground">{account.records.toLocaleString("en-US")} records</p>
    </div>
  );
}

export function UsersPanel({
  actor,
  accounts,
  error,
  latencyMs,
  host,
  activity,
}: {
  actor: CurrentUser;
  accounts: Account[];
  error: string | null;
  latencyMs: number;
  host: string;
  activity: AuditEntry[];
}) {
  const assignable = rolesActorCanAssign(actor);
  const count = (test: (a: Account) => boolean) => accounts.filter(test).length;
  const totalBytes = accounts.reduce((sum, a) => sum + a.bytes, 0);
  const stats = [
    { label: "Users", value: String(accounts.length) },
    { label: "Admins", value: String(count((a) => a.role !== "member")) },
    { label: "Temporary passwords", value: String(count((a) => a.must_change_password && !a.deactivated_at)) },
    { label: "Deactivated", value: String(count((a) => !!a.deactivated_at)) },
    { label: "Storage used", value: formatBytes(totalBytes) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Users &amp; access</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {actor.role === "super_admin"
              ? "Add people, change roles, reset passwords, set storage limits and deactivate or delete accounts."
              : "Add members, deactivate, reactivate or delete them, and see how much storage each one uses. A super admin manages everything else."}
          </p>
        </div>
        {assignable.length > 0 && <AddUserDialog roles={assignable} />}
      </div>

      <section aria-label="Summary" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-card sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:items-end">
          <span className="inline-flex items-center gap-1.5">
            <Database className="size-3.5" aria-hidden="true" />
            {error ? <StatusBadge tone="danger">Query failed</StatusBadge> : <StatusBadge tone="success">Database connected · {latencyMs} ms</StatusBadge>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> You: {ROLE_LABELS[actor.role]}
          </span>
          <span className="max-w-56 truncate">{error ?? host}</span>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          Users couldn&apos;t be loaded: {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">All user accounts</caption>
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Name</th>
                <th scope="col" className="px-5 py-3 font-medium">Role</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Storage</th>
                <th scope="col" className="hidden px-5 py-3 font-medium lg:table-cell">Last saved</th>
                <th scope="col" className="hidden px-5 py-3 font-medium xl:table-cell">Added</th>
                <th scope="col" className="w-12 px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a) => {
                const name = a.full_name ?? a.email;
                const can = capabilitiesFor(actor, a);
                return (
                  <tr key={a.id} className={a.deactivated_at ? "text-muted-foreground" : undefined}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-foreground">{name}</span>
                      {a.id === actor.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      <span className="block text-xs text-muted-foreground">{a.email}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{ROLE_LABELS[a.role]}</td>
                    <td className="px-5 py-3">
                      <AccountStatus account={a} />
                    </td>
                    <td className="px-5 py-3">
                      <StorageCell account={a} />
                    </td>
                    <td className="hidden px-5 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">{a.last_write_at ? saved.format(new Date(a.last_write_at)) : "Never"}</td>
                    <td className="hidden px-5 py-3 whitespace-nowrap text-muted-foreground xl:table-cell">{added.format(new Date(a.created_at))}</td>
                    <td className="px-3 py-3 text-right">
                      {(can.usage || can.lifecycle || can.role || can.password || can.storageLimit) && (
                        <UserActionsMenu
                          user={{ id: a.id, name, email: a.email, role: a.role, active: !a.deactivated_at, bytes: a.bytes, records: a.records, quotaBytes: a.storage_quota_bytes }}
                          can={can}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {actor.role === "super_admin" && (
        <section className="rounded-2xl border bg-card shadow-card">
          <h3 className="flex items-center gap-2 border-b px-5 py-4 text-sm font-semibold">
            <History className="size-4 text-muted-foreground" aria-hidden="true" /> Recent admin activity
          </h3>
          {activity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Nothing yet. Adding or changing users is recorded here.</p>
          ) : (
            <ul className="divide-y text-sm">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span>
                    <span className="font-medium">{entry.actor_email}</span> {ACTION_LABELS[entry.action] ?? entry.action}{" "}
                    <span className="font-medium">{entry.target_email}</span>
                    {entry.action === "user.role_changed" && ` (now ${ROLE_LABELS[entry.details.to as keyof typeof ROLE_LABELS] ?? entry.details.to})`}
                    {entry.action === "user.storage_limit_changed" && ` (now ${entry.details.megabytes} MB)`}
                  </span>
                  <time dateTime={entry.created_at} className="shrink-0 text-xs text-muted-foreground">
                    {saved.format(new Date(entry.created_at))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
