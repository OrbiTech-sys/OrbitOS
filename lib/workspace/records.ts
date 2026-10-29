import type { DemoData, DemoSettings, EntityId, TeamMember } from "../demo/types";
import { MEMBER_DEFAULT_SETTINGS, mergeSettings } from "../demo/settings-defaults";
import { READ_NOTIFICATIONS_LIMIT, readSchema, recordSchemas, settingsSchema, type StoredKind } from "./schemas";

/**
 * Converts between what the screens hold (a DemoData object) and what the
 * database stores (one row per record). Pure functions, no I/O.
 */

/** The member's own team entry. It is derived from their account, never stored. */
export const SELF_ID: EntityId = "tm-self";

export interface RecordKey {
  kind: StoredKind;
  id: string;
}
export interface StoredRecord extends RecordKey {
  data: Record<string, unknown>;
}
export interface Changes {
  upserts: StoredRecord[];
  deletes: RecordKey[];
}

type CollectionKind = Exclude<StoredKind, "meta">;
const COLLECTIONS: Record<CollectionKind, keyof DemoData> = {
  team: "team",
  contact: "contacts",
  product: "products",
  order: "orders",
  quotation: "quotations",
  invoice: "invoices",
  expense: "expenses",
  project: "projects",
  task: "tasks",
  activity: "activities",
};
const COLLECTION_KINDS = Object.keys(COLLECTIONS) as CollectionKind[];

export const emptyData = (self: TeamMember): DemoData => ({
  team: [self],
  contacts: [],
  products: [],
  orders: [],
  quotations: [],
  invoices: [],
  expenses: [],
  projects: [],
  tasks: [],
  activities: [],
});

export function selfMember(user: { fullName: string | null; email: string }): TeamMember {
  const name = user.fullName?.trim() || user.email.split("@")[0];
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";
  return { id: SELF_ID, name, role: "Owner", email: user.email, initials, tone: "indigo" };
}

/** Records that changed between two states: new or replaced items (by reference) and removed ones. */
export function diffData(prev: DemoData, next: DemoData): Changes {
  const changes: Changes = { upserts: [], deletes: [] };
  for (const kind of COLLECTION_KINDS) {
    const key = COLLECTIONS[kind];
    const before = prev[key] as { id: string }[];
    const after = next[key] as { id: string }[];
    if (before === after) continue;
    const old = new Map(before.map((item) => [item.id, item]));
    const seen = new Set<string>();
    for (const item of after) {
      seen.add(item.id);
      if (kind === "team" && item.id === SELF_ID) continue;
      if (old.get(item.id) !== item) changes.upserts.push({ kind, id: item.id, data: item as unknown as Record<string, unknown> });
    }
    for (const item of before) {
      if (!seen.has(item.id) && !(kind === "team" && item.id === SELF_ID)) changes.deletes.push({ kind, id: item.id });
    }
  }
  return changes;
}

const numberPart = (value: string) => Number(value.replace(/\D/g, "")) || 0;
const byText = (a: string, b: string) => a.localeCompare(b);

/** The order each list is shown in after loading (new items go first, as they do while working). */
const SORTS: { [K in keyof DemoData]: (a: DemoData[K][number], b: DemoData[K][number]) => number } = {
  team: (a, b) => (a.id === SELF_ID ? -1 : b.id === SELF_ID ? 1 : byText(a.name, b.name)),
  contacts: (a, b) => byText(b.createdAt, a.createdAt) || byText(a.name, b.name),
  products: (a, b) => byText(a.name, b.name),
  orders: (a, b) => numberPart(a.number) - numberPart(b.number),
  quotations: (a, b) => numberPart(b.number) - numberPart(a.number),
  invoices: (a, b) => numberPart(a.number) - numberPart(b.number),
  expenses: (a, b) => byText(b.date, a.date) || byText(a.vendor, b.vendor),
  projects: (a, b) => byText(a.name, b.name),
  tasks: (a, b) => byText(a.dueDate, b.dueDate) || byText(a.title, b.title),
  activities: (a, b) => byText(b.at, a.at),
};

export interface LoadedWorkspace {
  data: DemoData;
  settings: DemoSettings;
  readNotifications: string[];
  /** Rows that no longer match their schema and were left out. */
  skipped: number;
}

/** Builds a workspace from stored rows. Invalid rows are skipped rather than breaking the whole load. */
export function rowsToWorkspace(rows: StoredRecord[], self: TeamMember): LoadedWorkspace {
  const data = emptyData(self);
  const lists = data as unknown as Record<string, unknown[]>;
  let settings = MEMBER_DEFAULT_SETTINGS;
  let readNotifications: string[] = [];
  let skipped = 0;

  for (const row of rows) {
    if (row.kind === "meta") {
      if (row.id === "settings") {
        const parsed = settingsSchema.safeParse(row.data);
        if (parsed.success) settings = mergeSettings(parsed.data, MEMBER_DEFAULT_SETTINGS);
        else skipped++;
      } else if (row.id === "read") {
        const parsed = readSchema.safeParse(row.data);
        if (parsed.success) readNotifications = parsed.data.ids;
        else skipped++;
      }
      continue;
    }
    const parsed = recordSchemas[row.kind].safeParse(row.data);
    if (!parsed.success || parsed.data.id !== row.id || (row.kind === "team" && row.id === SELF_ID)) {
      skipped++;
      continue;
    }
    lists[COLLECTIONS[row.kind]].push(parsed.data);
  }

  for (const kind of COLLECTION_KINDS) {
    const key = COLLECTIONS[kind];
    (lists[key] as unknown[]).sort(SORTS[key] as (a: unknown, b: unknown) => number);
  }
  return { data, settings, readNotifications, skipped };
}

/** The "read notifications" record: the most recent ids only, so it can't grow without bound. */
export function readRecord(ids: string[]): StoredRecord {
  return { kind: "meta", id: "read", data: { ids: ids.slice(-READ_NOTIFICATIONS_LIMIT) } };
}

export function settingsRecord(settings: DemoSettings): StoredRecord {
  return { kind: "meta", id: "settings", data: settings as unknown as Record<string, unknown> };
}
