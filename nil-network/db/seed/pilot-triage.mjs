// Phase 3B. Merges the document triage (db/seed/research/triage_*.json) into the research records before they are
// turned into seed rows, and produces the list of source-access issues: one row per unique document, mapped to every
// page it affects. Nothing here records a human review.
const tidy = (t) => (typeof t === 'string' ? t.replace(/\s+/g, ' ').trim() : t);
export const TRIAGE_FILES = ['triage_a.json', 'triage_b.json', 'triage_c.json', 'triage_d.json'];
export const TRIAGED_ON = '2026-10-04';

// Where a newly read document supersedes what was recorded before, the new rule replaces the old one for that topic.
// Everywhere else the new finding is added to the existing rule and every source is kept.
const REPLACE = {
  'florida-state-university': ['agents', 'collectives'],
  'university-of-miami': ['school-payments', 'collectives'],
  'florida-atlantic-university': ['disclosure-required'],
  'florida-international-university': ['team-activities'],
  'university-of-north-florida': ['team-activities', 'agents', 'international-athletes', 'school-logos-marks', 'prohibited-categories'],
  'stetson-university': ['disclosure-required', 'school-logos-marks'],
};
const POLICY = {
  'university-of-north-florida': { title: 'UNF Policy 5.0110P, Intercollegiate Athletes: Name, Image and Likeness', source_id: 't1', policy_status: 'published', adopted_on: '2021-10-25',
    summary: 'UNF\'s formal university policy on athlete NIL, effective October 25, 2021 and revised January 20, 2026. It covers reporting, logos and uniforms, facilities, agents, prohibited deals, workshops and how violations are handled. The 2026-27 Student-Athlete Handbook and a one-page NIL Reference Guide summarise it.' },
  'stetson-university': { title: 'Stetson University Name, Image, and Likeness Policy', source_id: 's1', policy_status: 'published', adopted_on: '2025-09-16',
    summary: 'A six page Stetson University policy, last revised September 16, 2025. It covers what NIL activity is allowed, reporting to NIL Go, agents, use of Stetson\'s name and marks, sponsor conflicts, facilities, workshops, international athletes and late disclosure. All six pages were read on screen on October 4, 2026.' },
};
const WORKFLOW = {
  'florida-atlantic-university': { platform_name: 'Opendorse', deadline_text: 'Not stated on any FAU page read.' },
  'stetson-university': { what: 'NIL contracts or transactions with non-school payors worth $600 or more in total, with written documentation', recipient: 'NIL Go', deadline_text: 'Within five business days of signing or agreeing to payment terms', platform_name: 'NIL Go', platform_url: 'https://www.collegesportscommission.org/nil/', source_id: 't1', quote: null },
};
// Documents the triage agents described in notes but did not list, and sources known to exist behind a login.
const EXTRA_DOCS = [
  { title: 'University of Miami NIL Policy on Teamworks', organization: 'University of Miami Athletics', url: null, owners: ['university-of-miami'], occurrences: 1,
    why_unopened: 'Miami\'s 2023-24 Student-Athlete Handbook says athletes are also responsible for "the NIL Policy available on Teamworks". Teamworks is behind a login.', retry: 'Not attempted. Access controls are not bypassed.', status: 'login_required',
    class: 'A', claim_affected: 'Every Miami rule: disclosure platform and deadline, prohibited categories, marks, facilities, agents.', other_support: null, risk: 'high', finding: null },
  { title: 'FIU Athletics Brand Guide 2024-25 (image-only PDF)', organization: 'FIU Athletics', url: 'https://fiusports.com/documents/2024/12/19/FIU_Athletics_Brand_Guide_2024-25.pdf', owners: ['florida-international-university'], occurrences: 1,
    why_unopened: 'The PDF has no text layer.', retry: 'Opened, but the text could not be read.', status: 'still_inaccessible',
    class: 'B', claim_affected: 'FIU logo approval wording.', other_support: 'FIU Policy 910.001 names the two offices that approve logo use.', risk: 'low', finding: null },
  { title: 'UAA Obligations and Important Policies 2024-2025 (PDF)', organization: 'University Athletic Association (UF)', url: 'https://floridagators.com/documents/2025/2/14/UAA_Obligations_Important_Policies_2024_2025_09062024.pdf', owners: ['university-of-florida'], occurrences: 1,
    why_unopened: 'Found on October 4, 2026 after the page-read limit for UF was reached.', retry: 'Not retried.', status: 'not_retried',
    class: 'E', claim_affected: 'None expected. It is dated September 2024, before UF\'s August 2025 NIL overview.', other_support: 'UF Overview of Gators NIL (August 6, 2025).', risk: 'low', finding: null },
  { title: 'UF Name, Image, Likeness page (June 2021)', organization: 'University Athletic Association (UF)', url: 'https://floridagators.com/sports/2021/6/24/name-image-likeness.aspx', owners: ['university-of-florida'], occurrences: 1,
    why_unopened: 'Found on October 4, 2026 after the page-read limit for UF was reached.', retry: 'Opened in the browser on October 4, 2026.', status: 'opened_now',
    class: 'C', claim_affected: 'None. The address now redirects to UF\'s current Gators NIL page, which is already a cited source.', other_support: 'UF Overview of Gators NIL (August 6, 2025) and the Gators NIL page.', risk: 'none', finding: 'Redirects to the current Gators NIL page, which says athletes report third-party deals at NILgo.com. UF\'s compliance Agents page is headed "UF Policy on Agents (Not related to Name, Image, & Likeness)".' },
];

