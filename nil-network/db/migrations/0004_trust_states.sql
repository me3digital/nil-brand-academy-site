-- Trust states, documented policy searches, richer change history, and the revised index quality gate.

-- 1. Public trust state on every rule version. Separate from the internal workflow status.
alter table rule_versions add column trust_state text not null default 'NEEDS_REVIEW' check (trust_state in (
  'VERIFIED_TO_OFFICIAL_SOURCE',        -- an official primary source was located and checked
  'PUBLIC_POLICY_NOT_LOCATED',          -- public sources were searched; no school/district-specific policy located (does not mean none exists)
  'PENDING_INSTITUTION_CONFIRMATION',   -- needs direct confirmation from the institution
  'NEEDS_REVIEW',                       -- a source exists but interpretation, currency or applicability needs more review
  'SUPERSEDED'));                       -- kept for history, no longer current
-- How the check was done. 'human_review' may only be set when a person actually reviewed it.
alter table rule_versions add column review_method text not null default 'automated_extraction' check (review_method in (
  'automated_extraction','raw_source_text','visual_source_check','human_review'));
alter table rule_versions add column review_note text;
alter table rule_versions add column short_answer text;   -- one-line answer for the quick-answer layer
-- Quick-answer status. Stored on the rule so the top-of-page answer is a database fact, not template logic.
alter table rule_versions add column quick_status text check (quick_status in
  ('YES','NO','DEPENDS','CHECK_FIRST','NOT_PUBLICLY_SPECIFIED'));

alter table rule_version_sources drop constraint rule_version_sources_quote_check_check;
alter table rule_version_sources add constraint rule_version_sources_quote_check_check check (quote_check in
  ('machine_extracted','machine_confirmed_twice','machine_raw_text','visual_source_check','human_checked'));

-- 2. Policy searches: what we looked for, where, when, and what we did or did not find.
--    "Not located" is a statement about our search, never a claim that no policy exists.
create table policy_searches (
  id                       serial primary key,
  institution_id           int references institutions(id) on delete cascade,
  district_id              int references school_districts(id),
  governing_body_id        int references governing_bodies(id),
  subject                  text not null default 'nil_policy',
  public_policy_found      boolean not null,
  search_date              date not null,
  locations_checked        text[] not null,            -- pages and documents reviewed
  locations_unreachable    text[],                     -- documents that exist but could not be opened
  institution_confirmation boolean not null default false,
  confirmed_on             date,
  searched_by              text not null,
  notes                    text
);

-- 3. Change history that can show previous and current rule text.
alter table rule_change_log add column previous_text text;
alter table rule_change_log add column current_text text;
alter table rule_change_log add column effective_on date;

