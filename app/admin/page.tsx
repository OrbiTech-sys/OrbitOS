import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, Database, History, ShieldCheck, Users } from "lucide-react";

import { StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { listAccounts, listAuditLog } from "@/lib/auth/accounts";
import { ROLE_LABELS, isAdminRole, requireUser, type CurrentUser } from "@/lib/auth/session";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="Loading" />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const user = await requireUser();
  const { password } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.fullName ?? user.email}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      {password === "updated" && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" /> Your password was updated.
        </p>
      )}

      {isAdminRole(user.role) ? (
        <AdminPanels user={user} />
      ) : (
        <section className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="font-semibold">No admin access</h2>
          <p className="mt-1 text-sm text-muted-foreground">You&apos;re signed in as a member. Ask a super admin if you need access.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/demo">
              Open the workspace <ArrowRight />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "user.created": "added",
  "user.role_changed": "changed the role of",
  "user.password_reset": "reset the password of",
  "user.deactivated": "deactivated",
  "user.reactivated": "reactivated",
  "user.deleted": "deleted",
};

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

async function AdminPanels({ user }: { user: CurrentUser }) {
  const [{ accounts, error, latencyMs }, activity] = await Promise.all([listAccounts(), listAuditLog()]);
  const host = new URL(process.env.SUPABASE_URL!).host;
  const count = (test: (a: (typeof accounts)[number]) => boolean) => accounts.filter(test).length;

  const stats = [
    { label: "Users", value: accounts.length },
    { label: "Admins", value: count((a) => isAdminRole(a.role)) },
    { label: "Temporary passwords", value: count((a) => a.must_change_password && !a.deactivated_at) },
    { label: "Deactivated", value: count((a) => !!a.deactivated_at) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4 text-muted-foreground" aria-hidden="true" /> Database
          </h2>
          <div className="mt-3">
            {error ? <StatusBadge tone="danger">Query failed</StatusBadge> : <StatusBadge tone="success">Connected · {latencyMs} ms</StatusBadge>}
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{error ?? `Supabase · ${host}`}</p>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" /> Your access
          </h2>
          <div className="mt-3">
            <StatusBadge tone="primary">{ROLE_LABELS[user.role]}</StatusBadge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Row Level Security is enforced on every query.</p>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" /> People
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">
              Manage users <ArrowRight />
            </Link>
          </Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {user.role === "super_admin" && (
        <section className="rounded-2xl border bg-card shadow-card">
          <h2 className="flex items-center gap-2 border-b px-5 py-4 text-sm font-semibold">
            <History className="size-4 text-muted-foreground" aria-hidden="true" /> Recent admin activity
          </h2>
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
                  </span>
                  <time dateTime={entry.created_at} className="shrink-0 text-xs text-muted-foreground">
                    {when.format(new Date(entry.created_at))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
