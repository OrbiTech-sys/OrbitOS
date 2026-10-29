import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { UsersPanel } from "@/components/admin/users-panel";
import { PageHeader } from "@/components/demo/ui";
import { SettingsTabs } from "@/components/workspace/settings-tabs";
import { listAccounts, listAuditLog } from "@/lib/auth/accounts";
import { isAdminRole, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Users & access" };

export default function UsersPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage who can use OrbitOS and how much room each person has." />
      <SettingsTabs />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="Loading" />}>
        <UsersSection />
      </Suspense>
    </>
  );
}

async function UsersSection() {
  const user = await requireUser();
  // Members have no user management; their settings are the preferences page.
  if (!isAdminRole(user.role)) redirect("/workspace/settings");

  const [{ accounts, error, latencyMs }, activity] = await Promise.all([listAccounts(), listAuditLog()]);
  const host = new URL(process.env.SUPABASE_URL!).host;
  return <UsersPanel actor={user} accounts={accounts} error={error} latencyMs={latencyMs} host={host} activity={activity} />;
}
