// End-to-end connection and security check. Exits non-zero if anything fails.
//
//   1. Configuration   env vars present and plausible
//   2. Database        Postgres reachable, migrations applied
//   3. Hardening       RLS on every public table, anon locked out, role not writable,
//                      last super admin protected, audit log append-only
//   4. APIs            Auth and REST reachable with the publishable key
//   5. Super admin     exists, confirmed, has the role (and can sign in while the
//                      default password is still in place)
//   6. RLS in action   a throwaway user signs in and is checked against the
//                      policies (including promotion and deactivation), then deleted
//
// Guard tests run inside transactions that are always rolled back.
import { randomBytes } from "node:crypto";
import { readdir } from "node:fs/promises";

import { adminClient, bad, connectDb, info, ok, publicClient, readEnv } from "./shared.mjs";

let failures = 0;
const expect = (condition, pass, failMsg = pass) => {
  if (condition) ok(pass);
  else {
    bad(failMsg);
    failures++;
  }
  return condition;
};
const ROLLBACK = Symbol("rollback");
const ms = (start) => `${Math.round(performance.now() - start)} ms`;

console.log("\nOrbitOS · Supabase check\n");

console.log("Configuration");
const env = readEnv("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_DB_URL");
const url = new URL(env.SUPABASE_URL);
expect(url.protocol === "https:", `Project URL ${url.host}`, `SUPABASE_URL must be https (got ${url.protocol})`);
expect(
  env.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") || env.SUPABASE_PUBLISHABLE_KEY.startsWith("eyJ"),
  "Publishable key format",
  "SUPABASE_PUBLISHABLE_KEY should start with sb_publishable_ (or be the legacy anon JWT)",
);
expect(
  env.SUPABASE_SECRET_KEY.startsWith("sb_secret_") || env.SUPABASE_SECRET_KEY.startsWith("eyJ"),
  "Secret key format",
  "SUPABASE_SECRET_KEY should start with sb_secret_ (or be the legacy service_role JWT)",
);
expect(env.SUPABASE_SECRET_KEY !== env.SUPABASE_PUBLISHABLE_KEY, "Secret and publishable keys differ", "Secret key is the same as the publishable key");

const sql = connectDb();
const admin = adminClient();
let tempUserId;

