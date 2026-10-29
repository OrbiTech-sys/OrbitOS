"use client";

import { useEffect, useMemo, useState } from "react";

import { ShellInner } from "@/components/demo/shell";
import { ToastProvider } from "@/components/demo/toast";
import { createSettingsStore, SettingsProvider } from "@/lib/demo/settings";
import { MEMBER_DEFAULT_SETTINGS } from "@/lib/demo/settings-defaults";
import { DemoProvider, type DemoState, type StoreConfig } from "@/lib/demo/store";
import { WorkspaceEnvProvider, localNow, localToday, type WorkspaceEnv } from "@/lib/workspace/context";
import { saveWorkspaceChanges } from "@/lib/workspace/actions";
import type { WorkspaceBootstrap } from "@/lib/workspace/load";
import { SELF_ID, diffData, readRecord, settingsRecord } from "@/lib/workspace/records";
import { SyncProvider, type WorkspaceSync } from "@/lib/workspace/sync-context";
import { createSyncQueue, type SyncState } from "@/lib/workspace/sync";

/** Unique ids, so two open tabs can never hand out the same one. */
function randomSuffix() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replace(/-/g, "").slice(0, 12) : Math.random().toString(36).slice(2, 14);
}

/** A member's workspace: real clock, unique ids, everything attributed to them, nothing resettable. */
const WORKSPACE_CONFIG: StoreConfig = {
  today: localToday,
  now: () => localNow(),
  newId: (state, _key, prefix) => ({ id: `${prefix}-${randomSuffix()}`, counters: state.counters }),
  actors: { default: SELF_ID, finance: SELF_ID, inventory: SELF_ID },
  resettable: false,
  demo: false,
};

/**
 * A signed-in member's workspace. The same screens as the demo, running on their
 * own records from the database: every change is picked up from the store,
 * queued, and saved in the background (see lib/workspace/sync.ts).
 */
export function WorkspaceShell({ bootstrap, children }: { bootstrap: WorkspaceBootstrap; children: React.ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>({ status: "saved", pending: 0, error: null, usage: bootstrap.usage });

  const [runtime] = useState(() => {
    const queue = createSyncQueue({
      save: saveWorkspaceChanges,
      onState: setSyncState,
      // Saving can never work again: leave for the page that explains why.
      onFatal: (code) => window.location.assign(code === "inactive" ? "/account/deactivated" : "/sign-in?reason=session"),
      initialUsage: bootstrap.usage,
    });
    const settings = createSettingsStore({
      initial: bootstrap.settings,
      defaults: MEMBER_DEFAULT_SETTINGS,
      onChange: (s) => queue.add({ upserts: [settingsRecord(s)], deletes: [] }),
    });
    const onChange = (prev: DemoState, next: DemoState) => {
      const changes = diffData(prev.data, next.data);
      if (prev.readNotifications !== next.readNotifications) changes.upserts.push(readRecord(next.readNotifications));
      if (changes.upserts.length > 0 || changes.deletes.length > 0) queue.add(changes);
    };
    return { queue, settings, onChange };
  });

  useEffect(() => {
    const { queue } = runtime;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void queue.flush();
    };
    const onOnline = () => queue.retry();
    // Warn before leaving the page with changes that haven't reached the database yet.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (queue.pending() > 0) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Moving to another page of the app: finish saving in the background.
      void queue.flush();
    };
  }, [runtime]);

  const env = useMemo<WorkspaceEnv>(
    () => ({ mode: "workspace", base: "/workspace", today: bootstrap.today, selfId: bootstrap.selfId, profile: bootstrap.profile }),
    [bootstrap],
  );

  const sync = useMemo<WorkspaceSync>(
    () => ({ status: syncState.status, error: syncState.error, pending: syncState.pending, usage: syncState.usage ?? bootstrap.usage, retry: runtime.queue.retry }),
    [syncState, bootstrap.usage, runtime],
  );

  return (
    <WorkspaceEnvProvider value={env}>
      <SettingsProvider store={runtime.settings}>
        <SyncProvider value={sync}>
          <DemoProvider initial={{ data: bootstrap.data, readNotifications: bootstrap.readNotifications }} config={WORKSPACE_CONFIG} onChange={runtime.onChange}>
            <ToastProvider>
              <ShellInner>{children}</ShellInner>
            </ToastProvider>
          </DemoProvider>
        </SyncProvider>
      </SettingsProvider>
    </WorkspaceEnvProvider>
  );
}
