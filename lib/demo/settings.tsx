"use client";

/**
 * Workspace preferences (business profile, currency, theme, notification
 * toggles, module visibility).
 *
 * Each workspace owns one settings store, supplied through <SettingsProvider>:
 * - the public demo uses a browser-only store backed by localStorage (nothing
 *   is sent anywhere);
 * - a member's workspace uses a store seeded from the database that reports
 *   every change through `onChange`, so it can be saved with their records.
 * Outside any provider the demo store is used.
 *
 * Implemented as a tiny external store so the server render (and the first
 * client render) use the same values and saved ones are applied right after
 * hydration without a mismatch.
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { moneyFormatter, type MoneyFormatter } from "./format";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings-defaults";
import type { DemoSettings } from "./types";

const STORAGE_KEY = "orbitos-demo-settings-v1";

export interface SettingsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): DemoSettings;
  getServerSnapshot(): DemoSettings;
  update(patch: Partial<DemoSettings> | ((s: DemoSettings) => DemoSettings)): void;
  /** Restores the defaults and returns them. */
  reset(): DemoSettings;
}

export function createSettingsStore(options: {
  /** Starting value (a workspace's saved settings). */
  initial?: DemoSettings;
  /** What reset() returns to. */
  defaults?: DemoSettings;
  /** Persist in this browser's localStorage under this key (the demo). */
  storageKey?: string;
  /** Called after every change (a workspace saves it to the database). */
  onChange?: (settings: DemoSettings) => void;
}): SettingsStore {
  const defaults = options.defaults ?? DEFAULT_SETTINGS;
  const initial = options.initial ?? defaults;
  const { storageKey, onChange } = options;

  let current = initial;
  let loaded = !storageKey;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  function load() {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(storageKey!);
      if (raw) current = mergeSettings(JSON.parse(raw), defaults);
    } catch {
      // Storage may be unavailable (private mode, blocked cookies): keep defaults.
    }
  }

  function persist() {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(current));
      } catch {
        // Ignore persistence failures; the in-memory value still applies.
      }
    }
    onChange?.(current);
  }

  const getSnapshot = () => {
    if (!loaded && typeof window !== "undefined") load();
    return current;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot,
    // A browser-saved store renders defaults on the server and applies the saved values after hydration.
    getServerSnapshot: () => (storageKey ? defaults : initial),
    update(patch) {
      const base = getSnapshot();
      current = typeof patch === "function" ? patch(base) : { ...base, ...patch };
      persist();
      emit();
    },
    reset() {
      current = defaults;
      if (storageKey) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
      }
      onChange?.(current);
      emit();
      return current;
    },
  };
}

/** The public demo's browser-only store. */
export const demoSettingsStore = createSettingsStore({ storageKey: STORAGE_KEY });

const SettingsContext = createContext<SettingsStore>(demoSettingsStore);

export function SettingsProvider({ store, children }: { store: SettingsStore; children: React.ReactNode }) {
  return <SettingsContext.Provider value={store}>{children}</SettingsContext.Provider>;
}

export function useSettings(): DemoSettings {
  const store = useContext(SettingsContext);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/** Change or reset the current workspace's preferences. */
export function useSettingsActions() {
  const store = useContext(SettingsContext);
  return useMemo(() => ({ update: store.update, reset: store.reset }), [store]);
}

/** Currency formatter honouring the preferred-currency setting (display only). */
export function useMoney(): MoneyFormatter {
  return moneyFormatter(useSettings().currency);
}