export function mergeTriage(loaded, load) {
  const docs = []; const updates = {};
  for (const f of TRIAGE_FILES) { const t = load(f); docs.push(...t.documents); Object.assign(updates, t.school_updates); }
  docs.push(...EXTRA_DOCS);
  const schools = new Map(); const districts = new Map();
  for (const data of loaded) { for (const s of data.schools || []) schools.set(s.slug, s); for (const d of data.districts || []) districts.set(d.slug, d); }
  const triagedOwners = new Set(docs.flatMap((d) => d.owners));

  for (const [slug, u] of Object.entries(updates)) {
    const s = schools.get(slug) || districts.get(slug);
    if (!s) continue;                                  // Seminole County district and Seminole High are handled in the seed itself
    s.sources.push(...(u.sources || []));
    const replace = new Set(REPLACE[slug] || []);
    const topics = new Set((u.rules || []).map((r) => r.topic));
    s.rules = (s.rules || []).filter((r) => !(replace.has(r.topic) && topics.has(r.topic)));
    s.rules.push(...(u.rules || []));
    for (const p of u.programs || []) { const i = (s.programs || []).findIndex((x) => x.name === p.name); if (i > -1) s.programs[i] = p; else (s.programs = s.programs || []).push(p); }
    for (const c of u.contacts || []) { if (!(s.contacts || []).find((x) => x.office === c.office && (x.person_name || '') === (c.person_name || ''))) (s.contacts = s.contacts || []).push(c); }
    if (POLICY[slug]) s.school_policy = POLICY[slug];
    else if (s.school_policy && u.policy_status && u.policy_status !== 'unchanged' && u.policy_status !== 'none_found') s.school_policy.policy_status = u.policy_status;
    if (WORKFLOW[slug]) s.disclosure_workflow = { ...(s.disclosure_workflow || {}), ...WORKFLOW[slug] };
    s.ambiguities = [...(s.ambiguities || []), ...(u.notes || []).map((n) => 'October 4 re-check: ' + n), ...(u.corrections || []).map((n) => 'October 4 correction: ' + n)];
    if (u.policy_note && s.policy_search) s.policy_search.notes = tidy(u.policy_note);
  }
  // program status corrections confirmed on October 4
  const setCurrent = (slug, name, v) => { const p = (schools.get(slug)?.programs || []).find((x) => x.name.startsWith(name)); if (p) p.current = v; };
  setCurrent('florida-international-university', 'The Panther Exchange', true);
  setCurrent('florida-am-university', 'Rattlers Local Exchange', true);
  setCurrent('bethune-cookman-university', 'NIL Merchandise', true);

  // Rebuild "could not open" lists from the triage: only documents that are still unread stay on them.
  for (const slug of triagedOwners) {
    const s = schools.get(slug) || districts.get(slug); if (!s || !s.policy_search) continue;
    const mine = docs.filter((d) => d.owners.includes(slug));
    s.policy_search.locations_unreachable = mine.filter((d) => d.status !== 'opened_now' && ['A', 'B'].includes(d.class)).map((d) => `${tidy(d.title)} (${d.status === 'login_required' ? 'behind a login' : d.status === 'not_found_404' ? 'page no longer exists' : 'could not be opened'})`);
    s.policy_search.locations_checked = [...(s.policy_search.locations_checked || []), ...mine.filter((d) => d.status === 'opened_now').map((d) => `${tidy(d.title)} (opened October 4, 2026)`)];
    s.manual_review = mine.filter((d) => d.status !== 'opened_now').map((d) => `Class ${d.class}, ${d.risk} risk: ${tidy(d.title)}${d.url ? ' (' + d.url + ')' : ''}. ${tidy(d.why_unopened)}`);
    s.researched_on = TRIAGED_ON;
  }
  return { docs, updates };
}
