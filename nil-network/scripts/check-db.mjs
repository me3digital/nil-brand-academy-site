import { q } from '../src/lib/db.mjs';
const c = async (t) => (await q(`select count(*)::int n from ${t}`))[0].n;
for (const t of ['states','governing_bodies','institutions','sources','rule_topics','rules','rule_versions','rule_version_sources','scenarios','guidance_blocks','pages'])
  console.log(t.padEnd(24), await c(t));
console.log(await q(`select i.slug, count(*)::int rules from v_institution_rules r join institutions i on i.id=r.institution_id group by 1`));
const g = await q(`select path, index_status, rule_count::int, rules_needing_review::int, topics_answered::int, school_level_rules::int, program_count::int, scenarios_answered::int,
 chk_governing_body, chk_current_status, chk_rules_verified, chk_sources_attached, chk_matrix_populated, chk_school_info_checked, chk_school_specific_value, chk_contact_checked, chk_scenarios_answered, chk_last_verified, chk_no_open_conflict, meta_complete, human_approved from v_page_quality_gate`);
console.log(g);

console.log(await q(`select trust_state, review_method, count(*)::int n from rule_versions group by 1,2 order by 1,2`));
console.log(await q(`select i.slug, public_policy_found, array_length(locations_checked,1) checked from policy_searches p join institutions i on i.id=p.institution_id`));
