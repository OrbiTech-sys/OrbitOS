import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Database, KeyRound, LogOut, ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { listAccounts } from "@/lib/auth/accounts";
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
  if (user.mustChangePassword) redirect("/admin/password");
  const { password } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.fullName ?? user.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/password">
              <KeyRound /> Change password
            </Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost">
              <LogOut /> Sign out
            </Button>
          </form>
        </div>
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
        </section>
      )}
    </div>
  );
}

async function AdminPanels({ user }: { user: CurrentUser }) {
  const { accounts, error, latencyMs } = await listAccounts();
  const host = new URL(process.env.SUPABASE_URL!).host;

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

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <h2 className="border-b px-5 py-4 text-sm font-semibold">Accounts ({accounts.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Email</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{a.full_name ?? a.email}</span>
                    {a.full_name && <span className="block text-xs text-muted-foreground">{a.email}</span>}
                  </td>
                  <td className="px-5 py-3">{ROLE_LABELS[a.role]}</td>
                  <td className="px-5 py-3">
                    {a.must_change_password ? <StatusBadge tone="warning">Temporary</StatusBadge> : <StatusBadge tone="success">Set</StatusBadge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
