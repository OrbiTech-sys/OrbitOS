"use client";

import { createContext, useContext } from "react";

export type SaveStatus = "saved" | "saving" | "error";

export interface WorkspaceUsage {
  bytes: number;
  records: number;
  quotaBytes: number;
}

export interface WorkspaceSync {
  status: SaveStatus;
  /** Why the last save failed, when status is "error". */
  error: string | null;
  /** Changes waiting to be saved. */
  pending: number;
  usage: WorkspaceUsage;
  /** Try saving again now. */
  retry(): void;
}

const SyncContext = createContext<WorkspaceSync | null>(null);

export const SyncProvider = SyncContext.Provider;

/** Save state of a member's workspace; null in the public demo, which saves nothing. */
export const useWorkspaceSync = () => useContext(SyncContext);
