// Compares the connected database (DATABASE_URL) with a fresh local build of the same migrations + seed.
// Row counts per table, cascade size per school, quality-gate result per page, orphan checks, RLS state.
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import { buildSeedSql } from './seed.mjs';
const local = new PGlite();
for (const f of fs.readdirSync('db/migrations').sort()) await local.exec(fs.readFileSync('db/migrations/' + f, 'utf8'));
await local.exec(buildSeedSql());
const remote = new pg.Client({ connectionString: process.env.DATABASE_URL }); await remote.connect();
const both = async (sql) => [(await local.query(sql)).rows, (await remote.query(sql)).rows];
let bad = 0;
const [lt] = await both(`select tablename from pg_tables where schemaname='public' and tablename <> 'schema_migrations' order by 1`);
for (const { tablename } of lt) {
  const [a, b] = await both(`select count(*)::int n from ${tablename}`);
  const ok = a[0].n === b[0].n; if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'DIFF', tablename.padEnd(36), a[0].n, b[0].n);
}
for (const [label, sql] of [
  ['cascade per school', `select i.slug, count(*)::int n from v_institution_rules r join institutions i on i.id=r.institution_id group by 1 order by 1`],
  ['quality gate', `select path, index_status, topics_answered::int, school_level_rules::int, scenarios_answered::int from v_page_quality_gate order by 1`],
  ['rules without a current version', `select count(*)::int n from rules r where not exists (select 1 from rule_versions v where v.rule_id=r.id and v.is_current)`],
  ['versions without a source', `select count(*)::int n from rule_versions v where not exists (select 1 from rule_version_sources s where s.rule_version_id=v.id)`],
  ['verification states', `select verification_status, count(*)::int n from rule_versions group by 1 order by 1`],
  ['tables without RLS', `select count(*)::int n from pg_tables where schemaname='public' and not rowsecurity`],
  ['policies', `select count(*)::int n from pg_policies where schemaname='public'`],
]) { const [a, b] = await both(sql); const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) bad++; console.log(ok ? 'ok  ' : 'DIFF', label, JSON.stringify(b)); }
await remote.end();
console.log(bad ? `${bad} difference(s)` : 'Remote database matches the validated local build.');
process.exit(bad ? 1 : 0);
