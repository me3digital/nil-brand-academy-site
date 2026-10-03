// Florida pilot population (Phase 3). Turns the research files in db/seed/research/ into seed rows.
// The research files hold only what a school, district or conference publishes itself. Statewide and national rules are
// never restated here: every school inherits the canonical FHSAA, Florida, NCAA and College Sports Commission rule rows.
//
// Trust states are assigned from how each source was read and how current it is. Nothing here records a human review.
import fs from 'node:fs';
import path from 'node:path';

// Resolved from the project root (the bundler moves this module during a build).
const DIR = path.join(process.env.NIL_ROOT || process.cwd(), 'db/seed/research');
const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const FILES = ['colleges_a.json', 'colleges_b.json', 'colleges_c.json', 'colleges_d.json', 'hs_ocps_a.json', 'hs_ocps_b.json'];
const AS_OF = 'October 3, 2026';
const HOUSE = '2025-07-01';           // House settlement rules took effect; older college pages are not treated as current

// Short keys used in rule and source slugs.
const KEY = {
  'florida-state-university': 'fsu', 'university-of-miami': 'miami', 'university-of-south-florida': 'usf', 'university-of-central-florida': 'ucf',
  'florida-atlantic-university': 'fau', 'florida-international-university': 'fiu', 'florida-am-university': 'famu', 'bethune-cookman-university': 'bcu',
  'jacksonville-university': 'ju', 'university-of-north-florida': 'unf', 'florida-gulf-coast-university': 'fgcu', 'stetson-university': 'stetson',
  'orange-county-public-schools': 'ocps',
};
const keyOf = (slug) => KEY[slug] || slug.replace(/-high-school.*$/, '').replace(/^maynard-/, '') + '-hs';

// Display names where the research file's value is not the one to show.
const NAME = {
  'florida-am-university': { name: 'Florida A&M University', short_name: 'FAMU' },
  'bethune-cookman-university': { short_name: 'Bethune-Cookman' },
  'jacksonville-university': { short_name: 'Jacksonville University' },
  'university-of-north-florida': { short_name: 'UNF' },
  'stetson-university': { short_name: 'Stetson' },
  'university-of-miami': { short_name: 'Miami' },
  'boone-high-school-orlando': { name: 'Boone High School' },
  'maynard-evans-high-school-orlando': { name: 'Evans High School' },
};
// Other names people type into Find My School. Abbreviations and common short forms only.
const ALIASES = {
  'university-of-florida': ['UF', 'Florida'], 'florida-state-university': ['FSU', 'Florida State'], 'university-of-miami': ['UM', 'Miami'],
  'university-of-south-florida': ['USF', 'South Florida'], 'university-of-central-florida': ['UCF', 'Central Florida'],
  'florida-atlantic-university': ['FAU', 'Florida Atlantic'], 'florida-international-university': ['FIU', 'Florida International'],
  'florida-am-university': ['FAMU', 'Florida A and M', 'Florida Agricultural and Mechanical University'],
  'bethune-cookman-university': ['B-CU', 'BCU', 'Bethune Cookman'], 'jacksonville-university': ['JU'],
  'university-of-north-florida': ['UNF', 'North Florida'], 'florida-gulf-coast-university': ['FGCU', 'Florida Gulf Coast'], 'stetson-university': ['Stetson'],
  'boone-high-school-orlando': ['William R. Boone High School'], 'maynard-evans-high-school-orlando': ['Maynard Evans High School'],
  'dr-phillips-high-school-orlando': ['Dr Phillips', 'Doctor Phillips'],
};
const PRIVATE = new Set(['university-of-miami', 'bethune-cookman-university', 'jacksonville-university', 'stetson-university']);

// Rules left out of the public record, with the reason. Each one is carried into the school's review notes instead.
const DROP = {
  'jacksonville-university:parent-guardian': 'A financial aid referral, not a parent or guardian rule. Left off the page.',
  'florida-gulf-coast-university:parent-guardian': 'Restates Florida law on contracts with minors on a 2021 page. Left off the page.',
  'winter-park-high-school-winter-park:pay-for-play': 'An undated eligibility line that says athletes may not accept money for playing. It predates or ignores the FHSAA NIL rule, so it is not shown as the school\'s position.',
  'winter-park-high-school-winter-park:nil-education': 'Recorded as a disclosure note instead (the NIL menu item opens Form GA1).',
  'orange-county-public-schools:prohibited-categories': 'An advertising rule for district property. Folded into the district facilities rule so it is not read as a limit on a student\'s own deal.',
};
// School rules that come from a general policy that never mentions NIL or athlete deals. They are shown, but do not count as NIL-specific value.
const GENERAL = new Set(['university-of-central-florida:school-logos-marks', 'boone-high-school-orlando:penalties',
  'orange-county-public-schools:penalties', 'orange-county-public-schools:school-facilities']);
