-- Access control. Default deny.
-- The site is generated at build time over a server-side Postgres connection (DATABASE_URL, stored only in the build environment).
-- Nothing in the browser talks to the database, so the public API roles get no access at all.
-- When a public feature needs data (for example Find My School), it gets its own narrow read-only policy in a later migration.

-- 1. Row Level Security on every table in the public schema, with no policies = no rows for anon / authenticated.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- 2. Views run with the caller's rights, so they cannot be used to read around RLS.
alter view colleges set (security_invoker = true);
alter view high_schools set (security_invoker = true);
alter view athletic_conferences set (security_invoker = true);
alter view v_institution_rules set (security_invoker = true);
alter view v_state_rules set (security_invoker = true);
alter view v_page_quality_gate set (security_invoker = true);

-- 3. Belt and braces on Supabase: strip table privileges from the public API roles (skipped where those roles do not exist).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
    revoke all on all sequences in schema public from anon;
    alter default privileges in schema public revoke all on tables from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
    revoke all on all sequences in schema public from authenticated;
    alter default privileges in schema public revoke all on tables from authenticated;
  end if;
end $$;
