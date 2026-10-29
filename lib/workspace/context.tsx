"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { DEMO_TODAY, type ISODate } from "@/lib/demo/dates";
import type { EntityId } from "@/lib/demo/types";

/**
 * Where the screens in components/demo are running.
 *
 * - "demo": the public sample workspace at /demo (fixed date, fictional data,
 *   nothing saved). This is the default, so anything rendered outside a provider
 *   behaves exactly as the demo always did.
 * - "workspace": a signed-in member's own workspace at /workspace (real date,
 *   their own records, saved to the database).
 *
 * The shared code writes every internal link as "/demo/...". resolveHref and
 * canonicalPath translate at the edges, so one set of screens serves both.
 */
export type WorkspaceMode = "demo" | "workspace";

export interface WorkspaceProfile {
  name: string;
  email: string;
  roleLabel: string;
  isAdmin: boolean;
}

export interface WorkspaceEnv {
  mode: WorkspaceMode;
  base: string;
  today: ISODate;
  /** Team member the signed-in user acts as. */
  selfId: EntityId;
  profile: WorkspaceProfile | null;
}

export const DEMO_ENV: WorkspaceEnv = { mode: "demo", base: "/demo", today: DEMO_TODAY, selfId: "tm-alex", profile: null };

const EnvContext = createContext<WorkspaceEnv>(DEMO_ENV);

export const useWorkspaceEnv = () => useContext(EnvContext);
export const useToday = () => useContext(EnvContext).today;
export const useIsDemo = () => useContext(EnvContext).mode === "demo";

/** "/demo/crm" -> "/workspace/crm" (links to anything outside /demo are left alone). */
export function resolveHref(base: string, href: string): string {
  if (base === "/demo") return href;
  if (href === "/demo") return base;
  return /^\/demo[/?#]/.test(href) ? base + href.slice("/demo".length) : href;
}

/** "/workspace/crm" -> "/demo/crm", so route-matching logic has one shape. */
export function canonicalPath(base: string, pathname: string): string {
  if (base === "/demo") return pathname;
  if (pathname === base) return "/demo";
  return pathname.startsWith(`${base}/`) ? "/demo" + pathname.slice(base.length) : pathname;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The viewer's calendar date. Only called from event handlers, effects and store snapshots, never during render. */
export function localToday(): ISODate {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local date and time to the minute, e.g. 2026-10-29T14:05. */
export function localNow(): string {
  const d = new Date();
  return `${localToday()}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function subscribeClock(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  document.addEventListener("visibilitychange", callback);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", callback);
  };
}

/**
 * Provides the environment. In a workspace "today" starts as the server's date
 * (so the first render matches the HTML) and follows the viewer's own calendar
 * from then on, including across midnight.
 */
export function WorkspaceEnvProvider({ value, children }: { value: WorkspaceEnv; children: React.ReactNode }) {
  const live = value.mode === "workspace";
  const subscribe = useCallback((cb: () => void) => (live ? subscribeClock(cb) : () => {}), [live]);
  const today = useSyncExternalStore(
    subscribe,
    () => (live ? localToday() : value.today),
    () => value.today,
  );
  const env = useMemo(() => ({ ...value, today }), [value, today]);
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}