// Rules that rest on a document that could only be read in part.
const PARTIAL = { 'stetson-university': 'Only about one of the six pages of Stetson\'s NIL policy could be read. The rule may be incomplete.' };

const RANK = { no: 4, only_with_approval: 3, yes_with_conditions: 2, yes: 1, not_addressed: 0 };
const QUICK = { yes: 'YES', yes_with_conditions: 'DEPENDS', only_with_approval: 'CHECK_FIRST', no: 'NO', not_addressed: 'NOT_PUBLICLY_SPECIFIED' };
const SOURCE_TYPES = new Set(['statute', 'regulation', 'bylaw', 'board_document', 'form', 'institution_policy', 'district_policy', 'official_faq', 'official_webpage', 'government_database', 'legislative_record', 'secondary_reporting']);
const isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const tidy = (t) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim() : t);
// Research-process remarks are for the review notes, not for the public page.
const publicText = (t) => tidy(String(t).replace(/Read through a summarising tool\.\s*/g, '').replace(/Confirm wording[^.]*by hand\.\s*/g, '').replace(/Closest topic match\.\s*/g, '')
  .replace(/School-specific( part)?:\s*(\w)/g, (m, a, c) => 'What the school adds: ' + c));
const noneIfNull = (t) => (t && !/^none$/i.test(t) && publicText(t) ? publicText(t) : null);

const SPORT_FIX = [[/\s*\([^)]*\)\s*/g, ' '], [/^(?:boys|girls)\s+/i, ''], [/&/g, 'and'],
  [/^track$/i, 'Track and Field'], [/^swim and dive$/i, 'Swimming and Diving'], [/^(?:sideline|spirit) cheer$/i, 'Cheerleading'], [/^competitive cheer$/i, 'Competitive Cheerleading']];
const NOT_SPORTS = /special olympics|unified|^district$|^dance$/i;
const sportName = (n) => { let s = n; for (const [re, to] of SPORT_FIX) s = s.replace(re, to).trim(); return s.replace(/\s+/g, ' '); };
const sportSet = (list) => [...new Set((list || []).map(sportName).filter((s) => s && !NOT_SPORTS.test(s)))];

const scopeOfContact = (c) => {
  const t = `${c.office} ${c.role}`;
  if (/\bNIL\b|name, image/i.test(t)) return 'nil';
  if (/compliance/i.test(t)) return 'compliance';
  if (/licens|trademark|brand|marketing|sponsor|advertis/i.test(t)) return 'licensing';
  if (/international/i.test(t)) return 'international';
  if (/main (phone|line|office)|media relations|facilities/i.test(t)) return 'general';
  if (/athletic|clearance|trainer|sports medicine|coach/i.test(t)) return 'athletics';
  return 'general';
};
const CONTACT_ORDER = { nil: 1, compliance: 2, athletics: 3, licensing: 4, international: 5, general: 9 };

