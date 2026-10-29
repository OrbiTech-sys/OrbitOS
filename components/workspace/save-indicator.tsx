"use client";

import { CheckCircle2, CloudOff, Loader2, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkspaceSync } from "@/lib/workspace/sync-context";
import { cn } from "@/lib/utils";

/** Header chip showing whether the member's changes have reached the database. Renders nothing in the demo. */
export function SaveIndicator() {
  const sync = useWorkspaceSync();
  if (!sync) return null;
  const { status, pending } = sync;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
        status === "error" ? "bg-danger-soft text-danger" : status === "saving" || pending > 0 ? "bg-muted text-muted-foreground" : "text-muted-foreground",
      )}
    >
      {status === "error" ? (
        <>
          <CloudOff className="size-3.5" aria-hidden="true" /> Not saved
        </>
      ) : status === "saving" || pending > 0 ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Saving…
        </>
      ) : (
        <>
          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" /> Saved
        </>
      )}
    </span>
  );
}

/** Full-width notice under the header when saving has failed, with a retry. Renders nothing otherwise. */
export function SaveErrorBanner() {
  const sync = useWorkspaceSync();
  if (!sync || sync.status !== "error") return null;

  return (
    <div role="alert" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-danger/30 bg-danger-soft px-4 py-2 text-xs font-medium text-danger sm:px-6">
      <span>{sync.error ?? "Your latest changes couldn't be saved."}</span>
      <Button type="button" size="xs" variant="outline" onClick={sync.retry}>
        <RotateCw /> Try again
      </Button>
    </div>
  );
}
