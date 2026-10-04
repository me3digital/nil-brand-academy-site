// Turns db/seed/*.mjs into portable SQL (foreign keys resolved by slug) and applies it.
// The same SQL file can be run against Supabase.
import * as F from '../db/seed/florida.mjs';

const lit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (Array.isArray(v)) return `ARRAY[${v.map(lit).join(',')}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const raw = (sql) => ({ __raw: sql });
const val = (v) => (v && v.__raw ? v.__raw : lit(v));
const ins = (table, obj) => {
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined);
  return `insert into ${table} (${keys.join(', ')}) values (${keys.map((k) => val(obj[k])).join(', ')});`;
};
const id = (table, slug, col = 'slug') => (slug ? raw(`(select id from ${table} where ${col} = ${lit(slug)})`) : null);
const stateId = (code) => (code ? raw(`(select id from states where code = ${lit(code)})`) : null);
const instId = (slug) => id('institutions', slug);
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const scopeCols = (scope) => {
  if (scope.state) return { scope_type: 'state', state_id: stateId(scope.state) };
  if (scope.gb) return { scope_type: 'governing_body', governing_body_id: id('governing_bodies', scope.gb) };
  if (scope.district) return { scope_type: 'district', district_id: id('school_districts', scope.district) };
  if (scope.inst) return { scope_type: 'institution', institution_id: instId(scope.inst) };
  if (scope.level) return { scope_type: 'level' };
  throw new Error('bad scope ' + JSON.stringify(scope));
};

export function buildSeedSql() {
  const out = [];
  const add = (s) => out.push(s);
  const { CHECKED_ON, CHECKED_BY } = F;

  F.states.forEach((s) => add(ins('states', s)));
  F.governingBodies.forEach(({ state, ...g }) => add(ins('governing_bodies', { ...g, state_id: stateId(state) })));
  F.districts.forEach(({ state, ...d }) => add(ins('school_districts', { ...d, state_id: stateId(state) })));
  F.sources.forEach(({ gb, ...s }) => add(ins('sources', {
    ...s, governing_body_id: id('governing_bodies', gb), retrieved_on: CHECKED_ON,
    is_primary: s.source_type !== 'secondary_reporting',
  })));
  F.categories.forEach(([slug, name, sort_order]) => add(ins('rule_categories', { slug, name, sort_order })));
  F.topics.forEach(([slug, cat, label, question, applies_to, in_ip_matrix, sort_order]) => add(ins('rule_topics', {
    slug, category_id: id('rule_categories', cat), label, question, applies_to, in_ip_matrix, sort_order })));

  // sports
  const sportNames = new Set();
  F.institutions.forEach((i) => Object.values(i.sports || {}).flat().forEach((n) => sportNames.add(n)));
  [...sportNames].sort().forEach((n) => add(ins('sports', { slug: slugify(n), name: n })));

  F.institutions.forEach((i) => {
    add(ins('institutions', {
      slug: i.slug, name: i.name, short_name: i.short_name, institution_type: i.institution_type, sector: i.sector,
      state_id: stateId(i.state), city: i.city, county: i.county, street_address: i.street_address, postal_code: i.postal_code,
      district_id: id('school_districts', i.district), conference_id: id('governing_bodies', i.conference),
      division: i.division, classification: i.classification, nces_id: i.nces_id, ipeds_id: i.ipeds_id,
      website_url: i.website_url, athletics_url: i.athletics_url, athletics_brand: i.athletics_brand,
      profile_source_id: id('sources', i.profile_source), publication_state: i.publication_state, search_aliases: i.search_aliases,
    }));
    (i.governing || []).forEach((g) => add(ins('institution_governing_bodies', { institution_id: instId(i.slug), governing_body_id: id('governing_bodies', g) })));
    Object.entries(i.sports || {}).forEach(([gender, names]) => names.forEach((n) => add(ins('institution_sports', {
      institution_id: instId(i.slug), sport_id: id('sports', slugify(n)), gender, source_id: id('sources', i.sports_source) }))));
  });

  const prohibited = new Map();
  F.rules.forEach((r) => (r.prohibited || []).forEach(([slug, wording]) => { if (!prohibited.has(slug)) prohibited.set(slug, wording); }));
  const pcName = (slug) => slug.split('-').map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  [...prohibited.keys()].forEach((slug) => add(ins('prohibited_categories', { slug, name: pcName(slug) })));

  F.rules.forEach((r) => {
    add(ins('rules', { slug: r.slug, rule_topic_id: id('rule_topics', r.topic), ...scopeCols(r.scope), applies_to: r.applies }));
    const rv = raw(`(select v.id from rule_versions v join rules r on r.id = v.rule_id where r.slug = ${lit(r.slug)} and v.is_current)`);
    add(ins('rule_versions', {
      rule_id: id('rules', r.slug), version_no: 1, answer: r.answer, summary: r.summary, conditions: r.conditions,
      citation: r.citation, effective_date: r.effective_date, effective_note: r.effective_note,
      verification_status: r.status || 'researched', change_note: r.change_note,
      trust_state: r.trust, review_method: r.method, review_note: r.review_note, quick_status: r.quick_status, short_answer: r.short_answer, nil_specific: r.nil_specific === false ? false : undefined,
    }));
    r.sources.forEach((s) => add(ins('rule_version_sources', {
      rule_version_id: rv, source_id: id('sources', s.src), locator: s.locator, quote: s.quote,
      quote_check: s.check, checked_on: r.checked_on || CHECKED_ON, checked_by: CHECKED_BY })));
    if (r.disclosure) add(ins('disclosure_requirements', { rule_version_id: rv, ...r.disclosure }));
    (r.prohibited || []).forEach(([slug, wording]) => add(ins('rule_version_prohibited_categories', {
      rule_version_id: rv, prohibited_category_id: id('prohibited_categories', slug), wording })));
    add(ins('verification_events', {
      entity_type: 'rule_version', entity_id: rv, status: r.trust, method: r.method === 'visual_source_check' ? 'desk_review' : 'automated_fetch',
      verified_on: r.checked_on || CHECKED_ON, verified_by: CHECKED_BY, notes: r.method === 'visual_source_check' ? 'Read on screen from the official document by Claude. Not a human review.' : r.method === 'raw_source_text' ? 'Full page text read from the official site by Claude. Not a human review.' : 'Machine-extracted only.' }));
  });

  F.policySearches.forEach((p) => add(ins('policy_searches', {
    institution_id: instId(p.inst), public_policy_found: p.public_policy_found, search_date: p.search_date,
    locations_checked: p.locations_checked, locations_unreachable: p.locations_unreachable, searched_by: CHECKED_BY, notes: p.notes })));
  F.schoolPolicies.forEach((p) => add(ins('school_nil_policies', {
    institution_id: instId(p.inst), title: p.title, summary: p.summary, policy_status: p.policy_status,
    source_id: id('sources', p.source), adopted_on: p.adopted_on, verification_status: 'needs_verification', covers_nil: p.covers_nil !== false })));
  F.nilPrograms.forEach((p) => add(ins('nil_programs', {
    institution_id: instId(p.inst), name: p.name, program_type: p.program_type, description: p.description, url: p.url,
    source_id: id('sources', p.source), verification_status: 'researched', sort_order: p.sort, is_current: p.is_current })));
  F.contacts.forEach((c) => add(ins('school_contacts', {
    institution_id: instId(c.inst), office: c.office, role: c.role, person_name: c.person_name, email: c.email, phone: c.phone,
    url: c.url, is_public: c.is_public, show_on_page: c.show, source_id: id('sources', c.source), verification_status: c.status, contact_scope: c.contact_scope || 'general' })));
  (F.districtSearches || []).forEach((p) => add(ins('policy_searches', {
    district_id: id('school_districts', p.district), public_policy_found: p.public_policy_found, search_date: p.search_date,
    locations_checked: p.locations_checked, locations_unreachable: p.locations_unreachable, searched_by: CHECKED_BY, notes: p.notes })));
  (F.accessDocs || []).forEach((d, i) => {
    const key = `${i + 1}`;
    add(ins('source_access_issues', { title: String(d.title).replace(/\s+/g, ' ').trim(), organization: d.organization, url: d.url, class: d.class, status: d.status, risk: d.risk || 'low', occurrences: d.occurrences || 1,
      claim_affected: d.claim_affected, other_support: d.other_support, why_unopened: d.why_unopened, retry: d.retry, finding: d.finding, triaged_on: '2026-10-04' }));
    for (const o of d.owners || []) {
      const isDistrict = F.districts.some((x) => x.slug === o); const isInst = F.institutions.some((x) => x.slug === o);
      if (!isDistrict && !isInst) throw new Error('access doc owner not found: ' + o);
      add(ins('source_access_pages', { issue_id: raw(`(select max(id) from source_access_issues)`), institution_id: isInst ? instId(o) : null, district_id: isDistrict ? id('school_districts', o) : null }));
    }
  });
  (F.reviewNotes || []).forEach((n) => add(ins('school_review_notes', {
    institution_id: instId(n.inst), district_id: id('school_districts', n.district), governing_body_id: id('governing_bodies', n.gb), kind: n.kind, body: n.body })));

  F.scenarios.forEach(([slug, question, applies_to, sort_order, governs, conds]) => {
    add(ins('scenarios', { slug, question, applies_to, sort_order, is_quick: F.QUICK.includes(slug) }));
    governs.forEach((t) => add(ins('scenario_rule_topics', { scenario_id: id('scenarios', slug), rule_topic_id: id('rule_topics', t), role: 'governs' })));
    conds.forEach((t) => add(ins('scenario_rule_topics', { scenario_id: id('scenarios', slug), rule_topic_id: id('rule_topics', t), role: 'condition' })));
  });

  F.guidance.forEach((g) => add(ins('guidance_blocks', {
    slug: g.slug, block_type: g.type, ...scopeCols(g.scope), applies_to: g.applies, title: g.title, body: g.body,
    rule_topic_id: id('rule_topics', g.topic), link_url: g.link_url, link_label: g.link_label, sort_order: g.sort })));

  F.changeLog.forEach((c) => add(ins('rule_change_log', {
    rule_id: id('rules', c.rule), governing_body_id: id('governing_bodies', c.gb), state_id: stateId(c.state),
    changed_on: c.changed_on, change_type: c.change_type, summary: c.summary, source_id: id('sources', c.source),
    previous_text: c.previous_text, current_text: c.current_text, effective_on: c.effective_on })));
  F.watchItems.forEach((w) => add(ins('watch_items', {
    slug: w.slug, title: w.title, status_text: w.status_text, summary: w.summary, applies_to: w.applies,
    state_id: stateId(w.state), governing_body_id: id('governing_bodies', w.gb), as_of: w.as_of, source_id: id('sources', w.source) })));
  F.conflicts.forEach((c) => add(ins('conflicts', { rule_id: id('rules', c.rule), summary: c.summary, severity: c.severity, opened_on: c.opened_on })));

  F.pages.forEach((p) => add(ins('pages', {
    path: p.path, page_type: p.page_type, state_id: stateId(p.state), institution_id: instId(p.inst),
    title: p.title, meta_description: p.meta_description, h1: p.h1, last_updated: CHECKED_ON })));
  F.redirects.forEach((r) => add(ins('redirects', r)));
  F.marketAreas.forEach(({ institutions, state, ...m }) => {
    add(ins('market_areas', { ...m, state_id: stateId(state) }));
    institutions.forEach((s) => add(ins('institution_market_areas', { institution_id: instId(s), market_area_id: id('market_areas', m.slug) })));
  });
  F.sources.forEach((s) => add(ins('monitors', { source_id: id('sources', s.slug), frequency: ['statute', 'bylaw', 'regulation'].includes(s.source_type) ? 'weekly' : 'monthly', last_checked_on: CHECKED_ON })));
  return out.join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import('node:fs');
  fs.writeFileSync(new URL('../db/seed/florida.generated.sql', import.meta.url), buildSeedSql());
  console.log('wrote db/seed/florida.generated.sql');
}
