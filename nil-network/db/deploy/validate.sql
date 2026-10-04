-- Validation fingerprint. Run the same query on the local reference database and on Supabase; every row must match.
with t as (
  select 'tables' k, count(*)::text v from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name <> 'schema_migrations'
  union all select 'functions', count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('record_human_review','approve_page','is_automated_actor')
  union all select 'views', count(*)::text from information_schema.views where table_schema='public'
  union all select 'columns', count(*)::text from information_schema.columns where table_schema='public' and table_name <> 'schema_migrations'
  union all select 'foreign_keys', count(*)::text from information_schema.table_constraints where constraint_schema='public' and constraint_type='FOREIGN KEY'
  union all select 'check_constraints', count(*)::text from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public' and c.contype='c'
  union all select 'unique_and_pk', count(*)::text from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public' and c.contype in ('p','u') and c.conrelid::regclass::text <> 'schema_migrations'
  union all select 'indexes', count(*)::text from pg_indexes where schemaname='public' and tablename <> 'schema_migrations'
  union all select 'tables_with_rls', count(*)::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity and c.relname <> 'schema_migrations'
  union all select 'rls_policies', count(*)::text from pg_policies where schemaname='public'
  union all select 'rows:states', count(*)::text from states
  union all select 'rows:governing_bodies', count(*)::text from governing_bodies
  union all select 'rows:institutions', count(*)::text from institutions
  union all select 'rows:sources', count(*)::text from sources
  union all select 'rows:rule_topics', count(*)::text from rule_topics
  union all select 'rows:rules', count(*)::text from rules
  union all select 'rows:rule_versions', count(*)::text from rule_versions
  union all select 'rows:rule_version_sources', count(*)::text from rule_version_sources
  union all select 'rows:disclosure_requirements', count(*)::text from disclosure_requirements
  union all select 'rows:rule_change_log', count(*)::text from rule_change_log
  union all select 'rows:verification_events', count(*)::text from verification_events
  union all select 'rows:policy_searches', count(*)::text from policy_searches
  union all select 'rows:scenarios', count(*)::text from scenarios
  union all select 'rows:guidance_blocks', count(*)::text from guidance_blocks
  union all select 'rows:conflicts', count(*)::text from conflicts
  union all select 'rows:watch_items', count(*)::text from watch_items
  union all select 'rows:pages', count(*)::text from pages
  union all select 'rules_without_source', count(*)::text from rule_versions v where not exists (select 1 from rule_version_sources s where s.rule_version_id = v.id)
  union all select 'orphan_rule_sources', count(*)::text from rule_version_sources s where not exists (select 1 from sources x where x.id = s.source_id)
  union all select 'hash:rule_text', md5(string_agg(r.slug || '|' || v.answer || '|' || v.summary || '|' || v.trust_state || '|' || v.review_method || '|' || coalesce(v.quick_status,''), '~' order by r.slug collate "C")) from rules r join rule_versions v on v.rule_id = r.id
  union all select 'hash:rule_sources', md5(string_agg(r.slug || '|' || x.slug || '|' || coalesce(s.locator,'') || '|' || s.quote_check, '~' order by r.slug collate "C", x.slug collate "C", coalesce(s.locator,'') collate "C", s.quote_check collate "C")) from rule_version_sources s join rule_versions v on v.id = s.rule_version_id join rules r on r.id = v.rule_id join sources x on x.id = s.source_id
  union all select 'hash:change_log', md5(string_agg(changed_on::text || '|' || change_type || '|' || summary, '~' order by changed_on, summary collate "C")) from rule_change_log
  union all select 'trust:' || trust_state, count(*)::text from rule_versions group by trust_state
  union all select 'gate:' || path, index_status || ' ' || seo_status || ' class=' || value_class || ' rules=' || rule_count || ' review=' || rules_needing_review || ' topics=' || topics_answered || ' nil=' || nil_items || ' sup=' || supporting_items || ' scen=' || scenarios_answered
      || ' checks=' || concat_ws('', chk_governing_body::int, chk_rules_established::int, chk_sources_attached::int, chk_rules_traceable::int, chk_school_info_checked::int, chk_school_specific_value::int, chk_contact_checked::int, chk_scenarios_answered::int, chk_title_meta::int, chk_canonical::int, chk_internal_links::int, chk_no_open_conflict::int, chk_no_critical_source_gap::int, chk_human_review::int, chk_editorial_approval::int) from v_page_quality_gate
  union all select 'rows:school_contacts', count(*)::text from school_contacts
  union all select 'rows:nil_programs', count(*)::text from nil_programs
  union all select 'rows:school_nil_policies', count(*)::text from school_nil_policies
  union all select 'rows:school_review_notes', count(*)::text from school_review_notes
  union all select 'rows:school_districts', count(*)::text from school_districts
  union all select 'rows:source_access_issues', count(*)::text from source_access_issues
  union all select 'rows:source_access_pages', count(*)::text from source_access_pages
  union all select 'access:' || class || ':' || status, count(*)::text from source_access_issues group by class, status
  union all select 'human:rule_versions_marked_human_review', count(*)::text from rule_versions where review_method = 'human_review'
  union all select 'human:pages_marked_approved', count(*)::text from pages where human_approved
  union all select 'seo:' || seo_status, count(*)::text from v_page_quality_gate group by seo_status
  union all select 'class:' || value_class, count(*)::text from v_page_quality_gate group by value_class
  union all select 'hash:sources', md5(string_agg(slug || '|' || url || '|' || title, '~' order by slug collate "C")) from sources
  union all select 'cascade:' || i.slug, count(*)::text from v_institution_rules r join institutions i on i.id = r.institution_id group by i.slug
  union all select 'state_rules:' || level, count(*)::text from v_state_rules group by level
)
select k, v from t order by k collate "C";
