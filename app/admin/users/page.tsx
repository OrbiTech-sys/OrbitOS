import type { Metadata } from "next";
import { Suspense } from "react";

import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { UserActionsMenu } from "@/components/admin/user-actions-menu";
import { StatusBadge } from "@/components/shared/badges";
import { listAccounts, type Account } from "@/lib/auth/accounts";
import { canManageUser, rolesActorCanAssign } from "@/lib/auth/permissions";
import { ROLE_LABELS, isAdminRole, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="Loading" />}>
      <UsersSection />
    </Suspense>
  );
}

function AccountStatus({ account }: { account: Account }) {
  if (account.deactivated_at) return <StatusBadge tone="neutral">Deactivated</StatusBadge>;
  if (account.must_change_password) return <StatusBadge tone="warning">Temporary password</StatusBadge>;
  return <StatusBadge tone="success">Active</StatusBadge>;
}

const added = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

async function UsersSection() {
  const user = await requireUser();
  if (!isAdminRole(user.role)) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <h1 className="font-semibold">No admin access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only admins can see and add users.</p>
      </section>
    );
  }

  const { accounts, error } = await listAccounts();
  const assignable = rolesActorCanAssign(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "super_admin"
              ? "Add people, change roles, reset passwords and deactivate accounts."
              : "As an admin you can add members. A super admin manages everything else."}
          </p>
        </div>
        {assignable.length > 0 && <AddUserDialog roles={assignable} />}
      </div>

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
                <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">Added</th>
                <th scope="col" className="w-12 px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a) => {
                const name = a.full_name ?? a.email;
                return (
                  <tr key={a.id} className={a.deactivated_at ? "text-muted-foreground" : undefined}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-foreground">{name}</span>
                      {a.id === user.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      <span className="block text-xs text-muted-foreground">{a.email}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{ROLE_LABELS[a.role]}</td>
                    <td className="px-5 py-3">
                      <AccountStatus account={a} />
                    </td>
                    <td className="hidden px-5 py-3 whitespace-nowrap text-muted-foreground md:table-cell">{added.format(new Date(a.created_at))}</td>
                    <td className="px-3 py-3 text-right">
                      {canManageUser(user, a.id) && (
                        <UserActionsMenu user={{ id: a.id, name, email: a.email, role: a.role, active: !a.deactivated_at }} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
