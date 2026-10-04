-- NIL Intelligence Network update, part 01: migrations.
begin;

-- ===== 0007_source_access.sql
-- Phase 3B. Source-access triage and the critical-source rule.
--   One row per unique document that could not be opened during research, classified once, mapped to every page it affects.
--   A page with an unread class A (critical primary) source cannot be class A (strong) and cannot be SEO-eligible.

create table source_access_issues (
  id            serial primary key,
  title         text not null,
  organization  text,
  url           text,
  class         text not null check (class in ('A','B','C','D','E','F')),
  status        text not null check (status in ('opened_now','still_inaccessible','login_required','not_found_404','not_retried')),
  risk          text not null check (risk in ('high','medium','low','none')),
  occurrences   int not null default 1,          -- how many times research ran into it, across all pages
  claim_affected text,
  other_support text,
  why_unopened  text,
  retry         text,
  finding       text,
  triaged_on    date not null,
  resolved      boolean not null default false,  -- set by a person once the document has been read
  resolved_by   text,
  resolved_on   date
);
create table source_access_pages (
  issue_id       int not null references source_access_issues(id) on delete cascade,
  institution_id int references institutions(id) on delete cascade,
  district_id    int references school_districts(id),
  check (institution_id is not null or district_id is not null)
);
alter table source_access_issues enable row level security;
alter table source_access_pages enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on source_access_issues, source_access_pages from anon, authenticated;
    revoke all on sequence source_access_issues_id_seq from anon, authenticated;
  end if;
end $$;

