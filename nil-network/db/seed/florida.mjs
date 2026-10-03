import { applyPilot } from './pilot.mjs';
// Florida pilot seed. Every rule carries its source, locator and verbatim quote.
// Status vocabulary used here:
//   researched          = primary source opened, quote machine-extracted, waiting for a human check
//   needs_verification  = wording or currency could not be confirmed; do not treat as established
// Nothing in this file is marked 'verified'. Only a human second check can do that.

export const CHECKED_ON = '2026-10-03';
export const CHECKED_BY = 'Claude (automated source research)';

export const states = [{ code: 'FL', name: 'Florida', slug: 'florida' }];

export const governingBodies = [
  { slug: 'ncaa', name: 'National Collegiate Athletic Association', short_name: 'NCAA', body_type: 'national_association', website_url: 'https://www.ncaa.org/', description: 'Sets Division I rules, including Bylaw Article 22 on name, image and likeness.' },
  { slug: 'college-sports-commission', name: 'College Sports Commission', short_name: 'College Sports Commission', body_type: 'enforcement_body', website_url: 'https://www.collegesportscommission.org/', description: 'Runs NIL Go, the clearinghouse that reviews third-party NIL deals for Division I athletes, and enforces the House settlement rules.' },
  { slug: 'florida-legislature', name: 'Florida Legislature', short_name: 'Florida law', body_type: 'state_legislature', state: 'FL', website_url: 'http://www.leg.state.fl.us/', description: 'Enacts Florida Statutes, including section 1006.74 on intercollegiate athlete compensation.' },
  { slug: 'florida-board-of-governors', name: 'Florida Board of Governors', short_name: 'Florida Board of Governors', body_type: 'state_agency', state: 'FL', website_url: 'https://www.flbog.edu/', description: 'Regulates the State University System, including Regulation 6.022 on intercollegiate athletes.' },
  { slug: 'fhsaa', name: 'Florida High School Athletic Association', short_name: 'FHSAA', body_type: 'state_association', state: 'FL', website_url: 'https://fhsaa.com/', description: 'Governs interscholastic athletics for its member high schools in Florida. Bylaw 9.9 covers amateurism and NIL.' },
  { slug: 'sec', name: 'Southeastern Conference', short_name: 'SEC', body_type: 'conference', website_url: 'https://www.secsports.com/', description: 'Athletic conference.' },
];

export const districts = [
  { slug: 'seminole-county-public-schools', name: 'Seminole County Public Schools', state: 'FL', county: 'Seminole County', website_url: 'https://www.scps.k12.fl.us/', nces_district_id: '1201710' },
];

