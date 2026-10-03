// Proves the access model: every table has RLS on, no policies exist, and a non-owner role reads nothing.
import { q, getDb } from '../src/lib/db.mjs';
const t = await q(`select count(*)::int total, count(*) filter (where rowsecurity)::int rls_on from pg_tables where schemaname='public'`);
const p = await q(`select count(*)::int policies from pg_policies where schemaname='public'`);
const v = await q(`select count(*)::int views, count(*) filter (where reloptions::text like '%security_invoker=true%')::int invoker from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v'`);
console.log('tables', t[0], 'policies', p[0], 'views', v[0]);
const db = await getDb();
await db.exec(`create role anon_test nologin; grant usage on schema public to anon_test; grant select on all tables in schema public to anon_test;`);
await db.exec(`set role anon_test`);
const seen = await db.query(`select (select count(*) from rules)::int rules, (select count(*) from sources)::int sources, (select count(*) from v_institution_rules)::int cascade, (select count(*) from school_contacts)::int contacts`);
await db.exec(`reset role`);
console.log('rows visible to a non-owner role even WITH select granted:', seen.rows[0]);
const own = await q(`select (select count(*) from rules)::int rules, (select count(*) from v_institution_rules)::int cascade`);
console.log('rows visible to the build connection:', own[0]);