drop view v_review_queue;
drop view v_page_quality_gate;
create view v_page_quality_gate as
with ir as (select ir.*, v.trust_state, v.review_method, v.nil_specific, v.last_verified_on as v_last from v_institution_rules ir join rule_versions v on v.id = ir.rule_version_id),
agg as (
  select
    i.id as institution_id, i.institution_type,
    exists (select 1 from institution_governing_bodies g where g.institution_id = i.id) as governing_body_identified,
    exists (select 1 from ir where ir.institution_id = i.id and ir.topic_slug = 'nil-allowed' and ir.answer <> 'not_addressed') as current_status_established,
    (select count(*) from ir where ir.institution_id = i.id) as rule_count,
    (select count(*) from ir where ir.institution_id = i.id and ir.trust_state in ('NEEDS_REVIEW','PENDING_INSTITUTION_CONFIRMATION')) as rules_needing_review,
    (select count(*) from ir where ir.institution_id = i.id
        and not exists (select 1 from rule_version_sources rs join sources s on s.id = rs.source_id
                        where rs.rule_version_id = ir.rule_version_id and s.is_primary)) as rules_without_primary_source,
    -- every rule on the page is a canonical rule row with a citation and at least one source row
    (select count(*) from ir where ir.institution_id = i.id
        and (coalesce(ir.citation, '') = '' or not exists (select 1 from rule_version_sources rs where rs.rule_version_id = ir.rule_version_id))) as rules_not_traceable,
    (select count(distinct ir.topic_slug) from ir where ir.institution_id = i.id and ir.answer <> 'not_addressed') as topics_answered,
    -- school-level substance, split into NIL-specific and general
    (select count(*) from ir where ir.institution_id = i.id and ir.scope_type in ('district','institution') and ir.answer <> 'not_addressed'
        and ir.nil_specific and ir.trust_state = 'VERIFIED_TO_OFFICIAL_SOURCE') as nil_specific_rules,
    (select count(*) from ir where ir.institution_id = i.id and ir.scope_type in ('district','institution') and ir.answer <> 'not_addressed'
        and not ir.nil_specific and ir.trust_state = 'VERIFIED_TO_OFFICIAL_SOURCE') as general_school_rules,
    exists (select 1 from ir join disclosure_requirements dr on dr.rule_version_id = ir.rule_version_id
            where ir.institution_id = i.id and ir.scope_type in ('district','institution') and ir.trust_state = 'VERIFIED_TO_OFFICIAL_SOURCE') as disclosure_workflow_found,
    exists (select 1 from policy_searches ps where ps.institution_id = i.id and array_length(ps.locations_checked, 1) >= 3) as school_research_documented,
    exists (select 1 from school_nil_policies p where p.institution_id = i.id and p.policy_status = 'published' and p.covers_nil) as school_policy_published,
    exists (select 1 from policy_searches ps where ps.institution_id = i.id and ps.institution_confirmation) as institution_confirmed,
    (select count(*) from nil_programs n where n.institution_id = i.id and n.is_current
        and n.program_type in ('marketplace','collective','nil_entity','education','in_house_unit')) as nil_program_count,
    exists (select 1 from school_contacts c where c.institution_id = i.id and c.show_on_page
              and c.verification_status in ('verified','school_confirmed')) as contact_verified,
    exists (select 1 from school_contacts c where c.institution_id = i.id and c.show_on_page
              and c.verification_status in ('verified','school_confirmed') and c.contact_scope in ('nil','compliance','athletics')) as athletics_contact_found,
    (select count(*) from scenarios sc
       where (sc.applies_to = 'both' or sc.applies_to = i.institution_type)
         and not exists (select 1 from scenario_rule_topics srt
                         where srt.scenario_id = sc.id and srt.role = 'governs'
                           and not exists (select 1 from ir where ir.institution_id = i.id
                                           and ir.rule_topic_id = srt.rule_topic_id and ir.answer <> 'not_addressed'))) as scenarios_answered,
    (select max(ir.v_last) from ir where ir.institution_id = i.id) as last_verified_on,
    (select count(*) from ir where ir.institution_id = i.id and (ir.review_method <> 'human_review' or ir.v_last is null)) as rules_without_human_review,
    exists (select 1 from conflicts cf join ir on ir.rule_id = cf.rule_id
            where ir.institution_id = i.id and cf.status = 'open' and cf.severity = 'high') as open_high_conflict,
    -- a controlling primary source that is known to exist but has not been read (class A, still unread)
    (select count(*) from source_access_issues sa join source_access_pages sp on sp.issue_id = sa.id
       where sa.class = 'A' and sa.status <> 'opened_now' and not sa.resolved
         and (sp.institution_id = i.id or (sp.district_id is not null and sp.district_id = i.district_id))) as critical_sources_unread,
    (select count(*) from source_access_issues sa join source_access_pages sp on sp.issue_id = sa.id
       where sa.class = 'B' and sa.status <> 'opened_now' and not sa.resolved
         and (sp.institution_id = i.id or (sp.district_id is not null and sp.district_id = i.district_id))) as important_sources_unread
  from institutions i
),
pts as (
  select a.*,
    -- NIL-specific items the school or district itself provides
    (a.nil_specific_rules + a.nil_program_count
       + case when a.school_policy_published then 1 else 0 end
       + case when a.institution_confirmed then 1 else 0 end) as nil_items,
    -- supporting facts: a matched contact counts once, general school or district rules count once
    (case when a.contact_verified then 1 else 0 end + case when a.general_school_rules > 0 then 1 else 0 end) as supporting_items
  from agg a
),
chk as (
  select
    p.id as page_id, p.path, p.page_type, p.human_approved, p.index_override, t.*,
    (p.title is not null and p.meta_description is not null and p.h1 is not null) as meta_complete,
    t.governing_body_identified                               as chk_governing_body,
    t.current_status_established                              as chk_current_status,
    (t.rule_count > 0 and t.rules_needing_review = 0)         as chk_rules_verified,
    (t.rule_count > 0 and t.rules_without_primary_source = 0) as chk_sources_attached,
    (t.rule_count > 0 and t.rules_not_traceable = 0)          as chk_rules_traceable,
    (t.topics_answered >= 8)                                  as chk_matrix_populated,
    t.school_research_documented                              as chk_school_info_checked,
    -- A contact alone can never satisfy this: at least one NIL-specific item from the school or district is required,
    -- and three school-level facts in total. A contact is at most one of the three.
    (t.nil_items >= 1 and t.nil_items + t.supporting_items >= 3) as chk_school_specific_value,
    t.contact_verified                                        as chk_contact_checked,
    (t.scenarios_answered >= 5)                               as chk_scenarios_answered,
    (p.title is not null and p.meta_description is not null and p.h1 is not null) as chk_title_meta,
    (p.path = '/nil/' || s.slug || case t.institution_type when 'college' then '/colleges/' else '/high-schools/' end || i.slug || '/') as chk_canonical,
    (exists (select 1 from pages sp where sp.page_type = 'state_hub' and sp.state_id = i.state_id)
      and exists (select 1 from pages dp where dp.state_id = i.state_id
                  and dp.page_type = case t.institution_type when 'college' then 'college_directory' else 'high_school_directory' end)) as chk_internal_links,
    (not t.open_high_conflict)                                as chk_no_open_conflict,
    (t.critical_sources_unread = 0)                           as chk_no_critical_source_gap,
    (t.rule_count > 0 and t.rules_without_human_review = 0)   as chk_human_review,
    (p.human_approved and p.approved_by is not null)          as chk_editorial_approval,
    case
      when not t.school_research_documented or not t.athletics_contact_found then 'D'
      when t.nil_items >= 3 and (t.school_policy_published or t.disclosure_workflow_found) and t.critical_sources_unread = 0 then 'A'
      when t.nil_items >= 1 and t.nil_items + t.supporting_items >= 3 then 'B'
      else 'C' end as value_class
  from pages p
  join pts t on t.institution_id = p.institution_id
  join institutions i on i.id = p.institution_id
  join states s on s.id = i.state_id
  where p.page_type in ('college_hub','high_school_hub')
)
select c.*,
  c.chk_rules_verified as chk_rules_established,
  c.chk_human_review as chk_last_verified,
  (c.chk_governing_body and c.chk_current_status and c.chk_rules_verified and c.chk_sources_attached and c.chk_rules_traceable
    and c.chk_matrix_populated and c.chk_school_info_checked and c.chk_school_specific_value and c.chk_contact_checked
    and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict and c.chk_no_critical_source_gap
    and c.value_class in ('A','B') and c.index_override is null) as automated_pass,
  case c.value_class when 'A' then 'Strong school-specific value' when 'B' then 'Moderate school-specific value'
    when 'C' then 'State-rule-dominant / thin' else 'Incomplete' end as value_class_label,
  case
    when not (c.chk_governing_body and c.chk_current_status and c.chk_rules_verified and c.chk_sources_attached and c.chk_rules_traceable
      and c.chk_matrix_populated and c.chk_school_info_checked and c.chk_school_specific_value and c.chk_contact_checked
      and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict and c.chk_no_critical_source_gap
      and c.value_class in ('A','B') and c.index_override is null) then 'NOT_ELIGIBLE'
    when c.chk_human_review and c.chk_editorial_approval then 'APPROVED_TO_INDEX'
    else 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING' end as seo_status,
  case
    when (c.chk_governing_body and c.chk_current_status and c.chk_rules_verified and c.chk_sources_attached and c.chk_rules_traceable
      and c.chk_matrix_populated and c.chk_school_info_checked and c.chk_school_specific_value and c.chk_contact_checked
      and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict and c.chk_no_critical_source_gap
      and c.value_class in ('A','B') and c.index_override is null)
      and c.chk_human_review and c.chk_editorial_approval then 'index' else 'noindex' end as index_status
from chk c;
alter view v_page_quality_gate set (security_invoker = true);

-- Review queue: each rule once, with the number of pages one review unlocks. Statewide rules come first because they unlock the most.
create view v_review_queue as
select r.slug as rule_slug, r.scope_type, coalesce(gb.short_name, st.name || ' law', d.name, i.short_name, i.name) as issuer,
       t.label as topic, v.answer, v.trust_state, v.review_method, v.nil_specific, v.last_verified_on, v.verified_by, v.summary, v.citation, v.review_note,
       (select count(distinct p.id) from v_institution_rules ir join pages p on p.institution_id = ir.institution_id where ir.rule_version_id = v.id) as pages_inheriting
from rules r join rule_versions v on v.rule_id = r.id and v.is_current
join rule_topics t on t.id = r.rule_topic_id
left join governing_bodies gb on gb.id = r.governing_body_id
left join states st on st.id = r.state_id and r.scope_type = 'state'
left join school_districts d on d.id = r.district_id and r.scope_type = 'district'
left join institutions i on i.id = r.institution_id and r.scope_type = 'institution'
where r.status = 'active';
alter view v_review_queue set (security_invoker = true);

insert into schema_migrations (name) values ('0007_source_access.sql');
commit;
select 'part 01 applied' as result;
