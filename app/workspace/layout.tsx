import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkspaceLoading } from "@/components/workspace/workspace-loading";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requireUser } from "@/lib/auth/session";
import { loadWorkspace } from "@/lib/workspace/load";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · OrbitOS" },
  description: "Your OrbitOS workspace.",
  robots: { index: false, follow: false },
};

export default function WorkspaceLayout({ children }: LayoutProps<"/workspace">) {
  // Reading the session and the member's records happens per request, behind a boundary.
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <WorkspaceGate>{children}</WorkspaceGate>
    </Suspense>
  );
}

async function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const bootstrap = await loadWorkspace(user);
  return <WorkspaceShell bootstrap={bootstrap}>{children}</WorkspaceShell>;
}
