// Workspace self-test:  npm run test:workspace
//
//   1. Demo        the public demo's rules are exactly what they were
//   2. Records     a realistic session on an empty workspace produces records that
//                  pass validation and reload into the same data
//   3. Sync queue  batching, retries, edits during a save, quota, deactivation
//   4. Server      what the save endpoint accepts and rejects
//   5. Database    (needs .env.local) the whole path against Supabase with
//                  throwaway members, then cleans up
import { randomBytes } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

import { DEMO_CONFIG, createActions, createInitialState, createStore, type DemoActions, type DemoState, type StoreConfig } from "../../lib/demo/store";
import { persistChanges } from "../../lib/workspace/persist";
import { SELF_ID, diffData, emptyData, readRecord, rowsToWorkspace, selfMember, type Changes, type StoredRecord } from "../../lib/workspace/records";
import { fetchAllRecords } from "../../lib/workspace/rows";
import { recordSchemas } from "../../lib/workspace/schemas";
import { createSyncQueue, type SyncState } from "../../lib/workspace/sync";
import type { SaveResult } from "../../lib/workspace/types";

let failures = 0;
function check(cond: unknown, label: string, detail = "") {
  console.log(`  ${cond ? "✔" : "✖"} ${label}${!cond && detail ? ` -> ${detail}` : ""}`);
  if (!cond) failures++;
  return !!cond;
}
const section = (title: string) => console.log(`\n${title}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function must<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.value;
}

/** Stable text for comparing records regardless of key order. */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, val) => (val && typeof val === "object" && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b))) : val));

/* ---------------------------------------------------------------- 1. Demo -- */

section("Demo (unchanged behaviour)");
{
  const store = createStore(createInitialState());
  const a = createActions(store, DEMO_CONFIG);
  const before = store.getState();
  const maxCtc = Math.max(...before.data.contacts.map((c) => Number(c.id.split("-").pop())));
  const contact = must(a.addContact({ name: "Test", company: "Co", email: "t@example.com", phone: "", jobTitle: "", stage: "new", dealValue: 0, followUpDate: null, ownerId: "tm-priya", source: "", notes: "" }));
  const s1 = store.getState();
  check(contact.id === `ctc-${String(maxCtc + 1).padStart(3, "0")}`, `Counter ids continue the seed (${contact.id})`);
  check(contact.createdAt === "2026-10-13", "Records are dated on the fixed demo day");
  check(s1.data.activities[0].at === "2026-10-13T17:01" && s1.data.activities[0].actorId === "tm-alex", "Activity uses the simulated clock and the demo user");

  const customer = before.data.contacts.find((c) => c.stage === "customer")!;
  const product = before.data.products.find((p) => p.stock > 5)!;
  const order = must(a.createOrder({ customerId: customer.id, lines: [{ productId: product.id, quantity: 1 }], createInvoice: true }));
  const s2 = store.getState();
  check(order.createdById === "tm-alex" && order.date === "2026-10-13", "Orders are attributed to the demo user and date");
  check(s2.data.activities.some((x) => x.kind === "invoice" && x.actorId === "tm-sofia"), "Invoices are attributed to the demo finance owner");
  check(s2.data.activities.some((x) => x.message.includes("(demo, no accounting entry)")), "Demo log entries keep their demo caveat");
  must(a.adjustStock(product.id, 1, "test"));
  check(store.getState().data.activities[0].actorId === "tm-daniel", "Stock changes are attributed to the demo inventory owner");
  a.reset();
  check(store.getState().data.contacts.length === before.data.contacts.length, "Reset restores the sample data");
}

/* ------------------------------------------------------------- 2. Records -- */

section("A member's session");
const self = selfMember({ fullName: "Test Member", email: "member@example.com" });
let tick = 0;
const workspaceConfig: StoreConfig = {
  today: () => "2026-10-29",
  now: () => {
    tick++;
    return `2026-10-29T10:${String(Math.floor(tick / 60)).padStart(2, "0")}:${String(tick % 60).padStart(2, "0")}`;
  },
  newId: (state, _key, prefix) => ({ id: `${prefix}-${randomBytes(6).toString("hex")}`, counters: state.counters }),
  actors: { default: SELF_ID, finance: SELF_ID, inventory: SELF_ID },
  resettable: false,
  demo: false,
};

function newWorkspace(onChange: (prev: DemoState, next: DemoState) => void) {
  const store = createStore(createInitialState(emptyData(self)), onChange);
  return { store, actions: createActions(store, workspaceConfig) };
}

/** Everything a member does in a first session, through the same rules the screens use. */
function runSession(a: DemoActions) {
  const lead = must(a.addContact({ name: "Ada Lovelace", company: "Analytical Ltd", email: "ada@analytical.example", phone: "+1 555 0100", jobTitle: "CEO", stage: "qualified", dealValue: 12000, followUpDate: "2026-10-31", ownerId: SELF_ID, source: "Referral", notes: "Met at the expo" }));
  const customer = must(a.addContact({ name: "Grace Hopper", company: "Compiler Co", email: "grace@compiler.example", phone: "", jobTitle: "CTO", stage: "customer", dealValue: 30000, followUpDate: null, ownerId: SELF_ID, source: "", notes: "" }));
  a.setContactStage(lead.id, "negotiation");
  const widget = must(a.addProduct({ name: "Widget", sku: "wid-1", category: "Accessories", stock: 20, threshold: 5, unitPrice: 19.99, unitCost: 8, supplier: "Acme" }));
  const gadget = must(a.addProduct({ name: "Gadget", sku: "GAD-1", category: "Electronics", stock: 3, threshold: 2, unitPrice: 120, unitCost: 70, supplier: "" }));
  const order1 = must(a.createOrder({ customerId: customer.id, lines: [{ productId: widget.id, quantity: 2 }], notes: "first order", createInvoice: true }));
  const quote = must(a.createQuotation({ customerId: lead.id, lines: [{ productId: gadget.id, quantity: 1 }], validDays: 30, send: true }));
  const order2 = must(a.convertQuotationToOrder(quote.id));
  must(a.adjustStock(gadget.id, -1, "Damaged"));
  must(a.createReorderTask(gadget.id)); // no project yet: one is created
  const project = must(a.addProject({ name: "Website relaunch", customerId: customer.id, status: "active" }));
  const task = must(a.addTask({ title: "Draft the brief", projectId: project.id, assigneeId: SELF_ID, priority: "high", dueDate: "2026-11-02" }));
  a.setTaskStatus(task.id, "done");
  must(a.addTeamMember({ name: "Sam Lee", role: "Designer", email: "sam@example.com" }));
  must(a.addExpense({ date: "2026-10-28", category: "Software", vendor: "Tools Inc", description: "Licences", amount: 99 }));
  a.markInvoicePaid(order1.invoiceId!);
  must(a.setOrderStatus(order1.id, "shipped"));
  must(a.setOrderStatus(order2.id, "cancelled"));
  a.updateContact(lead.id, { notes: "Follow up soon", followUpDate: "2026-11-05" });
  a.logContactActivity(customer.id);
  a.setThreshold(widget.id, 8);
  a.markNotificationsRead(["overdue-1", "low-stock-2"]);
  // Enough activity to push the oldest entries out of the log (those are deleted from the database).
  for (let i = 0; i < 25; i++) must(a.adjustStock(widget.id, 1, `restock ${i}`));
  return { lead, customer, widget, gadget, order1, order2 };
}

const byId = (rows: { id: string }[]) => [...rows].sort((x, y) => x.id.localeCompare(y.id));

function sameWorkspace(label: string, loaded: ReturnType<typeof rowsToWorkspace>, expected: DemoState) {
  const keys = ["team", "contacts", "products", "orders", "quotations", "invoices", "expenses", "projects", "tasks", "activities"] as const;
  const wrong = keys.filter((k) => canon(byId(loaded.data[k])) !== canon(byId(expected.data[k])));
  check(wrong.length === 0, label, `differs in: ${wrong.join(", ")}`);
  check(canon(loaded.readNotifications) === canon(expected.readNotifications), "Read notifications survive a reload");
}

let finalState: DemoState;
{
  const rows = new Map<string, StoredRecord>();
  const batches: Changes[] = [];
  const { store, actions } = newWorkspace((prev, next) => {
    const changes = diffData(prev.data, next.data);
    if (prev.readNotifications !== next.readNotifications) changes.upserts.push(readRecord(next.readNotifications));
    batches.push(changes);
    for (const d of changes.deletes) rows.delete(`${d.kind}:${d.id}`);
    for (const u of changes.upserts) rows.set(`${u.kind}:${u.id}`, structuredClone(u));
  });
  const s = runSession(actions);
  finalState = store.getState();
  const d = finalState.data;

  check(d.team.length === 2 && d.team[0].id === SELF_ID, "The member is on their own team, alongside the person they added");
  check(d.orders.map((o) => o.number).join() === "ORD-1001,ORD-1002", `Orders are numbered from 1001 (${d.orders.map((o) => o.number)})`);
  check(d.invoices[0].number === "INV-2001" && d.quotations[0].number === "QUO-3001", "Invoices and quotations are numbered from 2001 and 3001");
  check(d.orders[0].createdById === SELF_ID && d.orders[0].date === "2026-10-29", "Records are attributed to the member and dated today");
  check(d.projects.some((p) => p.name === "Inventory restock") && d.tasks.some((t) => t.title === "Reorder Gadget"), "A reorder works in a workspace with no projects");
  check(d.contacts.find((c) => c.id === s.lead.id)!.stage === "customer", "Accepting a quotation turns the lead into a customer");
  check(d.products.find((p) => p.id === s.gadget.id)!.stock === 2, "Stock follows orders, adjustments and cancellations (Gadget: 3 -1 -1 +1 = 2)");
  check(!d.activities.some((x) => /demo|sample/i.test(x.message)), "A member's activity log never mentions the demo");
  check(d.activities.length === 40, `The activity log keeps the latest 40 (${d.activities.length})`);
  const allIds = [d.contacts, d.products, d.orders, d.quotations, d.invoices, d.expenses, d.projects, d.tasks, d.activities].flatMap((l) => l.map((x) => x.id));
  check(new Set(allIds).size === allIds.length, "Every record has a unique id");

  let invalid = 0;
  const detail: string[] = [];
  for (const b of batches)
    for (const u of b.upserts) {
      if (u.kind === "meta") continue;
      const r = recordSchemas[u.kind].safeParse(u.data);
      if (!r.success) {
        invalid++;
        if (detail.length < 3) detail.push(`${u.kind}: ${r.error.issues[0].path.join(".")} ${r.error.issues[0].message}`);
      }
    }
  check(invalid === 0, `All ${batches.reduce((n, b) => n + b.upserts.length, 0)} saved records pass validation`, detail.join("; "));
  check(batches.some((b) => b.deletes.length > 0) && !rows.has(`activity:${"none"}`), "Entries trimmed from the activity log are deleted from storage");
  sameWorkspace("Reloading the stored rows gives back exactly what was on screen", rowsToWorkspace([...rows.values()], self), finalState);
}

/* ----------------------------------------------------------- 3. Sync queue -- */

section("Save queue");
{
  const calls: Changes[] = [];
  const states: SyncState[] = [];
  const ok = (usage = { bytes: 10, records: 1, quotaBytes: 100 }): SaveResult => ({ ok: true, usage, rejected: [] });
  const upsert = (id: string, n: number): Changes => ({ upserts: [{ kind: "contact", id, data: { n } }], deletes: [] });

  // batching and coalescing
  let q = createSyncQueue({ save: async (c) => (calls.push(c), ok()), onState: (s) => states.push(s), debounceMs: 20 });
  q.add(upsert("a", 1));
  q.add(upsert("a", 2));
  q.add(upsert("b", 1));
  check(q.pending() === 2, "Changes to the same record are merged while waiting");
  await sleep(80);
  check(calls.length === 1 && calls[0].upserts.length === 2 && calls[0].upserts.find((u) => u.id === "a")!.data.n === 2, "They are saved together, latest version only");
  check(q.pending() === 0 && states.at(-1)!.status === "saved", "The queue empties and reports saved");

  // an edit made while a save is in flight is not lost
  calls.length = 0;
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  q = createSyncQueue({
    save: async (c) => {
      calls.push(c);
      if (calls.length === 1) await gate;
      return ok();
    },
    onState: () => {},
    debounceMs: 5,
  });
  q.add(upsert("x", 1));
  await sleep(30);
  q.add(upsert("x", 2));
  release();
  await sleep(60);
  check(calls.length === 2 && calls[1].upserts[0].data.n === 2 && q.pending() === 0, "An edit during a save is saved afterwards");

  // batches
  calls.length = 0;
  q = createSyncQueue({ save: async (c) => (calls.push(c), ok()), onState: () => {}, debounceMs: 5, batchSize: 100 });
  q.add({ upserts: Array.from({ length: 250 }, (_, i) => ({ kind: "contact" as const, id: `c${i}`, data: { i } })), deletes: [] });
  await q.flush();
  check(calls.length === 3 && calls.map((c) => c.upserts.length).join() === "100,100,50", "Large changes go in batches of 100");

  // failure, automatic retry
  let attempts = 0;
  const failStates: SyncState[] = [];
  q = createSyncQueue({
    save: async () => (++attempts < 3 ? { ok: false, code: "failed", error: "Server hiccup" } : ok()),
    onState: (s) => failStates.push(s),
    debounceMs: 5,
    retryMs: [15],
  });
  q.add(upsert("r", 1));
  await sleep(150);
  check(failStates.some((s) => s.status === "error" && s.error === "Server hiccup"), "A failed save is reported");
  check(attempts === 3 && q.pending() === 0 && failStates.at(-1)!.status === "saved", "...and retried automatically until it works");

  // network failure
  attempts = 0;
  q = createSyncQueue({
    save: async () => {
      if (++attempts === 1) throw new Error("fetch failed");
      return ok();
    },
    onState: () => {},
    debounceMs: 5,
    retryMs: [15],
  });
  q.add(upsert("n", 1));
  await sleep(100);
  check(attempts === 2 && q.pending() === 0, "A dropped connection is retried");

  // deactivation stops everything
  let fatal: string | null = null;
  attempts = 0;
  q = createSyncQueue({
    save: async () => (attempts++, { ok: false, code: "inactive", error: "Your account can no longer save changes." }),
    onState: () => {},
    onFatal: (c) => (fatal = c),
    debounceMs: 5,
    retryMs: [10],
  });
  q.add(upsert("d", 1));
  await sleep(80);
  check(fatal === "inactive" && attempts === 1, "A deactivated account stops saving at once and says why");

  // quota waits for the member
  let full = true;
  attempts = 0;
  const quotaStates: SyncState[] = [];
  q = createSyncQueue({
    save: async () => (attempts++, full ? { ok: false, code: "quota", error: "Your storage limit has been reached." } : ok()),
    onState: (s) => quotaStates.push(s),
    debounceMs: 5,
    retryMs: [10],
  });
  q.add(upsert("q", 1));
  await sleep(80);
  check(attempts === 1 && quotaStates.at(-1)!.status === "error", "A full workspace does not retry in a loop");
  full = false;
  q.retry();
  await sleep(40);
  check(q.pending() === 0 && quotaStates.at(-1)!.status === "saved", "...and saves once there is room again");

  // rejected records are reported, not retried forever
  const rejStates: SyncState[] = [];
  q = createSyncQueue({
    save: async () => ({ ok: true, usage: { bytes: 1, records: 1, quotaBytes: 10 }, rejected: [{ kind: "contact", id: "bad", reason: "Invalid record" }] }),
    onState: (s) => rejStates.push(s),
    debounceMs: 5,
  });
  const quiet = console.error;
  console.error = () => {};
  q.add(upsert("bad", 1));
  await sleep(40);
  console.error = quiet;
  check(q.pending() === 0 && rejStates.at(-1)!.status === "error" && /couldn't be saved/.test(rejStates.at(-1)!.error ?? ""), "Records the server refuses are dropped and flagged");
}

/* -------------------------------------------------------- 4. Save endpoint -- */

section("Save endpoint");
{
  type Call = { name: string; args: { p_upserts: { kind: string; id: string }[]; p_deletes: { kind: string; id: string }[] } };
  const fake = (rpcError: { code?: string; message: string } | null = null) => {
    const calls: Call[] = [];
    const client = {
      rpc: async (name: string, args: Call["args"]) => (calls.push({ name, args }), { error: rpcError }),
      from: (table: string) => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === "workspace_usage" ? { records: 3, bytes: 1234 } : { storage_quota_bytes: 5242880 }, error: null }) }) }),
      }),
    } as unknown as SupabaseClient;
    return { calls, client };
  };
  const goodContact = { id: "ctc-1", name: "A", company: "B", email: "a@b.c", phone: "", jobTitle: "", stage: "new", dealValue: 0, lastContact: "2026-10-29", followUpDate: null, ownerId: SELF_ID, source: "", notes: "", createdAt: "2026-10-29" };

  let f = fake();
  let r = await persistChanges(f.client, "u1", {
    upserts: [
      { kind: "contact", id: "ctc-1", data: { ...goodContact, extra: "dropped" } },
      { kind: "contact", id: "ctc-2", data: { ...goodContact, id: "ctc-2", stage: "hacker" } },
      { kind: "contact", id: "ctc-3", data: { ...goodContact, id: "other" } },
      { kind: "team", id: SELF_ID, data: { id: SELF_ID, name: "x", role: "", email: "", initials: "X", tone: "indigo" } },
      { kind: "meta", id: "secrets", data: {} },
      { kind: "contact", id: "ctc-1", data: { ...goodContact, name: "Newest" } },
    ],
    deletes: [
      { kind: "contact", id: "ctc-1" },
      { kind: "task", id: "tsk-9" },
      { kind: "meta", id: "settings" },
    ],
  });
  const sent = f.calls[0]?.args;
  check(r.ok && r.rejected.length === 4, "Invalid, mismatched, reserved and unknown records are rejected", r.ok ? String(r.rejected.length) : r.error);
  check(sent?.p_upserts.length === 1 && (sent.p_upserts[0] as unknown as { data: { name: string; extra?: string } }).data.name === "Newest", "Only valid records are sent, last version wins");
  check(!(sent?.p_upserts[0] as unknown as { data: { extra?: string } }).data.extra, "Unknown fields are stripped");
  check(sent?.p_deletes.length === 1 && sent.p_deletes[0].id === "tsk-9", "A record that is also being saved is not deleted, and settings can't be deleted");
  check(r.ok && r.usage.records === 3 && r.usage.quotaBytes === 5242880, "The reply carries current storage use");

  r = await persistChanges(f.client, "u1", { upserts: "nope", deletes: [] });
  check(!r.ok && r.code === "failed", "Garbage input is refused");
  r = await persistChanges(f.client, "u1", { upserts: Array.from({ length: 101 }, (_, i) => ({ kind: "contact", id: `c${i}`, data: goodContact })), deletes: [] });
  check(!r.ok, "More than 100 changes in one request are refused");

  f = fake({ message: "Workspace storage limit reached", code: "P0001" });
  r = await persistChanges(f.client, "u1", { upserts: [{ kind: "contact", id: "ctc-1", data: goodContact }], deletes: [] });
  check(!r.ok && r.code === "quota", "A full workspace is reported as such");
  f = fake({ message: 'new row violates row-level security policy for table "workspace_records"', code: "42501" });
  r = await persistChanges(f.client, "u1", { upserts: [{ kind: "contact", id: "ctc-1", data: goodContact }], deletes: [] });
  check(!r.ok && r.code === "inactive", "A deactivated account is reported as such");
  const quiet = console.error;
  console.error = () => {};
  f = fake({ message: "connection reset" });
  r = await persistChanges(f.client, "u1", { upserts: [{ kind: "contact", id: "ctc-1", data: goodContact }], deletes: [] });
  console.error = quiet;
  check(!r.ok && r.code === "failed", "Anything else is a retryable failure");
}

/* ------------------------------------------------------------ 5. Database -- */

section("Database (real Supabase, throwaway members)");
const env = (k: string) => process.env[k]?.trim();
if (!env("SUPABASE_URL") || !env("SUPABASE_PUBLISHABLE_KEY") || !env("SUPABASE_SECRET_KEY") || !env("SUPABASE_DB_URL")) {
  console.log("  – skipped: set the SUPABASE_* values in .env.local to run this part");
} else {
  const url = new URL(env("SUPABASE_URL")!).origin;
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, env("SUPABASE_SECRET_KEY")!, opts);
  const sql = postgres(env("SUPABASE_DB_URL")!, { ssl: "require", max: 1, prepare: false, onnotice: () => {} });
  const created: string[] = [];

  async function makeUser(label: string) {
    const email = `ws-${label}-${randomBytes(3).toString("hex")}@theorbitechsolution.com`;
    const password = randomBytes(18).toString("base64url");
    const made = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: {} });
    if (made.error) throw made.error;
    created.push(made.data.user.id);
    const client = createClient(url, env("SUPABASE_PUBLISHABLE_KEY")!, opts);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    return { id: made.data.user.id, email, client };
  }

  try {
    const a = await makeUser("a");
    const b = await makeUser("b");
    const boss = await makeUser("admin");
    await sql`update public.profiles set role = 'admin', full_name = 'Test Admin' where id = ${boss.id}`;
    const memberSelf = selfMember({ fullName: "Test Member", email: a.email });

    // The real path: store -> change feed -> save queue -> save endpoint -> database
    const states: SyncState[] = [];
    const queue = createSyncQueue({
      save: (changes) => persistChanges(a.client, a.id, changes),
      onState: (s) => states.push(s),
      debounceMs: 20,
      batchSize: 100,
    });
    const store = createStore(createInitialState(emptyData(memberSelf)), (prev, next) => {
      const changes = diffData(prev.data, next.data);
      if (prev.readNotifications !== next.readNotifications) changes.upserts.push(readRecord(next.readNotifications));
      if (changes.upserts.length || changes.deletes.length) queue.add(changes);
    });
    runSession(createActions(store, workspaceConfig));
    await queue.flush();
    await sleep(100);
    await queue.flush();
    const last = states.at(-1)!;
    check(last.status === "saved" && last.pending === 0 && !last.error, "A session saves cleanly end to end", JSON.stringify(last));

    const rows = await fetchAllRecords(a.client, a.id);
    const loaded = rowsToWorkspace(rows, memberSelf);
    check(loaded.skipped === 0, "Nothing stored is unreadable");
    sameWorkspace("Signing in again shows exactly what they left", loaded, store.getState());

    const [usage] = await sql`select records, bytes::int as bytes, last_write_at from public.workspace_usage where owner_id = ${a.id}`;
    check(usage.records === rows.length && last.usage?.records === rows.length && last.usage?.bytes === usage.bytes, `Storage use is tracked (${usage.records} records, ${usage.bytes} bytes)`);
    check(!!usage.last_write_at, "The last save time is recorded");

    const other = await fetchAllRecords(b.client, a.id);
    check(other.length === 0, "Another member cannot read any of it");

    const rpc = await boss.client.rpc("workspace_usage_breakdown", { p_owner: a.id });
    const rowsByKind = (rpc.data ?? []) as { kind: string; records: number; bytes: number }[];
    check(!rpc.error && rowsByKind.reduce((n, r) => n + Number(r.bytes), 0) === usage.bytes && rowsByKind.reduce((n, r) => n + Number(r.records), 0) === usage.records, "An admin sees per-module sizes that add up to the total", rpc.error?.message);
    check(!JSON.stringify(rpc.data).includes("Lovelace"), "...and none of the contents");
    const peek = await b.client.rpc("workspace_usage_breakdown", { p_owner: a.id });
    check(!peek.error && (peek.data ?? []).length === 0, "A member asking for someone's breakdown gets nothing");
    const adminView = await boss.client.from("workspace_usage").select("owner_id, bytes").eq("owner_id", a.id);
    check(adminView.data?.length === 1, "An admin can list a member's usage");
    const adminRows = await boss.client.from("workspace_records").select("id").eq("owner_id", a.id).limit(1);
    check((adminRows.data ?? []).length === 0, "An admin cannot read a member's records");

    // Paging: more than one page of records
    const big = await makeUser("big");
    const bigSelf = selfMember({ fullName: "Big Member", email: big.email });
    const bigQueue = createSyncQueue({ save: (c) => persistChanges(big.client, big.id, c), onState: () => {}, debounceMs: 10, batchSize: 100 });
    const bigStore = createStore(createInitialState(emptyData(bigSelf)), (p, n) => {
      const c = diffData(p.data, n.data);
      if (c.upserts.length) bigQueue.add(c);
    });
    const bigActions = createActions(bigStore, workspaceConfig);
    for (let i = 0; i < 1100; i++) must(bigActions.addContact({ name: `Person ${i}`, company: `Co ${i}`, email: `p${i}@example.com`, phone: "", jobTitle: "", stage: "new", dealValue: i, followUpDate: null, ownerId: SELF_ID, source: "", notes: "" }));
    await bigQueue.flush();
    await sleep(100);
    await bigQueue.flush();
    const bigRows = await fetchAllRecords(big.client, big.id);
    check(bigRows.filter((r) => r.kind === "contact").length === 1100, `More than one page loads in full (${bigRows.filter((r) => r.kind === "contact").length} contacts)`);

    // Limits, as the save endpoint reports them
    await sql`update public.profiles set storage_quota_bytes = ${usage.bytes + 300} where id = ${a.id}`;
    const tooMuch = await persistChanges(a.client, a.id, {
      upserts: [{ kind: "contact", id: "ctc-over", data: { id: "ctc-over", name: "Over", company: "", email: "", phone: "", jobTitle: "", stage: "new", dealValue: 0, lastContact: "2026-10-29", followUpDate: null, ownerId: SELF_ID, source: "", notes: randomBytes(500).toString("base64"), createdAt: "2026-10-29" } }],
      deletes: [],
    });
    check(!tooMuch.ok && tooMuch.code === "quota", "Past their storage limit, a save is refused with a clear reason");
    check((await fetchAllRecords(a.client, a.id)).length === rows.length, "...and nothing is half-saved");

    await sql`update public.profiles set deactivated_at = now() where id = ${a.id}`;
    const afterDeactivate = await persistChanges(a.client, a.id, { upserts: [{ kind: "contact", id: "ctc-late", data: goodContactFor() }], deletes: [] });
    check(!afterDeactivate.ok && afterDeactivate.code === "inactive", "A deactivated member's save is refused at once, even mid-session");
    check((await fetchAllRecords(a.client, a.id)).length === 0, "...and they can no longer read their data");
    await sql`update public.profiles set deactivated_at = null where id = ${a.id}`;
    check((await fetchAllRecords(a.client, a.id)).length === rows.length, "Reactivating restores access to everything, untouched");

    const before = await sql`select count(*)::int as n from public.workspace_records where owner_id = ${a.id}`;
    await admin.auth.admin.deleteUser(a.id);
    created.splice(created.indexOf(a.id), 1);
    const gone = await sql`select (select count(*)::int from public.workspace_records where owner_id = ${a.id}) as records, (select count(*)::int from public.workspace_usage where owner_id = ${a.id}) as usage`;
    check(before[0].n > 0 && gone[0].records === 0 && gone[0].usage === 0, "Deleting a member deletes their data and usage with them");
  } catch (e) {
    check(false, "Database checks ran to the end", e instanceof Error ? e.stack ?? e.message : String(e));
  } finally {
    for (const id of created) await admin.auth.admin.deleteUser(id);
    const left = created.length ? await sql`select count(*)::int as n from public.workspace_records where owner_id = any(${created})` : [{ n: 0 }];
    console.log(`  – removed ${created.length} throwaway member(s); ${left[0].n} of their records remain`);
    await sql.end();
  }
}

function goodContactFor() {
  return { id: "ctc-late", name: "A", company: "B", email: "a@b.c", phone: "", jobTitle: "", stage: "new", dealValue: 0, lastContact: "2026-10-29", followUpDate: null, ownerId: SELF_ID, source: "", notes: "", createdAt: "2026-10-29" };
}

console.log(failures ? `\n✖ ${failures} check(s) failed.\n` : "\n✔ Workspaces behave as designed.\n");
process.exit(failures ? 1 : 0);
