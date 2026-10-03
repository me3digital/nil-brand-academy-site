// Build-time data access. One code path, two backends:
//   DATABASE_URL set  -> Supabase Postgres (production source of truth)
//   otherwise         -> in-process Postgres (PGlite) loaded from db/migrations + seed, for staging and CI
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.NIL_ROOT || process.cwd();   // run builds from the project root
let dbPromise;

// NIL_REQUIRE_DB=1 (set for the hosted staging and launch builds) makes a missing connection a hard failure,
// so a hosted build can never quietly fall back to the files in the repo.
let source = null;
async function boot() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    client.connection?.stream?.unref?.();   // do not hold the build process open
    source = 'supabase';
    return { query: (sql, params) => client.query(sql, params) };
  }
  if (process.env.NIL_REQUIRE_DB === '1') throw new Error('NIL_REQUIRE_DB=1 but DATABASE_URL is not set. Refusing to build from repo files.');
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const dir = path.join(root, 'db/migrations');
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
  const { buildSeedSql } = await import('../../scripts/seed.mjs');
  await db.exec(buildSeedSql());
  source = 'repo-files';
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

// Where this build's data came from. The migration ledger only exists in the hosted database, so its timestamp
// cannot be produced by a repo-file build.
export async function buildProvenance() {
  await getDb();
  if (source !== 'supabase') return { source, ledger: null, database: null };
  const r = (await q(`select current_database() as database, count(*)::int as migrations, to_char(max(applied_at) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ledger from schema_migrations`))[0];
  return { source, ...r };
}
