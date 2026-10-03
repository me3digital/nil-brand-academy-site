// Build-time data access. One code path, two backends:
//   DATABASE_URL set  -> Supabase Postgres (production source of truth)
//   otherwise         -> in-process Postgres (PGlite) loaded from db/migrations + seed, for staging and CI
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.NIL_ROOT || process.cwd();   // run builds from the project root
let dbPromise;

async function boot() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    return { query: (sql, params) => client.query(sql, params) };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const dir = path.join(root, 'db/migrations');
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
  const { buildSeedSql } = await import('../../scripts/seed.mjs');
  await db.exec(buildSeedSql());
  return db;
}

export function getDb() {
  if (!globalThis.__nilDb) globalThis.__nilDb = boot();
  return globalThis.__nilDb;
}
export async function q(sql, params = []) {
  const db = await getDb();
  const res = await db.query(sql, params);
  return res.rows;
}
