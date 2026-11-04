// Access self-test:  npm run test:access   (with the app running; ACCESS_BASE_URL overrides http://localhost:3000,
// and set ACCESS_BUILD=production when it points at `npm start`)
//
// Drives the real running app over HTTP as each kind of user, with throwaway accounts
// that are deleted afterwards. It follows redirects by hand, so a loop fails the test,
// and it calls Server Actions directly, as an attacker could, so it proves the server
// refuses what the screens merely hide.
//
//   1. Visitors       public pages, what is closed to them, security headers
//   2. New member     temporary password -> own password -> workspace, with no loops
//   3. Members        every screen opens; admin areas are closed; saving reaches the database
//   4. Admins         manage members only; can't touch the website or a super admin
//   5. Super admins   full user CRUD, and website edits that reach the public pages
//   6. Forms          contact and access requests arrive in the inbox; rate limit; bots
//   7. Dead sessions  deactivated and deleted accounts end up somewhere sensible
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

let failures = 0;
function check(cond: unknown, label: string, detail = "") {
  console.log(`  ${cond ? "✔" : "✖"} ${label}${!cond && detail ? ` -> ${detail}` : ""}`);
  if (!cond) failures++;
  return !!cond;
}
const section = (title: string) => console.log(`\n${title}`);

const BASE = (process.env.ACCESS_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const env = (k: string) => process.env[k]?.trim() ?? "";
for (const key of ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_DB_URL"]) {
  if (!env(key)) {
    console.error(`Missing ${key}; this test needs .env.local.`);
    process.exit(1);
  }
}
try {
  await fetch(BASE, { method: "HEAD" });
} catch {
  console.error(`Nothing is answering at ${BASE}. Start the app first (npm run dev), or set ACCESS_BASE_URL.`);
  process.exit(1);
}

const admin = createClient(new URL(env("SUPABASE_URL")).origin, env("SUPABASE_SECRET_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
const sql = postgres(env("SUPABASE_DB_URL"), { ssl: "require", max: 1, prepare: false, onnotice: () => {} });

/* ---------------------------------------------------------- A small browser -- */

type Page = { status: number; url: string; html: string; chain: string[]; loop: boolean };

/** A cookie jar and a redirect follower. Also follows the meta refresh Next.js uses for a redirect inside a stream. */
class Browser {
  cookies = new Map<string, string>();

  private cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private remember(response: Response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = !value || attrs.some((a) => /max-age=0/i.test(a) || /expires=thu, 01 jan 1970/i.test(a));
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async raw(path: string, init: RequestInit = {}) {
    const response = await fetch(new URL(path, BASE), { redirect: "manual", ...init, headers: { cookie: this.cookieHeader(), origin: BASE, ...(init.headers as Record<string, string>) } });
    this.remember(response);
    return response;
  }

  /** Follows redirects from a response until a page settles. Visiting a URL twice counts as a loop. */
  async settle(first: Response, from: string): Promise<Page> {
    const chain = [from];
    let response = first;
    for (let hop = 0; hop < 10; hop++) {
      const location = response.headers.get("location");
      const html = location ? "" : await response.text();
      const meta = html.match(/<meta[^>]*http-equiv="refresh"[^>]*content="\d+;\s*url=([^"]+)"/i)?.[1];
      const next = location ?? (meta ? meta.replace(/&amp;/g, "&") : null);
      if (!next) return { status: response.status, url: chain.at(-1)!, html, chain, loop: false };
      const target = new URL(next, BASE);
      const path = target.pathname + target.search;
      if (chain.includes(path)) return { status: response.status, url: path, html, chain: [...chain, path], loop: true };
      chain.push(path);
      response = await this.raw(path);
    }
    return { status: 0, url: chain.at(-1)!, html: "", chain, loop: true };
  }

  async visit(path: string) {
    return this.settle(await this.raw(path), path);
  }

  /** Submits a form the way a browser without JavaScript does: the page's own hidden action fields, plus the given values. */
  async submitForm(path: string, formLabel: string, values: Record<string, string>) {
    const page = await this.visit(path);
    const form = page.html.match(new RegExp(`<form[^>]*aria-label="${formLabel}"[^>]*>([\\s\\S]*?)</form>`))?.[1];
    if (!form) throw new Error(`No form "${formLabel}" on ${page.url}`);
    const body = new FormData();
    for (const input of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
      const name = input[0].match(/name="([^"]+)"/)?.[1];
      const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
      if (name) body.append(name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'"));
    }
    for (const [name, value] of Object.entries(values)) body.append(name, value);
    return this.settle(await this.raw(page.url, { method: "POST", body }), page.url);
  }

  async signIn(email: string, password: string, next = "") {
    return this.submitForm(`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`, "Sign in", { email, password });
  }

  /** Calls a Server Action directly, as any client could. `args` is what the screen would pass. */
  async action(page: string, file: string, name: string, args: unknown[], formValues?: Record<string, string>) {
    const id = actionId(file, name);
    if (!id) throw new Error(`Server Action ${name} isn't built yet`);
    const headers: Record<string, string> = { accept: "text/x-component", "next-action": id };
    let body: BodyInit;
    if (formValues) {
      const data = new FormData();
      for (const [k, v] of Object.entries(formValues)) data.append(`_1_${k}`, v);
      data.append("0", JSON.stringify([...args.map((a) => (a === undefined ? "$undefined" : a)), "$K1"]));
      body = data;
    } else {
      headers["content-type"] = "text/plain;charset=UTF-8";
      body = JSON.stringify(args.map((a) => (a === undefined ? "$undefined" : a)));
    }
    const response = await this.raw(page, { method: "POST", headers, body });
    const text = await response.text();
    return { status: response.status, redirect: response.headers.get("x-action-redirect"), result: actionResult(text), text };
  }
}

/** The manifest maps each action to its id, per build. Pages must have been opened once in dev for theirs to appear. */
function actionId(file: string, name: string): string | null {
  // ACCESS_BUILD=production when testing `npm start`, whose ids come from the production build.
  for (const dir of process.env.ACCESS_BUILD === "production" ? [".next/server"] : [".next/dev/server", ".next/server"]) {
    const path = `${dir}/server-reference-manifest.json`;
    if (!existsSync(path)) continue;
    const manifest = JSON.parse(readFileSync(path, "utf8")) as { node: Record<string, { exportedName?: string; filename?: string }> };
    const found = Object.entries(manifest.node).find(([, v]) => v.exportedName === name && v.filename === file);
    if (found) return found[0];
  }
  return null;
}

/** Pulls the action's return value out of the response stream. */
function actionResult(text: string): Record<string, unknown> | null {
  const rows = new Map(text.split("\n").map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1)]));
  try {
    const ref = (JSON.parse(rows.get("0") ?? "{}") as { a?: string }).a;
    const key = ref?.match(/^\$@?([0-9a-f]+)$/)?.[1];
    return key ? (JSON.parse(rows.get(key) ?? "null") as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- Throwaways -- */

const created: string[] = [];
const tag = randomBytes(3).toString("hex");
const emailFor = (label: string) => `access-${label}-${tag}@theorbitechsolution.com`;

async function makeUser(label: string, role: "member" | "admin" | "super_admin", { temporary = false } = {}) {
  const email = emailFor(label);
  const password = `Check-${randomBytes(12).toString("base64url")}9a`;
  const made = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { created_by_admin: true } });
  if (made.error) throw made.error;
  created.push(made.data.user.id);
  await sql`update public.profiles set role = ${role}, full_name = ${`${label} check`}, must_change_password = ${temporary} where id = ${made.data.user.id}`;
  return { id: made.data.user.id, email, password };
}

const USERS_FILE = "lib/auth/user-actions.ts";
const SITE_FILE = "lib/content/actions.ts";
const FORMS_FILE = "lib/marketing/actions.ts";
const INBOX_FILE = "lib/marketing/inbox-actions.ts";
const SAVE_FILE = "lib/workspace/actions.ts";

const WORKSPACE_SCREENS = ["", "/analytics", "/copilot", "/crm", "/finance", "/inventory", "/orders", "/projects", "/sales", "/settings", "/team"];

const originalBrand = await sql`select data from public.site_content where key = 'brand'`;
const modulesAtStart = await sql`select data from public.site_content where key = 'modules'`;

try {
  /* -------------------------------------------------------------- Visitors -- */

  section("Visitors");
  const visitor = new Browser();
  for (const path of ["/", "/pricing", "/resources", "/contact", "/waitlist", "/privacy", "/terms", "/industries", "/industries/retail", "/product/crm", "/solutions/grow-sales", "/demo", "/demo/crm", "/sign-in"]) {
    const page = await visitor.visit(path);
    check(page.status === 200 && !page.loop, `${path} opens`, `status ${page.status}, chain ${page.chain.join(" > ")}`);
  }
  // A streamed page has already sent its status, so Next.js marks these noindex instead of a 404 (see its notFound docs).
  const unknownPage = await visitor.visit("/product/does-not-exist");
  check(unknownPage.status < 500 && unknownPage.html.includes("drifted out of orbit") && unknownPage.html.includes('name="robots" content="noindex"'), "An unknown address shows the not-found page, and tells search engines to skip it", `status ${unknownPage.status}`);

  for (const path of ["/workspace", "/workspace/crm", "/workspace/settings", "/workspace/settings/users", "/workspace/settings/inbox", "/workspace/settings/website", "/account/password"]) {
    const page = await visitor.visit(path);
    check(page.url.startsWith("/sign-in") && !page.loop, `${path} sends a visitor to sign in`, page.chain.join(" > "));
  }

  const home = await visitor.raw("/");
  const csp = home.headers.get("content-security-policy") ?? "";
  check(csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), "Pages carry a content security policy");
  check(!!home.headers.get("strict-transport-security") && home.headers.get("x-frame-options") === "DENY" && home.headers.get("x-content-type-options") === "nosniff", "...and the other security headers");
  check(!home.headers.get("x-powered-by"), "The server doesn't advertise what it runs on");
  const homeHtml = await home.text();
  check(!/sb_secret_|sb_publishable_/.test(homeHtml), "No Supabase keys reach the browser");

  const wrong = await visitor.signIn("nobody@theorbitechsolution.com", "not-a-real-password-1");
  check(wrong.html.includes("Email or password is incorrect"), "A wrong password gets one message that doesn't reveal whether the account exists");

  /* ------------------------------------------------------------ New member -- */

  section("A new member");
  const newcomer = await makeUser("newcomer", "member", { temporary: true });
  const nb = new Browser();
  const firstIn = await nb.signIn(newcomer.email, newcomer.password);
  check(firstIn.url === "/account/password" && !firstIn.loop && firstIn.html.includes("temporary password"), "Signing in with a temporary password leads straight to choosing a new one", firstIn.chain.join(" > "));

  for (const path of ["/workspace", "/workspace/crm", "/workspace/settings"]) {
    const bounced = await nb.visit(path);
    check(bounced.url === "/account/password" && !bounced.loop, `${path} waits until the password is replaced`, bounced.chain.join(" > "));
  }

  const NEW_PASSWORD = `Own-${randomBytes(10).toString("base64url")}7x`;
  const badCurrent = await nb.submitForm("/account/password", "Change password", { currentPassword: "wrong-password-1", newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
  check(badCurrent.html.includes("Current password is incorrect"), "A wrong current password is refused");
  const mismatch = await nb.submitForm("/account/password", "Change password", { currentPassword: newcomer.password, newPassword: NEW_PASSWORD, confirmPassword: `${NEW_PASSWORD}x` });
  check(mismatch.html.includes("match"), "A mistyped confirmation is refused");
  const weak = await nb.submitForm("/account/password", "Change password", { currentPassword: newcomer.password, newPassword: "short1", confirmPassword: "short1" });
  check(weak.html.includes("at least 12"), "A short password is refused");

  const changed = await nb.submitForm("/account/password", "Change password", { currentPassword: newcomer.password, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
  check(changed.url.includes("done=1") && changed.html.includes("Your password was updated") && !changed.loop, "Choosing a password succeeds", changed.chain.join(" > "));
  const [flag] = await sql`select must_change_password from public.profiles where id = ${newcomer.id}`;
  check(flag.must_change_password === false, "...and the temporary flag is cleared");

  const arrived = await nb.visit("/workspace");
  check(arrived.url === "/workspace" && arrived.status === 200 && !arrived.loop && arrived.html.includes("Your workspace"), "The member reaches their workspace, with no loop back to the password page", arrived.chain.join(" > "));

  const again = new Browser();
  const secondIn = await again.signIn(newcomer.email, NEW_PASSWORD, "/workspace/crm");
  check(secondIn.url === "/workspace/crm" && !secondIn.loop, "Next time they sign in with their own password and land where they were going", secondIn.chain.join(" > "));
  const offsite = new Browser();
  const notEvil = await offsite.signIn(newcomer.email, NEW_PASSWORD, "https://evil.example/");
  check(notEvil.url === "/workspace", "A malicious ?next= link can't send them to another site", notEvil.chain.join(" > "));
  const notEvil2 = new Browser();
  check((await notEvil2.signIn(newcomer.email, NEW_PASSWORD, "//evil.example")).url === "/workspace", "...in either form");

  /* --------------------------------------------------------------- Members -- */

  section("Members");
  for (const screen of WORKSPACE_SCREENS) {
    const page = await nb.visit(`/workspace${screen}`);
    check(page.status === 200 && !page.loop && page.url === `/workspace${screen}`, `/workspace${screen || "/"} opens`, page.chain.join(" > "));
  }
  for (const path of ["/workspace/settings/users", "/workspace/settings/inbox", "/workspace/settings/website"]) {
    const page = await nb.visit(path);
    check(page.url === "/workspace/settings" && !page.loop, `${path} is closed to a member`, page.chain.join(" > "));
  }

  await nb.visit("/workspace/settings");
  const contact = { id: "ctc-accesscheck", name: "Ada Check", company: "Check Co", email: "ada@example.com", phone: "", jobTitle: "", stage: "new", dealValue: 100, lastContact: "2026-11-04", followUpDate: null, ownerId: "tm-self", source: "Manual entry", notes: "", createdAt: "2026-11-04" };
  const saved = await nb.action("/workspace", SAVE_FILE, "saveWorkspaceChanges", [{ upserts: [{ kind: "contact", id: contact.id, data: contact }], deletes: [] }]);
  check(saved.result?.ok === true, "A member's change is saved through the real endpoint", saved.text.slice(0, 200));
  check((await nb.visit("/workspace/crm")).html.includes("Ada Check"), "...and is there when they come back");
  const edited = await nb.action("/workspace", SAVE_FILE, "saveWorkspaceChanges", [{ upserts: [{ kind: "contact", id: contact.id, data: { ...contact, name: "Ada Renamed" } }], deletes: [] }]);
  check(edited.result?.ok === true && (await nb.visit("/workspace/crm")).html.includes("Ada Renamed"), "An edit is saved too");
  const removed = await nb.action("/workspace", SAVE_FILE, "saveWorkspaceChanges", [{ upserts: [], deletes: [{ kind: "contact", id: contact.id }] }]);
  check(removed.result?.ok === true && !(await nb.visit("/workspace/crm")).html.includes("Ada Renamed"), "A delete is saved too");
  const signedOutSave = await new Browser().action("/workspace", SAVE_FILE, "saveWorkspaceChanges", [{ upserts: [], deletes: [] }]);
  check(signedOutSave.status === 307 || signedOutSave.result?.ok !== true, "Saving is refused to anyone signed out");

  const nameChanged = await nb.action("/workspace/settings", "lib/auth/actions.ts", "updateOwnName", [undefined], { fullName: "Newcomer Renamed" });
  check(nameChanged.result?.ok === true, "A member can correct their own name", nameChanged.text.slice(0, 200));
  const [renamed] = await sql`select full_name from public.profiles where id = ${newcomer.id}`;
  check(renamed.full_name === "Newcomer Renamed", "...and it reaches the database");
  check((await nb.visit("/workspace/settings")).html.includes("Newcomer Renamed"), "...and shows in their workspace");

  // What a member can't do, even by calling the actions directly.
  const stranger = await makeUser("stranger", "member");
  const memberAdd = await nb.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Sneaky", email: emailFor("sneaky"), role: "super_admin" });
  check(memberAdd.result?.ok === false, "A member can't add users, even by calling the action directly", memberAdd.text.slice(0, 200));
  const [sneaky] = await sql`select count(*)::int as n from auth.users where email = ${emailFor("sneaky")}`;
  check(sneaky.n === 0, "...and no account was created");
  const memberDelete = await nb.action("/workspace/settings/users", USERS_FILE, "deleteUser", [stranger.id]);
  check(memberDelete.result?.ok === false, "A member can't delete another user");
  const memberRole = await nb.action("/workspace/settings/users", USERS_FILE, "changeUserRole", [newcomer.id, undefined], { role: "super_admin" });
  check(memberRole.result?.ok === false, "A member can't promote themselves");
  const memberSite = await nb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["pricing", { hacked: true }]);
  check(memberSite.result?.ok === false, "A member can't edit the website");
  const memberInbox = await nb.action("/workspace/settings/inbox", INBOX_FILE, "deleteSubmission", ["00000000-0000-4000-8000-000000000000"]);
  check(memberInbox.result?.ok === false, "A member can't touch the inbox");

  /* ---------------------------------------------------------------- Admins -- */

  section("Admins");
  const boss = await makeUser("admin", "admin");
  const ab = new Browser();
  check((await ab.signIn(boss.email, boss.password)).url === "/workspace", "An admin signs in to their own workspace");
  const usersPage = await ab.visit("/workspace/settings/users");
  check(usersPage.status === 200 && !usersPage.loop && usersPage.html.includes("Users &amp; access") && usersPage.html.includes(stranger.email), "They can open Users & access and see the accounts", usersPage.chain.join(" > "));
  check(!usersPage.html.includes("Recent admin activity"), "They don't see the audit log");
  const inboxPage = await ab.visit("/workspace/settings/inbox");
  check(inboxPage.status === 200 && inboxPage.url === "/workspace/settings/inbox", "They can open the Inbox");
  check((await ab.visit("/workspace/settings/website")).url === "/workspace/settings", "The Website editor is closed to them");

  const adminAddsAdmin = await ab.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Too High", email: emailFor("toohigh"), role: "admin" });
  check(adminAddsAdmin.result?.ok === false, "An admin can't add another admin");
  const adminAddsMember = await ab.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Added By Admin", email: emailFor("added"), role: "member" });
  check(adminAddsMember.result?.ok === true && typeof adminAddsMember.result.tempPassword === "string", "An admin can add a member, who gets a temporary password", adminAddsMember.text.slice(0, 200));
  const [addedRow] = await sql`select p.id, p.role, p.must_change_password, p.full_name from public.profiles p where p.email = ${emailFor("added")}`;
  if (addedRow) created.push(addedRow.id);
  check(addedRow?.role === "member" && addedRow?.must_change_password === true && addedRow?.full_name === "Added By Admin", "...with the right role and the flag set");
  const duplicate = await ab.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Twin", email: emailFor("added"), role: "member" });
  check(duplicate.result?.ok === false && JSON.stringify(duplicate.result).includes("already exists"), "Adding the same email twice says so plainly");
  const badEmail = await ab.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "", email: "not-an-email", role: "member" });
  check(badEmail.result?.ok === false && JSON.stringify(badEmail.result).includes("Enter a valid email"), "A bad form comes back with field errors");

  const adminEdits = await ab.action("/workspace/settings/users", USERS_FILE, "updateUserDetails", [addedRow.id, undefined], { fullName: "Renamed By Admin", email: emailFor("added2") });
  check(adminEdits.result?.ok === true, "An admin can edit a member's name and email", adminEdits.text.slice(0, 200));
  const [editedRow] = await sql`select p.full_name, p.email, u.email as auth_email from public.profiles p join auth.users u on u.id = p.id where p.id = ${addedRow.id}`;
  check(editedRow.full_name === "Renamed By Admin" && editedRow.email === emailFor("added2") && editedRow.auth_email === emailFor("added2"), "...and both the profile and the sign-in change");
  const newSignIn = new Browser();
  const tempPassword = String(adminAddsMember.result?.tempPassword);
  check((await newSignIn.signIn(emailFor("added2"), tempPassword)).url === "/account/password", "They sign in with the new email and the temporary password");

  const adminDeactivates = await ab.action("/workspace/settings/users", USERS_FILE, "setUserActive", [addedRow.id, false]);
  check(adminDeactivates.result?.ok === true, "An admin can deactivate a member");
  const adminReactivates = await ab.action("/workspace/settings/users", USERS_FILE, "setUserActive", [addedRow.id, true]);
  check(adminReactivates.result?.ok === true, "...and reactivate them");
  const adminDeletes = await ab.action("/workspace/settings/users", USERS_FILE, "deleteUser", [addedRow.id]);
  check(adminDeletes.result?.ok === true, "...and delete them");
  const [gone] = await sql`select count(*)::int as n from auth.users where id = ${addedRow.id}`;
  check(gone.n === 0, "...and they are gone");
  created.splice(created.indexOf(addedRow.id), 1);

  const chief = await makeUser("super", "super_admin");
  for (const [name, args, form] of [
    ["updateUserDetails", [chief.id, undefined], { fullName: "Hacked", email: chief.email }],
    ["setUserActive", [chief.id, false], undefined],
    ["deleteUser", [chief.id], undefined],
    ["changeUserRole", [chief.id, undefined], { role: "member" }],
    ["resetUserPassword", [chief.id], undefined],
  ] as const) {
    const result = await ab.action("/workspace/settings/users", USERS_FILE, name, [...args], form);
    check(result.result?.ok === false, `An admin can't ${name} on a super admin`, result.text.slice(0, 200));
  }
  for (const [name, args, form] of [
    ["changeUserRole", [stranger.id, undefined], { role: "admin" }],
    ["resetUserPassword", [stranger.id], undefined],
    ["setStorageLimit", [stranger.id, undefined], { megabytes: "1" }],
  ] as const) {
    const result = await ab.action("/workspace/settings/users", USERS_FILE, name, [...args], form);
    check(result.result?.ok === false, `An admin can't ${name}, even on a member`);
  }
  const adminSite = await ab.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["brand", { hacked: true }]);
  check(adminSite.result?.ok === false, "An admin can't edit the website");

  const tempAdmin = await makeUser("tempadmin", "admin", { temporary: true });
  const tb = new Browser();
  check((await tb.signIn(tempAdmin.email, tempAdmin.password)).url === "/account/password", "An admin on a temporary password has to replace it first");
  check((await tb.visit("/workspace/settings/users")).url === "/account/password", "...before they can open admin screens");
  const tempAdd = await tb.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Via Temp", email: emailFor("viatemp"), role: "member" });
  check(tempAdd.result?.ok === false, "...or call admin actions directly");

  /* ---------------------------------------------------------- Super admins -- */

  section("Super admins");
  const sb = new Browser();
  check((await sb.signIn(chief.email, chief.password)).url === "/workspace", "A super admin signs in");
  const allUsers = await sb.visit("/workspace/settings/users");
  check(allUsers.status === 200 && allUsers.html.includes("Recent admin activity"), "They see the audit log");
  const editor = await sb.visit("/workspace/settings/website");
  check(editor.status === 200 && !editor.loop && editor.url === "/workspace/settings/website" && editor.html.includes("Navigation") && editor.html.includes("Pricing"), "They can open the Website editor", editor.chain.join(" > "));
  check((await sb.visit("/workspace/settings/inbox")).status === 200, "They can open the Inbox");

  const added = await sb.action("/workspace/settings/users", USERS_FILE, "addUser", [undefined], { fullName: "Second Chief", email: emailFor("chief2"), role: "admin" });
  check(added.result?.ok === true, "They can add an admin", added.text.slice(0, 200));
  const [chief2] = await sql`select id from public.profiles where email = ${emailFor("chief2")}`;
  if (chief2) created.push(chief2.id);
  const promote = await sb.action("/workspace/settings/users", USERS_FILE, "changeUserRole", [chief2.id, undefined], { role: "member" });
  check(promote.result?.ok === true, "They can change a role");
  const quota = await sb.action("/workspace/settings/users", USERS_FILE, "setStorageLimit", [chief2.id, undefined], { megabytes: "5" });
  const [quotaRow] = await sql`select storage_quota_bytes::bigint as q from public.profiles where id = ${chief2.id}`;
  check(quota.result?.ok === true && Number(quotaRow.q) === 5 * 1024 * 1024, "They can set a storage limit");
  const reset = await sb.action("/workspace/settings/users", USERS_FILE, "resetUserPassword", [chief2.id]);
  check(reset.result?.ok === true && typeof reset.result.tempPassword === "string", "They can reset a password");
  const [resetRow] = await sql`select must_change_password from public.profiles where id = ${chief2.id}`;
  check(resetRow.must_change_password === true, "...which forces a new one at next sign-in");
  const self = await sb.action("/workspace/settings/users", USERS_FILE, "deleteUser", [chief.id]);
  check(self.result?.ok === false, "They can't delete themselves here");

  const audit = await sql`select action from public.audit_log where actor_email = ${chief.email}`;
  check(["user.created", "user.role_changed", "user.storage_limit_changed", "user.password_reset"].every((a) => audit.some((r) => r.action === a)), "Everything they did is in the audit log");

  // Editing the website, end to end.
  const before = await visitor.visit("/pricing");
  check(before.html.includes("Simple plans") || before.status === 200, "The pricing page is up before the edit");
  const brandName = `Orbit Check ${tag}`;
  const original = originalBrand[0]?.data ?? { productName: "OrbitOS", company: "The OrbiTech Solution", tagline: "", description: "", footerBlurb: "", copyright: "", footerNote: "", contactEmail: "" };
  const badSave = await sb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["brand", { ...(original as object), productName: "" }]);
  check(badSave.result?.ok === false && JSON.stringify(badSave.result).includes("Product name"), "An invalid edit is refused, with a reason");
  const goodSave = await sb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["brand", { ...(original as object), productName: brandName }]);
  check(goodSave.result?.ok === true, "A valid edit saves", goodSave.text.slice(0, 300));
  const afterSave = await visitor.visit("/pricing");
  check(afterSave.html.includes(brandName), "...and a visitor sees it straight away");
  const auditSite = await sql`select count(*)::int as n from public.audit_log where actor_email = ${chief.email} and action = 'site.content_updated'`;
  check(auditSite[0].n >= 1, "...and it is in the audit log");
  const resetSite = await sb.action("/workspace/settings/website", SITE_FILE, "resetSiteSection", ["brand"]);
  check(resetSite.result?.ok === true, "A section can be reset to its default");
  check(!(await visitor.visit("/pricing")).html.includes(brandName), "...and the site follows");

  // Pages that didn't exist when the site was built.
  const newSlug = `check-${tag}`;
  const originalModules = await sql`select data from public.site_content where key = 'modules'`;
  const listed = (originalModules[0]?.data ?? (await sb.action("/workspace/settings/website", SITE_FILE, "resetSiteSection", ["modules"])).result?.data) as object[];
  const newModule = { slug: newSlug, name: `Module ${tag}`, tagline: "Added after the build", icon: "sparkles", problem: "", functionality: ["It works"], benefit: "", availability: "Planned", demoHref: "", note: "", visible: true };
  const addedModule = await sb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["modules", [...listed, newModule]]);
  check(addedModule.result?.ok === true, "A super admin can add a new module", addedModule.text.slice(0, 200));
  const newPage = await visitor.visit(`/product/${newSlug}`);
  check(newPage.status === 200 && newPage.html.includes(`Module ${tag}`), "Its page opens straight away, though it didn't exist when the site was built", `status ${newPage.status}`);
  check((await visitor.visit("/")).html.includes(`/product/${newSlug}`), "It appears in the menu and on the homepage");
  const hiddenModule = await sb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["modules", [...listed, { ...newModule, visible: false }]]);
  check(hiddenModule.result?.ok === true, "It can be hidden");
  const hiddenPage = await visitor.visit(`/product/${newSlug}`);
  check(hiddenPage.status === 404 || hiddenPage.html.includes("drifted out of orbit"), "...and its page then says not found", `status ${hiddenPage.status}`);
  check(!(await visitor.visit("/")).html.includes(`/product/${newSlug}`), "...and it leaves the menu");
  if (originalModules[0]) await sb.action("/workspace/settings/website", SITE_FILE, "saveSiteSection", ["modules", originalModules[0].data]);
  else await sb.action("/workspace/settings/website", SITE_FILE, "resetSiteSection", ["modules"]);

  /* ----------------------------------------------------------------- Forms -- */

  section("Website forms");
  const fakeIp = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
  const formEmail = emailFor("visitor");
  const fromVisitor = new Browser();
  const ipHeaders = { "x-forwarded-for": fakeIp };
  const post = async (name: string, page: string, input: unknown) => {
    const id = actionId(FORMS_FILE, name);
    if (!id) throw new Error(`Server Action ${name} isn't built yet`);
    const response = await fromVisitor.raw(page, { method: "POST", headers: { accept: "text/x-component", "next-action": id, "content-type": "text/plain;charset=UTF-8", ...ipHeaders }, body: JSON.stringify([input]) });
    return actionResult(await response.text());
  };

  await fromVisitor.visit("/contact");
  await fromVisitor.visit("/waitlist");
  const contactMessage = { name: "Vera Visitor", email: formEmail, company: "Visit Co", topic: "Pricing", message: "I would like to know more about this." };
  const sent = await post("submitContactForm", "/contact", contactMessage);
  check(sent?.ok === true, "A visitor's message is accepted", JSON.stringify(sent));
  const [row] = await sql`select id, kind, topic, status, ip_hash from public.site_submissions where email = ${formEmail}`;
  check(row?.kind === "contact" && row?.topic === "Pricing" && row?.status === "new", "...and stored");
  check(!!row?.ip_hash && !row.ip_hash.includes(fakeIp), "The network address is stored only as a hash");
  const bad = await post("submitContactForm", "/contact", { ...contactMessage, email: "nope", message: "short" });
  check(bad?.ok === false && JSON.stringify(bad).includes("email"), "An invalid message is refused with field errors");
  const bot = await post("submitContactForm", "/contact", { ...contactMessage, website: "http://spam.example" });
  check(bot?.ok === true, "A bot that fills the hidden field is told it worked");
  const [counted] = await sql`select count(*)::int as n from public.site_submissions where email = ${formEmail}`;
  check(counted.n === 1, "...but nothing is stored");
  const access = await post("submitWaitlistForm", "/waitlist", { name: "Vera Visitor", email: formEmail, businessType: "Manufacturing", teamSize: "6–20", interest: "Stock control" });
  check(access?.ok === true, "An access request is accepted", JSON.stringify(access));

  const anonymousRead = await new Browser().visit("/workspace/settings/inbox");
  check(anonymousRead.url.startsWith("/sign-in"), "Visitors can't read the inbox");
  const inboxForAdmin = await ab.visit("/workspace/settings/inbox");
  check(inboxForAdmin.html.includes(formEmail) && inboxForAdmin.html.includes("Stock control"), "An admin sees both in the inbox");
  check(!(await nb.visit("/workspace/settings/inbox")).html.includes(formEmail), "A member doesn't");

  const handled = await ab.action("/workspace/settings/inbox", INBOX_FILE, "setSubmissionHandled", [row.id, true]);
  const [handledRow] = await sql`select status, handled_by from public.site_submissions where id = ${row.id}`;
  check(handled.result?.ok === true && handledRow.status === "handled" && handledRow.handled_by === boss.id, "An admin can mark a message handled");
  const removedMessage = await ab.action("/workspace/settings/inbox", INBOX_FILE, "deleteSubmission", [row.id]);
  const [removedCount] = await sql`select count(*)::int as n from public.site_submissions where id = ${row.id}`;
  check(removedMessage.result?.ok === true && removedCount.n === 0, "...and delete it");

  let limited: Record<string, unknown> | null = null;
  for (let i = 0; i < 6; i++) limited = await post("submitContactForm", "/contact", { ...contactMessage, message: `Message number ${i} from the same place.` });
  check(limited?.ok === false && JSON.stringify(limited).includes("Please try again later"), "Too many messages from one place are refused", JSON.stringify(limited));

  /* ------------------------------------------------------- Password guessing -- */

  section("Password guessing");
  const guesser = await makeUser("guessed", "member");
  const guessFrom = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
  const guess = async (password: string) => {
    const page = await visitor.visit("/sign-in");
    const form = page.html.match(/<form[^>]*aria-label="Sign in"[^>]*>([\s\S]*?)<\/form>/)?.[1] ?? "";
    const body = new FormData();
    for (const input of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
      const name = input[0].match(/name="([^"]+)"/)?.[1];
      if (name) body.append(name, (input[0].match(/value="([^"]*)"/)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    }
    body.append("email", guesser.email);
    body.append("password", password);
    const response = await new Browser().raw("/sign-in", { method: "POST", body, headers: { "x-forwarded-for": guessFrom } });
    return { status: response.status, html: await response.text() };
  };
  let lastGuess = { status: 0, html: "" };
  for (let i = 0; i < 8; i++) lastGuess = await guess(`wrong-guess-${i}`);
  check(lastGuess.html.includes("Email or password is incorrect"), "Wrong guesses are refused normally at first");
  const blocked = await guess("wrong-guess-final");
  check(blocked.html.includes("Too many attempts"), "After too many wrong guesses for an account, further attempts are stopped");
  const blockedRight = await guess(guesser.password);
  check(blockedRight.html.includes("Too many attempts"), "...even with the right password, so guessing can't be finished off");
  const elsewhere = new Browser();
  check((await elsewhere.signIn(guesser.email, guesser.password)).url === "/workspace", "The real person, from another place, isn't locked out");

  /* --------------------------------------------------------- Dead sessions -- */

  section("Sessions that have ended");
  const leaver = await makeUser("leaver", "member");
  const lb = new Browser();
  await lb.signIn(leaver.email, leaver.password);
  check((await lb.visit("/workspace")).url === "/workspace", "A member is working normally");

  const deactivate = await sb.action("/workspace/settings/users", USERS_FILE, "setUserActive", [leaver.id, false]);
  check(deactivate.result?.ok === true, "A super admin deactivates them");
  const shutOut = await lb.visit("/workspace");
  check(shutOut.url === "/account/deactivated" && !shutOut.loop, "Their open session lands on an explanation, with no loop", shutOut.chain.join(" > "));
  const refusedSave = await lb.action("/workspace", SAVE_FILE, "saveWorkspaceChanges", [{ upserts: [], deletes: [] }]);
  check(refusedSave.result?.code === "inactive", "Their saves are refused");
  const banned = await new Browser().signIn(leaver.email, leaver.password);
  check(banned.html.includes("deactivated"), "Signing in again says the account is deactivated");

  const reactivate = await sb.action("/workspace/settings/users", USERS_FILE, "setUserActive", [leaver.id, true]);
  check(reactivate.result?.ok === true && (await lb.visit("/workspace")).url === "/workspace", "Reactivating restores access");

  const signedOut = await lb.submitForm("/account/deactivated", "Sign out", {}).catch(() => null);
  if (!signedOut) {
    const end = await lb.action("/workspace", "lib/auth/actions.ts", "endSession", []);
    check(end.status === 200, "Signing out ends the session");
  }
  const afterOut = await lb.visit("/workspace");
  check(afterOut.url.startsWith("/sign-in") && !afterOut.loop, "Once signed out, the workspace is closed again", afterOut.chain.join(" > "));

  const doomed = await makeUser("doomed", "member");
  const db = new Browser();
  await db.signIn(doomed.email, doomed.password);
  const deleted = await sb.action("/workspace/settings/users", USERS_FILE, "deleteUser", [doomed.id]);
  check(deleted.result?.ok === true, "A super admin deletes an account with a session still open");
  created.splice(created.indexOf(doomed.id), 1);
  const orphan = await db.visit("/workspace");
  check(orphan.url.startsWith("/sign-in") && !orphan.loop, "That session ends on the sign-in page, with no loop", orphan.chain.join(" > "));
} catch (e) {
  check(false, "The checks ran to the end", e instanceof Error ? (e.stack ?? e.message) : String(e));
} finally {
  // Leave everything as it was found.
  if (originalBrand[0]) await sql`insert into public.site_content (key, data) values ('brand', ${sql.json(originalBrand[0].data)}) on conflict (key) do update set data = excluded.data`;
  else await sql`delete from public.site_content where key = 'brand'`;
  if (modulesAtStart[0]) await sql`insert into public.site_content (key, data) values ('modules', ${sql.json(modulesAtStart[0].data)}) on conflict (key) do update set data = excluded.data`;
  else await sql`delete from public.site_content where key = 'modules'`;
  await sql`delete from public.site_submissions where email like ${`access-%-${tag}@theorbitechsolution.com`}`;
  for (const id of created) await admin.auth.admin.deleteUser(id);
  const [left] = await sql`select count(*)::int as n from auth.users where email like ${`access-%-${tag}@theorbitechsolution.com`}`;
  console.log(`\n  – removed ${created.length} throwaway account(s); ${left.n} remain`);
  await sql.end();
}

console.log(failures ? `\n✖ ${failures} check(s) failed.\n` : "\n✔ Every role can do what it should, and nothing more.\n");
process.exit(failures ? 1 : 0);
