-- NIL Intelligence Network: single source of truth
-- Target: Supabase (Postgres 15+). Validated locally on PGlite.
-- Principle: a rule is a row, never a sentence on a page. Pages render from rule versions.

-- ---------------------------------------------------------------- reference
create table states (
  id            serial primary key,
  code          char(2) not null unique,
  name          text not null unique,
  slug          text not null unique
);

-- Anything that issues NIL rules above the school level.
create table governing_bodies (
  id            serial primary key,
  slug          text not null unique,
  name          text not null,
  short_name    text not null,
  body_type     text not null check (body_type in (
                  'federal_agency','national_association','enforcement_body',
                  'state_legislature','state_agency','state_association','conference')),
  state_id      int references states(id),
  parent_id     int references governing_bodies(id),
  website_url   text,
  description   text
);

create table school_districts (
  id            serial primary key,
  slug          text not null unique,
  name          text not null,
  state_id      int not null references states(id),
  county        text,
  website_url   text,
  nces_district_id text
);

-- Colleges and high schools share one table; views `colleges` and `high_schools` split them.
create table institutions (
  id               serial primary key,
  slug             text not null,
  name             text not null,
  short_name       text,
  institution_type text not null check (institution_type in ('college','high_school')),
  sector           text check (sector in ('public','private','charter')),
  state_id         int not null references states(id),
  city             text,
  county           text,
  street_address   text,
  postal_code      text,
  district_id      int references school_districts(id),            -- high schools
  conference_id    int references governing_bodies(id),            -- colleges
  division         text,                                           -- 'NCAA Division I', 'FHSAA member'
  classification   text,                                           -- only when verified
  nces_id          text,
  ipeds_id         text,
  website_url      text,
  athletics_url    text,
  athletics_brand  text,
  profile_source_id int,                                           -- fk added below
  publication_state text not null default 'discovered' check (publication_state in
                   ('discovered','researched','verified','school_confirmed')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (state_id, institution_type, slug)
);

-- Which rule-making bodies an institution answers to (drives the cascade).
create table institution_governing_bodies (
  institution_id    int not null references institutions(id) on delete cascade,
  governing_body_id int not null references governing_bodies(id),
  relationship      text not null default 'member' check (relationship in ('member','subject_to')),
  primary key (institution_id, governing_body_id)
);

create table sports (
  id    serial primary key,
  slug  text not null unique,
  name  text not null
);

create table institution_sports (
  institution_id int not null references institutions(id) on delete cascade,
  sport_id       int not null references sports(id),
  gender         text not null default 'unspecified' check (gender in ('mens','womens','coed','unspecified')),
  season         text,
  source_id      int,
  primary key (institution_id, sport_id, gender)
);

-- ---------------------------------------------------------------- sources
create table sources (
  id               serial primary key,
  slug             text not null unique,
  title            text not null,
  url              text not null,
  organization     text not null,
  governing_body_id int references governing_bodies(id),
  source_type      text not null check (source_type in (
                     'statute','regulation','bylaw','board_document','form','institution_policy',
                     'district_policy','official_faq','official_webpage','government_database',
                     'legislative_record','secondary_reporting')),
  is_primary       boolean not null default true,
  published_on     date,
  published_note   text,          -- when only an approximate/derived date is known
  effective_on     date,
  retrieved_on     date not null,
  archived_url     text,
  content_hash     text,          -- filled by the change monitor
  notes            text
);
alter table institutions add constraint institutions_profile_source_fk
  foreign key (profile_source_id) references sources(id);
alter table institution_sports add constraint institution_sports_source_fk
  foreign key (source_id) references sources(id);

-- ---------------------------------------------------------------- rules
create table rule_categories (
  id         serial primary key,
  slug       text not null unique,
  name       text not null,
  sort_order int not null default 100
);

-- The fixed list of questions every hub can answer.
create table rule_topics (
  id           serial primary key,
  slug         text not null unique,
  category_id  int not null references rule_categories(id),
  label        text not null,        -- short matrix label
  question     text not null,        -- plain-English question
  applies_to   text not null default 'both' check (applies_to in ('high_school','college','both')),
  in_ip_matrix boolean not null default false,
  sort_order   int not null default 100
);

-- One rule = one issuer answering one topic for one audience.
create table rules (
  id                serial primary key,
  slug              text not null unique,
  rule_topic_id     int not null references rule_topics(id),
  scope_type        text not null check (scope_type in ('state','governing_body','district','institution')),
  state_id          int references states(id),
  governing_body_id int references governing_bodies(id),
  district_id       int references school_districts(id),
  institution_id    int references institutions(id),
  applies_to        text not null check (applies_to in ('high_school','college','both')),
  status            text not null default 'active' check (status in ('active','superseded','repealed','pending')),
  created_at        timestamptz not null default now(),
  check (
    (scope_type = 'state'          and state_id is not null and governing_body_id is null and district_id is null and institution_id is null) or
    (scope_type = 'governing_body' and governing_body_id is not null and district_id is null and institution_id is null) or
    (scope_type = 'district'       and district_id is not null and institution_id is null) or
    (scope_type = 'institution'    and institution_id is not null)
  )
);

-- Every change to a rule is a new version; old versions are never edited or deleted.
create table rule_versions (
  id                  serial primary key,
  rule_id             int not null references rules(id) on delete cascade,
  version_no          int not null,
  answer              text not null check (answer in
                        ('yes','yes_with_conditions','only_with_approval','no','not_addressed','unclear')),
  summary             text not null,     -- plain English, one or two sentences
  conditions          text,              -- the "as long as"
  citation            text,              -- e.g. 'FHSAA Bylaw 9.9.4.3'
  effective_date      date,
  effective_note      text,
  end_date            date,
  is_current          boolean not null default true,
  verification_status text not null default 'unverified' check (verification_status in
                        ('unverified','needs_verification','researched','verified','school_confirmed','disputed')),
  last_verified_on    date,
  verified_by         text,
  change_note         text,              -- what changed vs the previous version
  previous_version_id int references rule_versions(id),
  created_at          timestamptz not null default now(),
  unique (rule_id, version_no)
);
create unique index one_current_version_per_rule on rule_versions(rule_id) where is_current;

-- Provenance: which source supports which rule version, and where in it.
create table rule_version_sources (
  id              serial primary key,
  rule_version_id int not null references rule_versions(id) on delete cascade,
  source_id       int not null references sources(id),
  locator         text,           -- section / page
  quote           text,           -- verbatim supporting text
  quote_check     text not null default 'machine_extracted' check (quote_check in
                    ('machine_extracted','machine_confirmed_twice','machine_raw_text','human_checked')),
  checked_on      date not null,
  checked_by      text not null
);
create index rule_version_sources_rv on rule_version_sources(rule_version_id);

-- Structured detail for disclosure rules.
create table disclosure_requirements (
  rule_version_id int primary key references rule_versions(id) on delete cascade,
  what            text not null,
  recipient       text not null,
  deadline_text   text not null,
  deadline_business_days int,
  threshold_usd   numeric,
  form_name       text,
  form_url        text,
  platform_name   text,
  platform_url    text
);

create table prohibited_categories (
  id    serial primary key,
  slug  text not null unique,
  name  text not null
);
create table rule_version_prohibited_categories (
  rule_version_id        int not null references rule_versions(id) on delete cascade,
  prohibited_category_id int not null references prohibited_categories(id),
  wording                text,     -- exact wording in the source
  primary key (rule_version_id, prohibited_category_id)
);

-- Public change history ("Rule updated August 2026 - what changed?").
create table rule_change_log (
  id              serial primary key,
  rule_id         int references rules(id) on delete cascade,
  governing_body_id int references governing_bodies(id),
  state_id        int references states(id),
  changed_on      date not null,
  change_type     text not null check (change_type in ('adopted','amended','on_agenda','ratified','repealed','clarified','correction')),
  summary         text not null,
  source_id       int references sources(id),
  from_version_id int references rule_versions(id),
  to_version_id   int references rule_versions(id),
  is_public       boolean not null default true
);

-- Things that may change the rules soon. Never rendered as current rules.
create table watch_items (
  id              serial primary key,
  slug            text not null unique,
  title           text not null,
  status_text     text not null,
  summary         text not null,
  applies_to      text not null check (applies_to in ('high_school','college','both')),
  state_id        int references states(id),
  governing_body_id int references governing_bodies(id),
  as_of           date not null,
  source_id       int references sources(id),
  is_open         boolean not null default true
);

-- Where sources disagree. A page shows "under review" for any topic with an open high-severity conflict.
create table conflicts (
  id          serial primary key,
  rule_id     int references rules(id) on delete cascade,
  summary     text not null,
  severity    text not null check (severity in ('low','medium','high')),
  status      text not null default 'open' check (status in ('open','resolved')),
  resolution  text,
  opened_on   date not null,
  resolved_on date
);

-- Audit trail of every verification action on anything.
create table verification_events (
  id          serial primary key,
  entity_type text not null check (entity_type in ('rule_version','institution','contact','policy','page','source')),
  entity_id   int not null,
  status      text not null,
  method      text not null check (method in ('automated_fetch','desk_review','second_checker','school_email','school_phone','school_form')),
  verified_on date not null,
  verified_by text not null,
  notes       text
);

-- ---------------------------------------------------------------- school-level
create table school_nil_policies (
  id                  serial primary key,
  institution_id      int not null references institutions(id) on delete cascade,
  title               text not null,
  summary             text not null,
  policy_status       text not null check (policy_status in ('published','none_found','outdated','unconfirmed')),
  source_id           int references sources(id),
  adopted_on          date,
  verification_status text not null default 'needs_verification',
  last_verified_on    date,
  verified_by         text
);

-- Programs and intake paths a school runs for NIL (exchanges, collectives, education).
create table nil_programs (
  id             serial primary key,
  institution_id int not null references institutions(id) on delete cascade,
  name           text not null,
  program_type   text not null check (program_type in ('marketplace','collective','nil_entity','sponsorship_sales','education','in_house_unit','licensing')),
  description    text not null,
  url            text,
  source_id      int references sources(id),
  verification_status text not null default 'needs_verification',
  sort_order     int not null default 100
);

create table school_contacts (
  id             serial primary key,
  institution_id int not null references institutions(id) on delete cascade,
  office         text not null,
  role           text not null,
  person_name    text,
  email          text,
  phone          text,
  url            text,
  is_public      boolean not null default false,   -- only office-level or officially published role contacts
  show_on_page   boolean not null default false,
  source_id      int references sources(id),
  verification_status text not null default 'needs_verification',
  last_verified_on date
);

create table school_confirmations (
  id             serial primary key,
  institution_id int not null references institutions(id) on delete cascade,
  contact_role   text not null,
  method         text not null,
  evidence_ref   text,
  confirmed_on   date not null,
  recheck_on     date
);

-- ---------------------------------------------------------------- guidance content (structured, reusable)
create table scenarios (
  id         serial primary key,
  slug       text not null unique,
  question   text not null,
  applies_to text not null check (applies_to in ('high_school','college','both')),
  sort_order int not null default 100
);
-- role 'governs' decides the outcome; 'condition' adds an "as long as" line.
create table scenario_rule_topics (
  scenario_id   int not null references scenarios(id) on delete cascade,
  rule_topic_id int not null references rule_topics(id),
  role          text not null default 'governs' check (role in ('governs','condition')),
  primary key (scenario_id, rule_topic_id)
);

-- Action-plan steps and parent guidance, written once per issuer and inherited by every school under it.
create table guidance_blocks (
  id                serial primary key,
  slug              text not null unique,
  block_type        text not null check (block_type in ('action_step','parent_guidance')),
  scope_type        text not null check (scope_type in ('state','governing_body','district','institution','level')),
  state_id          int references states(id),
  governing_body_id int references governing_bodies(id),
  institution_id    int references institutions(id),
  applies_to        text not null check (applies_to in ('high_school','college','both')),
  title             text not null,
  body              text not null,
  rule_topic_id     int references rule_topics(id),   -- the rule this step rests on, if any
  link_url          text,
  link_label        text,
  sort_order        int not null default 100
);

-- ---------------------------------------------------------------- local opportunity intelligence (architecture only for now)
create table market_areas (
  id        serial primary key,
  slug      text not null unique,
  name      text not null,
  state_id  int not null references states(id),
  counties  text[]
);
create table institution_market_areas (
  institution_id int not null references institutions(id) on delete cascade,
  market_area_id int not null references market_areas(id),
  primary key (institution_id, market_area_id)
);
create table local_opportunity_intel (
  id             serial primary key,
  market_area_id int references market_areas(id),
  institution_id int references institutions(id),
  intel_type     text not null check (intel_type in ('industry','business_category','seasonal_event','campaign_idea','sport_insight')),
  title          text not null,
  body           text not null,
  sport_id       int references sports(id),
  source_id      int references sources(id),
  verification_status text not null default 'unverified',
  reviewed_by    text,
  reviewed_on    date,
  is_published   boolean not null default false
);

-- ---------------------------------------------------------------- pages, index control, redirects, requests
create table pages (
  id               serial primary key,
  path             text not null unique,          -- canonical path, e.g. /nil/florida/colleges/university-of-florida/
  page_type        text not null check (page_type in
                     ('national_hub','states_index','state_hub','college_directory','high_school_directory',
                      'college_hub','high_school_hub','sports_index','sport_hub','governing_body','methodology','tool')),
  state_id         int references states(id),
  institution_id   int references institutions(id),
  governing_body_id int references governing_bodies(id),
  sport_id         int references sports(id),
  title            text,
  meta_description text,
  h1               text,
  is_discoverable  boolean not null default true,   -- reachable in Find My School / internal nav
  human_approved   boolean not null default false,  -- editorial sign-off; required to index
  approved_by      text,
  approved_on      date,
  index_override   text check (index_override in ('force_noindex')),
  last_updated     date
);

create table redirects (
  from_path text primary key,
  to_path   text not null,
  status    int not null default 301
);

create table school_requests (
  id           serial primary key,
  school_name  text not null,
  state_code   char(2),
  requester_role text,
  email_hash   text,
  created_at   timestamptz not null default now()
);

create table monitors (
  source_id       int primary key references sources(id) on delete cascade,
  frequency       text not null check (frequency in ('daily','weekly','monthly')),
  last_checked_on date,
  last_changed_on date,
  alert_status    text not null default 'ok' check (alert_status in ('ok','changed','unreachable'))
);
