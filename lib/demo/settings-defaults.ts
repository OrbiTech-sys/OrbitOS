import type { DemoSettings } from "./types";

/** Default preferences. Kept apart from settings.tsx (a client module) so server code can use them too. */

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

/** Starting point for a new member's workspace: the same switches, no borrowed sample details. */
export const MEMBER_DEFAULT_SETTINGS: DemoSettings = {
  ...DEFAULT_SETTINGS,
  businessName: "My business",
  industry: "",
  contactEmail: "",
  location: "",
  theme: "system",
};

/** Fills gaps in saved settings (older or partial values) from the defaults. */
export function mergeSettings(saved: unknown, defaults: DemoSettings = DEFAULT_SETTINGS): DemoSettings {
  if (!saved || typeof saved !== "object") return defaults;
  const s = saved as Partial<DemoSettings>;
  return {
    ...defaults,
    ...s,
    notifications: { ...defaults.notifications, ...(s.notifications ?? {}) },
    modules: { ...defaults.modules, ...(s.modules ?? {}) },
  };
}
