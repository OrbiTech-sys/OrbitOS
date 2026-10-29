// Applies pending SQL files from supabase/migrations in order, each in its own
// transaction. History is recorded in supabase_migrations.schema_migrations, the
// same table the Supabase CLI uses, so `supabase db push` stays compatible later.
import { readdir, readFile } from "node:fs/promises";

import { connectDb, fail, info, ok } from "./shared.mjs";

const dir = new URL("../../supabase/migrations/", import.meta.url);
const files = (await readdir(dir)).filter((f) => /^\d+_[\w-]+\.sql$/.test(f)).sort();

const sql = connectDb();
try {
  console.log("\nApplying migrations\n");
  await sql.unsafe(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
    alter table supabase_migrations.schema_migrations add column if not exists statements text[];
    alter table supabase_migrations.schema_migrations add column if not exists name text;
  `);
  const applied = new Set((await sql`select version from supabase_migrations.schema_migrations`).map((r) => r.version));

  let count = 0;
  for (const file of files) {
    const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
    if (applied.has(version)) {
      info(`${file} (already applied)`);
      continue;
    }
    const body = await readFile(new URL(file, dir), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`
        insert into supabase_migrations.schema_migrations (version, name, statements)
        values (${version}, ${rest.join("_")}, ${[body]})
      `;
    });
    ok(file);
    count++;
  }
  console.log(`\n${count ? `Applied ${count} migration${count === 1 ? "" : "s"}.` : "Database is up to date."}\n`);
} catch (error) {
  fail(`Migration failed and was rolled back: ${error.message}`);
} finally {
  await sql.end();
}