export function applyPilot(F) {
  const { governingBodies, districts, sources, rules, institutions, policySearches, schoolPolicies, nilPrograms, contacts, pages, marketAreas, reviewNotes } = F;
  const haveSource = new Set(sources.map((s) => s.slug));
  const haveRule = new Set(rules.map((r) => r.slug));
  const note = (owner, kind, body) => { if (body) reviewNotes.push({ ...owner, kind, body: tidy(body) }); };

  const addSources = (key, list, gb) => {
    const map = {};
    for (const s of list || []) {
      const slug = `${key}-${s.id}`;
      map[s.id] = { slug, published_on: isDate(s.published_on) ? s.published_on : null };
      if (haveSource.has(slug)) continue;
      haveSource.add(slug);
      const type = s.is_primary === false ? 'secondary_reporting' : (SOURCE_TYPES.has(s.source_type) ? s.source_type : 'official_webpage');
      sources.push({ slug, title: tidy(s.title), url: s.url, organization: tidy(s.organization) || 'Official site', source_type: type, gb,
        published_on: map[s.id].published_on || undefined, notes: tidy(s.notes) || undefined });
    }
    return map;
  };

  // One rule per topic per owner. Several findings on the same topic become one rule with every source attached.
  const addRules = (ownerSlug, key, list, srcMap, scope, applies, ctx = {}) => {
    const byTopic = new Map();
    for (const r of list || []) {
      const dk = `${ownerSlug}:${r.topic}`;
      if (DROP[dk]) { note(ctx.owner, 'left_off_page', `${r.summary} Reason: ${DROP[dk]}`); continue; }
      if (!byTopic.has(r.topic)) byTopic.set(r.topic, []);
      byTopic.get(r.topic).push(r);
    }
    const made = [];
    for (const [topic, group] of byTopic) {
      const lead = group.reduce((a, b) => (RANK[b.answer] > RANK[a.answer] ? b : a), group[0]);
      const srcs = group.flatMap((r) => r.sources.map((x) => ({ src: srcMap[x.source_id].slug, locator: tidy(x.locator) || 'Page text', quote: x.quote, check: 'machine_raw_text', published_on: srcMap[x.source_id].published_on })));
      const dated = srcs.map((s) => s.published_on);
      const allDatedOld = dated.every(Boolean) && dated.every((d) => d < HOUSE);
      const citesPolicy = ctx.policySource && group.some((r) => r.sources.some((x) => x.source_id === ctx.policySource));
      const stale = applies === 'college' && !scope.gb && lead.answer !== 'not_addressed'
        && ((ctx.policyStatus !== 'published' && allDatedOld) || (['outdated', 'unconfirmed'].includes(ctx.policyStatus) && citesPolicy));
      const partial = PARTIAL[ownerSlug] && citesPolicy;
      const conditions = [...new Set(group.map((r) => noneIfNull(r.conditions)).filter(Boolean))].join(' ');
      let slug = `${key}-${topic}`; let i = 2; while (haveRule.has(slug)) slug = `${key}-${topic}-${i++}`;
      haveRule.add(slug);
      const rule = { slug, topic, scope, applies, answer: lead.answer,
        summary: group.map((r) => tidy(r.summary)).join(' '),
        conditions: conditions || null, citation: [...new Set(group.map((r) => tidy(r.citation)))].join('; '),
        sources: srcs.map(({ published_on, ...s }) => s),
        method: 'raw_source_text', status: 'researched',
        quick_status: lead.quick_status || QUICK[lead.answer], short_answer: tidy(lead.short_answer) || null,
        nil_specific: !GENERAL.has(`${ownerSlug}:${topic}`) };
      if (lead.answer === 'not_addressed') {
        rule.trust = 'PUBLIC_POLICY_NOT_LOCATED'; rule.quick_status = 'NOT_PUBLICLY_SPECIFIED';
        rule.review_note = `Not located in the public sources reviewed as of ${AS_OF}.`;
      } else if (partial) {
        rule.trust = 'NEEDS_REVIEW'; rule.status = 'needs_verification'; rule.review_note = PARTIAL[ownerSlug];
      } else if (stale) {
        rule.trust = 'PENDING_INSTITUTION_CONFIRMATION'; rule.status = 'needs_verification';
        rule.review_note = 'The school published this before the July 2025 rule changes, or on an undated page. It has not been confirmed as current.';
        if (!/Confirm with/.test(rule.conditions || '')) rule.conditions = [rule.conditions, 'Published before the July 2025 rule changes or undated. Confirm with the school that it still applies.'].filter(Boolean).join(' ');
        if (rule.quick_status === 'YES' || rule.quick_status === 'DEPENDS') rule.quick_status = 'CHECK_FIRST';
      } else rule.trust = 'VERIFIED_TO_OFFICIAL_SOURCE';
      rules.push(rule); made.push(rule);
    }
    return made;
  };

  const orlando = marketAreas.find((m) => m.slug === 'orlando-metro');

  for (const file of FILES) {
    const data = load(file);

    for (const c of data.conferences || []) {
      if (!governingBodies.find((g) => g.slug === c.slug)) governingBodies.push({ slug: c.slug, name: c.name, short_name: c.short_name, body_type: 'conference', website_url: c.website_url, description: tidy(c.notes) || 'Athletic conference.' });
      const map = addSources(c.slug, c.sources, c.slug);
      addRules(c.slug, c.slug, c.rules, map, { gb: c.slug }, 'college', { owner: { gb: c.slug } });
    }

    for (const d of data.districts || []) {
      const key = keyOf(d.slug);
      if (!districts.find((x) => x.slug === d.slug)) districts.push({ slug: d.slug, name: d.name, state: 'FL', county: d.county, website_url: d.website_url, nces_district_id: d.nces_district_id || undefined });
      const map = addSources(key, d.sources);
      // Fold the district advertising limits into the facilities rule rather than presenting them as a product ban on student deals.
      const ad = (d.rules || []).find((r) => r.topic === 'prohibited-categories');
      const fac = (d.rules || []).filter((r) => r.topic === 'school-facilities');
      if (ad && fac.length) { fac[0].conditions = `${fac[0].conditions} Ads on district property also cannot promote alcohol, tobacco, drugs, weapons or gambling.`; fac[0].sources.push(...ad.sources); }
      addRules(d.slug, key, d.rules, map, { district: d.slug }, 'high_school', { owner: { district: d.slug } });
      F.districtSearches.push({ district: d.slug, public_policy_found: !!d.policy_search?.public_policy_found, search_date: data.researched_on,
        locations_checked: (d.policy_search?.locations_checked || []).map(tidy), locations_unreachable: (d.policy_search?.locations_unreachable || []).map(tidy), notes: tidy(d.policy_search?.notes) });
      for (const u of d.policy_search?.locations_unreachable || []) note({ district: d.slug }, 'manual_review', `Could not be opened: ${u}`);
    }

    for (const s of data.schools) {
      const key = keyOf(s.slug);
      const isHS = s.institution_type === 'high_school';
      const nm = NAME[s.slug] || {};
      const name = nm.name || s.name;
      const short = nm.short_name || (isHS ? name : s.short_name) || name;
      const owner = { inst: s.slug };
      const map = addSources(key, s.sources);
      const src = (id) => (id && map[id] ? map[id].slug : null);

      const existing = institutions.findIndex((i) => i.slug === s.slug);
      const sports = isHS
        ? { unspecified: sportSet([...(s.sports.unspecified || []), ...(s.sports.mens || []), ...(s.sports.womens || [])]) }
        : { mens: sportSet(s.sports.mens), womens: sportSet(s.sports.womens) };
      const inst = { slug: s.slug, name, short_name: short, institution_type: s.institution_type, sector: PRIVATE.has(s.slug) ? 'private' : (s.sector || 'public'), state: 'FL',
        city: s.city, county: s.county || undefined, street_address: s.street_address || undefined, postal_code: s.postal_code || undefined,
        district: isHS ? s.district_slug : undefined, conference: isHS ? undefined : s.conference_slug || undefined,
        division: isHS ? 'FHSAA member school' : 'NCAA Division I', website_url: s.website_url, athletics_url: s.athletics_url,
        profile_source: src(s.profile_source_id), publication_state: 'researched',
        governing: isHS ? ['fhsaa'] : ['ncaa', 'college-sports-commission', ...(PRIVATE.has(s.slug) ? [] : ['florida-board-of-governors'])],
        sports, sports_source: src(s.sports_source_id) || src(s.profile_source_id), search_aliases: ALIASES[s.slug] || undefined };
      if (existing > -1) institutions[existing] = inst; else institutions.push(inst);

      // policy search (one current record per school)
      const ps = s.policy_search || {};
      const psIdx = policySearches.findIndex((p) => p.inst === s.slug);
      const nilPolicyFound = !!ps.public_policy_found && !(isHS);   // no pilot high school publishes NIL guidance of its own
      const psRow = { inst: s.slug, public_policy_found: nilPolicyFound, search_date: data.researched_on,
        locations_checked: (ps.locations_checked || []).map(tidy), locations_unreachable: (ps.locations_unreachable || []).map(tidy), notes: tidy(ps.notes) };
      if (psIdx > -1) policySearches[psIdx] = psRow; else policySearches.push(psRow);

      const pol = s.school_policy;
      if (pol) schoolPolicies.push({ inst: s.slug, title: tidy(pol.title), summary: tidy(pol.summary), policy_status: pol.policy_status, source: src(pol.source_id),
        adopted_on: isDate(pol.adopted_on) ? pol.adopted_on : null, covers_nil: !isHS || /NIL/.test(pol.title) });

      const made = addRules(s.slug, key, s.rules, map, { inst: s.slug }, s.institution_type, { owner, policyStatus: pol?.policy_status, policySource: pol?.source_id });

      // school disclosure process, attached to the school's own disclosure rule when that rule is current
      const wf = s.disclosure_workflow;
      const disc = made.find((r) => r.topic === 'disclosure-required');
      if (wf && disc && disc.trust === 'VERIFIED_TO_OFFICIAL_SOURCE') {
        const vague = (t) => !t || /^not (stated|read|seen)|^no deadline/i.test(t);
        disc.disclosure = { what: tidy(wf.what), recipient: tidy(wf.recipient), deadline_text: vague(wf.deadline_text) ? 'The school does not state a deadline of its own. The national deadline still applies.' : tidy(wf.deadline_text),
          platform_name: /not named/i.test(wf.platform_name || '') ? null : wf.platform_name || null, platform_url: wf.platform_url || null, form_name: wf.form_name || null, form_url: wf.form_url || null };
      }
      // high schools: record what the school's clearance pages say (or do not say) about Form GA1
      if (isHS && wf && src(wf.source_id)) {
        const silent = /do(es)? not mention|not mentioned|do not say/i.test(wf.what);
        const isWP = s.slug === 'winter-park-high-school-winter-park';
        if (silent || isWP) {
          const slug = `${key}-disclosure-required`; haveRule.add(slug);
          rules.push({ slug, topic: 'disclosure-required', scope: { inst: s.slug }, applies: 'high_school', answer: 'not_addressed',
            summary: isWP
              ? `${name}'s athletics site has a menu item named NIL that opens a copy of FHSAA Form GA1 dated August 2024. The site does not say how or when to hand the form in. Athletic clearance runs through ${wf.platform_name}.`
              : `${name} handles athletic clearance online through ${wf.platform_name}. Its public clearance instructions do not mention Form GA1 or NIL.`,
            conditions: 'The FHSAA rule still applies: Form GA1 goes to the school within five business days of signing. Ask the athletic department how it wants the form handed in.',
            citation: `${name} athletic clearance instructions`,
            sources: [{ src: src(wf.source_id), locator: 'Athletic clearance instructions', quote: wf.quote, check: 'machine_raw_text' },
              ...(isWP && src(pol?.source_id) ? [{ src: src(pol.source_id), locator: 'Site menu, More, NIL', quote: null, check: 'machine_raw_text' }] : [])],
            method: 'raw_source_text', status: 'researched', trust: 'PUBLIC_POLICY_NOT_LOCATED', quick_status: 'NOT_PUBLICLY_SPECIFIED',
            short_answer: 'The school\'s public pages do not say how to hand in Form GA1. Ask the athletic department.',
            review_note: `A school-specific Form GA1 process was not located in the public sources reviewed as of ${AS_OF}.`, nil_specific: true });
        }
      }
      // colleges: say plainly when no school statement on direct payments was located
      if (!isHS && !['acc', 'big-12', 'sec'].includes(s.conference_slug) && !made.find((r) => r.topic === 'school-payments') && (s.not_found || []).concat(s.ambiguities || []).some((t) => /opted in|revenue shar/i.test(t))) {
        const slug = `${key}-school-payments`; haveRule.add(slug);
        rules.push({ slug, topic: 'school-payments', scope: { inst: s.slug }, applies: 'college', answer: 'not_addressed',
          summary: `An official statement from ${short} on whether it opted in to House settlement revenue sharing, or pays athletes directly, was not located in the public sources reviewed as of ${AS_OF}.`,
          conditions: 'Schools outside the ACC, Big Ten, Big 12, Pac-12 and SEC choose each year whether to opt in. Ask the compliance office.',
          citation: `${short} public athletics and compliance pages`,
          sources: [{ src: src(s.profile_source_id) || map[s.sources[0].id].slug, locator: 'Pages listed under "Where we looked"', quote: null, check: 'machine_raw_text' }],
          method: 'raw_source_text', status: 'researched', trust: 'PUBLIC_POLICY_NOT_LOCATED', quick_status: 'NOT_PUBLICLY_SPECIFIED',
          short_answer: `${short} has not said publicly whether it pays athletes directly.`,
          review_note: `Not located in the public sources reviewed as of ${AS_OF}.`, nil_specific: true });
      }

      // programs: colleges only. High school booster and sponsor programs are not NIL and stay off the page.
      (s.programs || []).forEach((p, i) => {
        if (isHS) { note(owner, 'left_off_page', `Sponsor or booster program "${p.name}" is a school fundraising program, not NIL. Left off the page.`); return; }
        const status = p.current === true ? '' : p.current === false ? ' The school says this is no longer active.' : ' Current status not confirmed.';
        nilPrograms.push({ inst: s.slug, name: tidy(p.name), program_type: p.program_type, description: tidy(p.description) + (p.program_type === 'collective' && p.current === false && /news reporting/i.test(p.description) ? '' : status),
          url: p.url || undefined, source: src(p.source_id), sort: (i + 1) * 10, is_current: p.current === true ? true : p.current === false ? false : null });
      });

      // contacts: office, role and (when the official page prints it) the person's name and office phone. No personal emails.
      const cs = (s.contacts || []).map((c) => ({ ...c, scope: scopeOfContact(c) })).sort((a, b) => CONTACT_ORDER[a.scope] - CONTACT_ORDER[b.scope] || (/director/i.test(b.role) ? 1 : 0) - (/director/i.test(a.role) ? 1 : 0));
      const real = cs.filter((c) => c.scope !== 'general' && !(isHS && c.scope === 'licensing'));
      cs.forEach((c) => {
        const show = c.scope === 'general' ? real.length === 0 : real.includes(c) && real.indexOf(c) < 4;
        contacts.push({ inst: s.slug, office: tidy(c.office), role: tidy(c.role).split(/[.;] /)[0].replace(/\.$/, ''), person_name: c.person_name || undefined, phone: c.phone || undefined,
          url: c.url, source: src(c.source_id), is_public: true, show, status: 'verified', contact_scope: c.scope });
      });

      // review notes for the human checklist
      (s.important_claims || []).forEach((t) => note(owner, 'claim', t));
      (s.ambiguities || []).forEach((t) => note(owner, 'ambiguity', t));
      (s.conflicts || []).forEach((t) => note(owner, 'conflict', t));
      (s.manual_review || []).forEach((t) => note(owner, 'manual_review', t));
      (s.not_found || []).forEach((t) => note(owner, 'not_found', t));
      (ps.locations_unreachable || []).forEach((t) => note(owner, 'manual_review', `Could not be opened: ${t}`));

      // page
      const dir = isHS ? 'high-schools' : 'colleges';
      const verifiedTopics = made.filter((r) => r.trust === 'VERIFIED_TO_OFFICIAL_SOURCE' && r.nil_specific).map((r) => r.topic);
      const FACT = { 'disclosure-required': 'how to report a deal', 'agents': 'agent rules', 'school-logos-marks': 'logo approval', 'school-facilities': 'facility use', 'collectives': 'collectives',
        'prohibited-categories': 'banned categories', 'school-payments': 'school payments', 'international-athletes': 'international athletes', 'boosters': 'boosters', 'deal-review': 'deal review' };
      const facts = Object.keys(FACT).filter((t) => verifiedTopics.includes(t)).slice(0, 3).map((t) => FACT[t]);
      const meta = isHS
        ? `NIL rules for ${name} athletes in ${s.city}, Florida: what FHSAA allows, Form GA1, Orange County Public Schools rules, and who to ask at the school.`
        : facts.length
          ? [3, 2, 1].map((k) => `NIL rules for ${name} athletes: ${facts.slice(0, k).join(', ')}, NIL Go reporting and Florida law, with official sources.`).find((m) => m.length <= 165)
          : `NIL rules for ${name} athletes: what Florida law, the NCAA and NIL Go require, and what ${short} has and has not published, with sources.`;
      const path = `/nil/florida/${dir}/${s.slug}/`;
      if (!pages.find((p) => p.path === path)) pages.push({ path, page_type: isHS ? 'high_school_hub' : 'college_hub', state: 'FL', inst: s.slug,
        title: isHS ? [`${name} (${s.city}, FL) NIL Rules | NIL Brand Academy`, `${name} (${s.city}) NIL Rules | NIL Brand Academy`].find((t) => t.length <= 70) : `${name} NIL Rules | NIL Brand Academy`, h1: `${name} NIL rules`, meta_description: meta });

      if (orlando && (s.county === 'Orange County' || s.slug === 'university-of-central-florida') && !orlando.institutions.includes(s.slug)) orlando.institutions.push(s.slug);
    }
  }
}