-- 4. Index quality gate, revised. Not a word count. Not weakened.
drop view v_page_quality_gate;
create view v_page_quality_gate as
with ir as (select * from v_institution_rules),
agg as (
  select
    i.id as institution_id,
    exists (select 1 from institution_governing_bodies g where g.institution_id = i.id) as governing_body_identified,
    exists (select 1 from ir where ir.institution_id = i.id and ir.topic_slug = 'nil-allowed') as current_status_established,
    (select count(*) from ir where ir.institution_id = i.id) as rule_count,
    -- accuracy: rules still under review or waiting on the school
    (select count(*) from ir join rule_versions v on v.id = ir.rule_version_id where ir.institution_id = i.id
        and v.trust_state in ('NEEDS_REVIEW','PENDING_INSTITUTION_CONFIRMATION')) as rules_needing_review,
    (select count(*) from ir where ir.institution_id = i.id
        and not exists (select 1 from rule_version_sources rs join sources s on s.id = rs.source_id
                        where rs.rule_version_id = ir.rule_version_id and s.is_primary)) as rules_without_primary_source,
    (select count(distinct ir.topic_slug) from ir where ir.institution_id = i.id and ir.answer <> 'not_addressed') as topics_answered,
    (select count(*) from ir where ir.institution_id = i.id and ir.scope_type in ('district','institution')
        and ir.answer <> 'not_addressed') as school_level_rules,
    -- school-specific research: a documented search of at least three public locations
    exists (select 1 from policy_searches ps where ps.institution_id = i.id and array_length(ps.locations_checked, 1) >= 3) as school_research_documented,
    exists (select 1 from school_nil_policies p where p.institution_id = i.id and p.policy_status = 'published') as school_policy_published,
    exists (select 1 from policy_searches ps where ps.institution_id = i.id and ps.institution_confirmation) as institution_confirmed,
    (select count(*) from nil_programs n where n.institution_id = i.id) as program_count,
    exists (select 1 from school_contacts c where c.institution_id = i.id and c.show_on_page
              and c.verification_status in ('verified','school_confirmed')) as contact_verified,
    (select count(*) from scenarios sc
       where (sc.applies_to = 'both' or sc.applies_to = i.institution_type)
         and not exists (select 1 from scenario_rule_topics srt
                         where srt.scenario_id = sc.id and srt.role = 'governs'
                           and not exists (select 1 from ir where ir.institution_id = i.id
                                           and ir.rule_topic_id = srt.rule_topic_id and ir.answer <> 'not_addressed'))) as scenarios_answered,
    (select max(ir.last_verified_on) from ir where ir.institution_id = i.id) as last_verified_on,
    exists (select 1 from conflicts cf join ir on ir.rule_id = cf.rule_id
            where ir.institution_id = i.id and cf.status = 'open' and cf.severity = 'high') as open_high_conflict
  from institutions i
)
select
  p.id as page_id, p.path, p.page_type, a.*,
  (p.title is not null and p.meta_description is not null and p.h1 is not null) as meta_complete,
  p.human_approved,
  a.governing_body_identified                               as chk_governing_body,
  a.current_status_established                              as chk_current_status,
  (a.rule_count > 0 and a.rules_needing_review = 0)         as chk_rules_verified,
  (a.rule_count > 0 and a.rules_without_primary_source = 0) as chk_sources_attached,
  (a.topics_answered >= 8)                                  as chk_matrix_populated,
  a.school_research_documented                              as chk_school_info_checked,
  -- thin-content guard: the page must hold school-level facts the state hub does not.
  -- A documented "nothing located" search does not count; a school confirmation does.
  ((a.school_level_rules + a.program_count
     + case when a.school_policy_published then 1 else 0 end
     + case when a.contact_verified then 1 else 0 end
     + case when a.institution_confirmed then 1 else 0 end) >= 3) as chk_school_specific_value,
  a.contact_verified                                        as chk_contact_checked,
  (a.scenarios_answered >= 5)                               as chk_scenarios_answered,
  (a.last_verified_on is not null)                          as chk_last_verified,
  (not a.open_high_conflict)                                as chk_no_open_conflict,
  case when
        a.governing_body_identified and a.current_status_established
    and a.rule_count > 0 and a.rules_needing_review = 0 and a.rules_without_primary_source = 0
    and a.topics_answered >= 8 and a.school_research_documented
    and (a.school_level_rules + a.program_count
          + case when a.school_policy_published then 1 else 0 end
          + case when a.contact_verified then 1 else 0 end
          + case when a.institution_confirmed then 1 else 0 end) >= 3
    and a.contact_verified and a.scenarios_answered >= 5 and a.last_verified_on is not null
    and not a.open_high_conflict
    and p.title is not null and p.meta_description is not null and p.h1 is not null
    and p.human_approved and p.index_override is null
  then 'index' else 'noindex' end as index_status
from pages p
join agg a on a.institution_id = p.institution_id
where p.page_type in ('college_hub','high_school_hub');
alter view v_page_quality_gate set (security_invoker = true);
alter table policy_searches enable row level security;

-- 5. Quick-answer layer: which scenarios appear in the top "Just tell me what I can do" block.
alter table scenarios add column is_quick boolean not null default false;
