// Local-only proof that automated actors cannot record a human review or an approval. Refuses to run against a hosted database.
import { q } from '../src/lib/db.mjs';
if (process.env.DATABASE_URL) { console.error('Local reference database only.'); process.exit(1); }
const attempt = async (label, sql, params, shouldFail) => { let failed = false, msg = ''; try { await q(sql, params); } catch (e) { failed = true; msg = e.message; }
  console.log(`${failed === shouldFail ? 'PASS' : 'FAIL'}  ${label}${failed ? '  -> refused: ' + msg.slice(0, 90) : '  -> accepted'}`); if (failed !== shouldFail) process.exitCode = 1; };
await attempt('record_human_review as "Claude (automated source research)"', `select record_human_review('fhsaa-nil-allowed', $1)`, ['Claude (automated source research)'], true);
await attempt('record_human_review as "automated pipeline"', `select record_human_review('fhsaa-nil-allowed', $1)`, ['automated pipeline'], true);
await attempt('record_human_review with a blank name', `select record_human_review('fhsaa-nil-allowed', $1)`, ['  '], true);
await attempt('direct UPDATE setting review_method to human_review with an automated name', `update rule_versions set review_method = 'human_review', last_verified_on = current_date, verified_by = 'seed script' where id = 1`, [], true);
await attempt('direct UPDATE setting review_method to human_review with no name', `update rule_versions set review_method = 'human_review', last_verified_on = current_date, verified_by = null where id = 1`, [], true);
await attempt('approve_page as "Claude"', `select approve_page('/nil/florida/colleges/university-of-florida/', $1)`, ['Claude'], true);
await attempt('direct UPDATE setting human_approved with no approver', `update pages set human_approved = true where path = '/nil/florida/colleges/university-of-florida/'`, [], true);
const before = (await q(`select count(*)::int n from rule_versions where review_method = 'human_review'`))[0].n + (await q(`select count(*)::int n from pages where human_approved`))[0].n;
console.log(`human-review and approval records after the refused attempts: ${before} (expected 0)`);
await attempt('record_human_review with a person\'s name (demo, local only)', `select record_human_review('fhsaa-nil-allowed', $1, 'local demo')`, ['Demo Reviewer'], false);
process.exit(process.exitCode || 0);
