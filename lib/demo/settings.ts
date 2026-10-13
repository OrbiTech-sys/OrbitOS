"use client";

/**
 * Local demo preferences (business profile, currency, theme, notification
 * toggles, module visibility).
 *
 * These live ONLY in this browser's localStorage. They are not account
 * settings, are not synced anywhere and are never sent to a server.
 *
 * Implemented as a tiny external store so that the server render (and the
 * first client render) use the defaults and the saved values are applied
 * right after hydration without a mismatch.
 *
 * ---------------------------------------------------------------------------
 * FUTURE BACKEND NOTE
 * Business profile, currency and module visibility become rows on the
 * `organizations` / `organization_settings` tables; theme and notification
 * toggles become per-user rows in `user_preferences`.
 * ---------------------------------------------------------------------------
 */
import { useSyncExternalStore } from "react";
import { moneyFormatter, type MoneyFormatter } from "./format";
import type { DemoSettings } from "./types";

export const DEFAULT_SETTINGS: DemoSettings = {
  businessName: "Meridian Workspace Supply",
  industry: "Wholesale and distribution",
  contactEmail: "hello@meridianworkspace.example",
  location: "Austin, TX (sample)",
  currency: "USD",
  theme: "light",
  notifications: {
    overdueInvoices: true,
    lowStock: true,
    followUps: true,
    tasks: true,
    orders: true,
  },
  modules: {
    copilot: true,
    crm: true,
    sales: true,
    orders: true,
    inventory: true,
    finance: true,
    projects: true,
    team: true,
    analytics: true,
  },
};

const STORAGE_KEY = "orbitos-demo-settings-v1";

let current: DemoSettings = DEFAULT_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

function merge(saved: unknown): DemoSettings {
  if (!saved || typeof saved !== "object") return DEFAULT_SETTINGS;
  const s = saved as Partial<DemoSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(s.notifications ?? {}) },
    modules: { ...DEFAULT_SETTINGS.modules, ...(s.modules ?? {}) },
  };
}

function load() {
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) current = merge(JSON.parse(raw));
  } catch {
    // Storage may be unavailable (private mode, blocked cookies): keep defaults.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): DemoSettings {
  if (!loaded && typeof window !== "undefined") load();
  return current;
}

function getServerSnapshot(): DemoSettings {
  return DEFAULT_SETTINGS;
}

export function updateSettings(patch: Partial<DemoSettings> | ((s: DemoSettings) => DemoSettings)) {
  const base = getSnapshot();
  current = typeof patch === "function" ? patch(base) : { ...base, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore persistence failures; the in-memory value still applies.
  }
  listeners.forEach((l) => l());
}

export function resetSettings() {
  current = DEFAULT_SETTINGS;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useSettings(): DemoSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Currency formatter honouring the preferred-currency setting (display only). */
export function useMoney(): MoneyFormatter {
  return moneyFormatter(useSettings().currency);
}
