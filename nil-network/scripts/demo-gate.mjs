// Demonstration on the LOCAL reference database only (in-process, discarded on exit). Never run against the hosted database.
// Shows (1) a human review is stored once per rule and inherited by every page, and (2) the gate can graduate a page to "index".
if (process.env.DATABASE_URL) { console.error('Refusing to run: this demo must not touch the hosted database.'); process.exit(1); }
import { q } from '../src/lib/db.mjs';
const gate = async () => (await q(`select path, index_status, rules_without_human_review::int as unreviewed, chk_rules_verified, chk_contact_checked, chk_last_verified, chk_school_specific_value, human_approved from v_page_quality_gate order by path`));
// A second, simulated high school that exists only in this throwaway database, to show inheritance across schools.
await q(`insert into institutions (slug, name, institution_type, sector, state_id, city, publication_state) select 'demo-high-simulation', 'DEMO HIGH (simulation)', 'high_school', 'public', id, 'Nowhere', 'discovered' from states where code = 'FL'`);
await q(`insert into institution_governing_bodies (institution_id, governing_body_id) select i.id, g.id from institutions i, governing_bodies g where i.slug = 'demo-high-simulation' and g.slug = 'fhsaa'`);
await q(`insert into pages (path, page_type, institution_id, title, meta_description, h1) select '/demo/', 'high_school_hub', id, 't', 'd', 'h' from institutions where slug = 'demo-high-simulation'`);
console.log('BEFORE', await gate());
console.log('queue (top)', await q(`select scope_type, count(*)::int rules, max(pages_inheriting)::int max_pages from v_review_queue group by 1 order by 1`));
// one review of one FHSAA rule
const n = (await q(`select record_human_review('fhsaa-disclosure', 'DEMO REVIEWER (simulation)', 'demo') as n`))[0].n;
console.log('one review of fhsaa-disclosure was inherited by', n, 'page(s); rows written to rule_versions: 1');
// review every rule once (57 reviews, not one per page)
const all = await q(`select rule_slug from v_review_queue`);
for (const r of all) await q(`select record_human_review($1, 'DEMO REVIEWER (simulation)', 'demo')`, [r.rule_slug]);
console.log('reviews recorded:', all.length, '| human review events stored:', (await q(`select count(*)::int n from verification_events where status = 'human_reviewed'`))[0].n, '| rule-on-page rows covered:', (await q(`select count(*)::int n from v_institution_rules ir join pages p on p.institution_id = ir.institution_id`))[0].n);
console.log('AFTER REVIEWS', await gate());
console.log('approve UF ->', (await q(`select approve_page('/nil/florida/colleges/university-of-florida/', 'DEMO APPROVER (simulation)') as s`))[0].s);
console.log('approve Seminole ->', (await q(`select approve_page('/nil/florida/high-schools/seminole-high-school-sanford/', 'DEMO APPROVER (simulation)') as s`))[0].s);
console.log('FINAL', await gate());
process.exit(0);
