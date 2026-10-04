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
.item { border-top: 1px solid var(--line); padding: 12px 0; display: flex; flex-direction: column; gap: 6px }
.item h4 { margin: 0; font: 700 15px var(--body) } .item blockquote { margin: 0; padding: 6px 10px; border-left: 3px solid var(--line); font-size: 13px; color: var(--muted) }
.dec { display: flex; gap: 6px; flex-wrap: wrap } .dec button { font: 700 12px var(--body); border: 1px solid var(--line); background: var(--panel); color: var(--fg); padding: 6px 10px; border-radius: 6px; cursor: pointer }
.dec button[aria-pressed="true"].ap { background: var(--good-bg); color: var(--good); border-color: var(--good) } .dec button[aria-pressed="true"].rj { background: var(--bad-bg); color: var(--bad); border-color: var(--bad) } .dec button[aria-pressed="true"].fx { background: var(--warn-bg); color: var(--warn); border-color: var(--warn) }
.risk { font: 700 10px var(--body); text-transform: uppercase; letter-spacing: .05em; padding: 2px 6px; border-radius: 4px } .risk.high { background: var(--bad-bg); color: var(--bad) } .risk.medium { background: var(--warn-bg); color: var(--warn) } .risk.low, .risk.none { background: var(--hold-bg); color: var(--hold) }
details.step { background: var(--panel); border: 1px solid var(--line); border-radius: 10px } details.step > summary { cursor: pointer; padding: 12px 14px; font-weight: 700 } details.step > div { padding: 0 14px 12px }
.copy { font: 700 11px var(--body); border: 1px solid var(--line); background: transparent; color: var(--accent); border-radius: 6px; padding: 2px 7px; cursor: pointer }
@media (max-width: 560px) { dl.f { grid-template-columns: 1fr } details.rec > summary { grid-template-columns: 34px minmax(0, 1fr) } details.rec > summary .pill { grid-column: 2; justify-self: start } }
</style>
<div class="wrap">
  <header style="display:flex;flex-direction:column;gap:8px">
    <h1>Florida Pilot Review Workbench</h1>
    <p class="lede">Review queue, school records and unopened sources, built from the database on <span id="gen"></span>. Nothing here has been reviewed by a person yet. Statewide and national rules are reviewed once in the rule queue, and every school inherits that review.</p>
  </header>
  <div class="stats" id="stats"></div>
  <div class="tabs" role="tablist">
    <button role="tab" id="tab-queue" aria-selected="true" aria-controls="queue">Review queue</button>
    <button role="tab" id="tab-schools" aria-selected="false" aria-controls="schools">Schools</button>
    <button role="tab" id="tab-access" aria-selected="false" aria-controls="access">Unopened sources</button>
  </div>
  <section id="schools" role="tabpanel" aria-labelledby="tab-schools" hidden style="flex-direction:column;gap:12px">
    <div class="bar">
      <input type="search" id="q" placeholder="Search a school or city" aria-label="Search a school or city">
      <div class="chips" id="chips"></div>
    </div>
    <p class="count" id="count"></p>
    <div class="list" id="list"></div>
  </section>
  <section id="queue" role="tabpanel" aria-labelledby="tab-queue" style="display:flex;flex-direction:column;gap:16px">
    <p class="lede">Work top to bottom. Each rule is reviewed once, however many pages show it. Your marks are saved in this browser only. They do not change the database: a person records each approved review with the command the page builds for you.</p>
    <div class="bar"><label for="who" class="muted">Reviewer name</label><input type="text" id="who" placeholder="Your full name" style="font:15px var(--body);padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--fg);min-width:0;flex:0 1 240px">
      <button type="button" class="copy" id="copyall" style="padding:8px 12px">Copy commands for everything marked Approve</button><span class="count" id="progress"></span></div>
    <div id="qbody" style="display:flex;flex-direction:column;gap:10px"></div>
    <p class="muted" id="notq"></p>
  </section>
  <section id="access" role="tabpanel" aria-labelledby="tab-access" hidden style="flex-direction:column;gap:12px">
    <p class="lede">Every document research could not open, one row per unique document. Class A is a critical primary source: a page with an unread class A source cannot be strong or SEO-eligible.</p>
    <div class="chips" id="achips"></div>
    <div class="tw"><table><thead><tr><th>Class</th><th>Status</th><th>Risk</th><th>Document</th><th>Pages affected</th><th>Claim it could affect</th><th>Supported elsewhere by</th></tr></thead><tbody id="abody"></tbody></table></div>
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
document.getElementById('stats').innerHTML = [[R.length, 'Schools'], [n((r) => r.group === 'eligible'), 'Eligible, review pending'], [n((r) => r.group === 'hold'), 'On hold'], [n((r) => r.group === 'thin'), 'Keep noindex'], [n((r) => r.group === 'incomplete'), 'Incomplete'], [D.workload.tier1_total + D.workload.tier2_total, 'Unique rules']]
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
// review queue
const I = new Map(D.items.map((x) => [x.slug, x]));
let marks = {}; try { marks = JSON.parse(localStorage.getItem('nil-review-marks') || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem('nil-review-marks', JSON.stringify(marks)); } catch (e) {} };
const itemHtml = (x) => '<div class="item" data-slug="' + x.slug + '"><h4>' + esc(x.claim) + ' <span class="risk ' + x.risk + '">' + x.risk + ' risk</span></h4>'
  + '<p><b>' + esc(x.issuer) + ': ' + x.bottom_line + '.</b> ' + esc(x.summary) + (x.conditions ? ' <span class="muted">' + esc(x.conditions) + '</span>' : '') + '</p>'
  + x.sources.map((s) => '<blockquote>' + (s.quote ? '&ldquo;' + esc(s.quote) + '&rdquo;<br>' : '') + '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>' + (s.locator ? ', ' + esc(s.locator) : '') + (s.date ? ' <span class="tag">' + s.date + '</span>' : '') + '</blockquote>').join('')
  + '<p class="tag">Citation: ' + esc(x.citation) + ' &middot; Machine check: ' + esc(x.machine) + ' &middot; Shown on ' + x.pages + ' page' + (x.pages === 1 ? '' : 's') + ' &middot; <code>' + x.slug + '</code></p>'
  + '<p class="tag"><b>You are approving:</b> ' + esc(x.approving) + '</p>'
  + '<div class="dec">' + [['ap', 'Approve'], ['rj', 'Reject'], ['fx', 'Needs correction']].map(([k, l]) => '<button type="button" class="' + k + '" data-k="' + k + '" aria-pressed="' + (marks[x.slug] === k) + '">' + l + '</button>').join('') + '</div></div>';
