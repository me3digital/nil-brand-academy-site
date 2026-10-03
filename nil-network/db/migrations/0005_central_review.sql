-- Central human review. A person reviews a rule version once; every page that inherits the rule inherits the review.
-- Page-level review is limited to what is truly page-specific: the school's own facts and the editorial sign-off.

-- 1. Record a human review on the canonical rule version. Only ever call this for a review a person actually did.
create or replace function record_human_review(p_rule_slug text, p_reviewer text, p_note text default null, p_on date default current_date)
returns int language plpgsql as $$
declare v_id int; n int;
begin
  if coalesce(trim(p_reviewer), '') = '' then raise exception 'reviewer name is required'; end if;
  select v.id into v_id from rule_versions v join rules r on r.id = v.rule_id where r.slug = p_rule_slug and v.is_current;
  if v_id is null then raise exception 'no current version for rule %', p_rule_slug; end if;
  update rule_versions set review_method = 'human_review', last_verified_on = p_on, verified_by = p_reviewer, verification_status = 'verified' where id = v_id;
  insert into verification_events (entity_type, entity_id, status, method, verified_on, verified_by, notes)
    values ('rule_version', v_id, 'human_reviewed', 'second_checker', p_on, p_reviewer, p_note);
  select count(distinct p.id) into n from v_institution_rules ir join pages p on p.institution_id = ir.institution_id where ir.rule_version_id = v_id;
  return n;   -- how many school pages inherited this one review
end $$;

-- 2. Editorial sign-off for one page.
create or replace function approve_page(p_path text, p_approver text, p_on date default current_date)
returns text language plpgsql as $$
declare st text;
begin
  if coalesce(trim(p_approver), '') = '' then raise exception 'approver name is required'; end if;
  update pages set human_approved = true, approved_by = p_approver, approved_on = p_on where path = p_path;
  if not found then raise exception 'no page at %', p_path; end if;
  select index_status into st from v_page_quality_gate where path = p_path;
  return coalesce(st, 'not a school hub');
end $$;

-- Not callable through the public API.
revoke all on function record_human_review(text, text, text, date) from public;
revoke all on function approve_page(text, text, date) from public;

-- 3. The gate now requires a recorded human review on every rule a page inherits (before: on at least one).
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
    -- human review is recorded once on the rule version and inherited by every page under it
    (select count(*) from ir join rule_versions v on v.id = ir.rule_version_id where ir.institution_id = i.id
        and (v.review_method <> 'human_review' or v.last_verified_on is null)) as rules_without_human_review,
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
  (a.rule_count > 0 and a.rules_without_human_review = 0)                          as chk_last_verified,
  (not a.open_high_conflict)                                as chk_no_open_conflict,
  case when
        a.governing_body_identified and a.current_status_established
    and a.rule_count > 0 and a.rules_needing_review = 0 and a.rules_without_primary_source = 0
    and a.topics_answered >= 8 and a.school_research_documented
    and (a.school_level_rules + a.program_count
          + case when a.school_policy_published then 1 else 0 end
          + case when a.contact_verified then 1 else 0 end
          + case when a.institution_confirmed then 1 else 0 end) >= 3
    and a.contact_verified and a.scenarios_answered >= 5 and a.rules_without_human_review = 0
    and not a.open_high_conflict
    and p.title is not null and p.meta_description is not null and p.h1 is not null
    and p.human_approved and p.index_override is null
  then 'index' else 'noindex' end as index_status
from pages p
join agg a on a.institution_id = p.institution_id
where p.page_type in ('college_hub','high_school_hub');
alter view v_page_quality_gate set (security_invoker = true);

-- 4. Review queue: each rule once, with the number of pages one review unlocks.
create view v_review_queue as
select r.slug as rule_slug, r.scope_type, coalesce(gb.short_name, st.name || ' law', d.name, i.short_name, i.name) as issuer,
       t.label as topic, v.answer, v.trust_state, v.review_method, v.last_verified_on, v.verified_by,
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
  end if;
end $$;