export const sources = [
  // ---- FHSAA / high school
  { slug: 'fhsaa-bylaw-9-9-sbe-2024', title: 'FHSAA Bylaw 9.9 Amateurism, text presented to the State Board of Education', url: 'https://www.fldoe.org/core/fileparse.php/20758/urlt/5.2.pdf', organization: 'Florida Department of Education (text of FHSAA Bylaw 9.9)', gb: 'fhsaa', source_type: 'board_document', published_on: '2024-07-24', notes: 'Bylaw text as presented for ratification. Section numbers for penalties changed after the September 2024 amendment (9.9.5 became 9.9.6). Compare against the 2026-27 FHSAA Handbook before marking verified.' },
  { slug: 'fhsaa-bylaw-9-9-5-sbe-2024', title: 'FHSAA Bylaw 9.9.5 Affidavit of Compliance and 9.9.6 Penalties, amended text', url: 'https://www.fldoe.org/core/fileparse.php/20775/urlt/18-2.pdf', organization: 'Florida Department of Education (text of FHSAA Bylaw 9.9)', gb: 'fhsaa', source_type: 'board_document', published_on: '2024-09-25' },
  { slug: 'fhsaa-form-ga1', title: 'FHSAA Form GA1, Affidavit of Compliance with the Regulations on Amateurism and Interscholastic Athletic Eligibility (Revised 10/24)', url: 'https://s3.amazonaws.com/fhsaa.org/documents/2024/10/2/GA1_Affidavit_of_Amateurism_10124.pdf', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'form', published_note: 'Revised 10/24', notes: 'FHSAA-hosted copy linked from the FHSAA NIL resources page. Reprints Bylaw 9.9.1 through 9.9.6 in clean final text. Read visually on 2026-10-03.' },
  { slug: 'fhsaa-bylaw-9-9-final', title: 'FHSAA Bylaw 9.9 Amateurism and Name, Image, and Likeness (FHSAA-hosted bylaw pages)', url: 'https://s3.amazonaws.com/fhsaa.org/documents/2024/8/12/Bylaw_9_9_Final.pdf', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'bylaw', published_on: '2024-08-12', published_note: 'Posted August 12, 2024; pages from the 2024-25 Handbook', notes: 'Linked from the FHSAA NIL resources page. Predates the September 2024 affidavit amendment, so penalties are numbered 9.9.5 here. Read visually on 2026-10-03.' },
  { slug: 'fhsaa-letter-2024-06-21', title: 'A Letter from the FHSAA about NIL', url: 'https://fhsaa.com/news/2024/6/21/about-us-a-letter-from-the-fhsaa-about-nil.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'official_webpage', published_on: '2024-06-21' },
  { slug: 'fhsaa-board-recap-2024-07-22', title: 'FHSAA Board of Directors Recap of July Special Called Meeting', url: 'https://fhsaa.com/news/2024/7/22/about-us-board-of-directors-recap-of-july-special-called-meeting.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'board_document', published_on: '2024-07-22' },
  { slug: 'fhsaa-board-recap-2024-09', title: 'FHSAA Board of Directors Recap of September Meeting', url: 'https://fhsaa.com/news/2024/9/24/about-us-fhsaa-board-of-directors-recap-of-september-meeting.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'board_document', published_on: '2024-09-25' },
  { slug: 'sbe-consent-2024-09-25', title: 'State Board of Education Consent Item: Ratification of FHSAA Bylaws, September 25, 2024', url: 'https://www.fldoe.org/core/fileparse.php/20775/urlt/18-1.pdf', organization: 'Florida Department of Education', source_type: 'board_document', published_on: '2024-09-25' },
  { slug: 'sbe-agenda-2024-07-24', title: 'State Board of Education Meeting Agenda, July 24, 2024', url: 'https://www.fldoe.org/policy/state-board-of-edu/meetings/2024/2024-07-24/', organization: 'Florida Department of Education', source_type: 'board_document', published_on: '2024-07-24' },
  { slug: 'sbe-consent-2025-07-16', title: 'State Board of Education Consent Item: Ratification of FHSAA Bylaws, July 16, 2025', url: 'https://www.fldoe.org/core/fileparse.php/20872/urlt/10-1.pdf', organization: 'Florida Department of Education', source_type: 'board_document', published_on: '2025-07-16' },
  { slug: 'fl-stat-1006-20', title: 'Section 1006.20, Florida Statutes (2026): Athletics in public K-12 schools', url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=1000-1099/1006/Sections/1006.20.html', organization: 'Florida Legislature', gb: 'florida-legislature', source_type: 'statute', published_note: '2026 Florida Statutes' },
  { slug: 'fhsaa-handbook-2024-25', title: '2024-25 FHSAA Handbook (revised February 20, 2025)', url: 'https://s3.amazonaws.com/fhsaa.org/documents/2024/11/20/2425_handbook_update_11424.pdf', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'bylaw', published_on: '2025-02-20' },
  { slug: 'fhsaa-handbook-2026-27', title: '2026-27 FHSAA Handbook, Bylaws (2026-27 Edition, posted July 22, 2026)', url: 'https://s3.amazonaws.com/fhsaa.org/documents/2026/7/22/2627_handbook_website_7_22.pdf', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'bylaw', published_on: '2026-07-22', notes: 'Current handbook, "applicable to the 2026-27 school year". The NIL bylaw is numbered 9.10 here. Read as raw text on 2026-10-03 and compared word for word with the October 2024 text.' },
  { slug: 'fhsaa-nil-resources', title: 'Amateurism and Name, Image and Likeness (NIL) resources', url: 'https://fhsaa.com/sports/2024/8/12/ABOUT_NILResources.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'official_webpage', published_on: '2024-08-12' },
  { slug: 'fl-hb-981-2025', title: 'CS/CS/HB 981 (2025) Athlete Representation and Compensation, bill page', url: 'https://www.flsenate.gov/Session/Bill/2025/981', organization: 'Florida Senate', gb: 'florida-legislature', source_type: 'legislative_record', published_on: '2025-06-16' },
  // ---- Florida college law
  { slug: 'fl-stat-1006-74', title: 'Section 1006.74, Florida Statutes (2026): Intercollegiate athlete compensation and rights', url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=1000-1099/1006/Sections/1006.74.html', organization: 'Florida Legislature', gb: 'florida-legislature', source_type: 'statute', published_note: '2026 Florida Statutes' },
  { slug: 'fl-stat-468-453', title: 'Section 468.453, Florida Statutes (2026): Athlete agents, licensure required', url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0468/Sections/0468.453.html', organization: 'Florida Legislature', gb: 'florida-legislature', source_type: 'statute', published_note: '2026 Florida Statutes' },
  { slug: 'fl-stat-468-452', title: 'Section 468.452, Florida Statutes (2026): Athlete agents, definitions', url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0468/Sections/0468.452.html', organization: 'Florida Legislature', gb: 'florida-legislature', source_type: 'statute', published_note: '2026 Florida Statutes' },
  { slug: 'fl-sb-646-2020', title: 'CS/CS/SB 646 (2020) Intercollegiate Athlete Compensation and Rights, bill page', url: 'https://www.flsenate.gov/Session/Bill/2020/646', organization: 'Florida Senate', gb: 'florida-legislature', source_type: 'legislative_record', published_on: '2020-06-12', effective_on: '2021-07-01' },
  { slug: 'fl-hb-7b-2023', title: 'HB 7-B (2023 Special Session B) Intercollegiate Athlete Compensation and Rights, bill page', url: 'https://www.flsenate.gov/Session/Bill/2023B/7B', organization: 'Florida Senate', gb: 'florida-legislature', source_type: 'legislative_record', published_on: '2023-02-17', effective_on: '2023-02-16' },
  { slug: 'bog-reg-6-022', title: 'Board of Governors Regulation 6.022 Intercollegiate Athletes', url: 'https://www.flbog.edu/wp-content/uploads/2023/05/6.022-Intercollegiate-Athletes_05.10.2023.pdf', organization: 'Florida Board of Governors', gb: 'florida-board-of-governors', source_type: 'regulation', published_on: '2023-05-10' },
  { slug: 'bog-task-force-recs-2026', title: 'Task Force on Intercollegiate Athletics: Recommendations to the Board of Governors', url: 'https://www.flbog.edu/wp-content/uploads/2026/08/Recommendations-from-Task-Force-On-Intercollegiate-Athletics.pdf', organization: 'Florida Board of Governors', gb: 'florida-board-of-governors', source_type: 'board_document', published_on: '2026-09-03' },
  // ---- NCAA / CSC
  { slug: 'ncaa-d1-manual-2026-27', title: 'NCAA Division I 2026-27 Manual, Bylaw Article 22: Name, Image and Likeness', url: 'https://web3.ncaa.org/lsdbi/reports/getReport/90008', organization: 'NCAA', gb: 'ncaa', source_type: 'bylaw', published_note: '2026-27 Manual as retrieved' },
  { slug: 'ncaa-nil-page', title: 'NCAA Name, Image and Likeness (student-athlete page)', url: 'https://www.ncaa.org/student-athletes/name-image-likeness/', organization: 'NCAA', gb: 'ncaa', source_type: 'official_webpage' },
  { slug: 'ncaa-house-qa-2025-06', title: 'Question and Answer: Implementation of the House Settlement (June 13, 2025)', url: 'https://ncaaorg.s3.amazonaws.com/governance/d1/legislation/2024-25/June2025D1Gov_PhaseThreeInstSetQuestionandAnswer.pdf', organization: 'NCAA', gb: 'ncaa', source_type: 'official_faq', published_on: '2025-06-13', effective_on: '2025-07-01' },
  { slug: 'csc-faq', title: 'College Sports Commission FAQ', url: 'https://www.collegesportscommission.org/faq/', organization: 'College Sports Commission', gb: 'college-sports-commission', source_type: 'official_faq', notes: 'The FAQ had not been updated for the July 2026 review-exemption tier when retrieved.' },
  { slug: 'csc-nil-go', title: 'Student-Athlete NIL Deals: How NIL Go Works', url: 'https://www.collegesportscommission.org/nil/', organization: 'College Sports Commission', gb: 'college-sports-commission', source_type: 'official_webpage' },
  { slug: 'csc-memo-2026-06-23', title: 'CSC Memorandum: Update on NIL Deal Review and Agent Agreements (June 23, 2026)', url: 'https://assets.tina.io/29b83311-e587-42b1-861e-87ebde9aa253/CSC%20Memo%20Update%20on%20NIL%20Deal%20Review%20and%20Agent%20Agreements%206.23.26.pdf', organization: 'College Sports Commission', gb: 'college-sports-commission', source_type: 'official_webpage', published_on: '2026-06-23', effective_on: '2026-07-01' },
  { slug: 's4668-bill-status', title: 'S.4668, Protect College Sports Act of 2026: bill status', url: 'https://www.govinfo.gov/bulkdata/BILLSTATUS/119/s/BILLSTATUS-119s4668.xml', organization: 'U.S. Government Publishing Office', source_type: 'legislative_record', published_on: '2026-10-02' },
  // ---- University of Florida
  { slug: 'uf-nil-overview', title: 'Overview of the Gators and Name, Image, Likeness', url: 'https://floridagators.com/sports/2025/8/6/overview-name-image-likeness', organization: 'University Athletic Association, University of Florida', source_type: 'institution_policy', published_on: '2025-08-06', published_note: 'Date taken from the page URL', notes: 'Athlete-facing overview page, not a formal policy document. Text was machine-extracted; several passages need a human read.' },
  { slug: 'uf-gators-made', title: 'Gators Made: Name, Image, and Likeness', url: 'https://floridagators.com/sports/2021/12/16/gators-made-name-image-likeness.aspx', organization: 'University Athletic Association, University of Florida', source_type: 'official_webpage' },
  { slug: 'uf-compliance', title: 'UAA Compliance Office', url: 'https://floridagators.com/sports/2015/12/10/_compliance_', organization: 'University Athletic Association, University of Florida', source_type: 'official_webpage' },
  { slug: 'uf-licensing-faq', title: 'Licensing and Trademarks: Frequently Asked Questions', url: 'https://floridagators.com/sports/2015/12/10/_licensing_p_faq', organization: 'University Athletic Association, University of Florida', source_type: 'official_webpage', notes: 'General licensing FAQ, not NIL-specific.' },
  { slug: 'uf-iss-ncaa-faq', title: 'NCAA Frequently Asked Questions, International Student Services', url: 'https://internationalcenter.ufl.edu/iss/maintaining-f-1-status/employment-or-training/ncaa---frequently-asked-questions/', organization: 'University of Florida International Center', source_type: 'official_webpage' },
  { slug: 'uf-guidelines-legacy', title: 'Guidelines for Name, Image, and Likeness', url: 'https://floridagators.com/sports/2021/12/16/guidelines-name-image-likeness.aspx', organization: 'University Athletic Association, University of Florida', source_type: 'official_webpage', notes: 'Page currently reads "Updated information coming soon."' },
  { slug: 'uf-athletics-home', title: 'Florida Gators official athletics site', url: 'https://floridagators.com/', organization: 'University Athletic Association, University of Florida', source_type: 'official_webpage' },
  // ---- Seminole High School / SCPS
  { slug: 'shs-school-info', title: 'Seminole High School: School Info', url: 'https://sim.scps.k12.fl.us/school/info/0181', organization: 'Seminole County Public Schools', source_type: 'official_webpage' },
  { slug: 'nces-seminole-hs', title: 'NCES Common Core of Data: Seminole High School', url: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?City=Sanford&InstName=Seminole+High+School&Search=1&State=12&ID=120171001872', organization: 'National Center for Education Statistics', source_type: 'government_database' },
  { slug: 'shs-athletics-about', title: 'About Us, Seminole High School Athletics', url: 'https://shsnolessports.com/about-us/', organization: 'Seminole High School Athletics', source_type: 'official_webpage' },
  { slug: 'shs-media-credentials', title: 'Media Credential Request, Seminole High School Athletics', url: 'https://shsnolessports.com/media-credential-request/', organization: 'Seminole High School Athletics', source_type: 'official_webpage' },
  { slug: 'scps-facility-use', title: 'Facility Requests and Rental', url: 'https://www.scps.k12.fl.us/85956_3', organization: 'Seminole County Public Schools', source_type: 'district_policy', notes: 'Policy 7510 and the Facility Use Handbook (rev 05-2024) are linked from this page but could not be opened.' },
  { slug: 'scps-policies', title: 'Policies and Procedures', url: 'https://www.scps.k12.fl.us/district/school-board/policies-procedures', organization: 'Seminole County Public Schools', source_type: 'district_policy', notes: 'Board policy manual landing page. Individual policies could not be opened.' },
  { slug: 'fhsaa-member-directory', title: 'FHSAA Member School Directory', url: 'https://fhsaa.com/sports/2020/1/30/Membership.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'official_webpage' },
];

export const categories = [
  ['compensation', 'Getting paid', 10], ['disclosure', 'Disclosure and deal review', 20],
  ['school_involvement', 'School involvement', 30], ['boosters_collectives', 'Boosters and collectives', 40],
  ['agents', 'Agents and advisers', 50], ['intellectual_property', 'School name, logos and marks', 60],
  ['uniforms', 'Uniforms and team gear', 70], ['facilities', 'Facilities and event footage', 80],
  ['events', 'Team activities and events', 90], ['social_media', 'Social posts, appearances and autographs', 100],
  ['restricted_categories', 'Restricted categories', 110], ['eligibility', 'Eligibility guardrails', 120],
  ['family', 'Parents and guardians', 130], ['international', 'International athletes', 140],
  ['education', 'Education and next level', 150],
];

// [slug, category, label, question, applies_to, in_ip_matrix, sort]
export const topics = [
  ['nil-allowed', 'compensation', 'Earning NIL money', 'Can athletes here earn money from their name, image and likeness?', 'both', false, 10],
  ['pay-for-play', 'compensation', 'Pay for play', 'Can I be paid for playing, winning or choosing a school?', 'both', false, 20],
  ['deal-terms', 'compensation', 'What a deal must include', 'What does a deal need to be valid?', 'both', false, 30],
  ['school-payments', 'compensation', 'Payments from the school', 'Can the school itself pay me or license my NIL?', 'college', false, 40],
  ['disclosure-required', 'disclosure', 'Disclosing a deal', 'Do I have to disclose my deal, to whom, and by when?', 'both', false, 10],
  ['deal-review', 'disclosure', 'Deal review', 'Will anyone review my deal after I report it?', 'college', false, 20],
  ['school-staff-involvement', 'school_involvement', 'Coaches and school staff', 'Can my coach or school arrange or take part in my deal?', 'both', false, 10],
  ['collectives', 'boosters_collectives', 'NIL collectives', 'Can I take a deal from an NIL collective?', 'both', false, 10],
  ['boosters', 'boosters_collectives', 'Boosters', 'Can I do a deal with a booster?', 'both', false, 20],
  ['agents', 'agents', 'Agents and advisers', 'Can I hire an agent or adviser for NIL?', 'both', false, 10],
  ['school-logos-marks', 'intellectual_property', 'School logos, mascot and marks', 'Can the school logo or mascot appear in my sponsored content?', 'both', true, 10],
  ['school-name-reference', 'intellectual_property', 'School name', 'Can a brand reference my school by name?', 'both', true, 20],
  ['championship-accolades', 'intellectual_property', 'Titles and accolades', 'Can my deal mention school or association titles and awards?', 'high_school', true, 30],
  ['own-merchandise', 'intellectual_property', 'Your own merchandise', 'Can I sell my own merchandise?', 'college', true, 40],
  ['uniform-in-content', 'uniforms', 'Uniform in sponsored content', 'Can I wear my school uniform or team gear in sponsored content?', 'both', true, 10],
  ['team-issued-gear', 'uniforms', 'Selling team-issued gear', 'Can I sell or trade gear the school issued to me?', 'college', false, 20],
  ['school-facilities', 'facilities', 'School facilities', 'Can I shoot sponsored content at school facilities?', 'both', true, 10],
  ['event-footage', 'facilities', 'Footage from school events', 'Can footage shot at a school event be used in an ad?', 'high_school', true, 20],
  ['team-activities', 'events', 'During team activities', 'Can I promote a sponsor during games, practices or school events?', 'both', false, 10],
  ['sponsored-posts', 'social_media', 'Sponsored social posts', 'Can I post paid content on my own social accounts?', 'both', false, 10],
  ['appearances-autographs', 'social_media', 'Appearances and autographs', 'Can I be paid for appearances, camps or autographs?', 'both', false, 20],
  ['prohibited-categories', 'restricted_categories', 'Prohibited categories', 'Which products and services are off limits?', 'both', false, 10],
  ['recruiting-inducement', 'eligibility', 'Recruiting and enrollment', 'Can NIL be used to get me to attend a school?', 'both', false, 10],
  ['transfers', 'eligibility', 'Transfers', 'Does transferring affect my NIL?', 'both', false, 20],
  ['contract-length', 'eligibility', 'How long a deal can run', 'How long can my deal last?', 'high_school', false, 30],
  ['penalties', 'eligibility', 'Penalties', 'What happens if I break the rules?', 'both', false, 40],
  ['parent-guardian', 'family', 'Parent or guardian role', 'What does a parent or guardian have to do?', 'high_school', false, 10],
  ['international-athletes', 'international', 'International athletes', 'I am an international student. Can I do NIL deals?', 'college', false, 10],
  ['nil-education', 'education', 'Required financial literacy workshops', 'Does my school have to teach financial literacy and life skills?', 'college', false, 10],
  ['prospects-reporting', 'education', 'Deals signed before college', 'Do deals I sign in high school follow me to Division I?', 'both', false, 20],
];

const S = (src, locator, quote, check = 'machine_extracted') => ({ src, locator, quote, check });

export const rules = [
  // ================================================================= FHSAA (all Florida member high schools)
  { slug: 'fhsaa-nil-allowed', topic: 'nil-allowed', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'Yes. FHSAA athletes may profit from their name, image and likeness as long as they follow Bylaw 9.9.',
    conditions: 'Every other row in this matrix is one of those conditions.', citation: 'FHSAA Bylaw 9.9.4',
    effective_note: 'Approved by the FHSAA Board on June 4, 2024. State Board of Education ratification was on the July 24, 2024 agenda; the vote record and exact effective date were not found in a primary document.',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4', 'A student-athlete may profit from the use of their Name, Image, and Likeness subject to their compliance with FHSAA Bylaw 9.9.'),
              S('fhsaa-letter-2024-06-21', 'Letter, first paragraph', "On June 4, 2024, the Florida High School Athletic Association's (FHSAA) Board of Directors unanimously approved the revision of FHSAA Bylaw 9.9, Amateurism, to include Name, Image, and Likeness (NIL)")] },
  { slug: 'fhsaa-sponsored-posts', topic: 'sponsored-posts', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'Yes. Endorsements, promotions, social media presence and product or service advertisements are all named as permitted activities.',
    conditions: 'Subject to the prohibited categories, school marks and Form GA1 rules in this matrix.', citation: 'FHSAA Bylaw 9.9.4',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4', 'Permissible activities include, but are not limited to, commercial endorsements, promotional activities, social media presence, product, or service advertisements.')] },
  { slug: 'fhsaa-deal-terms', topic: 'deal-terms', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'An NIL agreement must be a fully executed, written contract.', citation: 'FHSAA Bylaw 9.9.4.1',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.1', 'An NIL agreement is a fully executed, written contract that allows for student-athletes to profit from or be compensated for promoting, partnering, and/or representing product endorsements and other activities as defined in FHSAA Bylaw 9.9.')] },
  { slug: 'fhsaa-pay-for-play', topic: 'pay-for-play', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. Competing for money and cashing in on athletic performance still put amateur status at risk, and so does any NIL agreement that does not follow Bylaw 9.9.',
    citation: 'FHSAA Bylaw 9.9.2 (a), (c), (f)',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.2', 'a) Competing for money or other monetary compensations; ... c) Capitalizing on athletic fame or performance by receiving money or gifts of a monetary nature; ... f) Accepting a Name, Image, and Likeness (NIL) agreement that does not adhere to FHSAA Bylaw 9.9.')] },
  { slug: 'fhsaa-school-logos-marks', topic: 'school-logos-marks', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'only_with_approval',
    summary: 'Not without prior written consent. The bylaw bars using a member school\'s, FHSAA\'s or NFHS\'s uniforms, logos, mascots, insignia or identifying marks in NIL activity. It allows a school\'s uniform, equipment, logo and name with prior written consent from the school, district or governing body, and Form GA1 records that consent for member school marks.',
    conditions: 'We found no consent path for FHSAA or NFHS marks, or for references to events, games or championships.', citation: 'FHSAA Bylaw 9.9.4.3; Form GA1 Section B',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3, first sentence', 'Student-athletes are prohibited from making any reference to and will not otherwise use or authorize others to use the uniforms, logos, mascots, insignia, or identifying marks of a member school, the FHSAA, the NFHS, and/or any FHSAA, NFHS, or member school event, game, or championship when engaging in any NIL activity.'),
              S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3, second sentence', 'Student-athletes will be prohibited from monetizing their Name, Image, and Likeness with the use of their school\'s uniform, equipment, logo, name, proprietary patents, products, and/or copyrights associated with an FHSAA member school, NFHS, and/or school district, either in public, print, or social media platforms, unless granted authorization by prior written consent from the school, district or governing body of the school, or Association, respectively.'),
              S('fhsaa-form-ga1', 'Section B', 'In accordance with FHSAA Bylaw 9.9.4.3 above, this school, school district, or governing body provided written consent authorizing the above student to use member school uniforms, logos, mascots, insignia, or identifying marks. [ ___ Yes] [ ___ No] *Required')] },
  { slug: 'fhsaa-school-name', topic: 'school-name-reference', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'only_with_approval',
    summary: 'Not without prior written consent. The school name is listed alongside the uniform and logo as something an athlete cannot monetize with unless the school, district or Association consents in writing.',
    citation: 'FHSAA Bylaw 9.9.4.3',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3', "Student-athletes will be prohibited from monetizing their Name, Image, and Likeness with the use of their school's uniform, equipment, logo, name, proprietary patents, products, and/or copyrights associated with an FHSAA member school, NFHS, and/or school district, either in public, print, or social media platforms, unless granted authorization by prior written consent from the school, district or governing body of the school, or Association, respectively.")] },
  { slug: 'fhsaa-uniform', topic: 'uniform-in-content', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'only_with_approval',
    summary: 'Not without prior written consent. The school uniform and school equipment cannot be used in paid NIL content unless the school, district or Association consents in writing.',
    citation: 'FHSAA Bylaw 9.9.4.3',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3', "Student-athletes will be prohibited from monetizing their Name, Image, and Likeness with the use of their school's uniform, equipment, logo, name, proprietary patents, products, and/or copyrights ... unless granted authorization by prior written consent from the school, district or governing body of the school, or Association, respectively.")] },
  { slug: 'fhsaa-accolades', topic: 'championship-accolades', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. Paid NIL activity cannot reference FHSAA, NFHS, school or district accolades or championships.',
    citation: 'FHSAA Bylaw 9.9.4.3.2',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3.2', "No reference to FHSAA, NFHS, school, or school district accolades or championships may be used in the student's NIL activities for which they are compensated.")] },
  { slug: 'fhsaa-facilities', topic: 'school-facilities', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'not_addressed',
    summary: 'Bylaw 9.9 does not mention school facilities. It does require written consent to use school equipment. Ask your school and district.',
    citation: 'FHSAA Bylaw 9.9.4.3 (equipment only)',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3', "...with the use of their school's uniform, equipment, logo, name, proprietary patents, products, and/or copyrights ...")] },
  { slug: 'fhsaa-team-activities', topic: 'team-activities', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. Athletes may not endorse or promote any third party during school-sponsored, district-sponsored or FHSAA activities.',
    citation: 'FHSAA Bylaw 9.9.4.3.1',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.3.1', 'Student-athletes may not endorse or promote any third-party entities, goods, or services during school-/district-sponsored activities or FHSAA activities.')] },
  { slug: 'fhsaa-prohibited-categories', topic: 'prohibited-categories', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'Nine categories are off limits for Florida high school athletes, listed in Bylaw 9.9.4.4 (a) through (i).',
    citation: 'FHSAA Bylaw 9.9.4.4 (a)-(i)',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.4', 'Student-athletes are prohibited from engaging in any NIL activities involving the following categories of products and services: (a) Adult entertainment products and services; (b) Alcohol, tobacco, vaping, and nicotine products; (c) Cannabis products; (d) Controlled substances; (e) Prescription pharmaceuticals; (f) Gambling, including sports betting, the lottery, and betting in connection with video games, online games, and mobile devices; (g) Weapons, firearms, and ammunition; (h) Political or social activism; and (i) NIL Collectives.')],
    prohibited: [['adult-entertainment', 'Adult entertainment products and services'], ['alcohol-tobacco-vaping-nicotine', 'Alcohol, tobacco, vaping, and nicotine products'], ['cannabis', 'Cannabis products'], ['controlled-substances', 'Controlled substances'], ['prescription-pharmaceuticals', 'Prescription pharmaceuticals'], ['gambling', 'Gambling, including sports betting, the lottery, and betting in connection with video games, online games, and mobile devices'], ['weapons', 'Weapons, firearms, and ammunition'], ['political-social-activism', 'Political or social activism'], ['nil-collectives', 'NIL Collectives']] },
  { slug: 'fhsaa-collectives', topic: 'collectives', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. NIL collectives are a prohibited category. The bylaw describes them as groups that collect funds from donors, individuals or businesses to facilitate NIL deals, pay or transfer funds to athletes, create ways for athletes to monetize their NIL, or otherwise promote NIL. School sanctioned team fundraising does not count as a collective.',
    citation: 'FHSAA Bylaw 9.9.4.2 and 9.9.4.4(i)',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.2', 'NIL Collectives include but are not limited to, groups, organizations, or cooperative enterprises that exist to collect funds from donors, individuals, or businesses to: (a) help facilitate NIL deals for student-athletes; (b) facilitate payments to or transfers funds to student-athletes; (c) create ways for athletes to monetize from their NIL; and/or (d) otherwise promote NIL for schools or student-athletes. NIL Collectives shall not include school sanctioned team fundraising.')] },
  { slug: 'fhsaa-school-staff', topic: 'school-staff-involvement', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. School employees, athletic department staff and representatives of the school\'s athletic interests may not form, direct, offer, provide or otherwise take part in NIL activity.',
    citation: 'FHSAA Bylaw 9.9.4.5',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.5', "No school employee, athletic department staff member, or representative of a school's athletic interests as defined in Bylaw 1.4.17 (a-e), may form, direct, offer, provide, or otherwise engage in any activity outlined in FHSAA Bylaw 9.9. Representatives of a school's athletic interests as defined in Bylaw 1.4.17(f) are subject to the prohibitions included in 9.9.4.2 and 9.9.4.4(i).")] },
  { slug: 'fhsaa-boosters', topic: 'boosters', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. A member of a school\'s athletic booster organization counts as a representative of the school\'s athletic interests, and those representatives may not engage in NIL activity. The same definition covers volunteers and immediate relatives of coaches.',
    conditions: 'Bylaw 9.9.4.5 adds that representatives defined in Bylaw 1.4.17(f) are subject to the collective prohibitions. The text of Bylaw 1.4.17 was not checked visually, and the same definition appears to list student-athletes and their families, so how the bar applies to them needs FHSAA confirmation.',
    citation: 'FHSAA Bylaws 9.9.4.5 and 1.4.17 (a)-(e)', status: 'needs_verification',
    sources: [S('fhsaa-handbook-2024-25', 'Bylaw 1.4.17', "Representative of a School's Athletic Interests – refers to any independent person, business, organization, or group that participates in, assists with and/or promotes that school's interscholastic athletic program. This includes: (a) A student-athlete or other student participant in the athletic program at that school; (b) The parents, guardians or other family members of a student-athlete or other student participant; (c) Immediate relatives of a coach or other member of the athletic department staff; (d) A volunteer with that school's athletic program; (e) A member of an athletic booster organization of that school"),
              S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.5', "No school employee, athletic department staff member, or representative of a school's athletic interests as defined in Bylaw 1.4.17 (a-e), may form, direct, offer, provide, or otherwise engage in any activity outlined in FHSAA Bylaw 9.9.")] },
  { slug: 'fhsaa-agents', topic: 'agents', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'Only for NIL advice. Hiring a registered agent to manage an athletic career can cost amateur status, except when the agent is hired to advise on NIL related matters.',
    conditions: 'The bylaw does not define "registered agent". Florida athlete agent licensing rules were not checked for high school athletes.',
    citation: 'FHSAA Bylaw 9.9.2(d)',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.2(d)', 'd) Signing a professional playing contract in any sport or hiring a registered agent to manage his/her athletic career, other than for the purpose of advising on NIL related matters;')] },
  { slug: 'fhsaa-disclosure', topic: 'disclosure-required', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes',
    summary: 'Yes. Any athlete who does NIL must sign Form GA1 and submit it to the school within five business days of signing an NIL agreement. The athletic director completes the school\'s section and a copy goes to FHSAA. Submitting the form does not by itself grant eligibility.',
    citation: 'FHSAA Bylaw 9.9.5; Form GA1', effective_note: 'Added by the FHSAA Board in September 2024.',
    sources: [S('fhsaa-bylaw-9-9-5-sbe-2024', 'Bylaw 9.9.5', "A student who engages in any NIL activity must sign an 'Affidavit of Compliance with the Regulations on Amateurism and Interscholastic Athletic Eligibility.' ... The student/parent must complete, obtain all applicable signatures and submit this form to the school within five (5) business days of signing a Name, Image, and Likeness (NIL) agreement."),
              S('fhsaa-form-ga1', 'Header, Sections A and B', 'Submission of this form DOES NOT grant eligibility. ... Once Section A is signed by the student and parent, please provide this form to the member school Athletic Director to complete Section B. ... THIS STUDENT has engaged in a Name, Image, and Likeness (NIL) agreement with: ____ ... Once Section B is completed, please send a scanned copy of this form to NIL@fhsaa.org.')],
    disclosure: { what: 'Form GA1 (Affidavit of Compliance), naming the other party to the NIL agreement and signed by the student and a parent or legal guardian', recipient: 'Your school\'s athletic director, who completes Section B. A copy goes to FHSAA.', deadline_text: 'Within five business days of signing an NIL agreement', deadline_business_days: 5, form_name: 'FHSAA Form GA1', form_url: 'https://s3.amazonaws.com/fhsaa.org/documents/2024/10/2/GA1_Affidavit_of_Amateurism_10124.pdf' } },
  { slug: 'fhsaa-parent-guardian', topic: 'parent-guardian', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'A parent or legal guardian signs Form GA1 with the student, under penalties of perjury. By entering an NIL agreement, the student and parents release the school, its district and FHSAA from liability tied to the deal, and agree to hold them harmless.',
    conditions: 'Bylaw 9.9 does not itself say a parent must co-sign the NIL contract. Whether Florida contract law requires it for a minor was not checked here.',
    citation: 'Form GA1 Section A; FHSAA Bylaws 9.9.4.1.1 and 9.9.4.1.2',
    sources: [S('fhsaa-form-ga1', 'Section A', 'Signature of Student / Signature of Parent/Legal Guardian ... Under penalties of perjury, I declare that I have read the foregoing Affidavit and that the facts stated therein are true and correct'),
              S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.1.1', 'By entering into an NIL agreement, the student-athlete and his/her parent(s)/guardian(s) release their school, its district or governing body, and FHSAA from any liability related to, or arising from the NIL agreement.'),
              S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9, opening section', 'Student-athletes and their families are encouraged to seek legal counsel and tax advice when considering NIL activity.')] },
  { slug: 'fhsaa-recruiting', topic: 'recruiting-inducement', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'No. NIL may not be used to pressure, urge or entice an athlete to attend a school to play sports, and an NIL agreement may not be used as a guise for athletic recruiting.',
    citation: 'FHSAA Bylaw 9.9.4.6',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.6', 'NIL activities shall not be used to pressure, urge, or entice a student-athlete to attend a school for the purpose of participating in interscholastic athletics. The NIL agreement shall not be used as a guise for athletic recruiting (reference Policies 36 and 37).')] },
  { slug: 'fhsaa-transfers', topic: 'transfers', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'no',
    summary: 'Not that season. An athlete who transfers after starting a sport cannot secure an NIL agreement that season, unless one of the exceptions in Bylaw 9.3.2.2 applies.',
    conditions: 'The text of the Bylaw 9.3.2.2 exceptions was not opened. Ask your athletic director whether one applies.', citation: 'FHSAA Bylaw 9.9.4.7',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.7', 'A student-athlete who transfers after starting a sport, shall be prohibited from securing an NIL agreement that season, unless he/she meets one of the provisions outlined in Bylaw 9.3.2.2.')] },
  { slug: 'fhsaa-contract-length', topic: 'contract-length', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes_with_conditions',
    summary: 'A deal is limited to the athlete\'s high school eligibility and cannot extend past the high school graduation date.',
    conditions: 'Check the end date in the contract before you sign.', citation: 'FHSAA Bylaw 9.9.4.1',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Bylaw 9.9.4.1', "An NIL agreement is limited to a student-athlete's high school period of athletic eligibility and shall not extend beyond a student-athlete's high school graduation date.")] },
  { slug: 'fhsaa-penalties', topic: 'penalties', scope: { gb: 'fhsaa' }, applies: 'high_school', answer: 'yes',
    summary: 'Penalties escalate. First violation: a formal warning, and the deal must be ended or changed and any compensation returned. Second: ineligible to represent any member school for one year. Third: ineligible for the rest of the athlete\'s high school career. An athlete who falsifies information or receives an impermissible benefit will be deemed ineligible under Bylaw 9.1.2.2 or Policy 36.5.2.',
    citation: 'FHSAA Bylaw 9.9.6.3',
    sources: [S('fhsaa-bylaw-9-9-sbe-2024', 'Penalties section', 'Any violation by a student-athlete of the provisions of Bylaw 9.9 shall result in escalating sanctions. However, a student-athlete who falsifies information or who receives an impermissible benefit will be deemed ineligible in accordance with Bylaw 9.1.2.2 or Policy 36.5.2, respectively. ... the student-athlete shall receive a formal warning. If applicable, the student shall immediately terminate/modify the NIL agreement, remove any advertisement, promotional activity, or endorsement, and return any awards, gifts, or other compensation. ... the student-athlete will be ineligible to represent any member school for a period of one year from the date of discovery. ... the student-athlete will be ineligible to compete in any interscholastic athletic contest in any sport for the duration of the student-athlete\'s high school career.')] },

  // ================================================================= Florida law
  { slug: 'fl-hs-no-statute', topic: 'nil-allowed', scope: { state: 'FL' }, applies: 'high_school', answer: 'not_addressed',
    summary: 'We found no Florida statute on high school NIL. Section 1006.20(2)(a) requires FHSAA bylaw changes to be ratified by the State Board of Education, so the FHSAA bylaw is the rule we cite.',
    citation: 'Section 1006.20(2)(a), Florida Statutes',
    sources: [S('fl-stat-1006-20', 's. 1006.20(2)(a)', "Any changes to the FHSAA's bylaws must be ratified by the State Board of Education.")] },
  { slug: 'fl-college-nil-allowed', topic: 'nil-allowed', scope: { state: 'FL' }, applies: 'college', answer: 'yes',
    summary: 'Yes. In a legislative finding, section 1006.74 says a college athlete "must have an equal opportunity to control and profit from the commercial use of her or his name, image, or likeness." The current section has four subsections (definition, workshops, liability, rulemaking) and none restricts athlete deals.',
    citation: 'Section 1006.74, Florida Statutes (opening paragraph)',
    effective_note: 'Created in 2020 (effective July 1, 2021) and revised by HB 7-B, effective February 16, 2023.',
    sources: [S('fl-stat-1006-74', 's. 1006.74, opening paragraph', "participation in intercollegiate athletics should not infringe upon an intercollegiate athlete's ability to earn compensation for her or his name, image, or likeness. An intercollegiate athlete must have an equal opportunity to control and profit from the commercial use of her or his name, image, or likeness, and be protected from unauthorized appropriation and commercial exploitation of her or his right to publicity, including her or his name, image, or likeness.")] },
  { slug: 'fl-college-education', topic: 'nil-education', scope: { state: 'FL' }, applies: 'college', answer: 'yes',
    summary: 'Yes. Every covered Florida college must run at least two financial literacy, life skills and entrepreneurship workshops, each at least five hours, in different semesters, before an athlete graduates.',
    citation: 'Section 1006.74(2), Florida Statutes; Board of Governors Regulation 6.022(1)',
    sources: [S('fl-stat-1006-74', 's. 1006.74(2)', 'A postsecondary educational institution must conduct at least two financial literacy, life skills, and entrepreneurship workshops, each for a minimum of 5 hours, before the graduation of an intercollegiate athlete. The workshops may not be identical, and the second workshop must include more rigorous instruction. The workshops may not be conducted in the same semester.'),
              S('bog-reg-6-022', 'Regulation 6.022(1)', 'Each university must conduct at least two financial literacy, life skills, and entrepreneurship workshops for a minimum of five (5) hours each consistent with the requirements in section 1006.74, Florida Statutes, prior to the graduation of the intercollegiate athlete.')] },
  { slug: 'fl-college-agents', topic: 'agents', scope: { state: 'FL' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes, but the agent must hold a Florida athlete agent license to represent a college athlete on NIL contracts. A spouse, parent, sibling, grandparent or guardian is not treated as an athlete agent.',
    citation: 'Sections 468.453(8) and 468.452(2), Florida Statutes',
    sources: [S('fl-stat-468-453', 's. 468.453(8)', 'Notwithstanding subsection (3), a person must hold a valid license as an athlete agent to act as an athlete agent representing an intercollegiate athlete for purposes of contracts that allow an intercollegiate athlete to profit from the commercial use of her or his name, image, or likeness'),
              S('fl-stat-468-452', 's. 468.452(2)', 'The term does not include a spouse, parent, sibling, grandparent, or guardian of the student athlete or an individual acting solely on behalf of a professional sports team or professional sports organization.')] },
  { slug: 'fl-college-disclosure', topic: 'disclosure-required', scope: { state: 'FL' }, applies: 'college', answer: 'not_addressed',
    summary: 'Section 1006.74 contains no requirement to disclose NIL deals to the school. The reporting duty we found comes from NCAA rules. Florida\'s athlete agent statutes (sections 468.454 and following) were not checked and may require notice of agent contracts.',
    citation: 'Section 1006.74, Florida Statutes (no disclosure provision)',
    sources: [S('fl-stat-1006-74', 's. 1006.74(1)-(4)', '(4) The Board of Governors and the State Board of Education shall adopt regulations and rules, respectively, to implement this section.History.—s. 1, ch. 2020-28; s. 20, ch. 2021-35; ss. 1, 2, ch. 2021-217; s. 2, ch. 2023-4.')] },

  // ================================================================= NCAA Division I / College Sports Commission
  { slug: 'ncaa-nil-allowed', topic: 'nil-allowed', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. Division I athletes may be paid for the use of their name, image and likeness in third-party deals.',
    conditions: 'NIL cannot be payment for playing or for athletic achievement.', citation: 'NCAA Division I Bylaws 22.01.1 and 22.1.2',
    effective_date: '2025-07-01',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaws 22.01.1, 22.1.2', "An individual may receive compensation for the use of the individual’s name, image and likeness, which may be secured or compensated based, in whole or in part, on athletics skill or reputation. ... An individual may permit the use of the individual’s name, image, likeness in noninstitutional name, image and likeness activities and receive compensation for such activities.", 'machine_raw_text')] },
  { slug: 'ncaa-pay-for-play', topic: 'pay-for-play', scope: { gb: 'ncaa' }, applies: 'college', answer: 'no',
    summary: 'No. NIL activities may not be used to pay an athlete for athletics participation or achievement.',
    citation: 'NCAA Division I Bylaw 22.01.1', effective_date: '2025-07-01',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.01.1', 'Name, image and likeness activities may not be used to compensate an individual for athletics participation or achievement.', 'machine_raw_text')] },
  { slug: 'ncaa-school-payments', topic: 'school-payments', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. NCAA rules let a school make direct payments to athletes within the annual benefits cap, and the College Sports Commission says schools can enter NIL deals directly with athletes. Those deals are reported by the school and do not go into NIL Go.',
    conditions: 'The cap is about $21.58 million per school for 2026-27.', citation: 'NCAA Division I Bylaw 16.13.1; CSC FAQ',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 16.13.1', 'An institution may provide direct payments, benefits and expenses to a student-athlete as specified in this section, provided the aggregate value provided by (or on behalf of) the institution does not exceed the value of the applicable period’s benefits cap and the written agreement does not provide for payments to a third party on a student-athlete’s behalf.', 'machine_raw_text'),
              S('csc-faq', 'What is the revenue share cap?', 'The cap for the 2026-27 academic year is approximately $21.58 million per school, up from $20.5 million during the 2025-26 academic year. ... Yes. Those deals are reported by the school via the CAPS platform and subject to the revenue sharing cap. ... Payment directly from the student-athlete’s institution is not considered a third-party NIL deal and does not need to be reported in NIL Go.', 'machine_raw_text')] },
  { slug: 'ncaa-school-staff', topic: 'school-staff-involvement', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes, within limits. A school may act as a marketing agent for an athlete and may help identify or facilitate a third-party deal when the third party funds the entire payment. A school may not guarantee a third-party deal.',
    conditions: 'The payor must attest in NIL Go that the school did not direct it to make the deal and that it funded the payment itself.',
    citation: 'NCAA Division I Bylaws 22.1.1, 22.1.1.1 and 22.2.3; House settlement Q&A E3',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaws 22.1.1(b), 22.1.1.1', 'Act as a marketing agent for a student-athlete with respect to noninstitutional name, image or likeness contracts. ... An institution shall not provide a written or oral guarantee of a third-party NIL contract or payment. ... (c) That the noninstitutional payor was not directed by an institution to enter into the contract or payment terms with the student-athlete; and (d) That the noninstitutional payor has self-funded the payment to the student-athlete.', 'machine_raw_text'),
              S('ncaa-house-qa-2025-06', 'Question E3', 'Yes, provided the third party is self-funding the entire payment outlined in the NIL contract.')] },
  { slug: 'ncaa-collectives', topic: 'collectives', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes, but deals with a collective or any other "associated entity" must be for a valid business purpose (promoting goods or services sold to the public for profit), at rates in line with what similarly situated people with comparable NIL value, who are not athletes or recruits of that school, are paid. Raising money to induce athletes to attend a school does not qualify.',
    citation: 'NCAA Division I Bylaws 22.02.1 and 22.1.3',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.1.3', 'An associated entity or individual shall not enter into an agreement with or provide payment to a prospective student-athlete or student-athlete unless the agreement or payment terms, as determined by the name, image and likeness clearinghouse, are for a valid business purpose related to the promotion or endorsement of goods or services provided to the general public for profit, with compensation at rates and terms commensurate with compensation paid to similarly situated individuals with comparable name, image and likeness value who are not prospective student-athletes or student-athletes of the institution. Raising money to induce student-athletes to attend or participate in intercollegiate athletics at an institution does not satisfy the valid business purpose requirement for making NIL payments to student-athletes.', 'machine_raw_text')] },
  { slug: 'ncaa-boosters', topic: 'boosters', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes, with review. Anyone who has given more than $50,000 in their lifetime to the school or its collective is an "associated individual", so deals with them face the valid business purpose and compensation tests.',
    citation: 'NCAA Division I Bylaws 22.02.2 and 22.1.3',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.02.2(b)', 'An individual who directly or indirectly (including contributions by an affiliated entity or family member) has contributed more than $50,000 during the individual’s lifetime to an institution or to an associated entity defined in 22.02.1-(a)', 'machine_raw_text')] },
  { slug: 'ncaa-agents', topic: 'agents', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes',
    summary: 'Yes. NCAA rules allow professional services, including agent representation, for NIL activities.',
    citation: 'NCAA Division I Bylaw 22.3.1',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.3.1', 'An individual may use professional services, including agent representation, for the purpose of name, image and likeness activities.', 'machine_raw_text')] },
  { slug: 'ncaa-disclosure', topic: 'disclosure-required', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes',
    summary: 'Yes. Every Division I athlete must report all third-party NIL deals worth $600 or more in total to NIL Go within five business days of signing or agreeing to payment terms. Multiple deals or payments from the same or related payor count together, and non-cash benefits count toward the $600.',
    conditions: 'One representative may enter the deal, but the athlete must submit it.',
    citation: 'NCAA Division I Bylaws 22.2.2 and 22.2.2.2; CSC FAQ and NIL Go page', effective_date: '2025-07-01',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaws 22.2.2, 22.2.2.2', 'If an individual enters into multiple agreements or receives multiple payments from the same or substantially the same third party, including any affiliates or parties with common ownership, such activities must be reported if the aggregate value is $600 or more during the student-athlete’s period of eligibility. ... A student-athlete shall submit written documentation to the name, image and likeness clearinghouse within five business days of execution of a noninstitutional name, image or likeness contract or agreement to payment terms.', 'machine_raw_text'),
              S('csc-faq', 'What type of NIL deals must be reported in NIL Go?', 'All NCAA Division I student-athletes must report third-party NIL deals with compensation that equals or exceeds $600 (including contracts or payments with the potential to meet or exceed $600 via payment structures such as royalties or bonuses). Compensation includes both direct payments and other benefits such as free car leases, gym memberships, etc.', 'machine_raw_text'),
              S('csc-nil-go', 'How NIL Go Works', 'Student-athletes may each designate one representative to enter deals into NIL Go on their behalf, for submission by the student-athlete.', 'machine_raw_text')],
    disclosure: { what: 'Every third-party NIL deal worth $600 or more in total (cash and non-cash), with the contract or payment terms', recipient: 'NIL Go, the clearinghouse run by the College Sports Commission', deadline_text: 'Within five business days of signing or agreeing to payment terms', deadline_business_days: 5, threshold_usd: 600, platform_name: 'NIL Go', platform_url: 'https://www.collegesportscommission.org/nil/' } },
  { slug: 'csc-deal-review', topic: 'deal-review', scope: { gb: 'college-sports-commission' }, applies: 'college', answer: 'yes',
    summary: 'Yes. NIL Go checks whether the payor is tied to the school. If it is, the deal must have a valid business purpose and pay within a reasonable range. Since July 1, 2026, associated deals of $600 to $15,000 skip the compensation-range review until the athlete has more than $50,000 in associated deals in an academic year. Deals come back Cleared, Not Cleared or Flagged.',
    conditions: 'Exempt deals must still be reported and still need a valid business purpose.',
    citation: 'NCAA Division I Bylaw 22.2.4; CSC Memorandum of June 23, 2026', effective_date: '2026-07-01',
    change_note: 'Replaced the April 2026 policy, which exempted deals up to $2,500 until an athlete reached $15,000 in associated deals.',
    sources: [S('csc-memo-2026-06-23', 'Part I, Updated Enforcement Policy', 'the CSC will not subject deals valued between $600-$15,000 to RoC review unless and until a student-athlete has exceeded $50,000 in Associated deals in an academic year. ... This updates the prior policy, in effect since April 2026, that exempted deals up to $2,500 from RoC review unless and until a student-athlete reached $15,000 in Associated deals. ... All Associated deals still must be "for a valid business purpose related to the promotion or endorsement of goods or services provided to the general public for profit."'),
              S('ncaa-d1-manual-2026-27', 'Bylaw 22.2.4', 'The name, image and likeness clearinghouse shall review all reported noninstitutional name, image and likeness contracts or payment terms submitted by student-athletes once all reporting requirements have been met (see Bylaw 22.2.2) to determine whether an associated entity or individual, including a noninstitutional payor, is involved.', 'machine_raw_text'),
              S('csc-nil-go', 'Deal Review and Outcomes', 'Cleared – The deal meets necessary requirements and can proceed. Not Cleared – The deal fails to meet necessary requirements. ... Flagged for Additional Review', 'machine_raw_text')] },
  { slug: 'ncaa-penalties', topic: 'penalties', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes',
    summary: 'Not reporting a deal within five business days, or carrying on with a deal that was not cleared, can cost eligibility. If a deal is not cleared, the athlete can revise and resubmit it, appeal, or return the payment.',
    citation: 'NCAA Division I Bylaws 22.2.2.2, 22.2.4.2 and 23.2.5.1; CSC FAQ',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaws 22.2.4.2, 23.2.5.1', '(a) The contract or payment terms may be rescinded or revised and resubmitted; (b) An appeal of the decision may be submitted to the designated enforcement entity ...; or (c) The student-athlete may return the impermissible amount of payment received. ... The CSC may declare a student-athlete ineligible for participation in athletically related activities, including practice or competition.', 'machine_raw_text'),
              S('ncaa-d1-manual-2026-27', 'Bylaw 22.2.2.2', 'Failure to report an agreement or payment within the five-day period may result in disciplinary action by the CSC, which may include rendering the student-athlete ineligible for future practice and competition (see Bylaw 23.3).', 'machine_raw_text'),
              S('csc-faq', 'What happens if an NIL deal is not cleared?', 'If the student-athlete continues with a deal that has been deemed “not cleared” or that has not been reported, they will face enforcement consequences, which could include loss of eligibility.', 'machine_raw_text')] },
  { slug: 'ncaa-logos-marks', topic: 'school-logos-marks', scope: { gb: 'ncaa' }, applies: 'college', answer: 'not_addressed',
    summary: 'We found no rule in NCAA Bylaw Article 22 on athletes using school logos or marks in third-party deals. The NCAA tells athletes to "Review your campus NIL policy and applicable state law."',
    citation: 'NCAA NIL page, "Getting started with NIL"', status: 'needs_verification',
    sources: [S('ncaa-nil-page', 'Getting started with NIL', 'Review your campus NIL policy and applicable state law')] },
  { slug: 'ncaa-prohibited-categories', topic: 'prohibited-categories', scope: { gb: 'ncaa' }, applies: 'college', answer: 'not_addressed',
    summary: 'We found no list of prohibited product categories for NIL deals in NCAA Bylaw Article 22. NCAA sports wagering rules outside Article 22 were not reviewed, so do not read this as permission.',
    citation: 'NCAA Division I Manual 2026-27, Article 22 (no provision found)', status: 'needs_verification',
    sources: [S('ncaa-d1-manual-2026-27', 'Article 22, Bylaws 22.01 through 22.4: no list of prohibited product or industry categories found', null)] },
  { slug: 'ncaa-recruiting', topic: 'recruiting-inducement', scope: { gb: 'ncaa' }, applies: 'college', answer: 'no',
    summary: 'No. Pay to attend or compete for a specific school is pay-for-play and is not allowed.',
    citation: 'NCAA NIL page, "What\'s allowed vs. not allowed"',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.01.1', 'Name, image and likeness activities may not be used to compensate an individual for athletics participation or achievement.', 'machine_raw_text'),
              S('ncaa-nil-page', "What's allowed vs. not allowed", 'Pay-for-play, including payment to attend or compete for a specific school or compensation for athletics participation or achievement')] },
  { slug: 'ncaa-transfers', topic: 'transfers', scope: { gb: 'ncaa' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Four-year transfers must report deals of $600 or more signed from the date they entered the Transfer Portal. A deal that was already cleared and stays in place does not need to be resubmitted.',
    citation: 'NCAA Division I Bylaw 22.2.2.5.2',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaw 22.2.2.5.2', 'Prospective four-year college transfers shall report all noninstitutional name, image, and likeness contracts or payment terms with compensation of $600 or more that have been executed from the date in which the student-athlete’s name was officially entered into the NCAA Transfer Portal. A transfer who has previously reported a deal that will remain in place upon transfer shall not be required to resubmit the deal if it has been cleared by the CSC.', 'machine_raw_text')] },
  { slug: 'ncaa-prospects-reporting', topic: 'prospects-reporting', scope: { gb: 'ncaa' }, applies: 'both', answer: 'yes',
    summary: 'Yes. An athlete enrolling at a Division I school must report third-party deals of $600 or more made since the first day of junior year of high school (or July 1, 2025, if later). The deadline is 14 days after enrolling full time or before the team\'s first game, whichever comes first.',
    citation: 'NCAA Division I Bylaws 22.2.2.5.1 and 22.2.2.5.3',
    sources: [S('ncaa-d1-manual-2026-27', 'Bylaws 22.2.2.5.1, 22.2.2.5.3', 'An incoming prospective student-athlete must report noninstitutional name, image and likeness contracts or payment terms not later than either 14 days after initial full-time enrollment at a Division I institution, or prior to the institution’s first scheduled contest against outside competition in the individual\'s sport, whichever occurs first.', 'machine_raw_text'),
              S('ncaa-nil-page', 'High school prospects planning to play Division I', 'Report threshold: all third-party NIL deals worth $600 or more since July 1, 2025 or starting your junior year of high school, whichever is later')] },
  { slug: 'csc-international', topic: 'international-athletes', scope: { gb: 'college-sports-commission' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'International athletes must report deals of $600 or more like every Division I athlete, but whether a deal is legal for them can depend on immigration rules. The College Sports Commission tells them to consult their school before going ahead.',
    citation: 'CSC FAQ, "Are international student-athletes required to report third-party NIL deals?"',
    sources: [S('csc-faq', 'International student-athletes', 'All Division I student-athletes are required to report their third-party NIL deals at or above $600 in aggregate in NIL Go. However, the legality of such deals may vary depending on factors including state and federal laws and immigration regulations. Student-athletes should reach out to their institution for guidance and consult with them before proceeding with any third-party NIL deals.', 'machine_raw_text')] },

  // ================================================================= University of Florida
  { slug: 'uf-nil-allowed', topic: 'nil-allowed', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. UF tells its athletes they have full rights to profit from their NIL, and that every paid deal must be a real exchange: you provide a service or promotion and get paid for it.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Opening section', "Good news – as a Florida Gator you have full rights to profit from your Name, Image, and Likeness (NIL) as long as you follow a few common-sense rules. ... every paid NIL deal must be a 'quid pro quo' arrangement (you provide services or promotion, and in return you get paid)", 'machine_confirmed_twice')] },
  { slug: 'uf-deal-terms', topic: 'deal-terms', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'UF says every deal should spell out what you will do in return for payment, and that athletes must be paid only for work actually performed.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Deal guidance', "Make sure every NIL deal spells out what you'll do in return for payment (what posts, videos, appearances, etc.). Student-athletes must be compensated only for work actually performed.")] },
  { slug: 'uf-sponsored-posts', topic: 'sponsored-posts', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. UF says athletes can use their own social platforms for paid ads and brand partnerships.',
    conditions: 'Subject to the prohibited vendor, Gators marks and NIL Go reporting rules in this matrix.', citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'What you can do', "You can freely use your Instagram, TikTok, YouTube, or other platforms to post paid ads, 'sponsor me' content, and brand partnerships.", 'machine_confirmed_twice')] },
  { slug: 'uf-appearances', topic: 'appearances-autographs', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. UF lists paid autograph signings, speaking at events or camps and other in-person promotions as allowed.',
    conditions: 'Subject to the prohibited vendor, Gators marks and NIL Go reporting rules in this matrix.', citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'What you can do', 'Personal Appearances and Autographs. You can be paid for autograph signings, speaking at events or camps, autograph sessions at a dealer, and other in-person promotions.', 'machine_confirmed_twice')] },
  { slug: 'uf-own-merchandise', topic: 'own-merchandise', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Yes. Athletes may create and sell their own branded merchandise and autographed memorabilia. Using Florida Gators trademarks, logos or marks on it requires approval.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'What you can do', 'You may create and sell your own branded merchandise (caps, shirts, posters, etc.) and autograph memorabilia, as long as gain approval to use the Florida Gators trademarks, logos and marks.', 'machine_confirmed_twice')] },
  { slug: 'uf-logos-marks', topic: 'school-logos-marks', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'only_with_approval',
    summary: 'Only with approval. UF says you can use the Gator logo, marks and colors for marketing purposes if you have approval, and to avoid showing UF logos or team trademarks in ads unless you have it. UF lists its Licensing Manager as the contact for merchandise, apparel and logo questions.',
    citation: 'UF, Overview of Gators NIL; UAA Licensing FAQ',
    sources: [S('uf-nil-overview', 'What You Can Do', 'You can utilize the Gator logo, marks and colors for marketing purposes if you have approval. ... as long as gain approval to use the Florida Gators trademarks, logos and marks', 'machine_raw_text'),
              S('uf-nil-overview', 'Contacts', 'Merch & Apparel/Logo: ... Licensing Manager', 'machine_confirmed_twice'),
              S('uf-licensing-faq', 'Licensing FAQ', 'Anyone wishing to use the marks, logos and symbols of the University must obtain a license.')] },
  { slug: 'uf-uniform', topic: 'uniform-in-content', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes_with_conditions',
    summary: 'Only for Gators sponsors. UF\'s overview answers "Can I wear UF logos in my NIL deal?" this way: if the company is a sponsor of the Gators, yes; if not, you cannot promote it in Gators gear.',
    conditions: 'UF also says to avoid showing UF logos or team trademarks in your own ads unless you have approval.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Common Questions; Social Media and Content Creation', 'Can I wear UF logos in my NIL deal? Is the company a Sponsor of the Gators? If yes, of course! If no, then you cannot promote it in Gators Gear. ... Avoid showing any UF logos or team trademarks in those ads unless you’ve gotten the proper approval.', 'machine_raw_text')] },
  { slug: 'uf-team-issued-gear', topic: 'team-issued-gear', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'no',
    summary: 'No. Athletes cannot sell, trade or give away for value any equipment or apparel issued by UF. Signing a jersey you bought yourself is fine.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'What you cannot do', 'You can autograph a photo of yourself or sign a jersey you buy on your own, but you cannot sell, trade, or give away for value any equipment or apparel issued by UF (e.g. your game jersey, helmet, team shoes, gear bag, etc.).', 'machine_confirmed_twice')] },
  { slug: 'uf-team-activities', topic: 'team-activities', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'only_with_approval',
    summary: 'During official team activities (games, practices, team travel) UF says to stick to team-approved gear and appearances. A deal with a brand other than the team sponsors is fine, but do not wear or promote that brand\'s gear at games or team practices.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Team commitments', 'During official team activities (games, practices, team travel, etc.), stick to team-approved gear and appearances. For example, if you sign an apparel deal with a brand other than our team sponsors (Nike/Jordan), that’s okay – just don’t wear or promote that brand’s gear at Gator games or team practices.', 'machine_raw_text')] },
  { slug: 'uf-prohibited-categories', topic: 'prohibited-categories', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'no',
    summary: 'UF does not allow NIL agreements with gambling or sports wagering vendors, or with vendors associated with performance enhancing drugs, both as defined by the NCAA. No other category limits were found in UF\'s published material.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Prohibited vendors', 'Student-athletes will not be permitted to enter into NIL agreements with gambling/sports wagering vendors or vendors associated with athlete performance enhancing drugs, both as defined by the NCAA.', 'machine_confirmed_twice')],
    prohibited: [['gambling', 'gambling/sports wagering vendors'], ['performance-enhancing-drugs', 'vendors associated with athlete performance enhancing drugs']] },
  { slug: 'uf-disclosure', topic: 'disclosure-required', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'yes',
    summary: 'UF repeats the national rule: any third-party deal worth $600 or more goes into NIL Go within five business days of signing. An agent or parent can enter it, but the athlete must hit submit.',
    conditions: 'A UF International Center page also mentions reporting NIL activity to UAA Compliance through a Teamworks form. That may predate NIL Go and needs confirmation.',
    citation: 'UF, Overview of Gators NIL',
    sources: [S('uf-nil-overview', 'Reporting', 'Under the new House v. NCAA settlement, any third-party NIL contract or deal worth $600 or more (in total value) must be reported online through the NIL platform called NIL Go. ... within 5 business days of signing the contract ... You can do it yourself or have one trusted rep (like an agent or parent) enter the deal in NIL Go on your behalf – but you, the student-athlete, must hit \'submit\'.', 'machine_confirmed_twice')],
    disclosure: { what: 'Any third-party NIL deal worth $600 or more in total: who the sponsor is, what you will provide, how much you will be paid, and the contract', recipient: 'NIL Go (College Sports Commission)', deadline_text: 'Within five business days of signing', deadline_business_days: 5, threshold_usd: 600, platform_name: 'NIL Go', platform_url: 'https://www.collegesportscommission.org/nil/' } },
  { slug: 'uf-facilities', topic: 'school-facilities', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'not_addressed',
    summary: 'UF\'s published NIL material does not say whether athletes can use UF facilities for sponsored shoots. Ask UAA Compliance before planning one.',
    citation: 'UF, Overview of Gators NIL (no provision found)', status: 'needs_verification',
    sources: [S('uf-nil-overview', 'Whole page: no statement on use of UF facilities for NIL activity found', null)] },
  { slug: 'uf-international', topic: 'international-athletes', scope: { inst: 'university-of-florida' }, applies: 'college', answer: 'only_with_approval',
    summary: 'Talk to the UF International Center first. UF\'s International Student Services says international athletes must not enter any NIL agreement without its guidance, that an athlete on an F-1 visa cannot perform services for a business while in the United States without proper authorization, and that NIL activity rarely qualifies for that authorization.',
    citation: 'UF, Overview of Gators NIL; UF International Center NCAA FAQ',
    sources: [S('uf-nil-overview', 'International athletes', 'Prior to participating in any NIL opportunities, international athletes on F-1 visas are encouraged to contact the UF International Center prior to participation in NIL agreements.', 'machine_confirmed_twice'),
              S('uf-iss-ncaa-faq', 'NCAA FAQ', 'US student visa regulations may prevent NIL compensation for international students while in the US and there may also be tax implications. Therefore, international student-athletes must not enter into any NIL agreements without the guidance from the University of Florida International Students Services office', 'machine_confirmed_twice'),
              S('uf-iss-ncaa-faq', 'NCAA FAQ', 'the international student-athlete cannot engage in services for a business or company while in the US on an F-1 visa without proper authorization. ... Unfortunately, it is rare that an NIL activity will qualify for authorization.')] },

  // ================================================================= Seminole County Public Schools / Seminole High School
  { slug: 'scps-facilities', topic: 'school-facilities', scope: { district: 'seminole-county-public-schools' }, applies: 'high_school', answer: 'only_with_approval',
    summary: 'Only through the district. Any outside use of a Seminole County Public Schools facility must be requested online through Facilitron, with payment and proof of insurance. District staff make the final decision.',
    conditions: 'The district\'s Policy 7510 and Facility Use Handbook could not be opened, so whether they address commercial filming is not yet known.',
    citation: 'SCPS Facility Requests and Rental page', status: 'needs_verification',
    sources: [S('scps-facility-use', 'Facility Requests/Rental', "Moving forward, the only way to request use of a district facility is by creating a Facilitron account and submitting a request online. ... Facilitron will also collect payment and proof of insurance (certificate of insurance) on Seminole County Public Schools' behalf. ... Seminole County Public Schools' administrative staff will make final decisions on all facility use requests.")] },
  { slug: 'shs-event-footage', topic: 'event-footage', scope: { inst: 'seminole-high-school-sanford' }, applies: 'high_school', answer: 'not_addressed',
    summary: 'Seminole High School\'s media credential page says credentialed coverage is "for news and editorial coverage" and that requests are due 48 hours before the event. We found no school rule on using event footage in an ad. Separately, FHSAA Bylaw 9.9.4.3 bars referring to a member school event or game in NIL activity.',
    citation: 'Seminole High School Athletics, Media Credential Request', status: 'needs_verification',
    sources: [S('shs-media-credentials', 'Media Credential Request', 'for news and editorial coverage ... DEADLINE 48 HOURS PRIOR TO EVENT START ... The dissemination of editorial content must be a primary purpose of the media outlet')] },
];

// ================================================================= second-pass source review, 2026-10-03
// Each change below was made after reading the official text directly (raw text of the live page or PDF).
// Nothing here is a human or legal review.
sources.push(
  { slug: 'sbe-fhsaa-bylaws-2026-07-22', title: 'State Board of Education Consent Item, July 22, 2026: Ratification of FHSAA Bylaws, Summary of Approved Bylaws', url: 'https://www.fldoe.org/file/20954/36-2.pdf', organization: 'Florida Department of Education', gb: 'fhsaa', source_type: 'board_document', published_on: '2026-07-22', is_primary: true },
  { slug: 'fhsaa-rules-publications', title: 'FHSAA Rules and Publications page (links the current Handbook and Form GA1)', url: 'https://fhsaa.com/sports/2020/1/28/RulesPub.aspx', organization: 'Florida High School Athletic Association', gb: 'fhsaa', source_type: 'official_webpage', is_primary: true },
  { slug: 'fl-stat-468-454', title: 'Section 468.454, Florida Statutes (2026): Athlete agents, contracts', url: 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0468/Sections/0468.454.html', organization: 'Florida Legislature', gb: 'florida-legislature', source_type: 'statute', is_primary: true },
  { slug: 'scps-policy-7510', title: 'Seminole County School Board Policy 7510, Use of District Facilities (revised 11/14/23)', url: 'https://go.neola.com/semi-fl/policy/policy-manual/po7510', organization: 'Seminole County Public Schools', source_type: 'district_policy', published_on: '2023-11-14', is_primary: true },
);
const R = (slug) => { const r = rules.find((x) => x.slug === slug); if (!r) throw new Error('second pass: unknown rule ' + slug); return r; };

// FHSAA. The 2026-27 Handbook renumbers the NIL bylaw from 9.9 to 9.10. Its text was compared word for word with the
// October 2024 text. Substance is unchanged: one subtitle gained the word "Defined" and policy cross-references were updated.
rules.filter((r) => r.scope.gb === 'fhsaa').forEach((r) => {
  r.sources.push(S('fhsaa-handbook-2026-27', 'Bylaw 9.10 (numbered 9.9 before 2026-27), pages 30 to 31', null, 'machine_raw_text'));
});
R('fhsaa-nil-allowed').effective_note = 'First approved by the FHSAA Board on June 4, 2024. The 2026-27 Handbook, which states "These Bylaws are applicable to the 2026-27 school year", carries the same rules as Bylaw 9.10. A clarifying amendment (the word "Defined" added to the NIL collectives subtitle) was on the State Board of Education consent agenda on July 22, 2026, effective July 1, 2026. The State Board vote record was not located.';
R('fhsaa-nil-allowed').sources.push(S('sbe-fhsaa-bylaws-2026-07-22', 'Summary of Approved Bylaws, row 9.9', 'Adds “Defined” to the subtitle for NIL Collectives. Effective July 1, 2026', 'machine_raw_text'));
R('fhsaa-disclosure').sources.push(S('fhsaa-rules-publications', 'Forms list', 'Affidavit of Amateurism (GA1)', 'machine_raw_text'));

Object.assign(R('fhsaa-boosters'), {
  conditions: 'Bylaw 1.4.17 lists six groups. Members of a booster organization are group (e), so the full bar applies to them. Group (f), people and businesses that donate to or help promote the athletic program, is treated differently: the bylaw applies only the NIL collective prohibitions to them. Groups (a) and (b) are student-athletes and their own families, and the bylaw does not explain how the bar is meant to apply to them. Ask your athletic director if a deal involves a teammate\'s or relative\'s business.',
});
R('fhsaa-boosters').sources = [
  S('fhsaa-handbook-2026-27', 'Bylaw 1.4.17 (a) to (f), page 8 area', '(e) A member of an athletic booster organization of that school; (f) A person, business, organization, or group that makes financial or in-kind contributions to the athletic department or that is otherwise involved in promoting the school\'s interscholastic athletic program.', 'machine_raw_text'),
  S('fhsaa-handbook-2026-27', 'Bylaw 9.10.4.5', 'No school employee, athletic department staff member, or representative of a school\'s athletic interests as defined in Bylaw 1.4.17 (a-e), may form, direct, offer, provide, or otherwise engage in any activity outlined in FHSAA Bylaw 9.9. Representatives of a school\'s athletic interests as defined in Bylaw 1.4.17(f) are subject to the prohibitions included in 9.9.4.2 and 9.9.4.4(i).', 'machine_raw_text'),
  ...R('fhsaa-boosters').sources.filter((x) => x.src !== 'fhsaa-handbook-2024-25' && x.src !== 'fhsaa-handbook-2026-27'),
];
R('fhsaa-transfers').conditions = 'The exceptions in Bylaw 9.3.2.2 include a military move, foster care placement, a court-ordered change in custody, a full and complete move, and reassignment by the district school board. The transfer bylaw was substantively amended for 2026-27, so ask your athletic director whether one applies to you.';
R('fhsaa-transfers').sources.push(S('fhsaa-handbook-2026-27', 'Bylaw 9.3.2.2', 'A student may not participate in sports at two different schools during the same school year, unless the student qualifies under one the following', 'machine_raw_text'));

// Florida statutes, read as raw text from the 2026 Florida Statutes.
R('fl-college-agents').sources.forEach((x) => { x.check = 'machine_raw_text'; });
Object.assign(R('fl-college-disclosure'), {
  citation: 'Sections 1006.74 and 468.454(6) and (7), Florida Statutes',
  summary: 'Florida\'s NIL statute, section 1006.74, has no requirement to disclose NIL deals to the school. The deal-reporting duty comes from NCAA rules. Florida law does require notice of an agent contract: the agent must tell the athletic director within 72 hours of signing, or before the athlete\'s next athletic event if that is sooner, and the athlete must also inform the school.',
  conditions: 'This notice is about signing with an athlete agent, not about each NIL deal.',
});
R('fl-college-disclosure').sources.push(S('fl-stat-468-454', 's. 468.454(6)', 'Within 72 hours after entering into an agent contract or before the next scheduled athletic event in which the student athlete may participate, whichever occurs first, the athlete agent must give notice in a record of the existence of the contract to the athletic director of the educational institution at which the student athlete is enrolled', 'machine_raw_text'));
R('fl-hs-no-statute').sources.forEach((x) => { x.check = 'machine_raw_text'; });

// NCAA. Article 22 of the 2026-27 Division I Manual was read in full as raw text (report generated October 3, 2026).
Object.assign(R('ncaa-logos-marks'), {
  citation: 'NCAA Division I Manual 2026-27, Article 22 (no provision on school marks in NIL deals)',
  summary: 'NCAA Bylaws 22.01 through 22.3 say nothing about athletes using school logos or marks in third-party deals, so your school\'s policy decides. The NCAA tells athletes to "Review your campus NIL policy and applicable state law."',
  conditions: 'Bylaw 22.4 is a separate rule that limits commercial logos on uniforms and equipment worn in competition.',
});
R('ncaa-logos-marks').sources.push(S('ncaa-d1-manual-2026-27', 'Article 22, Bylaws 22.01 to 22.3 read in full: no mention of logos, marks, uniforms or apparel', null, 'machine_raw_text'));
R('ncaa-prohibited-categories').sources.forEach((x) => { x.check = 'machine_raw_text'; x.locator = 'Article 22 read in full: no list of prohibited product or industry categories'; });
Object.assign(R('ncaa-school-staff'), {
  citation: 'NCAA Division I Bylaws 22.1.1, 22.1.1.1 and 22.2.3',
  summary: 'Yes, within limits. A school may act as a marketing agent for an athlete on third-party NIL deals. A school may not guarantee a third-party deal, and the payor must attest that the school did not direct it to make the deal and that it funded the payment itself.',
  conditions: 'A June 2025 NCAA question and answer document adds that a school may help identify or facilitate a deal when the third party funds the whole payment. That document predates the current Manual.',
});

// University of Florida. The International Center FAQ was re-read as raw page text and every quoted passage matched.
R('uf-international').sources.forEach((x) => { if (x.quote) x.check = 'machine_raw_text'; });
R('uf-international').conditions = [R('uf-international').conditions, 'The International Center page carries no date.'].filter(Boolean).join(' ');

// Seminole County and Seminole High School.
Object.assign(R('scps-facilities'), {
  conditions: 'Board Policy 7510 (revised 11/14/23) was read in full. It sets the request, fee and insurance process and does not mention filming, photography or commercial shoots. The district\'s Facility Use Handbook was not read.',
});
R('scps-facilities').sources.forEach((x) => { x.check = 'machine_raw_text'; });
R('scps-facilities').sources.push(S('scps-policy-7510', 'Policy 7510, whole policy', 'The required certificate of insurance must be provided seven (7) business days prior to the Facility use; failure to provide the required insurance may result in the cancellation of the Facility use.', 'machine_raw_text'));
Object.assign(R('shs-event-footage'), {
  answer: 'only_with_approval',
  citation: 'Seminole High School Athletics, Media Credential Request terms',
  summary: 'Only with written approval. Seminole High School\'s media credential terms prohibit secondary or commercial use of pictures, audio or film of its athletics events made by a credential holder, including advertising and sales promotion, without prior specific written approval of Seminole High School Athletics. Separately, FHSAA Bylaw 9.9.4.3 bars referring to a member school event or game in NIL activity.',
  conditions: 'These terms bind credentialed media. The page does not address footage shot by families or the athlete.',
});
R('shs-event-footage').sources = [S('shs-media-credentials', 'Media Credential Request, use of coverage', 'Any secondary or commercial use of any picture, audio description, film/tape, or drawing of any Seminole High School Athletics Events taken or made by the Credential Holder (including, but not limited to use in delayed editorial, advertising, sales promotion, or merchandising) is prohibited without prior specific written approval of Seminole High School Athletics.', 'machine_raw_text')];



// TRUST STATES. Set per rule from what was actually checked on 2026-10-03.
//   visual_source_check = read on screen from the official document (FHSAA-hosted Bylaw 9.9 pages and Form GA1, Revised 10/24)
//   raw_source_text     = full page text read directly from the official site
// No rule is marked human_review. Only a person can set that.
const NEEDS_REVIEW = {};   // every rule was resolved one way or the other in the second pass; open questions live in conditions and in the conflicts table
const NOT_LOCATED = {
  'uf-facilities': 'UF\'s NIL overview page was read in full on October 3, 2026. It does not address facility use for NIL.',
  'fhsaa-facilities': 'The NIL bylaw in the 2026-27 Handbook was read in full. It does not mention facilities.',
  'fl-hs-no-statute': 'No Florida statute on high school NIL was located. Section 1006.20 was read; it leaves eligibility to FHSAA bylaws.',
};
// UF's NIL overview page was re-read as raw page text on 2026-10-03 and every quoted passage below was matched against it.
rules.forEach((r) => r.sources.forEach((x) => { if (x.src === 'uf-nil-overview' && x.quote) x.check = 'machine_raw_text'; }));
rules.forEach((r) => {
  const srcs = r.sources.map((x) => x.src);
  if (r.scope.gb === 'fhsaa') {
    r.method = 'visual_source_check';
    r.sources.forEach((x) => { if (x.src === 'fhsaa-bylaw-9-9-sbe-2024' || x.src === 'fhsaa-bylaw-9-9-5-sbe-2024' || x.src === 'fhsaa-form-ga1') x.check = 'visual_source_check'; });
    if (!srcs.includes('fhsaa-form-ga1')) r.sources.push({ src: 'fhsaa-form-ga1', locator: 'Bylaw 9.9 as reprinted on Form GA1 (Revised 10/24)', quote: null, check: 'visual_source_check' });
  } else if (r.sources.some((x) => x.check === 'machine_raw_text') || ['fl-college-nil-allowed', 'fl-college-education', 'fl-college-disclosure'].includes(r.slug)) {
    r.method = 'raw_source_text';
    if (['fl-college-nil-allowed', 'fl-college-education', 'fl-college-disclosure'].includes(r.slug)) r.sources.forEach((x) => { if (x.src === 'fl-stat-1006-74') x.check = 'machine_raw_text'; });
  } else r.method = 'automated_extraction';
  if (NOT_LOCATED[r.slug]) { r.trust = 'PUBLIC_POLICY_NOT_LOCATED'; r.review_note = NOT_LOCATED[r.slug]; }
  else if (NEEDS_REVIEW[r.slug]) { r.trust = 'NEEDS_REVIEW'; r.review_note = NEEDS_REVIEW[r.slug]; r.status = 'needs_verification'; }
  else if (r.method === 'automated_extraction') { r.trust = 'NEEDS_REVIEW'; r.review_note = 'Source text was machine-extracted only.'; r.status = 'needs_verification'; }
  else { r.trust = 'VERIFIED_TO_OFFICIAL_SOURCE'; r.status = 'researched'; }
});


// ----------------------------------------------------------------- quick-answer layer
// One status and one plain line per rule that can lead a "Just tell me what I can do" answer.
// Statuses: YES, NO, DEPENDS, CHECK_FIRST, NOT_PUBLICLY_SPECIFIED. Each line restates the rule's own summary and adds nothing new.
const QUICK_ANSWERS = {
  'fhsaa-nil-allowed': ['YES', 'Yes. Every deal has to follow FHSAA Bylaw 9.9.'],
  'fhsaa-sponsored-posts': ['YES', 'Yes. Endorsements, social media promotion and advertisements are named as permitted.'],
  'fhsaa-disclosure': ['YES', 'Yes. Form GA1 goes to your school within five business days of signing.'],
  'fhsaa-uniform': ['CHECK_FIRST', 'Not without prior written consent from your school or district.'],
  'fhsaa-school-logos-marks': ['CHECK_FIRST', 'Not without prior written consent from your school or district.'],
  'fhsaa-facilities': ['NOT_PUBLICLY_SPECIFIED', 'Bylaw 9.9 does not mention facilities. Ask your school and district.'],
  'scps-facilities': ['CHECK_FIRST', 'Only through the district\'s facility request process.'],
  'fhsaa-school-staff': ['NO', 'No. School employees and athletic staff cannot take part in NIL deals.'],
  'fhsaa-boosters': ['NO', 'No. Booster club members count as representatives of the school\'s athletic interests.'],
  'fhsaa-agents': ['DEPENDS', 'Only to advise on NIL. An agent who manages your athletic career can cost you amateur status.'],
  'fl-college-nil-allowed': ['YES', 'Yes. Florida law says college athletes must have an equal opportunity to profit from their NIL.'],
  'ncaa-nil-allowed': ['YES', 'Yes. Division I athletes can be paid by third parties for their NIL.'],
  'uf-nil-allowed': ['YES', 'Yes. It has to be a real exchange: you do something for the brand and get paid for it.'],
  'uf-sponsored-posts': ['YES', 'Yes. Paid ads and brand partnerships on your own accounts are allowed.'],
  'ncaa-disclosure': ['DEPENDS', 'Deals worth $600 or more go into NIL Go within five business days.'],
  'uf-disclosure': ['DEPENDS', 'Deals worth $600 or more go into NIL Go within five business days of signing.'],
  'fl-college-disclosure': ['NOT_PUBLICLY_SPECIFIED', 'Florida\'s NIL statute has no disclosure rule. The NCAA rule is the one that applies.'],
  'uf-uniform': ['DEPENDS', 'Only if the company is a Gators sponsor.'],
  'uf-logos-marks': ['CHECK_FIRST', 'Only with UF\'s approval.'],
  'ncaa-logos-marks': ['NOT_PUBLICLY_SPECIFIED', 'NCAA rules do not cover this. Your school sets it.'],
  'uf-facilities': ['NOT_PUBLICLY_SPECIFIED', 'UF\'s published NIL material does not say. Ask UAA Compliance first.'],
  'ncaa-school-staff': ['DEPENDS', 'A school may help find or facilitate a deal that a third party fully funds. It may not guarantee one.'],
  'ncaa-boosters': ['DEPENDS', 'Yes, but deals with major donors get extra review in NIL Go.'],
  'fl-college-agents': ['YES', 'Yes. The agent needs a Florida athlete agent license.'],
  'ncaa-agents': ['YES', 'Yes. NCAA rules allow agent representation for NIL.'],
};
rules.forEach((r) => { const qa = QUICK_ANSWERS[r.slug]; if (qa) { r.quick_status = qa[0]; r.short_answer = qa[1]; } });
for (const k of Object.keys(QUICK_ANSWERS)) if (!rules.find((r) => r.slug === k)) throw new Error('quick answer for unknown rule ' + k);


// ----------------------------------------------------------------- 2026-27 renumbering: Bylaw 9.9 is now Bylaw 9.10
// Rule text, citations and guidance use the current number. Verbatim source quotes and locators keep the number printed in the document quoted.
const renum = (t) => (typeof t === 'string' ? t.replace(/\b9\.9(?=\.\d|\b)(?!\d)/g, '9.10') : t);
rules.forEach((r) => {
  for (const k of ['summary', 'conditions', 'citation', 'short_answer', 'review_note']) r[k] = renum(r[k]);
  if (r.disclosure) for (const k of Object.keys(r.disclosure)) r.disclosure[k] = renum(r.disclosure[k]);
});
R('fhsaa-nil-allowed').citation = 'FHSAA Bylaw 9.10.4 (numbered 9.9.4 before 2026-27)';

// ----------------------------------------------------------------- institutions
export const institutions = [
  { slug: 'university-of-florida', name: 'University of Florida', short_name: 'UF', institution_type: 'college', sector: 'public', state: 'FL', city: 'Gainesville',
    conference: 'sec', division: 'NCAA Division I', website_url: 'https://www.ufl.edu/', athletics_url: 'https://floridagators.com/', athletics_brand: 'University Athletic Association',
    profile_source: 'uf-athletics-home', publication_state: 'researched', governing: ['ncaa', 'college-sports-commission', 'florida-board-of-governors'],
    sports: { mens: ['Baseball', 'Basketball', 'Cross Country', 'Football', 'Golf', 'Swimming and Diving', 'Tennis', 'Track and Field'], womens: ['Basketball', 'Cross Country', 'Golf', 'Gymnastics', 'Lacrosse', 'Soccer', 'Softball', 'Swimming and Diving', 'Tennis', 'Track and Field', 'Volleyball'] },
    sports_source: 'uf-athletics-home', market: null },
  { slug: 'seminole-high-school-sanford', name: 'Seminole High School', short_name: 'Seminole High School', institution_type: 'high_school', sector: 'public', state: 'FL', city: 'Sanford', county: 'Seminole County',
    street_address: '2701 Ridgewood Avenue', postal_code: '32773', district: 'seminole-county-public-schools', division: 'FHSAA member school', nces_id: '120171001872',
    website_url: 'https://www.seminolehs.scps.k12.fl.us/', athletics_url: 'https://shsnolessports.com/',
    profile_source: 'nces-seminole-hs', publication_state: 'researched', governing: ['fhsaa'],
    sports: { unspecified: ['Baseball', 'Basketball', 'Beach Volleyball', 'Bowling', 'Cheerleading', 'Cross Country', 'Flag Football', 'Football', 'Golf', 'Lacrosse', 'Soccer', 'Softball', 'Swimming', 'Tennis', 'Track and Field', 'Volleyball', 'Water Polo', 'Weightlifting', 'Wrestling'] },
    sports_source: 'shs-athletics-about' },
  // Discovered only: recorded so Find My School can answer honestly. No hub page, no rules, not part of the pilot build.
  { slug: 'university-of-central-florida', name: 'University of Central Florida', short_name: 'UCF', institution_type: 'college', sector: 'public', state: 'FL', city: 'Orlando',
    division: 'NCAA Division I', website_url: 'https://www.ucf.edu/', athletics_url: 'https://ucfknights.com/', publication_state: 'discovered', governing: ['ncaa', 'college-sports-commission', 'florida-board-of-governors'] },
];

export const policySearches = [
  { inst: 'university-of-florida', public_policy_found: true, search_date: '2026-10-03',
    locations_checked: ['floridagators.com NIL overview page (read in full)', 'floridagators.com Gators Made NIL page', 'floridagators.com legacy NIL guidelines page', 'floridagators.com compliance pages', 'UF International Center NCAA FAQ', 'UF licensing and brand center pages'],
    notes: 'UF publishes an athlete-facing overview rather than a formal policy document.' },
  { inst: 'university-of-central-florida', public_policy_found: false, search_date: '2026-10-03',
    locations_checked: ['ucfknights.com compliance pages', 'ucfknights.com athletics director letters (November 2024 to December 2025)', 'UCF policy library (policies.ucf.edu)', 'UCF brand and licensing pages', 'UCF 2021-22 Student-Athlete Handbook (outdated)'],
    locations_unreachable: ['big12sports.com NIL page (server error)'],
    notes: 'No current institutional NIL policy or guidelines document was located. A 2021-22 handbook and a 2016 compliance page exist but are out of date.' },
  { inst: 'seminole-high-school-sanford', public_policy_found: false, search_date: '2026-10-03',
    locations_checked: ['Seminole High School athletics site: home, About Us, Athlete Clearance, Media Credential pages', 'Seminole High School main site', 'Seminole County Public Schools policies landing page', 'Seminole County Public Schools facility rental page', 'Seminole County Public Schools athletics events page'],
    locations_unreachable: ['SCPS board policy manual (individual policies)', 'SCPS Student Conduct and Discipline Code', 'SCPS Policy 7510 and Facility Use Handbook (rev 05-2024)'],
    notes: 'No school-specific or district-specific NIL policy was located in the public sources reviewed. Several district documents could not be opened, so an internal or unpublished policy may exist.' },
];

export const schoolPolicies = [
  { inst: 'university-of-florida', title: 'Overview of Gators NIL', policy_status: 'published', source: 'uf-nil-overview', adopted_on: null,
    summary: 'UF publishes an athlete-facing NIL overview (dated August 6, 2025 in its URL) rather than a formal policy document. It covers what athletes can do, the NIL Go reporting rule, use of Gators marks and gear, prohibited vendors, international athletes and the support UF offers. UF\'s older "Guidelines for Name, Image, and Likeness" page now reads "Updated information coming soon."' },
];

export const nilPrograms = [
  { inst: 'university-of-florida', name: 'Gators NIL Exchange', program_type: 'marketplace', source: 'uf-gators-made', sort: 10, url: 'https://floridagators.com/sports/2021/12/16/gators-made-name-image-likeness.aspx',
    description: 'UF says the exchange "allows fans, alumni, and local businesses to directly connect with Gator athletes to offer them opportunities."' },
  { inst: 'university-of-florida', name: 'Florida Victorious', program_type: 'nil_entity', source: 'uf-gators-made', sort: 20, url: 'https://floridavictorious.com/',
    description: 'UF\'s NIL page describes Florida Victorious as "an exclusive community for Gator Nation" that "strives to be the model NIL entity in collegiate athletics." Whether a payor counts as "associated" with a school is decided in NIL Go review.' },
  { inst: 'university-of-florida', name: 'Gators Sports Properties', program_type: 'sponsorship_sales', source: 'uf-gators-made', sort: 30, url: 'https://floridagators.com/sports/2015/12/10/_sponsors_',
    description: 'The route for companies that want to sponsor or partner with the Florida Gators and their athletes.' },
  { inst: 'university-of-florida', name: 'NIL Suite, Hawkins Center, Gators Experience and GatorMade', program_type: 'education', source: 'uf-gators-made', sort: 40, url: 'https://floridagators.com/sports/2025/8/6/overview-name-image-likeness',
    description: 'UF\'s in-house support: one-on-one NIL advising, content help, and financial literacy, brand building and education workshops.' },
];

export const contacts = [
  { inst: 'university-of-florida', office: 'UAA Compliance Office', role: 'Compliance office, general contact', phone: '(352) 375-4683 ext. 6022', url: 'https://floridagators.com/sports/2015/12/10/_compliance_', source: 'uf-compliance', is_public: true, show: true, status: 'verified' },
  { inst: 'university-of-florida', office: 'UAA Licensing', role: 'Merchandise, apparel and logo approval', url: 'https://floridagators.com/sports/2025/8/6/overview-name-image-likeness', source: 'uf-nil-overview', is_public: true, show: true, status: 'verified' },
  { inst: 'university-of-florida', office: 'UF International Center, International Student Services', role: 'First stop for international athletes', url: 'https://internationalcenter.ufl.edu/iss/maintaining-f-1-status/employment-or-training/ncaa---frequently-asked-questions/', source: 'uf-iss-ncaa-faq', is_public: true, show: true, status: 'verified' },
  { inst: 'seminole-high-school-sanford', office: 'Seminole High School Athletics', role: 'Athletic Director', person_name: 'Woody Cox', phone: '407-320-5057 (athletics office)', url: 'https://shsnolessports.com/about-us/', source: 'shs-athletics-about', is_public: true, show: true, status: 'verified' },
];

// ----------------------------------------------------------------- scenarios
// [slug, question, applies_to, sort, governs[], conditions[]]
export const QUICK = ['paid-by-brand', 'local-restaurant', 'agent', 'school-logo', 'uniform', 'facilities', 'booster', 'disclose', 'school-arranges'];
export const scenarios = [
  ['paid-by-brand', 'Can I get paid by a brand?', 'both', 5, ['nil-allowed'], ['prohibited-categories', 'disclosure-required']],
  ['disclose', 'Do I need to disclose the deal?', 'both', 15, ['disclosure-required'], []],
  ['local-restaurant', 'Can I promote a local restaurant on my social media?', 'both', 10, ['sponsored-posts'], ['prohibited-categories', 'disclosure-required', 'school-logos-marks']],
  ['uniform', 'Can I wear my uniform?', 'both', 20, ['uniform-in-content'], []],
  ['school-logo', 'Can I use my school logo?', 'both', 30, ['school-logos-marks'], []],
  ['brand-names-school', 'Can a brand reference my school by name?', 'high_school', 40, ['school-name-reference'], []],
  ['facilities', 'Can I film sponsored content at school?', 'both', 50, ['school-facilities'], []],
  ['school-arranges', 'Can my school arrange the deal?', 'both', 60, ['school-staff-involvement'], []],
  ['booster', 'Can a booster pay me?', 'both', 70, ['boosters'], []],
  ['collective', 'Can I take a deal from an NIL collective?', 'both', 80, ['collectives'], ['disclosure-required']],
  ['sportsbook', 'Can I promote a sports betting company?', 'both', 90, ['prohibited-categories'], []],
  ['agent', 'Can I hire an agent?', 'both', 100, ['agents'], []],
  ['during-game', 'Can I shout out my sponsor at a game or team event?', 'both', 110, ['team-activities'], []],
  ['autographs', 'Can I get paid for autographs or a camp appearance?', 'college', 120, ['appearances-autographs'], ['disclosure-required', 'team-issued-gear']],
];

// ----------------------------------------------------------------- guidance blocks
export const guidance = [
  // High school athlete action plan (inherited by every FHSAA school)
  { slug: 'hs-step-check-brand', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 10, topic: 'prohibited-categories', title: 'Check the brand against the prohibited list', body: 'Before you reply to an offer, make sure the product or service is not in one of the nine prohibited categories, and that the deal is not coming from a collective, a booster, a school employee or an athletic department staff member.' },
  { slug: 'hs-step-written', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 20, topic: 'deal-terms', title: 'Get the deal in writing', body: 'An NIL agreement has to be a fully executed written contract. Make sure it ends on or before your graduation date and says exactly what you will do and what you will receive.' },
  { slug: 'hs-step-marks', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 30, topic: 'school-logos-marks', title: 'Keep school marks out unless you have written consent', body: 'No uniform, logo, mascot or school name in the content unless your school or district has agreed in writing first. School, district, FHSAA and NFHS titles and championships cannot be mentioned in paid content at all.' },
  { slug: 'hs-step-parent', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 40, topic: 'parent-guardian', title: 'Review it with a parent or guardian', body: 'A parent or legal guardian has to sign Form GA1 with you. FHSAA also encourages families to get legal and tax advice before agreeing to a deal.' },
  { slug: 'hs-step-ga1', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 50, topic: 'disclosure-required', title: 'File Form GA1 within five business days', body: 'After you sign, complete Form GA1 and hand it to your school within five business days. The school fills in its section and sends a copy to FHSAA.', link_url: 'https://s3.amazonaws.com/fhsaa.org/documents/2024/10/2/GA1_Affidavit_of_Amateurism_10124.pdf', link_label: 'Form GA1 (PDF)' },
  { slug: 'hs-step-activities', type: 'action_step', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 60, topic: 'team-activities', title: 'Keep sponsors away from school time', body: 'Do the posts, shoots and appearances on your own time. No promoting a sponsor during any school-sponsored, district-sponsored or FHSAA activity.' },
  // Parent guidance (FHSAA)
  { slug: 'hs-parent-signature', type: 'parent_guidance', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 10, topic: 'parent-guardian', title: 'Your signature is part of the process', body: 'A parent or legal guardian signs Form GA1 alongside the student, under penalties of perjury. Read the affidavit and the agreement before you sign.' },
  { slug: 'hs-parent-release', type: 'parent_guidance', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 20, topic: 'parent-guardian', title: 'You release the school and FHSAA from liability', body: 'The bylaw says that by entering an NIL agreement, the student and parents release the school, its district or governing body, and FHSAA from liability related to the agreement.' },
  { slug: 'hs-parent-who', type: 'parent_guidance', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 30, topic: 'school-staff-involvement', title: 'Know who cannot be involved', body: 'Coaches, school employees, athletic staff, boosters and collectives cannot arrange, offer or take part in your child\'s deal. If an offer comes through one of them, treat it as a warning sign and ask the athletic director.' },
  { slug: 'hs-parent-penalties', type: 'parent_guidance', scope: { gb: 'fhsaa' }, applies: 'high_school', sort: 40, topic: 'penalties', title: 'Repeat violations cost eligibility', body: 'A first violation brings a formal warning, and the deal has to be ended or changed. A second means a year of ineligibility, and a third ends high school eligibility.' },
  { slug: 'hs-parent-college', type: 'parent_guidance', scope: { level: true }, applies: 'high_school', sort: 50, topic: 'prospects-reporting', title: 'Planning on Division I? Keep records now', body: 'NCAA rules require incoming Division I athletes to report third-party deals of $600 or more made since the start of junior year (or July 1, 2025, if later), within 14 days of enrolling full time or before the team\'s first game, whichever comes first. Keep every contract and payment record so reporting is easy later.' },
  // College athlete action plan (inherited by every Division I school)
  { slug: 'col-step-real-deal', type: 'action_step', scope: { gb: 'ncaa' }, applies: 'college', sort: 10, topic: 'pay-for-play', title: 'Make sure it is a real deal', body: 'The deal should pay you for something specific you do for a business: posts, appearances, content. Money for playing, performing or choosing a school is not NIL.' },
  { slug: 'col-step-school-rules', type: 'action_step', scope: { gb: 'ncaa' }, applies: 'college', sort: 20, topic: 'school-logos-marks', title: 'Check your school\'s rules on logos, gear and categories', body: 'We found no NCAA Article 22 rule on school marks or product categories, and the NCAA tells athletes to review their campus NIL policy. Read the school rows in the matrix above and ask compliance if the deal touches logos, uniforms or facilities.' },
  { slug: 'col-step-agent', type: 'action_step', scope: { state: 'FL' }, applies: 'college', sort: 30, topic: 'agents', title: 'Using an agent? Confirm the Florida license', body: 'Florida requires a person acting as an athlete agent on a college athlete\'s NIL contracts to hold a valid Florida athlete agent license. A spouse, parent, sibling, grandparent or guardian is not treated as an athlete agent.' },
  { slug: 'col-step-report', type: 'action_step', scope: { gb: 'ncaa' }, applies: 'college', sort: 40, topic: 'disclosure-required', title: 'Report deals of $600 or more in NIL Go within five business days', body: 'Add up everything from the same payor, including free products and perks. You can have one representative enter the deal, but you have to submit it yourself.', link_url: 'https://www.collegesportscommission.org/nil/', link_label: 'How NIL Go works' },
  { slug: 'col-step-wait', type: 'action_step', scope: { gb: 'college-sports-commission' }, applies: 'college', sort: 50, topic: 'deal-review', title: 'Watch for the review result', body: 'A deal comes back Cleared, Not Cleared or Flagged. If it is not cleared, you can revise and resubmit, appeal, or return the payment. Do not carry on with a deal that was not cleared.' },
  { slug: 'col-parent-records', type: 'parent_guidance', scope: { gb: 'ncaa' }, applies: 'college', sort: 10, topic: 'disclosure-required', title: 'A parent can enter deals, but the athlete submits', body: 'Each athlete may name one representative, such as a parent or agent, to enter deals in NIL Go. The athlete is still responsible for submitting them accurately and on time.' },
  { slug: 'col-parent-agent', type: 'parent_guidance', scope: { state: 'FL' }, applies: 'college', sort: 20, topic: 'agents', title: 'Check any agent\'s Florida license', body: 'Florida requires a state athlete agent license to represent a college athlete on NIL contracts. Parents, guardians, siblings, grandparents and spouses are not treated as agents under the statute.' },
];

// ----------------------------------------------------------------- change history and watch list
export const changeLog = [
  { gb: 'fhsaa', rule: 'fhsaa-nil-allowed', changed_on: '2024-06-04', change_type: 'adopted', source: 'fhsaa-letter-2024-06-21', summary: 'FHSAA Board of Directors approved the revision of Bylaw 9.9 to allow NIL for high school athletes.' },
  { gb: 'fhsaa', rule: 'fhsaa-collectives', changed_on: '2024-07-22', change_type: 'amended', source: 'fhsaa-board-recap-2024-07-22', summary: 'The definition of an NIL collective was revised to exclude school sanctioned team fundraising.' },
  { gb: 'fhsaa', rule: 'fhsaa-nil-allowed', changed_on: '2024-07-24', change_type: 'on_agenda', source: 'sbe-agenda-2024-07-24', summary: 'Ratification of the NIL bylaw was on the State Board of Education agenda for approval. The vote record was not found in a primary document.' },
  { gb: 'fhsaa', rule: 'fhsaa-disclosure', changed_on: '2024-09-25', change_type: 'amended', source: 'fhsaa-board-recap-2024-09', summary: 'At its September 2024 meeting (recap published September 25), the FHSAA Board added a disclosure affidavit to Bylaw 9.9.',
    previous_text: 'Bylaw 9.9 had no affidavit requirement; section 9.9.5 held the penalties.', current_text: 'Section 9.9.5 requires Form GA1 within five business days of signing an NIL agreement; penalties moved to 9.9.6.' },
  { gb: 'fhsaa', rule: 'fhsaa-disclosure', changed_on: '2025-07-16', change_type: 'on_agenda', source: 'sbe-consent-2025-07-16', summary: 'Bylaw 9.9.5 (Form GA1) was on the State Board of Education consent agenda for ratification, with the form revised 10/24 attached. The vote record was not found.' },
  { state: 'FL', rule: 'fl-college-nil-allowed', changed_on: '2021-07-01', change_type: 'adopted', source: 'fl-sb-646-2020', summary: 'Florida\'s college NIL statute, section 1006.74, took effect (created by SB 646 in 2020).' },
  { state: 'FL', rule: 'fl-college-nil-allowed', changed_on: '2023-02-16', change_type: 'amended', source: 'fl-hb-7b-2023', summary: 'HB 7-B (chapter 2023-4) revised the provisions on athlete agents, athlete compensation, institutional requirements and workshops, and added a liability shield for institutions and their employees.' },
  { gb: 'ncaa', rule: 'ncaa-disclosure', changed_on: '2025-07-01', change_type: 'adopted', source: 'ncaa-house-qa-2025-06', summary: 'House settlement rules took effect: direct school payments, the $600 reporting rule and NIL Go review of third-party deals.' },
  { gb: 'college-sports-commission', rule: 'csc-deal-review', changed_on: '2026-07-01', change_type: 'amended', source: 'csc-memo-2026-06-23', summary: 'The College Sports Commission widened the exemption from compensation-range review for deals with school-associated payors.', effective_on: '2026-07-01',
    previous_text: 'Deals up to $2,500 were exempt until an athlete reached $15,000 in associated deals (policy in effect from April 2026).', current_text: 'Deals of $600 to $15,000 are exempt until an athlete has more than $50,000 in associated deals in an academic year.' },
];

export const watchItems = [
  { slug: 's4668-protect-college-sports-act', title: 'Protect College Sports Act of 2026 (S.4668)', applies: 'college', as_of: '2026-10-02', source: 's4668-bill-status',
    status_text: 'Passed the Senate 77 to 22 on September 28, 2026. Not law.', summary: 'No House action was recorded as of October 2, 2026. We have not verified the bill\'s provisions, and nothing on this page changes unless it becomes law.' },
  { slug: 'fl-bog-task-force-2026', title: 'Florida Board of Governors task force recommendations', applies: 'college', state: 'FL', gb: 'florida-board-of-governors', as_of: '2026-09-03', source: 'bog-task-force-recs-2026',
    status_text: 'Recommendations approved September 3, 2026. Not yet law or regulation.', summary: 'The Board approved recommendations to ask the Legislature to amend section 1006.74, to regulate agents if Congress does not act, and to require financial literacy training in an athlete\'s first year.' },
  { slug: 'fl-hs-nil-legislation', title: 'Florida high school NIL legislation', applies: 'high_school', state: 'FL', as_of: '2026-10-03', source: 'fl-hb-981-2025',
    status_text: 'HB 981 (2025) died in committee on June 16, 2025. We found no high school NIL statute.', summary: 'A 2025 bill on athlete representation and compensation, which included high school NIL provisions, did not pass. FHSAA Bylaw 9.9 remains the rule we cite.' },
];

export const conflicts = [
  { rule: 'fl-college-disclosure', severity: 'medium', opened_on: '2026-10-03', summary: 'Section 1006.74 has no disclosure rule, but a legacy UF compliance page says Florida law requires athletes and agents to notify the school of certain agent contracts. Florida\'s athlete agent statutes (sections 468.454 and following) have not been checked.' },
  { rule: 'uf-disclosure', severity: 'low', opened_on: '2026-10-03', summary: 'UF\'s overview gives the NIL Go deadline two ways: "within 5 business days of signing the contract" and "within 5 days of signing". The NCAA bylaw says five business days.' },
  { rule: 'fhsaa-disclosure', severity: 'medium', opened_on: '2026-10-03', summary: 'Form GA1 timing is worded three ways: the bylaw and form say within five business days of signing an NIL agreement; the State Board 2025 summary says "before participating in NIL activities"; the FHSAA September 2024 recap says within five business days "of engaging in any NIL activity". We show the bylaw and form wording.' },
  { rule: 'fhsaa-school-logos-marks', severity: 'low', opened_on: '2026-10-03', summary: 'Bylaw 9.9.4.3 opens with an unqualified ban on school marks, then allows use with prior written consent. Form GA1 (statement 4 and Section B) treats prior written consent as the working mechanism for member school marks. We show "only with written consent".' },
  { rule: 'csc-deal-review', severity: 'low', opened_on: '2026-10-03', summary: 'The CSC memo says the exemption ends once an athlete has "exceeded" $50,000 in associated deals; the CSC NIL page says "reached". The CSC FAQ had not been updated for the new tier.' },
  { rule: 'uf-disclosure', severity: 'medium', opened_on: '2026-10-03', summary: 'UF\'s NIL overview names NIL Go as the reporting venue; a UF International Center FAQ says UAA policy asks athletes to report all NIL activity through a Teamworks form. The second may predate NIL Go.' },
];

// ----------------------------------------------------------------- pages
export const pages = [
  { path: '/nil/', page_type: 'national_hub', title: 'NIL Rules by State and School | NIL Brand Academy', h1: 'NIL rules for your state and your school', meta_description: 'Find the NIL rules that apply to you. Sourced NIL rules by state and school, with last-checked dates, disclosure steps and next steps.' },
  { path: '/nil/states/', page_type: 'states_index', title: 'NIL Rules by State | NIL Brand Academy', h1: 'NIL rules by state', meta_description: 'State by state NIL rules for high school and college athletes, each with sources and a last-checked date.' },
  { path: '/nil/states/florida/', page_type: 'state_hub', state: 'FL', title: 'Florida NIL Rules: High School and College | NIL Brand Academy', h1: 'Florida NIL rules', meta_description: 'What Florida high school and college athletes can and cannot do with NIL: FHSAA Bylaw 9.9, Form GA1, Florida law, NCAA and NIL Go reporting, with sources.' },
  { path: '/nil/florida/colleges/', page_type: 'college_directory', state: 'FL', title: 'Florida College NIL Rules by School | NIL Brand Academy', h1: 'Florida colleges', meta_description: 'NIL rules, disclosure steps and school contacts for Florida college athletes, school by school.' },
  { path: '/nil/florida/high-schools/', page_type: 'high_school_directory', state: 'FL', title: 'Florida High School NIL Rules by School | NIL Brand Academy', h1: 'Florida high schools', meta_description: 'NIL rules, Form GA1 steps and school contacts for Florida high school athletes and parents, school by school.' },
  { path: '/nil/florida/colleges/university-of-florida/', page_type: 'college_hub', state: 'FL', inst: 'university-of-florida', title: 'University of Florida NIL Rules | NIL Brand Academy', h1: 'University of Florida NIL rules', meta_description: 'What University of Florida athletes can and cannot do with NIL: NIL Go reporting, logo and gear rules, prohibited vendors, contacts and sources.' },
  { path: '/nil/florida/high-schools/seminole-high-school-sanford/', page_type: 'high_school_hub', state: 'FL', inst: 'seminole-high-school-sanford', title: 'Seminole High School (Sanford, FL) NIL Rules | NIL Brand Academy', h1: 'Seminole High School NIL rules', meta_description: 'NIL rules for Seminole High School athletes in Sanford, Florida: what FHSAA allows, Form GA1, school marks and facilities, parent guidance and sources.' },
  { path: '/nil/sports/', page_type: 'sports_index', title: 'NIL by Sport | NIL Brand Academy', h1: 'NIL by sport', meta_description: 'How NIL works sport by sport, with links to the schools that offer each sport.' },
  { path: '/nil/how-we-verify/', page_type: 'methodology', title: 'How We Verify NIL Rules | NIL Brand Academy', h1: 'How we verify NIL rules', meta_description: 'How NIL Brand Academy sources, checks and dates every NIL rule we publish, and what each status label means.' },
];

export const redirects = [
  { from_path: '/nil/florida/', to_path: '/nil/states/florida/', status: 301 },
];

export const marketAreas = [
  { slug: 'orlando-metro', name: 'Orlando metro', state: 'FL', counties: ['Orange County', 'Seminole County', 'Osceola County', 'Lake County'], institutions: ['seminole-high-school-sanford'] },
  { slug: 'gainesville-metro', name: 'Gainesville metro', state: 'FL', counties: ['Alachua County'], institutions: ['university-of-florida'] },
];

// ----------------------------------------------------------------- second pass, continued (after all exports exist)
guidance.forEach((g) => { g.title = renum(g.title); g.body = renum(g.body); });
watchItems.forEach((w) => { w.status_text = renum(w.status_text); w.summary = renum(w.summary); });
pages.forEach((p) => { p.meta_description = renum(p.meta_description); });
// Resolved: section 468.454 was read. It requires notice of agent contracts, which the rule now states.
conflicts.splice(conflicts.findIndex((c) => c.rule === 'fl-college-disclosure'), 1);
conflicts.forEach((c) => { c.summary = renum(c.summary); });
conflicts.push({ rule: 'fhsaa-boosters', severity: 'low', opened_on: '2026-10-03', summary: 'The 2026-27 Handbook renumbers the NIL bylaw to 9.10, but Bylaw 9.10.4.5 still refers to "FHSAA Bylaw 9.9", "9.9.4.2" and "9.9.4.4(i)", and Form GA1 (revised 10/24), which FHSAA still links as the current form, cites Bylaw 9.9. We read these as the same rules under their old number.' });
changeLog.push(
  { gb: 'fhsaa', rule: 'fhsaa-nil-allowed', changed_on: '2026-07-01', change_type: 'amended', source: 'sbe-fhsaa-bylaws-2026-07-22', effective_on: '2026-07-01',
    summary: 'For 2026-27 the NIL bylaw was renumbered from 9.9 to 9.10, and the NIL collectives subtitle gained the word "Defined". A word-for-word comparison with the October 2024 text found no change to what athletes may or may not do.',
    previous_text: 'Bylaw 9.9, Amateurism and Name, Image, and Likeness (NIL). Subsection 9.9.4.2, "NIL Collectives."', current_text: 'Bylaw 9.10, Amateurism and Name, Image, and Likeness (NIL). Subsection 9.10.4.2, "NIL Collectives Defined."' },
  { gb: 'fhsaa', rule: 'fhsaa-transfers', changed_on: '2026-07-22', change_type: 'on_agenda', source: 'sbe-fhsaa-bylaws-2026-07-22',
    summary: 'Substantive amendments to Bylaw 9.3 (transfers), following SB 538, were on the State Board of Education consent agenda for ratification. The NIL transfer rule depends on the exceptions in Bylaw 9.3.2.2.' },
);

// ----------------------------------------------------------------- Phase 3: Florida pilot population
// Canonical rule edits (made once, inherited by every Division I school in the pilot).
R('ncaa-disclosure').sources.push(S('csc-faq', 'If a school has not opted in to the system, do their student-athletes\' NIL deals have to go through this platform?', 'Yes, all Division I student-athletes, regardless of whether or not their school has opted in to revenue sharing, have to report third-party NIL deals valued at $600 or more in the aggregate into the NIL Go platform.', 'machine_raw_text'));
R('ncaa-disclosure').conditions = 'This applies whether or not your school opted in to revenue sharing. One representative may enter the deal, but the athlete must submit it.';
R('ncaa-school-payments').sources.push(S('csc-faq', 'What is the process for a school opting in or out of revenue sharing?', 'Each year, schools outside of the ACC, Big Ten, Big 12, Pac-12 and SEC will have the option to opt in to or out of revenue sharing.', 'machine_raw_text'));
R('ncaa-school-payments').summary += ' Schools outside the ACC, Big Ten, Big 12, Pac-12 and SEC choose each year whether to opt in, so check what your school has announced.';
// General district and school rules that never mention NIL: shown, but not counted as NIL-specific value.
R('scps-facilities').nil_specific = false;
R('shs-event-footage').nil_specific = false;
institutions.find((i) => i.slug === 'university-of-florida').search_aliases = ['UF', 'Florida'];
const CONTACT_SCOPE = { 'UAA Compliance Office': 'compliance', 'UAA Licensing': 'licensing', 'UF International Center, International Student Services': 'international', 'Seminole High School Athletics': 'athletics' };
contacts.forEach((c) => { c.contact_scope = CONTACT_SCOPE[c.office]; });
nilPrograms.forEach((p) => { p.is_current = true; });
schoolPolicies.forEach((p) => { p.covers_nil = true; });

// Notes for the human review checklist. Never rendered on a public page.
export const reviewNotes = [];
export const districtSearches = [];
applyPilot({ governingBodies, districts, sources, rules, institutions, policySearches, schoolPolicies, nilPrograms, contacts, pages, marketAreas, reviewNotes, districtSearches });
changeLog.push({ gb: 'ncaa', rule: 'ncaa-school-payments', changed_on: '2026-10-03', change_type: 'clarified', source: 'csc-faq',
  summary: 'We added the College Sports Commission\'s statement that schools outside the ACC, Big Ten, Big 12, Pac-12 and SEC choose each year whether to opt in to revenue sharing, and that NIL Go reporting applies either way.' });
{ const slugs = rules.map((r) => r.slug); const dup = slugs.filter((x, i) => slugs.indexOf(x) !== i); if (dup.length) throw new Error('duplicate rule slugs: ' + dup.join(', ')); }
{ const ss = new Set(sources.map((x) => x.slug)); for (const r of rules) for (const x of r.sources) if (!ss.has(x.src)) throw new Error(`rule ${r.slug} cites unknown source ${x.src}`); }