const qb = document.getElementById('qbody');
qb.innerHTML = D.steps.map((st, n) => '<details class="step" id="step-' + n + '"' + (n < 2 ? ' open' : '') + '><summary>' + (n + 1) + '. ' + esc(st.title) + ' <span class="tag" data-step="' + n + '"></span></summary><div><p class="muted">' + esc(st.note) + (st.page ? ' <a href="' + STAGE + st.page + '" target="_blank" rel="noopener">Open the staging page</a>' : '') + '</p>'
  + st.rules.map((sl) => itemHtml(I.get(sl))).join('') + (st.page ? '<div class="item"><h4>Page approval</h4><p>After every rule above is approved and recorded, read the assembled page once and approve it: is it accurate, useful and appropriately worded?</p><p><code>select approve_page(\\'' + st.page + '\\', \\'Your Name\\');</code></p></div>' : '') + '</div></details>').join('');
const prog = () => { const all = D.steps.flatMap((s) => s.rules); const c = (k) => all.filter((s) => marks[s] === k).length;
  document.getElementById('progress').textContent = c('ap') + ' approved, ' + c('rj') + ' rejected, ' + c('fx') + ' need correction, ' + (all.length - c('ap') - c('rj') - c('fx')) + ' of ' + all.length + ' not yet marked';
  D.steps.forEach((st, n) => { document.querySelector('[data-step="' + n + '"]').textContent = st.rules.filter((s) => marks[s]).length + ' of ' + st.rules.length + ' marked'; }); };
qb.addEventListener('click', (e) => { const b = e.target.closest('.dec button'); if (!b) return; const it = b.closest('.item'); const sl = it.dataset.slug;
  marks[sl] = marks[sl] === b.dataset.k ? undefined : b.dataset.k; it.querySelectorAll('.dec button').forEach((x) => x.setAttribute('aria-pressed', marks[sl] === x.dataset.k)); save(); prog(); });
document.getElementById('copyall').addEventListener('click', async (e) => { const who = document.getElementById('who').value.trim(); const b = e.currentTarget;
  if (!who) { b.textContent = 'Enter your name first'; return; }
  const sql = D.steps.flatMap((s) => s.rules).filter((s) => marks[s] === 'ap').map((s) => "select record_human_review('" + s + "', '" + who.replace(/'/g, "''") + "', 'Reviewed in the workbench');").join('\\n');
  try { await navigator.clipboard.writeText(sql); b.textContent = 'Copied. Paste into the Supabase SQL editor'; } catch (err) { b.textContent = 'Copy failed. Use a desktop browser'; } });
const notQ = D.records.filter((r) => r.seo_status !== 'SEO_ELIGIBLE_HUMAN_REVIEW_PENDING');
document.getElementById('notq').textContent = 'Not in the queue, because the page stays noindex whatever a reviewer does: ' + notQ.map((r) => r.name).join(', ') + '.';
prog();
// unopened sources
const AF = [['open', 'Still unread'], ['AB', 'Class A and B'], ['all', 'All ' + D.access.length]]; let af = 'open';
const ac = document.getElementById('achips'); ac.innerHTML = AF.map(([k, l]) => '<button type="button" data-k="' + k + '" aria-pressed="' + (k === af) + '">' + l + '</button>').join('');
const ST = { opened_now: 'Opened Oct 4', still_inaccessible: 'Still inaccessible', login_required: 'Behind a login', not_found_404: 'Page gone', not_retried: 'Not retried' };
const adraw = () => { const rows = D.access.filter((a) => af === 'all' || (af === 'AB' ? 'AB'.includes(a.class) : a.status !== 'opened_now'));
  document.getElementById('abody').innerHTML = rows.map((a) => '<tr><td><b>' + a.class + '</b></td><td>' + ST[a.status] + '</td><td><span class="risk ' + a.risk + '">' + a.risk + '</span></td><td>' + (a.url ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.title) + '</a>' : esc(a.title)) + '<br><span class="tag">' + esc(a.why || '') + (a.finding ? ' Finding: ' + esc(a.finding) : '') + '</span></td><td>' + esc(a.owners.join(', ')) + '</td><td>' + esc(a.claim || '') + '</td><td>' + esc(a.support || '') + '</td></tr>').join(''); };
ac.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; af = b.dataset.k; ac.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); adraw(); }); adraw();
const tabs = [...document.querySelectorAll('[role=tab]')];
tabs.forEach((t) => t.addEventListener('click', () => { tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); }));
</script>
`;
fs.writeFileSync('review/pilot-review-workbench.html', html);
console.log('wrote review/pilot-review-workbench.html', html.length);
