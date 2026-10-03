-- Convenience splits
create view colleges as select * from institutions where institution_type = 'college';
create view high_schools as select * from institutions where institution_type = 'high_school';
create view athletic_conferences as select * from governing_bodies where body_type = 'conference';

-- THE CASCADE: every current rule that applies to an institution, from every layer above it.
-- Change one statewide rule version and every school under it inherits the change.
create view v_institution_rules as
select
  i.id                as institution_id,
  r.id                as rule_id,
  r.slug              as rule_slug,
  r.scope_type,
  case r.scope_type when 'state' then 1 when 'governing_body' then 2 when 'district' then 3 else 4 end as layer_order,
  coalesce(gb.short_name, st.name || ' law', d.name, i.short_name, i.name) as issuer_name,
  gb.slug             as governing_body_slug,
  t.id                as rule_topic_id,
  t.slug              as topic_slug,
  t.label             as topic_label,
  t.question          as topic_question,
  t.in_ip_matrix,
  t.sort_order        as topic_sort,
  c.slug              as category_slug,
  c.name              as category_name,
  c.sort_order        as category_sort,
  v.id                as rule_version_id,
  v.version_no,
  v.answer,
  v.summary,
  v.conditions,
  v.citation,
  v.effective_date,
  v.effective_note,
  v.verification_status,
  v.last_verified_on,
  v.verified_by
from institutions i
join rules r on r.status = 'active'
  and (r.applies_to = 'both' or r.applies_to = i.institution_type)
  and (
       (r.scope_type = 'state' and r.state_id = i.state_id)
    or (r.scope_type = 'governing_body' and (
          r.governing_body_id = i.conference_id
          or exists (select 1 from institution_governing_bodies igb
                     where igb.institution_id = i.id and igb.governing_body_id = r.governing_body_id)))
    or (r.scope_type = 'district' and r.district_id = i.district_id)
    or (r.scope_type = 'institution' and r.institution_id = i.id)
  )
join rule_versions v on v.rule_id = r.id and v.is_current
join rule_topics t on t.id = r.rule_topic_id
join rule_categories c on c.id = t.category_id
left join governing_bodies gb on gb.id = r.governing_body_id
left join states st on st.id = r.state_id and r.scope_type = 'state'
left join school_districts d on d.id = r.district_id and r.scope_type = 'district';

-- Same cascade at state level (rules every school of that level in the state inherits).
create view v_state_rules as
select
  s.id as state_id, lvl.level,
  r.id as rule_id, r.slug as rule_slug, r.scope_type,
  case r.scope_type when 'state' then 1 else 2 end as layer_order,
  coalesce(gb.short_name, s.name || ' law') as issuer_name,
  gb.slug as governing_body_slug,
  t.id as rule_topic_id, t.slug as topic_slug, t.label as topic_label, t.question as topic_question,
  t.in_ip_matrix, t.sort_order as topic_sort,
  c.slug as category_slug, c.name as category_name, c.sort_order as category_sort,
  v.id as rule_version_id, v.version_no, v.answer, v.summary, v.conditions, v.citation,
  v.effective_date, v.effective_note, v.verification_status, v.last_verified_on, v.verified_by
from states s
cross join (values ('high_school'), ('college')) as lvl(level)
join rules r on r.status = 'active'
  and (r.applies_to = 'both' or r.applies_to = lvl.level)
  and (
       (r.scope_type = 'state' and r.state_id = s.id)
    or (r.scope_type = 'governing_body' and exists (
          select 1 from governing_bodies g
          where g.id = r.governing_body_id
            and g.body_type <> 'conference'
            and (g.state_id = s.id or g.state_id is null)))
  )
join rule_versions v on v.rule_id = r.id and v.is_current
join rule_topics t on t.id = r.rule_topic_id
join rule_categories c on c.id = t.category_id
left join governing_bodies gb on gb.id = r.governing_body_id;

-- INDEX QUALITY GATE for school hubs. A page is indexable only when every check passes.
-- No word counts. Every check is about verified, school-relevant utility.
create view v_page_quality_gate as
with ir as (
  select * from v_institution_rules
),
agg as (
  select
    i.id as institution_id,
    exists (select 1 from institution_governing_bodies g where g.institution_id = i.id) as governing_body_identified,
    exists (select 1 from ir where ir.institution_id = i.id and ir.topic_slug = 'nil-allowed') as current_status_established,
    (select count(*) from ir where ir.institution_id = i.id) as rule_count,
    (select count(*) from ir where ir.institution_id = i.id
        and ir.verification_status not in ('verified','school_confirmed')) as rules_not_verified,
    (select count(*) from ir where ir.institution_id = i.id
        and not exists (select 1 from rule_version_sources rs join sources s on s.id = rs.source_id
                        where rs.rule_version_id = ir.rule_version_id and s.is_primary)) as rules_without_primary_source,
    (select count(distinct ir.topic_slug) from ir where ir.institution_id = i.id and ir.answer <> 'not_addressed') as topics_answered,
    (select count(*) from ir where ir.institution_id = i.id and ir.scope_type in ('district','institution')
        and ir.answer <> 'not_addressed') as school_level_rules,
    exists (select 1 from school_nil_policies p where p.institution_id = i.id) as school_policy_checked,
    exists (select 1 from school_nil_policies p where p.institution_id = i.id and p.policy_status = 'published') as school_policy_published,
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
  -- individual checks
  a.governing_body_identified                          as chk_governing_body,
  a.current_status_established                         as chk_current_status,
  (a.rule_count > 0 and a.rules_not_verified = 0)      as chk_rules_verified,
  (a.rule_count > 0 and a.rules_without_primary_source = 0) as chk_sources_attached,
  (a.topics_answered >= 8)                             as chk_matrix_populated,
  a.school_policy_checked                              as chk_school_info_checked,
  -- duplicate/thin-content guard: the page must hold facts the state hub does not
  ((a.school_level_rules + a.program_count + case when a.school_policy_published then 1 else 0 end) >= 3) as chk_school_specific_value,
  a.contact_verified                                   as chk_contact_checked,
  (a.scenarios_answered >= 5)                          as chk_scenarios_answered,
  (a.last_verified_on is not null)                     as chk_last_verified,
  (not a.open_high_conflict)                           as chk_no_open_conflict,
  case when
        a.governing_body_identified and a.current_status_established
    and a.rule_count > 0 and a.rules_not_verified = 0 and a.rules_without_primary_source = 0
    and a.topics_answered >= 8 and a.school_policy_checked
    and (a.school_level_rules + a.program_count + case when a.school_policy_published then 1 else 0 end) >= 3
    and a.contact_verified and a.scenarios_answered >= 5 and a.last_verified_on is not null
    and not a.open_high_conflict
    and p.title is not null and p.meta_description is not null and p.h1 is not null
    and p.human_approved and p.index_override is null
  then 'index' else 'noindex' end as index_status
from pages p
join agg a on a.institution_id = p.institution_id
where p.page_type in ('college_hub','high_school_hub');
