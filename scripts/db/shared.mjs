// Shared helpers for the database scripts. Run them through npm (`npm run db:*`),
// which loads .env.local with Node's --env-file-if-exists. Secrets are read from
// the environment only and never printed.
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

export const ok = (msg) => console.log(`  ✔ ${msg}`);
export const bad = (msg) => console.log(`  ✖ ${msg}`);
export const info = (msg) => console.log(`  – ${msg}`);

export function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

export function readEnv(...names) {
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    fail(`Missing ${missing.join(", ")} in .env.local. Copy .env.example and fill it in.`);
  }
  return Object.fromEntries(names.map((name) => [name, process.env[name].trim()]));
}

/** Direct Postgres connection (session pooler or direct). Used for migrations and checks. */
export function connectDb() {
  const { SUPABASE_DB_URL } = readEnv("SUPABASE_DB_URL");
  return postgres(SUPABASE_DB_URL, {
    ssl: "require",
    max: 1,
    prepare: false, // safe behind Supavisor in either pooling mode
    connect_timeout: 15,
    onnotice: () => {},
  });
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Secret-key client. Bypasses RLS: scripts only, never imported by the app. */
export function adminClient() {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = readEnv("SUPABASE_URL", "SUPABASE_SECRET_KEY");
  return createClient(new URL(SUPABASE_URL).origin, SUPABASE_SECRET_KEY, noSession);
}

/** Publishable-key client: behaves exactly like the app (subject to RLS). */
export function publicClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = readEnv("SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY");
  return createClient(new URL(SUPABASE_URL).origin, SUPABASE_PUBLISHABLE_KEY, noSession);
}
