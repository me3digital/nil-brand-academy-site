// Prints the quality gate for every school page: one row per page, PASS/FAIL per category.
import { q } from '../src/lib/db.mjs';
export const CHECKS = [
  ['chk_governing_body', 'Governing body identified'], ['chk_rules_established', 'Current statewide/national rules established'],
  ['chk_sources_attached', 'Primary sources attached'], ['chk_rules_traceable', 'Rule summaries trace to canonical records'],
  ['chk_school_info_checked', 'School/district research completed'], ['chk_school_specific_value', 'School-specific value present'],
  ['chk_contact_checked', 'Official contact checked'], ['chk_scenarios_answered', 'Scenarios populated'], ['chk_title_meta', 'Title/meta complete'],
  ['chk_canonical', 'Canonical complete'], ['chk_internal_links', 'Internal links complete'], ['chk_no_open_conflict', 'No unresolved source conflict'],
  ['chk_human_review', 'Human review complete'], ['chk_editorial_approval', 'Editorial approval complete'],
];
export async function gateRows() {
  return q(`select g.*, i.name, i.short_name, i.city, i.institution_type from v_page_quality_gate g join institutions i on i.id = g.institution_id order by i.institution_type, i.name`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await gateRows();
  for (const r of rows) {
    const fails = CHECKS.filter(([k]) => !r[k]).map(([k]) => k.replace('chk_', ''));
    console.log(`${r.name.padEnd(36)} ${r.value_class} ${r.seo_status.padEnd(34)} ${r.index_status.padEnd(8)} nil=${r.nil_items} sup=${r.supporting_items} review=${r.rules_needing_review} | FAIL: ${fails.join(', ')}`);
  }
  const by = (k) => rows.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
  console.log(by('value_class'), by('seo_status'), by('index_status'));
  process.exit(0);
}
