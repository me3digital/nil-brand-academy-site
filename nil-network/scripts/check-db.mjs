import { q } from '../src/lib/db.mjs';
const c = async (t) => (await q(`select count(*)::int n from ${t}`))[0].n;
for (const t of ['states','governing_bodies','institutions','sources','rule_topics','rules','rule_versions','rule_version_sources','scenarios','guidance_blocks','pages'])
  console.log(t.padEnd(24), await c(t));
console.log(await q(`select i.slug, count(*)::int rules from v_institution_rules r join institutions i on i.id=r.institution_id group by 1`));
const g = await q(`select path, index_status, rule_count::int, rules_not_verified::int, topics_answered::int, school_level_rules::int, program_count::int, scenarios_answered::int,
 chk_governing_body, chk_current_status, chk_rules_verified, chk_sources_attached, chk_matrix_populated, chk_school_info_checked, chk_school_specific_value, chk_contact_checked, chk_scenarios_answered, chk_last_verified, chk_no_open_conflict, meta_complete, human_approved from v_page_quality_gate`);
console.log(g);
