// Builds an update for the hosted database: the named new migrations, then a full reload of the seed data.
// The reload is safe only while every record in the database comes from the seed (pilot stage). Once people edit
// records in the database, stop using it and write data migrations instead.
// The Supabase SQL editor refuses very large queries, so the update is written as numbered parts to run in order.
// Part 01 holds the migrations. Parts 02 onward reload the data; to redo a failed reload, start again at part 02.
// Usage: node scripts/bundle-update.mjs 0006_pilot_gate.sql
import fs from 'node:fs';
const migs = process.argv.slice(2);
const LIMIT = 240000;
const dir = 'db/deploy/update';
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const parts = [];
let m = `-- NIL Intelligence Network update, part 01: migrations.\nbegin;\n`;
for (const f of migs) m += `\n-- ===== ${f}\n${fs.readFileSync(`db/migrations/${f}`, 'utf8')}\ninsert into schema_migrations (name) values ('${f}');\n`;
parts.push(m + `commit;\nselect 'part 01 applied' as result;\n`);
const stmts = fs.readFileSync('db/seed/florida.generated.sql', 'utf8').split(/\n(?=insert into )/);
const truncate = `do $$ declare t text; begin\n  select string_agg(format('public.%I', tablename), ', ') into t from pg_tables where schemaname = 'public' and tablename <> 'schema_migrations';\n  execute 'truncate table ' || t || ' restart identity cascade';\nend $$;\n`;
let chunks = [[]], size = 0;
for (const s of stmts) { if (size + s.length > LIMIT && chunks[chunks.length - 1].length) { chunks.push([]); size = 0; } chunks[chunks.length - 1].push(s); size += s.length + 1; }
chunks.forEach((c, i) => {
  const n = String(i + 2).padStart(2, '0'); const last = i === chunks.length - 1;
  parts.push(`-- NIL Intelligence Network update, part ${n} of ${String(chunks.length + 1).padStart(2, '0')}: seed data${i === 0 ? ' (starts by emptying the seed tables; identity columns restart)' : ''}.\nbegin;\n${i === 0 ? truncate : ''}${c.join('\n')}\n${last ? `insert into schema_migrations (name) values ('seed:florida:reload:' || to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS'));\n` : ''}commit;\nselect 'part ${n} applied' as result;\n`);
});
parts.forEach((p, i) => fs.writeFileSync(`${dir}/part${String(i + 1).padStart(2, '0')}.sql`, p));
fs.rmSync('db/deploy/supabase_update.sql', { force: true });
console.log('wrote', parts.length, 'parts to', dir, parts.map((p) => p.length).join(' '));