try {
  console.log("\nDatabase");
  let start = performance.now();
  const [{ version }] = await sql`select current_setting('server_version') as version`;
  ok(`Connected to Postgres ${version} (${ms(start)})`);

  const files = (await readdir(new URL("../../supabase/migrations/", import.meta.url))).filter((f) => f.endsWith(".sql"));
  const applied = await sql`
    select version from supabase_migrations.schema_migrations
  `.catch(() => []);
  const appliedSet = new Set(applied.map((r) => r.version));
  const pending = files.filter((f) => !appliedSet.has(f.split("_")[0]));
  expect(pending.length === 0, `All ${files.length} migration(s) applied`, `Pending migrations: ${pending.join(", ")} (run npm run db:migrate)`);

  console.log("\nHardening");
  const unprotected = await sql`
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  `;
  expect(unprotected.length === 0, "Row Level Security enabled on every public table", `RLS disabled on: ${unprotected.map((r) => r.relname).join(", ")}`);

  const [priv] = await sql`
    select
      has_table_privilege('anon', 'public.profiles', 'select, insert, update, delete') as anon_any,
      has_column_privilege('authenticated', 'public.profiles', 'role', 'update') as auth_role,
      has_column_privilege('authenticated', 'public.profiles', 'must_change_password', 'update') as auth_flag,
      has_table_privilege('authenticated', 'public.profiles', 'insert, delete') as auth_insert_delete
  `;
  expect(!priv.anon_any, "Anonymous visitors have no access to profiles", "anon can access public.profiles");
  expect(!priv.auth_role && !priv.auth_flag, "Users cannot change their own role or password flag", "authenticated can update role or must_change_password");
  expect(!priv.auth_insert_delete, "Users cannot insert or delete profiles", "authenticated can insert/delete profiles");

  const triggers = await sql`
    select tgname from pg_trigger
    where tgrelid = 'auth.users'::regclass and tgname in ('on_auth_user_created', 'on_auth_user_updated')
  `;
  expect(triggers.length === 2, "Auth triggers installed (profile creation, password-change tracking)", "Auth triggers missing on auth.users");

  const [auditPriv] = await sql`
    select
      has_table_privilege('anon', 'public.audit_log', 'select, insert, update, delete') as anon_any,
      has_table_privilege('authenticated', 'public.audit_log', 'insert, update, delete') as auth_write
  `;
  expect(!auditPriv.anon_any && !auditPriv.auth_write, "Audit log is closed to visitors and read-only for users", "audit_log privileges are too broad");

  // Runs a statement in a savepoint, then rolls the whole transaction back. Returns its error, if any.
  const refused = async (statement) => {
    let error = null;
    await sql
      .begin(async (tx) => {
        error = await tx.savepoint((sp) => statement(sp)).then(() => null, (e) => e);
        throw ROLLBACK;
      })
      .catch((e) => {
        if (e !== ROLLBACK) throw e;
      });
    return error;
  };

  const demote = await refused((tx) => tx`update public.profiles set role = 'member' where role = 'super_admin'`);
  expect(
    demote?.message?.includes("at least one active super admin"),
    "The last active super admin cannot be demoted or removed",
    `Last super admin guard did not fire: ${demote?.message ?? "update was allowed (rolled back)"}`,
  );

  const tamper = await refused(async (tx) => {
    const [row] = await tx`
      insert into public.audit_log (actor_id, actor_email, action)
      values (gen_random_uuid(), 'db-check', 'db.check') returning id
    `;
    await tx`update public.audit_log set action = 'tampered' where id = ${row.id}`;
  });
  expect(tamper?.message?.includes("append-only"), "Audit log entries cannot be edited or deleted", `Audit log tampering was not blocked: ${tamper?.message ?? "update was allowed (rolled back)"}`);

  console.log("\nAPIs");
  start = performance.now();
  const health = await fetch(new URL("/auth/v1/health", url), { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY } });
  expect(health.ok, `Auth API healthy (${ms(start)})`, `Auth API returned ${health.status}`);

  start = performance.now();
  const anonRead = await publicClient().from("profiles").select("id").limit(1);
  expect(
    anonRead.error?.code === "42501",
    `REST API reachable and refuses anonymous reads (${ms(start)})`,
    `Anonymous read was not refused: ${anonRead.error ? anonRead.error.message : `${anonRead.data?.length ?? 0} row(s) returned`}`,
  );

  console.log("\nSuper admin");
  const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    bad("SUPER_ADMIN_EMAIL is not set");
    failures++;
  } else {
    const [row] = await sql`
      select u.id, u.email_confirmed_at, u.banned_until, p.role, p.must_change_password
      from auth.users u left join public.profiles p on p.id = u.id
      where lower(u.email) = ${adminEmail}
    `;
    if (expect(!!row, `${adminEmail} exists`, `${adminEmail} not found (run npm run db:seed)`)) {
      expect(row.role === "super_admin", "Role is super_admin", `Role is ${row.role ?? "missing"}`);
      expect(!!row.email_confirmed_at, "Email confirmed", "Email not confirmed");
      expect(!row.banned_until || row.banned_until < new Date(), "Account active", "Account is banned");

      const password = process.env.SUPER_ADMIN_PASSWORD;
      if (row.must_change_password && password) {
        const client = publicClient();
        start = performance.now();
        const { error } = await client.auth.signInWithPassword({ email: adminEmail, password });
        if (expect(!error, `Signs in with the default password (${ms(start)})`, `Sign-in failed: ${error?.message}`)) {
          const { data: profile } = await client.from("profiles").select("role").eq("id", row.id).single();
          expect(profile?.role === "super_admin", "Session sees its own super_admin profile through RLS", "Signed-in session could not read its own profile");
          const { count } = await client.from("profiles").select("id", { count: "exact", head: true });
          info(`Super admin can see ${count ?? 0} profile(s)`);
          await client.auth.signOut({ scope: "local" });
        }
        info("Default password is still active and must be changed at first sign-in");
      } else if (!row.must_change_password) {
        ok("Default password has been changed");
      }
    }
  }

  console.log("\nRLS in action (temporary user)");
  // Created already confirmed, so no email is sent. A real domain avoids Auth's invalid-domain rejection.
  const tempDomain = process.env.SUPER_ADMIN_EMAIL?.split("@")[1]?.trim() || "example.com";
  const tempEmail = `rls-check-${randomBytes(4).toString("hex")}@${tempDomain}`;
  const tempPassword = randomBytes(24).toString("base64url");
  const created = await admin.auth.admin.createUser({ email: tempEmail, password: tempPassword, email_confirm: true });
  if (expect(!created.error, "Created temporary member account", `Could not create temporary user: ${created.error?.message}`)) {
    tempUserId = created.data.user.id;
    const member = publicClient();
    const signIn = await member.auth.signInWithPassword({ email: tempEmail, password: tempPassword });
    if (expect(!signIn.error, "Temporary user signs in", `Temporary user sign-in failed: ${signIn.error?.message}`)) {
      const own = await member.from("profiles").select("id, role");
      expect(
        own.data?.length === 1 && own.data[0].id === tempUserId && own.data[0].role === "member",
        "Sees only their own profile, as a member",
        `Expected exactly their own member profile, got ${JSON.stringify(own.data ?? own.error?.message)}`,
      );
      const escalate = await member.from("profiles").update({ role: "super_admin" }).eq("id", tempUserId);
      expect(escalate.error?.code === "42501", "Cannot promote themselves to super_admin", `Role escalation was not blocked: ${escalate.error?.message ?? "update succeeded"}`);
      const rename = await member.from("profiles").update({ full_name: "RLS check" }).eq("id", tempUserId).select("full_name");
      expect(rename.data?.[0]?.full_name === "RLS check", "Can update their own display name", `Display name update failed: ${rename.error?.message}`);

      await sql`update public.profiles set role = 'admin' where id = ${tempUserId}`;
      const asAdmin = await member.from("profiles").select("id");
      expect((asAdmin.data?.length ?? 0) > 1, "Promoted to admin, sees every profile", `Admin saw ${asAdmin.data?.length ?? 0} profile(s)`);
      const auditAsAdmin = await member.from("audit_log").select("id").limit(1);
      expect(auditAsAdmin.data?.length === 0, "Admins cannot read the audit log", "An admin could read audit_log");

      await sql`update public.profiles set deactivated_at = now() where id = ${tempUserId}`;
      const deactivated = await member.from("profiles").select("id");
      expect(deactivated.data?.length === 1, "Deactivation removes admin access at once, same session", `Deactivated admin still saw ${deactivated.data?.length} profile(s)`);
      await member.auth.signOut({ scope: "local" });
    }
  }
} catch (error) {
  bad(`Unexpected error: ${error.message}`);
  failures++;
} finally {
  if (tempUserId) {
    const { error } = await admin.auth.admin.deleteUser(tempUserId);
    if (error) bad(`Could not delete temporary user ${tempUserId}: ${error.message}`);
    else info("Temporary user deleted");
  }
  await sql.end();
}

console.log(failures ? `\n✖ ${failures} check(s) failed.\n` : "\n✔ Supabase is connected and secured.\n");
process.exit(failures ? 1 : 0);
