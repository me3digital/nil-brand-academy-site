import { q } from './db.mjs';

const RANK = { no: 4, only_with_approval: 3, yes_with_conditions: 2, yes: 1 };
export const INFO_TOPICS = new Set(['prohibited-categories', 'penalties', 'disclosure-required', 'deal-review', 'deal-terms',
  'parent-guardian', 'contract-length', 'transfers', 'nil-education', 'prospects-reporting', 'international-athletes', 'school-payments']);
export const ANSWER_LABEL = { yes: 'Allowed', yes_with_conditions: 'Allowed with conditions', only_with_approval: 'Approval required',
  no: 'Not allowed', not_addressed: 'Not publicly specified', unclear: 'Unclear', info: 'Rule applies' };

// Public wording for the five trust states. Nothing here says "human verified": that label needs a person.
export const TRUST = {
  VERIFIED_TO_OFFICIAL_SOURCE: { label: 'Checked against the official source', short: 'Official source checked', cls: 'ok' },
  PUBLIC_POLICY_NOT_LOCATED: { label: 'No public policy located', short: 'Not located in public sources', cls: 'none' },
  PENDING_INSTITUTION_CONFIRMATION: { label: 'Awaiting school confirmation', short: 'Awaiting school confirmation', cls: 'wait' },
  NEEDS_REVIEW: { label: 'Under review', short: 'Under review', cls: 'review' },
  SUPERSEDED: { label: 'Superseded', short: 'Superseded', cls: 'old' },
};
export const QUICK_LABEL = { YES: 'Yes', NO: 'No', DEPENDS: 'Depends', CHECK_FIRST: 'Check first', NOT_PUBLICLY_SPECIFIED: 'Not publicly specified' };
const QUICK_FROM_ANSWER = { yes: 'YES', yes_with_conditions: 'DEPENDS', only_with_approval: 'CHECK_FIRST', no: 'NO', not_addressed: 'NOT_PUBLICLY_SPECIFIED', unclear: 'NOT_PUBLICLY_SPECIFIED' };
export const quickOf = (layer) => (layer ? layer.quick_status || QUICK_FROM_ANSWER[layer.answer] : 'NOT_PUBLICLY_SPECIFIED');
const firstSentence = (t) => { const parts = String(t || '').match(/.+?[.!?](?=\s|$)/g); if (!parts) return t; let out = parts[0].trim(); if (out.length < 14 && parts[1]) out += ' ' + parts[1].trim(); return out; };
export const shortOf = (layer) => (layer ? layer.short_answer || firstSentence(layer.summary) : '');

const iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const fmtDate = (d) => { if (!d) return null; const s = iso(d); const [y, m, day] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${day}, ${y}`; };
export const fmtMonth = (d) => { if (!d) return null; const s = iso(d); const [y, m] = s.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };

async function attachSources(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.rule_version_id);
  const src = await q(`select rs.rule_version_id, rs.locator, rs.quote, rs.quote_check, rs.checked_on,
      s.id as source_id, s.slug, s.title, s.url, s.organization, s.source_type, s.is_primary
    from rule_version_sources rs join sources s on s.id = rs.source_id
    where rs.rule_version_id = any($1::int[]) order by rs.id`, [ids]);
  const disc = await q(`select * from disclosure_requirements where rule_version_id = any($1::int[])`, [ids]);
  const proh = await q(`select rp.rule_version_id, pc.name, rp.wording from rule_version_prohibited_categories rp
    join prohibited_categories pc on pc.id = rp.prohibited_category_id where rp.rule_version_id = any($1::int[]) order by rp.prohibited_category_id`, [ids]);
  const conf = await q(`select c.*, r.slug as rule_slug from conflicts c join rules r on r.id = c.rule_id where c.status = 'open'`);
  const tr = await q(`select id, trust_state, review_method, review_note, short_answer, quick_status from rule_versions where id = any($1::int[])`, [ids]);
  return rows.map((r) => ({
    ...r,
    ...(() => { const t = tr.find((x) => x.id === r.rule_version_id) || {}; return { trust_state: t.trust_state, review_method: t.review_method, review_note: t.review_note, short_answer: t.short_answer, quick_status: t.quick_status }; })(),
    sources: src.filter((s) => s.rule_version_id === r.rule_version_id),
    disclosure: disc.find((d) => d.rule_version_id === r.rule_version_id) || null,
    prohibited: proh.filter((p) => p.rule_version_id === r.rule_version_id),
    conflicts: conf.filter((c) => c.rule_slug === r.rule_slug),
  }));
}

// Collapse the layers for each topic into one bottom line: the most restrictive answer wins,
// and the most specific layer breaks ties. Every layer stays visible underneath.
export function buildTopics(rows) {
  const byTopic = new Map();
  for (const r of rows) {
    if (!byTopic.has(r.topic_slug)) byTopic.set(r.topic_slug, { slug: r.topic_slug, label: r.topic_label, question: r.topic_question,
      category_slug: r.category_slug, category_name: r.category_name, category_sort: r.category_sort, sort: r.topic_sort,
      in_ip_matrix: r.in_ip_matrix, info: INFO_TOPICS.has(r.topic_slug), layers: [] });
    byTopic.get(r.topic_slug).layers.push(r);
  }
  const topics = [...byTopic.values()];
  for (const t of topics) {
    t.layers.sort((a, b) => a.layer_order - b.layer_order);
    const firm = (l) => l.trust_state !== 'NEEDS_REVIEW' && l.trust_state !== 'PENDING_INSTITUTION_CONFIRMATION' && l.trust_state !== 'SUPERSEDED';
    let answered = t.layers.filter((l) => l.answer !== 'not_addressed');
    // A rule that is under review, or that the school has not confirmed as current, stays visible but never sets the bottom line
    // while a checked rule on the same topic exists.
    if (answered.some(firm)) answered = answered.filter(firm);
    if (!answered.length) { t.answer = 'not_addressed'; t.lead = t.layers[t.layers.length - 1]; }
    else if (answered.some((l) => l.answer === 'unclear')) { t.answer = 'unclear'; t.lead = answered.find((l) => l.answer === 'unclear'); }
    else {
      const top = Math.max(...answered.map((l) => RANK[l.answer]));
      const leaders = answered.filter((l) => RANK[l.answer] === top);
      t.lead = leaders[leaders.length - 1];
      t.answer = t.lead.answer;
    }
    t.chip = t.info && t.answer !== 'not_addressed' ? 'info' : t.answer;
    t.trust = t.lead.trust_state;
    t.needsReview = t.layers.some((l) => l.trust_state === 'NEEDS_REVIEW' || l.trust_state === 'PENDING_INSTITUTION_CONFIRMATION');
  }
  topics.sort((a, b) => a.category_sort - b.category_sort || a.sort - b.sort);
  return topics;
}

export function groupByCategory(topics) {
  const cats = [];
  for (const t of topics) {
    let c = cats.find((x) => x.slug === t.category_slug);
    if (!c) { c = { slug: t.category_slug, name: t.category_name, topics: [] }; cats.push(c); }
    c.topics.push(t);
  }
  return cats;
}

export async function buildScenarios(level, topics) {
  const sc = await q(`select s.id, s.slug, s.question, s.sort_order, s.is_quick,
      array_agg(t.slug || ':' || srt.role) as links
    from scenarios s join scenario_rule_topics srt on srt.scenario_id = s.id join rule_topics t on t.id = srt.rule_topic_id
    where s.applies_to in ('both', $1) group by s.id order by s.sort_order`, [level]);
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  return sc.map((s) => {
    const governs = s.links.filter((l) => l.endsWith(':governs')).map((l) => bySlug.get(l.split(':')[0])).filter(Boolean);
    const conditions = s.links.filter((l) => l.endsWith(':condition')).map((l) => bySlug.get(l.split(':')[0])).filter(Boolean);
    const answered = governs.filter((t) => t.answer !== 'not_addressed');
    if (!answered.length) return { ...s, answer: 'not_addressed', governs, conditions, lead: governs[0]?.lead || null, topic: governs[0] };
    let pick = answered[0];
    for (const t of answered) if ((RANK[t.answer] || 0) > (RANK[pick.answer] || 0)) pick = t;
    return { ...s, answer: pick.answer, governs: answered, conditions: conditions.filter((t) => t.answer !== 'not_addressed'), lead: pick.lead, topic: pick };
  }).filter((s) => s.governs.length);
}

function collectSources(topics, extra = []) {
  const map = new Map();
  for (const t of topics) for (const l of t.layers) for (const s of l.sources) if (!map.has(s.slug)) map.set(s.slug, s);
  for (const s of extra) if (s && !map.has(s.slug)) map.set(s.slug, s);
  const list = [...map.values()];
  list.forEach((s, i) => { s.n = i + 1; });
  return list;
}

export function trustCounts(topics) {
  const seen = new Map();
  for (const t of topics) for (const l of t.layers) seen.set(l.rule_version_id, l.trust_state);
  const c = { total: seen.size, VERIFIED_TO_OFFICIAL_SOURCE: 0, PUBLIC_POLICY_NOT_LOCATED: 0, PENDING_INSTITUTION_CONFIRMATION: 0, NEEDS_REVIEW: 0, SUPERSEDED: 0 };
  for (const v of seen.values()) c[v]++;
  return c;
}
// Everything Find My School can answer: schools with a page, and schools we know of but have not built.
export async function getFindIndex() {
  return q(`select i.name, i.short_name, i.city, i.county, i.search_aliases, i.institution_type, s.name as state, s.code, s.slug as state_slug, p.path
    from institutions i join states s on s.id = i.state_id left join pages p on p.institution_id = i.id order by i.name`);
}
export async function getState(slug) { return (await q(`select * from states where slug = $1`, [slug]))[0]; }
export async function getStates() { return q(`select * from states order by name`); }
export async function getPage(path) { return (await q(`select * from pages where path = $1`, [path]))[0]; }

export async function getInstitutions(stateId, type) {
  return q(`select i.*, p.path, g.index_status from institutions i
    left join pages p on p.institution_id = i.id left join v_page_quality_gate g on g.page_id = p.id
    where i.state_id = $1 and i.institution_type = $2 order by i.name`, [stateId, type]);
}

export async function getStateHub(stateSlug) {
  const state = await getState(stateSlug);
  const levels = {};
  for (const level of ['high_school', 'college']) {
    const rows = await attachSources(await q(`select * from v_state_rules where state_id = $1 and level = $2`, [state.id, level]));
    const topics = buildTopics(rows);
    levels[level] = { topics, categories: groupByCategory(topics), scenarios: await buildScenarios(level, topics) };
  }
  const changeLog = await q(`select c.*, s.slug as source_slug, s.url as source_url, s.title as source_title, coalesce(g.short_name, st.name || ' law') as issuer
    from rule_change_log c left join sources s on s.id = c.source_id left join governing_bodies g on g.id = c.governing_body_id left join states st on st.id = c.state_id
    where c.is_public order by c.changed_on desc`);
  const watch = await q(`select w.*, s.url as source_url, s.title as source_title from watch_items w left join sources s on s.id = w.source_id where w.is_open order by w.as_of desc`);
  const bodies = await q(`select * from governing_bodies where body_type <> 'conference' and (state_id = $1 or state_id is null) order by id`, [state.id]);
  const sources = collectSources([...levels.high_school.topics, ...levels.college.topics]);
  const checked = (await q(`select max(checked_on) d from rule_version_sources`))[0].d;
  return { state, levels, changeLog, watch, bodies, sources, checked, trust: trustCounts([...levels.high_school.topics, ...levels.college.topics]) };
}

export async function getHub(stateSlug, type, slug) {
  const state = await getState(stateSlug);
  const inst = (await q(`select i.*, d.name as district_name, d.website_url as district_url, c.short_name as conference_name
    from institutions i left join school_districts d on d.id = i.district_id left join governing_bodies c on c.id = i.conference_id
    where i.state_id = $1 and i.institution_type = $2 and i.slug = $3`, [state.id, type, slug]))[0];
  const rows = await attachSources(await q(`select * from v_institution_rules where institution_id = $1`, [inst.id]));
  const topics = buildTopics(rows);
  const page = (await q(`select * from pages where institution_id = $1`, [inst.id]))[0];
  const gate = (await q(`select * from v_page_quality_gate where page_id = $1`, [page.id]))[0];
  const bodies = await q(`select g.* from governing_bodies g join institution_governing_bodies ig on ig.governing_body_id = g.id where ig.institution_id = $1 order by g.id`, [inst.id]);
  const policies = await q(`select p.*, s.slug as source_slug, s.url as source_url, s.title as source_title from school_nil_policies p left join sources s on s.id = p.source_id where p.institution_id = $1`, [inst.id]);
  const programs = await q(`select n.*, s.slug as source_slug from nil_programs n left join sources s on s.id = n.source_id where n.institution_id = $1 order by n.sort_order`, [inst.id]);
  const contacts = await q(`select c.*, s.slug as source_slug from school_contacts c left join sources s on s.id = c.source_id where c.institution_id = $1 and c.show_on_page and c.is_public order by c.id`, [inst.id]);
  const sports = await q(`select sp.name, sp.slug, s.gender from institution_sports s join sports sp on sp.id = s.sport_id where s.institution_id = $1 order by sp.name`, [inst.id]);
  const guidance = await q(`select g.*, t.slug as topic_slug from guidance_blocks g left join rule_topics t on t.id = g.rule_topic_id
    where g.applies_to in ('both', $2) and (
         (g.scope_type = 'level')
      or (g.scope_type = 'state' and g.state_id = $3)
      or (g.scope_type = 'governing_body' and g.governing_body_id in (select governing_body_id from institution_governing_bodies where institution_id = $1))
      or (g.scope_type = 'institution' and g.institution_id = $1))
    order by g.sort_order`, [inst.id, type, state.id]);
  // a guidance block may rest on a rule outside this school's cascade (e.g. NCAA prospect reporting on a high school page)
  const extraRuleRows = [];
  for (const g of guidance) {
    if (g.topic_slug && !topics.find((t) => t.slug === g.topic_slug)) {
      const r = await attachSources(await q(`select r.slug as rule_slug, v.id as rule_version_id, v.citation, v.summary, gb.short_name as issuer_name
        from rules r join rule_versions v on v.rule_id = r.id and v.is_current join rule_topics t on t.id = r.rule_topic_id
        left join governing_bodies gb on gb.id = r.governing_body_id where t.slug = $1 limit 1`, [g.topic_slug]));
      if (r[0]) { g.external = r[0]; extraRuleRows.push(r[0]); }
    }
  }
  const changeLog = await q(`select c.*, s.slug as source_slug, coalesce(g.short_name, st.name || ' law') as issuer
    from rule_change_log c left join sources s on s.id = c.source_id left join governing_bodies g on g.id = c.governing_body_id left join states st on st.id = c.state_id
    where c.is_public and c.rule_id in (select rule_id from v_institution_rules where institution_id = $1) order by c.changed_on desc`, [inst.id]);
  const watch = await q(`select w.*, s.slug as source_slug from watch_items w left join sources s on s.id = w.source_id
    where w.is_open and w.applies_to in ('both', $1) and (w.state_id is null or w.state_id = $2) order by w.as_of desc`, [type, state.id]);
  const intel = await q(`select l.* from local_opportunity_intel l where l.is_published and (l.institution_id = $1
    or l.market_area_id in (select market_area_id from institution_market_areas where institution_id = $1))`, [inst.id]);
  const extraSources = [];
  const srcBySlug = async (s) => (s ? (await q(`select id as source_id, slug, title, url, organization, source_type, is_primary from sources where slug = $1`, [s]))[0] : null);
  for (const p of policies) extraSources.push(await srcBySlug(p.source_slug));
  for (const p of programs) extraSources.push(await srcBySlug(p.source_slug));
  for (const c of contacts) extraSources.push(await srcBySlug(c.source_slug));
  for (const c of changeLog) extraSources.push(await srcBySlug(c.source_slug));
  for (const w of watch) extraSources.push(await srcBySlug(w.source_slug));
  for (const r of extraRuleRows) for (const s of r.sources) extraSources.push(s);
  const profileSource = (await q(`select id as source_id, slug, title, url, organization, source_type, is_primary from sources where id = $1`, [inst.profile_source_id]))[0];
  extraSources.push(profileSource);
  const search = (await q(`select * from policy_searches where institution_id = $1 order by search_date desc limit 1`, [inst.id]))[0] || null;
  const sources = collectSources(topics, extraSources);
  const n = (slug) => sources.find((s) => s.slug === slug)?.n;
  const checked = rows.reduce((m, r) => { for (const s of r.sources) { const d = iso(s.checked_on); if (!m || d > m) m = d; } return m; }, null);
  return { state, inst, topics, categories: groupByCategory(topics), scenarios: await buildScenarios(type, topics), page, gate, bodies,
    policies, programs, contacts, sports, guidance, changeLog, watch, intel, sources, n, checked, profileSource, search, trust: trustCounts(topics) };
}

export async function allHubPaths(type) {
  return q(`select s.slug as state, i.slug from institutions i join states s on s.id = i.state_id where i.institution_type = $1 and exists (select 1 from pages p where p.institution_id = i.id)`, [type]);
}
export async function indexablePaths() {
  const hubs = await q(`select p.path, p.last_updated from pages p join v_page_quality_gate g on g.page_id = p.id where g.index_status = 'index'`);
  const other = await q(`select path, last_updated from pages where page_type not in ('college_hub','high_school_hub') and human_approved
     and title is not null and meta_description is not null and index_override is null`);
  return [...other, ...hubs];
}
export async function pageIndexable(path) { return (await indexablePaths()).some((p) => p.path === path); }
export async function getSports() {
  return q(`select sp.*, count(distinct s.institution_id)::int as schools from sports sp left join institution_sports s on s.sport_id = sp.id group by sp.id order by sp.name`);
}
export async function getSport(slug) {
  const sport = (await q(`select * from sports where slug = $1`, [slug]))[0];
  const schools = await q(`select distinct i.name, i.institution_type, p.path from institution_sports s join institutions i on i.id = s.institution_id
    left join pages p on p.institution_id = i.id where s.sport_id = $1 order by i.name`, [sport.id]);
  return { sport, schools };
}
export const gateChecks = (g) => [
  ['Governing body identified', g.chk_governing_body],
  ['Current statewide and national rules established (none under review or awaiting the school)', g.chk_rules_established],
  ['Primary sources attached to every rule', g.chk_sources_attached],
  ['Rule summaries trace to canonical records', g.chk_rules_traceable],
  ['School and district research completed (3 or more public locations)', g.chk_school_info_checked],
  ['School-specific value present (NIL-specific school or district facts; a contact alone does not count)', g.chk_school_specific_value],
  ['Official contact checked against the school\'s page', g.chk_contact_checked],
  ['Scenarios populated (5 or more)', g.chk_scenarios_answered],
  ['Title and meta description complete', g.chk_title_meta],
  ['Canonical complete', g.chk_canonical],
  ['Internal links complete', g.chk_internal_links],
  ['No unresolved high-severity source conflict', g.chk_no_open_conflict],
  ['Human review complete (recorded by a person, once per rule)', g.chk_human_review],
  ['Editorial approval complete (recorded by a person)', g.chk_editorial_approval],
];
export const SEO_STATUS = { NOT_ELIGIBLE: 'Not eligible', SEO_ELIGIBLE_HUMAN_REVIEW_PENDING: 'SEO-eligible / human review pending', APPROVED_TO_INDEX: 'Approved to index' };
