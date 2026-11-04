import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { WebsiteEditor } from "@/components/admin/website/website-editor";
import { PageHeader } from "@/components/demo/ui";
import { SettingsTabs } from "@/components/workspace/settings-tabs";
import { canEditWebsite } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getEditableContent } from "@/lib/content/store";

export const metadata: Metadata = { title: "Website" };

export default function WebsitePage() {
  return (
    <>
      <PageHeader title="Settings" description="Edit the public website." />
      <SettingsTabs />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="Loading" />}>
        <WebsiteSection />
      </Suspense>
    </>
  );
}

async function WebsiteSection() {
  const user = await requireUser();
  // Only super admins edit the website; the save action and the database refuse anyone else too.
  if (!canEditWebsite(user)) redirect("/workspace/settings");

  const { content, edited, error } = await getEditableContent();
  return <WebsiteEditor initial={content} edited={edited} loadError={error} />;
}
