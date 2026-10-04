// Builds the human review queue and the per-school review checklists from the database.
//   node scripts/review-queue.mjs            -> review/review-queue.md, review/school-checklists.md, review/summary.json
// Nothing here marks anything as reviewed. It only lays the work out so a person can do it quickly.
import fs from 'node:fs';
import { q } from '../src/lib/db.mjs';
import { CHECKS, gateRows } from './gate-report.mjs';

const TRUST = { VERIFIED_TO_OFFICIAL_SOURCE: 'checked against source', PUBLIC_POLICY_NOT_LOCATED: 'not located', PENDING_INSTITUTION_CONFIRMATION: 'awaiting school', NEEDS_REVIEW: 'under review' };
const ANS = { yes: 'Allowed', yes_with_conditions: 'Allowed with conditions', only_with_approval: 'Approval required', no: 'Not allowed', not_addressed: 'Not publicly specified' };
const esc = (t) => String(t ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const gates = await gateRows();
const queue = await q(`select * from v_review_queue order by pages_inheriting desc, issuer, topic`);
const central = queue.filter((r) => r.scope_type === 'state' || (r.scope_type === 'governing_body' && r.pages_inheriting > 3));
const shared = queue.filter((r) => (r.scope_type === 'governing_body' && r.pages_inheriting <= 3) || r.scope_type === 'district');
const school = queue.filter((r) => r.scope_type === 'institution');

let out = `# Human review queue\n\nGenerated from the database on ${new Date().toISOString().slice(0, 10)}. Nothing in this queue has been reviewed by a person yet.\n\n`;
out += `## How to work this queue\n\n1. Part 1 first. Each statewide or national rule is reviewed once and every school under it inherits the review.\n2. Part 2 next: conference and district rules, each shared by a few schools.\n3. Part 3 last: one short checklist per school, covering only what is specific to that school.\n\nTo record a review, a person runs \`select record_human_review('<rule slug>', '<your name>', '<note>');\` in the Supabase SQL editor. To approve a page: \`select approve_page('<path>', '<your name>');\`. Both refuse automated names.\n\n`;
const table = (rows, withIssuer = true) => `| Rule | ${withIssuer ? 'Issuer | ' : ''}Topic | Bottom line | Citation | State | Pages |\n|---|${withIssuer ? '---|' : ''}---|---|---|---|---|\n` +
  rows.map((r) => `| \`${r.rule_slug}\` | ${withIssuer ? esc(r.issuer) + ' | ' : ''}${esc(r.topic)} | ${ANS[r.answer]} | ${esc(r.citation)} | ${TRUST[r.trust_state]} | ${r.pages_inheriting} |`).join('\n') + '\n\n';
out += `## Part 1. Central rules (${central.length} rules, reviewed once)\n\n`;
for (const issuer of [...new Set(central.map((r) => r.issuer))]) { const rows = central.filter((r) => r.issuer === issuer); out += `### ${issuer} (${rows.length} rules, inherited by ${Math.max(...rows.map((r) => r.pages_inheriting))} pages)\n\n` + table(rows, false); }
out += `## Part 2. Conference and district rules (${shared.length})\n\n` + table(shared);
out += `## Part 3. School-specific rules (${school.length})\n\nSee the per-school checklists. Summary by state:\n\n` + Object.entries(school.reduce((m, r) => { m[TRUST[r.trust_state]] = (m[TRUST[r.trust_state]] || 0) + 1; return m; }, {})).map(([k, v]) => `- ${k}: ${v}`).join('\n') + '\n';
fs.mkdirSync('review', { recursive: true });
fs.writeFileSync('review/review-queue.md', out);

// ---- per-school checklists
const recommend = (g, pending, review) => {
  if (g.seo_status === 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING') return g.value_class === 'A'
    ? 'SEO-ELIGIBLE / HUMAN-REVIEW-PENDING. Review first. Candidate to index once a person has reviewed and approved it.'
    : 'SEO-ELIGIBLE / HUMAN-REVIEW-PENDING. Review after the class A pages. Thinner school layer, so check the school-specific claims closely.';
  if (review) return 'HOLD. A source could only be read in part. Read the full document by hand, then re-run the gate.';
  if (pending) return 'HOLD. The school\'s published NIL guidance predates the current rules or is undated. Ask the school to confirm what is current, then re-run the gate.';
  if (g.value_class === 'D') return 'INCOMPLETE. Keep noindex. No athletics contact was located on the school\'s public pages.';
  return 'KEEP NOINDEX. State-rule-dominant. Useful in Find My School, not as an indexed page, unless the school or district confirms NIL guidance of its own.';
};
let md = `# Per-school review checklists\n\nOne record per school. Statewide and national rules are not repeated here: they are reviewed once in the central queue.\n\n`;
const summary = []; const records = [];
for (const g of gates) {
  const id = g.institution_id;
  const inst = (await q(`select i.*, d.name as district, c.short_name as conference from institutions i left join school_districts d on d.id = i.district_id left join governing_bodies c on c.id = i.conference_id where i.id = $1`, [id]))[0];
  const bodies = (await q(`select g.short_name from governing_bodies g join institution_governing_bodies ig on ig.governing_body_id = g.id where ig.institution_id = $1 order by g.id`, [id])).map((b) => b.short_name);
  const rules = await q(`select ir.rule_slug, ir.scope_type, ir.topic_slug, ir.topic_label, ir.answer, ir.summary, ir.citation, v.trust_state, v.nil_specific, v.review_note from v_institution_rules ir join rule_versions v on v.id = ir.rule_version_id where ir.institution_id = $1 and ir.scope_type in ('institution','district') order by ir.scope_type desc, ir.topic_sort`, [id]);
  const srcs = await q(`select distinct s.title, s.url, s.source_type, s.published_on from sources s where s.id in (
      select rs.source_id from rule_version_sources rs join v_institution_rules ir on ir.rule_version_id = rs.rule_version_id where ir.institution_id = $1 and ir.scope_type in ('institution','district')
      union select source_id from school_nil_policies where institution_id = $1 union select source_id from nil_programs where institution_id = $1
      union select source_id from school_contacts where institution_id = $1 union select profile_source_id from institutions where id = $1) order by s.title`, [id]);
  const search = (await q(`select * from policy_searches where institution_id = $1 order by search_date desc limit 1`, [id]))[0];
  const policies = await q(`select * from school_nil_policies where institution_id = $1`, [id]);
  const disc = await q(`select dr.*, ir.scope_type from disclosure_requirements dr join v_institution_rules ir on ir.rule_version_id = dr.rule_version_id where ir.institution_id = $1 and ir.scope_type in ('institution','district')`, [id]);
  const contacts = await q(`select * from school_contacts where institution_id = $1 and show_on_page order by id`, [id]);
  const notes = await q(`select kind, body from school_review_notes where institution_id = $1 order by id`, [id]);
  const N = (k) => notes.filter((n) => n.kind === k).map((n) => n.body);
  const fails = CHECKS.filter(([k]) => !g[k]).map(([, l]) => l);
  const autoFails = CHECKS.filter(([k]) => !g[k] && !['chk_human_review', 'chk_editorial_approval'].includes(k)).map(([, l]) => l);
  const pending = rules.filter((r) => r.trust_state === 'PENDING_INSTITUTION_CONFIRMATION').length;
  const review = rules.filter((r) => r.trust_state === 'NEEDS_REVIEW').length;
  const ip = rules.filter((r) => ['school-logos-marks', 'uniform-in-content', 'school-facilities', 'school-name-reference', 'event-footage'].includes(r.topic_slug));
  const rec = recommend(g, pending, review);
  const list = (arr, empty = 'None recorded.') => (arr.length ? arr.map((x) => `  - ${x}`).join('\n') : `  - ${empty}`);
  md += `## ${inst.name}\n\n`;
  md += `- **Page:** ${g.path}\n- **School type:** ${inst.sector} ${inst.institution_type === 'college' ? 'university, NCAA Division I' + (inst.conference ? ', ' + inst.conference : '') : 'high school' + (inst.district ? ', ' + inst.district : '')}\n- **City:** ${inst.city}\n- **Governing body:** ${bodies.join(', ')}\n`;
  md += `- **School-specific sources found (${srcs.length}):**\n${list(srcs.map((s) => `[${esc(s.title)}](${s.url})${s.published_on ? ' (' + String(s.published_on instanceof Date ? s.published_on.toISOString().slice(0, 10) : s.published_on) + ')' : ''}`))}\n`;
  md += `- **School-specific sources not found:**\n${list(N('not_found'), search?.public_policy_found ? 'Nothing specific was logged as missing.' : 'A school NIL policy was not located in the public sources reviewed as of October 3, 2026.')}\n`;
  md += `- **School-specific policy status:** ${policies.length ? policies.map((p) => `${esc(p.title)}: ${p.policy_status}${p.covers_nil ? '' : ' (does not cover NIL)'}`).join('; ') : 'No NIL policy document located'}. Public policy search: ${search?.public_policy_found ? 'guidance located' : 'not located'} (${search?.locations_checked?.length || 0} locations checked).\n`;
  md += `- **Disclosure process:** ${disc.length ? disc.map((d) => `${esc(d.what)} To: ${esc(d.recipient)}. When: ${esc(d.deadline_text)}${d.platform_name ? ' Platform: ' + d.platform_name + '.' : ''}`).join(' / ') : (rules.find((r) => r.topic_slug === 'disclosure-required') ? esc(rules.find((r) => r.topic_slug === 'disclosure-required').summary) + ` (${TRUST[rules.find((r) => r.topic_slug === 'disclosure-required').trust_state]})` : 'No school-specific process located. The inherited statewide or national process applies.')}\n`;
  md += `- **Official contact:**\n${list(contacts.map((c) => `${esc(c.office)}${c.person_name ? ', ' + c.person_name : ''} (${esc(c.role)})${c.phone ? ', ' + c.phone : ''} [${c.contact_scope}] ${c.url}`), 'None located.')}\n`;
  md += `- **Logo, uniform and facility guidance:**\n${list(ip.map((r) => `${r.topic_label} (${r.scope_type}, ${TRUST[r.trust_state]}${r.nil_specific ? '' : ', general policy that does not mention NIL'}): ${esc(r.summary)}`), 'None located at school or district level.')}\n`;
  md += `- **School and district rules on the page (${rules.length}):**\n${list(rules.map((r) => `\`${r.rule_slug}\` ${r.topic_label}: ${ANS[r.answer]} (${TRUST[r.trust_state]})`))}\n`;
  md += `- **Important school-specific claims to check first:**\n${list(N('claim'))}\n`;
  md += `- **Potential ambiguities:**\n${list([...N('ambiguity'), ...N('conflict').map((c) => 'Conflict: ' + c)])}\n`;
  md += `- **Sources requiring manual review:**\n${list(N('manual_review'))}\n`;
  if (N('left_off_page').length) md += `- **Found but left off the page:**\n${list(N('left_off_page'))}\n`;
  md += `- **Automated quality gate:** ${g.seo_status.replace(/_/g, ' ')}. School-specific value class ${g.value_class} (${g.value_class_label}). ${CHECKS.length - fails.length} of ${CHECKS.length} checks pass.\n`;
  md += `  - ${CHECKS.map(([k, l]) => `${l}: ${g[k] ? 'PASS' : 'FAIL'}`).join('\n  - ')}\n`;
  md += `- **Reason for failures:** ${autoFails.length ? autoFails.join('; ') + '.' : 'No automated check fails.'} Human review and editorial approval are not recorded (only a person can record them).${pending ? ` ${pending} school rule(s) await school confirmation.` : ''}${review ? ` ${review} school rule(s) are under review.` : ''}\n`;
  md += `- **Recommended editorial status:** ${rec}\n\n`;
  records.push({ name: inst.name, type: inst.institution_type, sector: inst.sector, city: inst.city, conference: inst.conference, district: inst.district, bodies, path: g.path,
    value_class: g.value_class, value_label: g.value_class_label, seo_status: g.seo_status, nil_items: Number(g.nil_items),
    sources: srcs.map((x) => ({ title: x.title, url: x.url, date: x.published_on ? String(x.published_on instanceof Date ? x.published_on.toISOString().slice(0, 10) : x.published_on) : null })),
    not_found: N('not_found'), policy_found: !!search?.public_policy_found, locations: search?.locations_checked?.length || 0, policies: policies.map((p) => ({ title: p.title, status: p.policy_status, covers_nil: p.covers_nil })),
    disclosure: disc.map((d) => ({ what: d.what, recipient: d.recipient, when: d.deadline_text, platform: d.platform_name })),
    contacts: contacts.map((c) => ({ office: c.office, person: c.person_name, role: c.role, phone: c.phone, scope: c.contact_scope, url: c.url })),
    rules: rules.map((r) => ({ slug: r.rule_slug, scope: r.scope_type, topic: r.topic_label, topic_slug: r.topic_slug, answer: ANS[r.answer], trust: TRUST[r.trust_state], nil_specific: r.nil_specific, summary: r.summary })),
    claims: N('claim'), ambiguities: [...N('ambiguity'), ...N('conflict').map((c) => 'Conflict: ' + c)], manual: N('manual_review'), left_off: N('left_off_page'),
    checks: CHECKS.map(([k, l]) => [l, !!g[k]]), reason: (autoFails.length ? autoFails.join('; ') + '. ' : 'No automated check fails. ') + 'Human review and editorial approval are not recorded.' + (pending ? ` ${pending} school rule(s) await school confirmation.` : '') + (review ? ` ${review} school rule(s) are under review.` : ''),
    recommended: rec });
  summary.push({ name: inst.name, type: inst.institution_type, city: inst.city, path: g.path, value_class: g.value_class, seo_status: g.seo_status, index_status: g.index_status, nil_items: Number(g.nil_items),
    school_rules: rules.filter((r) => r.scope_type === 'institution').length, pending, review, policy_found: !!search?.public_policy_found, policy_published: policies.some((p) => p.policy_status === 'published' && p.covers_nil),
    workflow: disc.length > 0, contact: contacts.length > 0, athletics_contact: g.athletics_contact_found, sources: srcs.length, claims: N('claim').length, ambiguities: N('ambiguity').length + N('conflict').length, manual: N('manual_review').length,
    checks: Object.fromEntries(CHECKS.map(([k]) => [k, !!g[k]])), autoFails, recommended: rec });
}
fs.writeFileSync('review/school-checklists.md', md);
const src = (await q(`select count(*)::int n, count(*) filter (where is_primary)::int p from sources`))[0];
const counts = {};
for (const t of ['institutions', 'school_districts', 'governing_bodies', 'sources', 'rules', 'rule_versions', 'rule_version_sources', 'policy_searches', 'school_nil_policies', 'nil_programs', 'school_contacts', 'school_review_notes', 'pages', 'sports', 'institution_sports', 'scenarios', 'guidance_blocks', 'rule_change_log', 'conflicts', 'monitors'])
  counts[t] = (await q(`select count(*)::int n from ${t}`))[0].n;
fs.writeFileSync('review/summary.json', JSON.stringify({ schools: summary, sources: src, counts, queue: { central: central.length, shared: shared.length, school: school.length },
  centralByIssuer: Object.fromEntries([...new Set(central.map((r) => r.issuer))].map((i) => [i, central.filter((r) => r.issuer === i).length])),
  conflicts: await q(`select r.slug, c.severity, c.summary from conflicts c join rules r on r.id = c.rule_id where c.status = 'open' order by c.severity, r.slug`) }, null, 1));
// ---- tiered, prioritised queue (Phase 3B)
const HIGH = new Set(['disclosure-required', 'deal-review', 'pay-for-play', 'prohibited-categories', 'penalties', 'agents', 'boosters', 'collectives', 'school-staff-involvement', 'recruiting-inducement', 'transfers', 'international-athletes', 'school-payments', 'nil-allowed']);
const MED = new Set(['school-logos-marks', 'uniform-in-content', 'school-facilities', 'school-name-reference', 'event-footage', 'deal-terms', 'contract-length', 'parent-guardian', 'team-activities']);
const detail = await q(`select r.slug, r.scope_type, r.applies_to, t.slug as topic_slug, t.label as topic, t.question, v.id as vid, v.answer, v.summary, v.conditions, v.citation, v.trust_state, v.review_method, v.nil_specific, v.short_answer,
    coalesce(gb.short_name, st.name || ' law', d.name, i.short_name, i.name) as issuer, gb.body_type, i.slug as inst_slug, d.slug as district_slug
  from rules r join rule_versions v on v.rule_id = r.id and v.is_current join rule_topics t on t.id = r.rule_topic_id
  left join governing_bodies gb on gb.id = r.governing_body_id left join states st on st.id = r.state_id and r.scope_type = 'state'
  left join school_districts d on d.id = r.district_id and r.scope_type = 'district' left join institutions i on i.id = r.institution_id and r.scope_type = 'institution'
  where r.status = 'active' order by r.id`);
const rsrc = await q(`select rs.rule_version_id as vid, rs.locator, rs.quote, rs.quote_check, s.title, s.url, s.published_on, s.is_primary from rule_version_sources rs join sources s on s.id = rs.source_id order by rs.id`);
const METHOD = { raw_source_text: 'page text read by machine and matched to the quote', visual_source_check: 'read on screen from the official document', automated_extraction: 'machine summary only', human_review: 'human reviewed' };
const items = detail.map((r) => ({
  slug: r.slug, tier: r.scope_type === 'state' || r.scope_type === 'governing_body' ? 1 : 2, scope: r.scope_type, applies: r.applies_to, issuer: r.issuer, inst: r.inst_slug, district: r.district_slug,
  claim: r.question, bottom_line: ANS[r.answer], summary: r.summary, conditions: r.conditions, citation: r.citation,
  machine: `${TRUST[r.trust_state]}; ${METHOD[r.review_method] || r.review_method}`, trust: r.trust_state,
  approving: r.trust_state === 'PUBLIC_POLICY_NOT_LOCATED' ? 'That "not located" is a fair statement of the search, and that nothing in the cited source answers the question.'
    : r.trust_state === 'PENDING_INSTITUTION_CONFIRMATION' ? 'Nothing yet. This rule waits on the school. Review only if the school confirms it is current.'
    : 'That the plain-English summary says what the quoted source says, no more and no less, and that the source is the current one.',
  risk: HIGH.has(r.topic_slug) ? 'high' : MED.has(r.topic_slug) ? 'medium' : 'low', topic: r.topic, nil_specific: r.nil_specific,
  pages: Number(queue.find((x) => x.rule_slug === r.slug)?.pages_inheriting || 0),
  sources: rsrc.filter((x) => x.vid === r.vid).map((x) => ({ title: x.title, url: x.url, locator: x.locator, quote: x.quote, date: x.published_on ? String(x.published_on instanceof Date ? x.published_on.toISOString().slice(0, 10) : x.published_on) : null, primary: x.is_primary })),
}));
// review order: central college rules, then the strongest college, the other strong colleges, moderate colleges, then eligible high schools
const elig = records.filter((r) => r.seo_status === 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING');
const slugOf = (r) => r.path.split('/').slice(-2, -1)[0];
const FIRST = 'university-of-florida';
const colA = elig.filter((r) => r.type === 'college' && r.value_class === 'A').sort((a, b) => (slugOf(a) === FIRST ? -1 : slugOf(b) === FIRST ? 1 : b.nil_items - a.nil_items));
const colB = elig.filter((r) => r.type === 'college' && r.value_class === 'B').sort((a, b) => b.nil_items - a.nil_items);
const hsE = elig.filter((r) => r.type === 'high_school');
const conf = (r) => items.filter((x) => x.tier === 1 && x.scope === 'governing_body' && r.conference && x.issuer === r.conference);
const steps = [];
steps.push({ title: 'Central college rules', note: 'NCAA, College Sports Commission and Florida law. Reviewed once, inherited by all 13 college pages.', rules: items.filter((x) => x.tier === 1 && x.applies !== 'high_school' && !['conference'].includes(detail.find((d) => d.slug === x.slug).body_type) && x.issuer !== 'FHSAA' && !(x.applies === 'both' && x.issuer === 'FHSAA')).filter((x) => detail.find((d) => d.slug === x.slug).applies_to !== 'high_school').map((x) => x.slug), page: null });
for (const r of [...colA, ...colB]) steps.push({ title: r.name, note: `${r.value_class === 'A' ? 'Strong' : 'Moderate'} college page. ${slugOf(r) === FIRST ? 'Recommended first page to take through the whole workflow.' : ''}`.trim(), rules: [...conf(r).map((x) => x.slug), ...items.filter((x) => x.inst === slugOf(r)).map((x) => x.slug)], page: r.path });
if (hsE.length) {
  steps.push({ title: 'Central high school rules', note: 'FHSAA and Florida law. Reviewed once, inherited by every Florida high school page.', rules: items.filter((x) => x.tier === 1 && detail.find((d) => d.slug === x.slug).applies_to !== 'college' && (x.issuer === 'FHSAA' || detail.find((d) => d.slug === x.slug).applies_to === 'high_school')).map((x) => x.slug), page: null });
  const dists = [...new Set(hsE.map((r) => r.district))];
  for (const dn of dists) steps.push({ title: dn, note: 'District rules. Reviewed once, inherited by every school in the district.', rules: items.filter((x) => x.scope === 'district' && x.issuer === dn).map((x) => x.slug), page: null });
  for (const r of hsE) steps.push({ title: r.name, note: 'High school page that passes the automated gate on the strength of its district NIL policy.', rules: items.filter((x) => x.inst === slugOf(r)).map((x) => x.slug), page: r.path });
}
const queued = new Set(steps.flatMap((s) => s.rules));
const access = await q(`select sa.*, coalesce((select json_agg(coalesce(i.name, d.name) order by coalesce(i.name, d.name)) from source_access_pages sp left join institutions i on i.id = sp.institution_id left join school_districts d on d.id = sp.district_id where sp.issue_id = sa.id), '[]') as owners from source_access_issues sa order by sa.class, sa.status, sa.id`);
const workload = { tier1_total: items.filter((x) => x.tier === 1).length, tier2_total: items.filter((x) => x.tier === 2).length, tier3_total: records.length,
  tier1_queued: [...queued].filter((s) => items.find((x) => x.slug === s).tier === 1).length, tier2_queued: [...queued].filter((s) => items.find((x) => x.slug === s).tier === 2).length, tier3_queued: steps.filter((s) => s.page).length,
  first_page: { rules_central: steps[0].rules.length, rules_school: steps[1]?.rules.length, approvals: 1 }, display_instances: Number((await q(`select count(*)::int n from v_institution_rules ir join pages p on p.institution_id = ir.institution_id`))[0].n) };
fs.writeFileSync('review/data.json', JSON.stringify({ generated: new Date().toISOString().slice(0, 10), records, items, steps, workload,
  access: access.map((a) => ({ title: a.title, organization: a.organization, url: a.url, class: a.class, status: a.status, risk: a.risk, occurrences: a.occurrences, claim: a.claim_affected, support: a.other_support, why: a.why_unopened, retry: a.retry, finding: a.finding, owners: typeof a.owners === 'string' ? JSON.parse(a.owners) : a.owners })) }));
console.log('workload', JSON.stringify(workload)); console.log('steps', steps.map((s) => `${s.title}:${s.rules.length}`).join(' | '));
console.log('central', central.length, 'shared', shared.length, 'school', school.length, '| sources', src, '| schools', summary.length);
process.exit(0);
