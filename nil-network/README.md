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
