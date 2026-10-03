// Applies db/migrations/*.sql and the generated seed to the database in DATABASE_URL (Supabase), once each, inside transactions.
// Usage: DATABASE_URL=... node scripts/migrate.mjs [--seed]
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { tlsOptions } from '../src/lib/db.mjs';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set. Refusing to run.'); process.exit(1); }
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: tlsOptions(new URL(process.env.DATABASE_URL).hostname) });
await client.connect();
await client.query(`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
await client.query(`alter table public.schema_migrations enable row level security`);
const done = new Set((await client.query('select name from schema_migrations')).rows.map((r) => r.name));
const run = async (name, sql) => {
  if (done.has(name)) { console.log('skip   ', name); return; }
  await client.query('begin');
  try { await client.query(sql); await client.query('insert into schema_migrations(name) values ($1)', [name]); await client.query('commit'); console.log('applied', name); }
  catch (e) { await client.query('rollback'); console.error('FAILED ', name, e.message); process.exit(1); }
};
const dir = 'db/migrations';
for (const f of fs.readdirSync(dir).sort()) await run(f, fs.readFileSync(path.join(dir, f), 'utf8'));
if (process.argv.includes('--seed')) {
  const { buildSeedSql } = await import('./seed.mjs');
  await run('seed:florida-pilot-2026-10-03', buildSeedSql());
  // seed tables were created before 0003 ran its loop, but re-assert RLS in case new tables appeared
  await client.query(`do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security', t.tablename); end loop; end $$;`);
}
await client.end();
