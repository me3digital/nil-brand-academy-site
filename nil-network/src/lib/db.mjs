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

// Reads a Postgres connection string without the URL parser, so a password containing characters such as @ # / ? works
// as typed. If the password was pasted with the template's square brackets still around it, the bare form is tried too.
function parseDatabaseUrl(raw) {
  const m = String(raw).trim().match(/^postgres(?:ql)?:\/\/([^:\/]+):(.*)@([^@\/:?]+):(\d+)\/([^?]+)/);
  if (!m) return [];
  const [, user, pw, host, port, database] = m;
  const dec = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
  const base = { user: dec(user), host, port: Number(port), database };
  const out = [{ ...base, password: dec(pw) }];
  if (dec(pw) !== pw) out.push({ ...base, password: pw });
  if (/^\[.*\]$/.test(pw)) out.push({ ...base, password: pw.slice(1, -1) });
  return out;
}
async function boot() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const candidates = parseDatabaseUrl(process.env.DATABASE_URL);
    let lastCode = 'unparseable';
    for (const cfg of candidates) {
      const client = new pg.Client({ ...cfg, ssl: { rejectUnauthorized: false } });
      try {
        await client.connect();
        source = 'supabase';
        // Keep the process alive only while a query is in flight, so the build can exit when it is done.
        const stream = client.connection?.stream; let busy = 0; stream?.unref?.();
        return { query: async (sql, params) => { if (busy++ === 0) stream?.ref?.(); try { return await client.query(sql, params); } finally { if (--busy === 0) stream?.unref?.(); } } };
      } catch (e) { lastCode = e.code || e.name || 'error'; try { await client.end(); } catch {} }
    }
    // Never echo the connection string or the driver's message: only a code.
    throw new Error(`Could not connect to the database (${lastCode}). Check DATABASE_URL in the build environment.`);
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
