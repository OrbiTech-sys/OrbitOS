"use client";

import { useCallback, useTransition } from "react";

import { endSession } from "@/lib/auth/actions";
import { useWorkspaceSync } from "@/lib/workspace/sync-context";

/**
 * Signs out of a workspace: saves what is pending, ends the session, then does a full
 * page load. That last step matters: it clears the member's records from this tab's
 * memory, so neither the Back button nor the router's cache can bring them back.
 */
export function useSignOut() {
  const sync = useWorkspaceSync();
  const [pending, startTransition] = useTransition();

  const signOut = useCallback(() => {
    startTransition(async () => {
      try {
        await sync?.flush();
      } finally {
        await endSession();
        window.location.replace("/");
      }
    });
  }, [sync]);

  return { signOut, pending };
}
