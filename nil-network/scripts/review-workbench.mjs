// Builds the private review workbench page (review/pilot-review-workbench.html) from review/data.json.
// Run scripts/review-queue.mjs first. The page is for the ME3 review team; it is never part of the public site.
import fs from 'node:fs';
const data = fs.readFileSync('review/data.json', 'utf8').replace(/</g, '\\u003c');
const html = `<title>Florida Pilot Review Workbench</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Lato:wght@400;700&display=swap">
<style>
/* Layout: a filter bar over a single column of school records; each record opens to the 16-field checklist. */
:root { --bg:#f7f5fa; --panel:#ffffff; --fg:#231a33; --muted:#665c78; --line:#ddd6e8; --accent:#4b2a8c; --accent-soft:#ece5f8;
  --good:#1d6b45; --good-bg:#e2f3ea; --warn:#8a5a00; --warn-bg:#fbefd2; --bad:#9b2c2c; --bad-bg:#fbe4e4; --hold:#3e5a8a; --hold-bg:#e3ebf8;
  --display:'Fraunces', Georgia, serif; --body:'Lato', 'Helvetica Neue', Arial, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#17121f; --panel:#211a2d; --fg:#ece7f4; --muted:#a79dba; --line:#3a3049; --accent:#b99cf0; --accent-soft:#2f2543;
  --good:#7fd3a6; --good-bg:#173527; --warn:#f0c66b; --warn-bg:#3d3013; --bad:#f29a9a; --bad-bg:#431f1f; --hold:#9fbcf0; --hold-bg:#1e2c47; color-scheme: dark } }
:root[data-theme="dark"] { --bg:#17121f; --panel:#211a2d; --fg:#ece7f4; --muted:#a79dba; --line:#3a3049; --accent:#b99cf0; --accent-soft:#2f2543;
  --good:#7fd3a6; --good-bg:#173527; --warn:#f0c66b; --warn-bg:#3d3013; --bad:#f29a9a; --bad-bg:#431f1f; --hold:#9fbcf0; --hold-bg:#1e2c47; color-scheme: dark }
* { box-sizing: border-box }
body { background: var(--bg); color: var(--fg); font: 15px/1.5 var(--body); padding-inline: 16px; padding-block: 24px 64px }
.wrap { max-width: 980px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px }
h1 { font: 600 28px/1.15 var(--display); margin: 0; text-wrap: balance }
h2 { font: 600 20px/1.2 var(--display); margin: 0 }
p { margin: 0 } a { color: var(--accent) } .muted { color: var(--muted) }
.lede { max-width: 68ch; color: var(--muted) }
.tabs { display: flex; gap: 8px; flex-wrap: wrap }
.tabs button, .chips button { font: 700 13px var(--body); border: 1px solid var(--line); background: var(--panel); color: var(--fg); padding: 8px 14px; border-radius: 999px; cursor: pointer }
.tabs button[aria-selected="true"], .chips button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--bg) }
button:focus-visible, summary:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px }
.bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center }
.chips { display: flex; flex-wrap: wrap; gap: 6px }
input[type=search] { font: 15px var(--body); padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--fg); min-width: 0; flex: 1 1 220px }
.count { color: var(--muted); font-size: 13px }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px }
.stat { border-top: 2px solid var(--line); padding-top: 8px } .stat b { display: block; font: 600 24px/1 var(--display); font-variant-numeric: tabular-nums } .stat span { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em }
.list { display: flex; flex-direction: column; gap: 8px }
details.rec { background: var(--panel); border: 1px solid var(--line); border-radius: 10px }
details.rec > summary { list-style: none; cursor: pointer; padding: 12px 14px; display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 12px; align-items: center }
details.rec > summary::-webkit-details-marker { display: none }
.cls { width: 34px; height: 34px; border-radius: 8px; display: grid; place-items: center; font: 600 17px var(--display) }
.cls.A { background: var(--good-bg); color: var(--good) } .cls.B { background: var(--hold-bg); color: var(--hold) } .cls.C { background: var(--warn-bg); color: var(--warn) } .cls.D { background: var(--bad-bg); color: var(--bad) }
.nm { font-weight: 700 } .sub { font-size: 13px; color: var(--muted) }
.pill { font: 700 11px var(--body); letter-spacing: .04em; text-transform: uppercase; padding: 4px 9px; border-radius: 999px; white-space: nowrap }
.pill.ok { background: var(--good-bg); color: var(--good) } .pill.hold { background: var(--hold-bg); color: var(--hold) } .pill.no { background: var(--warn-bg); color: var(--warn) } .pill.inc { background: var(--bad-bg); color: var(--bad) }
.body { padding: 4px 14px 16px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 14px }
.rec-line { background: var(--accent-soft); border-radius: 8px; padding: 10px 12px; margin-top: 12px }
dl.f { display: grid; grid-template-columns: minmax(120px, 190px) minmax(0, 1fr); gap: 8px 16px; margin: 0 }
dl.f dt { font: 700 12px var(--body); text-transform: uppercase; letter-spacing: .05em; color: var(--muted); padding-top: 2px } dl.f dd { margin: 0; min-width: 0; overflow-wrap: anywhere }
dl.f ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px }
.checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 4px 14px; list-style: none; padding: 0; margin: 0; font-size: 13px }
.checks li::before { content: 'FAIL'; font: 700 10px var(--body); margin-right: 6px; padding: 1px 5px; border-radius: 4px; background: var(--bad-bg); color: var(--bad) }
.checks li.p::before { content: 'PASS'; background: var(--good-bg); color: var(--good) }
.tag { font-size: 12px; color: var(--muted) }
.tw { overflow-x: auto } table { border-collapse: collapse; width: 100%; font-size: 13px; background: var(--panel) } th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--line); vertical-align: top } th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted) } td.n { font-variant-numeric: tabular-nums; text-align: right }
code { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--accent-soft); padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere }
.copy { font: 700 11px var(--body); border: 1px solid var(--line); background: transparent; color: var(--accent); border-radius: 6px; padding: 2px 7px; cursor: pointer }
@media (max-width: 560px) { dl.f { grid-template-columns: 1fr } details.rec > summary { grid-template-columns: 34px minmax(0, 1fr) } details.rec > summary .pill { grid-column: 2; justify-self: start } }
</style>
<div class="wrap">
  <header style="display:flex;flex-direction:column;gap:8px">
    <h1>Florida Pilot Review Workbench</h1>
    <p class="lede">One record per school, built from the database on <span id="gen"></span>. Nothing here has been reviewed by a person yet. Statewide and national rules are reviewed once in the rule queue, and every school inherits that review.</p>
  </header>
  <div class="stats" id="stats"></div>
  <div class="tabs" role="tablist">
    <button role="tab" id="tab-schools" aria-selected="true" aria-controls="schools">Schools</button>
    <button role="tab" id="tab-queue" aria-selected="false" aria-controls="queue">Rule queue</button>
  </div>
  <section id="schools" role="tabpanel" aria-labelledby="tab-schools" style="display:flex;flex-direction:column;gap:12px">
    <div class="bar">
      <input type="search" id="q" placeholder="Search a school or city" aria-label="Search a school or city">
      <div class="chips" id="chips"></div>
    </div>
    <p class="count" id="count"></p>
    <div class="list" id="list"></div>
  </section>
  <section id="queue" role="tabpanel" aria-labelledby="tab-queue" hidden style="flex-direction:column;gap:16px">
    <p class="lede">Work top to bottom. Central rules first: one review covers every page that inherits the rule. To record a review, a person runs the command in the Supabase SQL editor with their own name. Automated names are refused.</p>
    <div id="qbody" style="display:flex;flex-direction:column;gap:18px"></div>
  </section>
</div>
<script id="data" type="application/json">${data}</script>
<script>
const D = JSON.parse(document.getElementById('data').textContent);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STAGE = 'https://nil-brand-academy-staging.netlify.app';
document.getElementById('gen').textContent = D.generated;
const group = (r) => r.seo_status === 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING' ? 'eligible' : r.value_class === 'D' ? 'incomplete' : /^HOLD/.test(r.recommended) ? 'hold' : 'thin';
const PILL = { eligible: ['ok', 'Eligible, review pending'], hold: ['hold', 'Hold'], thin: ['no', 'Keep noindex'], incomplete: ['inc', 'Incomplete'] };
const R = D.records.map((r) => ({ ...r, group: group(r) }));
const order = { eligible: 0, hold: 1, thin: 2, incomplete: 3 };
R.sort((a, b) => order[a.group] - order[b.group] || a.value_class.localeCompare(b.value_class) || b.nil_items - a.nil_items || a.name.localeCompare(b.name));
const n = (f) => R.filter(f).length;
document.getElementById('stats').innerHTML = [[R.length, 'Schools'], [n((r) => r.group === 'eligible'), 'Eligible, review pending'], [n((r) => r.group === 'hold'), 'On hold'], [n((r) => r.group === 'thin'), 'Keep noindex'], [n((r) => r.group === 'incomplete'), 'Incomplete'], [D.queue.filter((x) => x.group === 'central').length, 'Central rules to review']]
  .map(([v, l]) => '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>').join('');
const FILTERS = [['all', 'All'], ['eligible', 'Eligible'], ['hold', 'Hold'], ['thin', 'Keep noindex'], ['incomplete', 'Incomplete'], ['college', 'Colleges'], ['high_school', 'High schools']];
let active = 'all';
const chips = document.getElementById('chips');
chips.innerHTML = FILTERS.map(([k, l]) => '<button type="button" id="chip-' + k + '" data-k="' + k + '" aria-pressed="' + (k === 'all') + '">' + l + '</button>').join('');
const ul = (a, empty) => a.length ? '<ul>' + a.map((x) => '<li>' + x + '</li>').join('') + '</ul>' : '<span class="muted">' + (empty || 'None recorded.') + '</span>';
const rec = (r) => {
  const ip = r.rules.filter((x) => ['school-logos-marks', 'uniform-in-content', 'school-facilities', 'school-name-reference', 'event-footage'].includes(x.topic_slug));
  const [pc, pl] = PILL[r.group];
  return '<details class="rec" id="rec-' + r.path.split('/').slice(-2, -1)[0] + '"><summary><span class="cls ' + r.value_class + '" title="' + esc(r.value_label) + '">' + r.value_class + '</span><span><span class="nm">' + esc(r.name) + '</span><br><span class="sub">' + esc(r.city) + ' &middot; ' + (r.type === 'college' ? 'College' + (r.conference ? ', ' + esc(r.conference) : '') : 'High school') + ' &middot; ' + r.rules.filter((x) => x.scope === 'institution').length + ' school rules</span></span><span class="pill ' + pc + '">' + pl + '</span></summary><div class="body">'
    + '<p class="rec-line"><b>Recommended editorial status.</b> ' + esc(r.recommended) + '</p>'
    + '<dl class="f">'
    + '<dt>School</dt><dd>' + esc(r.name) + ' &middot; <a href="' + STAGE + r.path + '" target="_blank" rel="noopener">Open the staging page</a></dd>'
    + '<dt>School type</dt><dd>' + esc(r.sector) + ' ' + (r.type === 'college' ? 'university, NCAA Division I' + (r.conference ? ', ' + esc(r.conference) : '') : 'high school' + (r.district ? ', ' + esc(r.district) : '')) + '</dd>'
    + '<dt>City</dt><dd>' + esc(r.city) + '</dd>'
    + '<dt>Governing body</dt><dd>' + esc(r.bodies.join(', ')) + '</dd>'
    + '<dt>Sources found (' + r.sources.length + ')</dt><dd>' + ul(r.sources.map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>' + (s.date ? ' <span class="tag">' + s.date + '</span>' : ''))) + '</dd>'
    + '<dt>Sources not found</dt><dd>' + ul(r.not_found.map(esc), r.policy_found ? 'Nothing specific was logged as missing.' : 'A school NIL policy was not located in the public sources reviewed as of October 3, 2026.') + '</dd>'
    + '<dt>Policy status</dt><dd>' + (r.policies.length ? r.policies.map((p) => esc(p.title) + ': <b>' + p.status + '</b>' + (p.covers_nil ? '' : ' (does not cover NIL)')).join('<br>') : 'No NIL policy document located.') + '<br><span class="tag">Public policy search: ' + (r.policy_found ? 'guidance located' : 'not located') + ', ' + r.locations + ' locations checked</span></dd>'
    + '<dt>Disclosure process</dt><dd>' + (r.disclosure.length ? r.disclosure.map((d) => esc(d.what) + '<br><span class="tag">To: ' + esc(d.recipient) + '. When: ' + esc(d.when) + (d.platform ? ' Platform: ' + esc(d.platform) : '') + '</span>').join('<br>') : (r.rules.find((x) => x.topic_slug === 'disclosure-required') ? esc(r.rules.find((x) => x.topic_slug === 'disclosure-required').summary) + ' <span class="tag">(' + r.rules.find((x) => x.topic_slug === 'disclosure-required').trust + ')</span>' : '<span class="muted">No school-specific process located. The inherited statewide or national process applies.</span>')) + '</dd>'
    + '<dt>Official contact</dt><dd>' + ul(r.contacts.map((c) => esc(c.office) + (c.person ? ', ' + esc(c.person) : '') + ' (' + esc(c.role) + ')' + (c.phone ? ', ' + esc(c.phone) : '') + ' <span class="tag">' + c.scope + '</span> <a href="' + esc(c.url) + '" target="_blank" rel="noopener">official page</a>'), 'None located.') + '</dd>'
    + '<dt>Logo, uniform, facility</dt><dd>' + ul(ip.map((x) => '<b>' + esc(x.topic) + '</b> <span class="tag">' + x.scope + ', ' + x.trust + (x.nil_specific ? '' : ', general policy that does not mention NIL') + '</span><br>' + esc(x.summary)), 'None located at school or district level.') + '</dd>'
    + '<dt>Claims to check first</dt><dd>' + ul(r.claims.map(esc)) + '</dd>'
    + '<dt>Potential ambiguities</dt><dd>' + ul(r.ambiguities.map(esc)) + '</dd>'
    + '<dt>Needs manual review</dt><dd>' + ul(r.manual.map(esc)) + '</dd>'
    + (r.left_off.length ? '<dt>Left off the page</dt><dd>' + ul(r.left_off.map(esc)) + '</dd>' : '')
    + '<dt>School and district rules</dt><dd>' + ul(r.rules.map((x) => '<code>' + esc(x.slug) + '</code> ' + esc(x.topic) + ': ' + x.answer + ' <span class="tag">' + x.trust + '</span>'), 'None.') + '</dd>'
    + '<dt>Automated gate</dt><dd><b>' + r.seo_status.replace(/_/g, ' ') + '</b>. Class ' + r.value_class + ', ' + esc(r.value_label.toLowerCase()) + '.<ul class="checks" style="margin-top:8px">' + r.checks.map(([l, ok]) => '<li class="' + (ok ? 'p' : '') + '">' + esc(l) + '</li>').join('') + '</ul></dd>'
    + '<dt>Reason for failures</dt><dd>' + esc(r.reason) + '</dd>'
    + '<dt>To approve</dt><dd><code>select approve_page(\\'' + r.path + '\\', \\'Your Name\\');</code><br><span class="tag">Only after every rule on the page has a recorded human review.</span></dd>'
    + '</dl></div></details>';
};
const list = document.getElementById('list'), q = document.getElementById('q'), count = document.getElementById('count');
function draw() {
  const t = q.value.trim().toLowerCase();
  const rows = R.filter((r) => (active === 'all' || r.group === active || r.type === active) && (!t || (r.name + ' ' + r.city).toLowerCase().includes(t)));
  list.innerHTML = rows.map(rec).join('') || '<p class="muted">No school matches. Clear the search or pick another filter.</p>';
  count.textContent = rows.length + ' of ' + R.length + ' schools. A strong, B moderate, C state-rule-dominant, D incomplete.';
}
chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; active = b.dataset.k; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
q.addEventListener('input', draw); draw();
// rule queue
const G = [['central', 'Part 1. Central rules', 'Reviewed once. Every school under the rule inherits the review.'], ['shared', 'Part 2. Conference and district rules', 'Each is shared by a few schools.'], ['school', 'Part 3. School-specific rules', 'Review alongside the school record.']];
document.getElementById('qbody').innerHTML = G.map(([k, h, d]) => { const rows = D.queue.filter((x) => x.group === k);
  return '<div style="display:flex;flex-direction:column;gap:8px"><h2>' + h + ' (' + rows.length + ')</h2><p class="muted">' + d + '</p><div class="tw"><table><thead><tr><th>Issuer</th><th>Topic</th><th>Bottom line</th><th>Citation</th><th>State</th><th>Pages</th><th>Record a review</th></tr></thead><tbody>'
    + rows.map((x) => '<tr><td>' + esc(x.issuer) + '</td><td>' + esc(x.topic) + '</td><td>' + x.answer + '</td><td>' + esc(x.citation) + '</td><td>' + x.trust + '</td><td class="n">' + x.pages + '</td><td><code>' + esc(x.slug) + '</code> <button type="button" class="copy" data-c="select record_human_review(\\'' + esc(x.slug) + '\\', \\'Your Name\\', \\'note\\');">Copy command</button></td></tr>').join('') + '</tbody></table></div></div>'; }).join('');
document.getElementById('qbody').addEventListener('click', async (e) => { const b = e.target.closest('.copy'); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.c); b.textContent = 'Copied'; } catch { b.textContent = b.dataset.c; } });
const tabs = [...document.querySelectorAll('[role=tab]')];
tabs.forEach((t) => t.addEventListener('click', () => { tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); }));
</script>
`;
fs.writeFileSync('review/pilot-review-workbench.html', html);
console.log('wrote review/pilot-review-workbench.html', html.length);
