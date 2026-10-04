# NIL Intelligence Network (staging)

The database-driven site behind `nilbrandacademy.com/nil/`. Built separately from the live site. Nothing here deploys anywhere on its own.

## What is here

| Path | What it is |
| --- | --- |
| `db/migrations/0001_schema.sql` | The data model (Supabase / Postgres). Rules, versions, sources, verification, schools, pages. |
| `db/migrations/0002_views.sql` | The cascade (`v_institution_rules`, `v_state_rules`) and the index quality gate (`v_page_quality_gate`). |
| `db/seed/florida.mjs` | Florida pilot data with source, locator and quote for every rule. Edit this, never the pages. |
| `db/seed/florida.generated.sql` | The same seed as portable SQL, ready to run on Supabase. |
| `src/` | Astro templates. Pages contain no regulatory text; they render rule rows. |
| `scripts/` | Seed builder, DB check, QA audit, redirects writer, screenshot helper. |

## Commands

```
npm install
npm run check:db     # row counts, cascade, quality gate
npm run build        # staging build: every page noindex
npm run build:launch # launch build: index only pages that pass the gate
```

Without `DATABASE_URL` the build runs on an in-process Postgres loaded from the migrations and seed. With `DATABASE_URL` set it reads Supabase.

## Rules of the road

1. A rule is a row. Change the row and every dependent page changes on the next build.
2. Nothing is `verified` until a person checks the quote against the source and sets `verification_status`, `last_verified_on`, `verified_by`.
3. A school page is indexable only when `v_page_quality_gate.index_status = 'index'`, which also needs `pages.human_approved`.
4. No school logos, mascots or colors. School names only.
5. Production launch needs Michaela's written approval. See the pre-launch report.

## Phase 2A status (2026-10-03)

- Database: Supabase project "NIL Brand Academy" (org ME3 Digital, East US). Schema and seed applied from `db/deploy/supabase_bundle.sql`. `db/deploy/validate.sql` returns the same 41-check fingerprint locally and on Supabase.
- Staging: separate Netlify project `nil-brand-academy-staging`, built from this branch with base directory `nil-network`. Blocked from indexing by robots.txt, a robots meta tag and an `X-Robots-Tag` header.
- The build reads the database at build time. With `DATABASE_URL` set (Netlify environment variable only) it reads Supabase; without it, it builds the identical data from `db/migrations` and `db/seed` in process.
- QA: `node scripts/audit.mjs <paths>`, `node scripts/qa-interact.mjs`, `node scripts/linkcheck.mjs` against `python3 -m http.server 4321` in `dist/`.
- This branch is never merged into `main`. Launch is a single proxy rule on the production site.

## Phase 3: Florida pilot population (2026-10-03)

- **Scope:** 13 Florida Division I colleges and 17 high schools (Seminole High plus 16 Orange County Public Schools high schools). Every school page is noindex.
- **Population workflow:** research files in `db/seed/research/` hold only what a school, district or conference publishes itself. `db/seed/pilot.mjs` turns them into seed rows and assigns trust states. Statewide and national rules are never restated per school: they are inherited from the canonical rule rows.
- **Trust states for school rules:** quotes read as raw page text are "checked against the official source". A college rule that rests only on a page dated before July 2025, or on an undated or outdated school policy, is "awaiting school confirmation" and never sets a page's bottom line while a checked rule exists. A rule resting on a document that could only be read in part is "under review".
- **Quality gate (`0006_pilot_gate.sql`):**
  - School-specific value needs at least one NIL-specific item from the school or district (a rule that addresses NIL, a published NIL policy, a current NIL program, or a school confirmation) and three school-level facts in total. A contact counts as at most one. A contact alone never passes.
  - Value class A (strong), B (moderate), C (state-rule-dominant / thin), D (incomplete). C and D stay noindex whatever else passes.
  - `seo_status`: `NOT_ELIGIBLE`, `SEO_ELIGIBLE_HUMAN_REVIEW_PENDING`, `APPROVED_TO_INDEX`. A page indexes only when every automated check passes and a person has recorded both the rule reviews and the page approval.
  - `record_human_review` and `approve_page` refuse automated names, and table constraints refuse the same writes done directly. `node scripts/test-guards.mjs` proves it on the local reference database.
- **TLS:** the build verifies the database server certificate (chain and host name). Supabase signs its certificates with its own root, so that public root certificate ships in `db/certs/` and is trusted alongside Node's standard roots. `rejectUnauthorized` is `true`. The staging banner shows `TLS certificate verified` when the connection passed.
- **Commands:** `node scripts/gate-report.mjs` (gate per page), `node scripts/review-queue.mjs` (human review queue and per-school checklists into `review/`), `node scripts/pilot-qa.mjs` (QA across every built page; set `QA_BASE` for the hosted site), `node scripts/bundle-update.mjs 0006_pilot_gate.sql` (hosted database update).

## Phase 3B: completing the pilot before human review (2026-10-04)

- **Seminole County:** 8 more high schools researched from public sources. The district publishes Board Policy 2431.06 on NIL (revised January 20, 2026), which the first pass missed because the board policy manual had not been opened. All Seminole County pages now inherit it.
- **Source-access triage (`0007_source_access.sql`, `db/seed/pilot-triage.mjs`):** every document research could not open is one row in `source_access_issues`, classed A to F once and mapped to each page it affects through `source_access_pages`. A page with an unread class A (critical primary) source cannot be class A or SEO-eligible. A person clears an issue by setting `resolved` after reading the document.
- **Currency rule:** a college rule with no source dated after July 1, 2025 is "awaiting school confirmation" unless the school has a current published NIL policy. General (non-NIL) policies are exempt.
- **Review workbench:** `node scripts/review-queue.mjs && node scripts/review-workbench.mjs` builds a tiered queue (central rules, institution rules, page approval), in priority order, with the source excerpt and link for each claim. Marks made in the page are local to the reviewer's browser; reviews are recorded with `record_human_review`.
- **No outreach.** This phase used public sources only. No school, district or third party was contacted.
