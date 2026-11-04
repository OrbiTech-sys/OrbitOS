import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { InboxPanel } from "@/components/admin/inbox-panel";
import { PageHeader } from "@/components/demo/ui";
import { SettingsTabs } from "@/components/workspace/settings-tabs";
import { canReadInbox } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listSubmissions } from "@/lib/marketing/inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Settings" description="What visitors have sent through the website." />
      <SettingsTabs />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="Loading" />}>
        <InboxSection />
      </Suspense>
    </>
  );
}

async function InboxSection() {
  const user = await requireUser();
  if (!canReadInbox(user)) redirect("/workspace/settings");

  const { submissions, error } = await listSubmissions();
  return <InboxPanel submissions={submissions} error={error} />;
}
