// Creates (or promotes) the super admin from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.
// Safe to re-run: an existing account keeps its current password, so running this
// after the password has been changed never resets it.
import { adminClient, connectDb, fail, info, ok, readEnv } from "./shared.mjs";

const env = readEnv("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD");
const email = env.SUPER_ADMIN_EMAIL.toLowerCase();

const sql = connectDb();
try {
  console.log("\nSeeding super admin\n");
  const [existing] = await sql`select id from auth.users where lower(email) = ${email}`;

  let userId = existing?.id;
  const created = !existing;
  if (created) {
    const { data, error } = await adminClient().auth.admin.createUser({
      email,
      password: env.SUPER_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) fail(`Could not create ${email}: ${error.message}`);
    userId = data.user.id;
    ok(`Created auth user ${email}`);
  } else {
    info(`${email} already exists; password left unchanged`);
  }

  await sql`
    insert into public.profiles (id, email, full_name, role, must_change_password)
    values (${userId}, ${email}, 'Super Admin', 'super_admin', ${created})
    on conflict (id) do update
      set role = 'super_admin',
          full_name = coalesce(public.profiles.full_name, excluded.full_name),
          must_change_password = public.profiles.must_change_password or excluded.must_change_password
  `;
  ok(`${email} has the super_admin role`);
  if (created) info("A password change is required at first sign-in.");
  console.log();
} catch (error) {
  fail(`Seeding failed: ${error.message}`);
} finally {
  await sql.end();
}
