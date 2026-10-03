-- NIL Intelligence Network update, part 01: migrations.
begin;

-- ===== 0006_pilot_gate.sql
-- Phase 3, Florida pilot. Four changes:
--   1. School-specific value now needs NIL-specific substance from the school or district. A contact alone never satisfies it.
--   2. A page that passes every automated check is SEO_ELIGIBLE_HUMAN_REVIEW_PENDING. Only a person can move it further.
--   3. Thin-content class (A to D) per page. Classes C and D stay noindex whatever else passes.
--   4. Guards so that an automated process can never record a human review or an editorial approval.

alter table institutions add column search_aliases text[];
-- false = the rule comes from a general policy that never mentions NIL or athlete deals (a facility-use or conduct policy)
alter table rule_versions add column nil_specific boolean not null default true;
-- false = a published school document that does not cover NIL (a social media policy, an old code of conduct)
alter table school_nil_policies add column covers_nil boolean not null default true;
alter table nil_programs add column is_current boolean;          -- null = status not confirmed
alter table school_contacts add column contact_scope text not null default 'general'
  check (contact_scope in ('nil','compliance','athletics','licensing','international','general'));

-- Notes for the human review checklist. Never rendered on a public page.
create table school_review_notes (
  id                serial primary key,
  institution_id    int references institutions(id) on delete cascade,
  district_id       int references school_districts(id),
  governing_body_id int references governing_bodies(id),
  kind              text not null check (kind in ('claim','ambiguity','conflict','manual_review','not_found','left_off_page')),
  body              text not null,
  resolved          boolean not null default false,
  resolved_by       text,
  resolved_on       date
);
alter table school_review_notes enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on school_review_notes from anon, authenticated;
    revoke all on sequence school_review_notes_id_seq from anon, authenticated;
  end if;
end $$;

-- 4. Human-only fields. The name recorded must be a person's.
create or replace function is_automated_actor(p text) returns boolean language sql immutable as $$
  select coalesce(trim(p), '') = '' or p ~* '(claude|automat|script|bot\M|system|pipeline|seed|gpt|\mai\M|agent)';
$$;
alter table rule_versions add constraint human_review_needs_a_person
  check (review_method <> 'human_review' or (last_verified_on is not null and not is_automated_actor(verified_by)));
alter table pages add constraint approval_needs_a_person
  check (not human_approved or (approved_on is not null and not is_automated_actor(approved_by)));

create or replace function record_human_review(p_rule_slug text, p_reviewer text, p_note text default null, p_on date default current_date)
returns int language plpgsql as $$
declare v_id int; n int;
begin
  if is_automated_actor(p_reviewer) then raise exception 'a human reviewer name is required; automated processes cannot record a human review'; end if;
  select v.id into v_id from rule_versions v join rules r on r.id = v.rule_id where r.slug = p_rule_slug and v.is_current;
  if v_id is null then raise exception 'no current version for rule %', p_rule_slug; end if;
  update rule_versions set review_method = 'human_review', last_verified_on = p_on, verified_by = p_reviewer, verification_status = 'verified' where id = v_id;
  insert into verification_events (entity_type, entity_id, status, method, verified_on, verified_by, notes)
    values ('rule_version', v_id, 'human_reviewed', 'second_checker', p_on, p_reviewer, p_note);
  select count(distinct p.id) into n from v_institution_rules ir join pages p on p.institution_id = ir.institution_id where ir.rule_version_id = v_id;
  return n;
end $$;

create or replace function approve_page(p_path text, p_approver text, p_on date default current_date)
returns text language plpgsql as $$
declare st text;
begin
  if is_automated_actor(p_approver) then raise exception 'a human approver name is required; automated processes cannot approve a page'; end if;
  update pages set human_approved = true, approved_by = p_approver, approved_on = p_on where path = p_path;
  if not found then raise exception 'no page at %', p_path; end if;
  select seo_status into st from v_page_quality_gate where path = p_path;
  return coalesce(st, 'not a school hub');
end $$;
revoke all on function record_human_review(text, text, text, date) from public;
revoke all on function approve_page(text, text, date) from public;
revoke all on function is_automated_actor(text) from public;

-- The gate.
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
            where ir.institution_id = i.id and cf.status = 'open' and cf.severity = 'high') as open_high_conflict
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
    (t.rule_count > 0 and t.rules_without_human_review = 0)   as chk_human_review,
    (p.human_approved and p.approved_by is not null)          as chk_editorial_approval,
    case
      when not t.school_research_documented or not t.athletics_contact_found then 'D'
      when t.nil_items >= 3 and (t.school_policy_published or t.disclosure_workflow_found) then 'A'
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
    and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict
    and c.value_class in ('A','B') and c.index_override is null) as automated_pass,
  case c.value_class when 'A' then 'Strong school-specific value' when 'B' then 'Moderate school-specific value'
    when 'C' then 'State-rule-dominant / thin' else 'Incomplete' end as value_class_label,
  case
    when not (c.chk_governing_body and c.chk_current_status and c.chk_rules_verified and c.chk_sources_attached and c.chk_rules_traceable
      and c.chk_matrix_populated and c.chk_school_info_checked and c.chk_school_specific_value and c.chk_contact_checked
      and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict
      and c.value_class in ('A','B') and c.index_override is null) then 'NOT_ELIGIBLE'
    when c.chk_human_review and c.chk_editorial_approval then 'APPROVED_TO_INDEX'
    else 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING' end as seo_status,
  case
    when (c.chk_governing_body and c.chk_current_status and c.chk_rules_verified and c.chk_sources_attached and c.chk_rules_traceable
      and c.chk_matrix_populated and c.chk_school_info_checked and c.chk_school_specific_value and c.chk_contact_checked
      and c.chk_scenarios_answered and c.chk_title_meta and c.chk_canonical and c.chk_internal_links and c.chk_no_open_conflict
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
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function record_human_review(text, text, text, date) from anon, authenticated;
    revoke all on function approve_page(text, text, date) from anon, authenticated;
    revoke all on function is_automated_actor(text) from anon, authenticated;
  end if;
end $$;

insert into schema_migrations (name) values ('0006_pilot_gate.sql');
commit;
select 'part 01 applied' as result;
