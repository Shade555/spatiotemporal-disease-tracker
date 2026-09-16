# Development Progress

Last updated: 2026-09-16

## Current State

- Repository baseline inspected: only `LICENSE` existed before initialization.
- `context.md` created as the project specification and architecture source of truth.
- `progress.md` created to track implementation state across agent sessions.
- Next.js 16.3.4 TypeScript App Router scaffold created with Tailwind CSS, ESLint, Turbopack, and npm.
- `library.md` created as the npm dependency ledger.
- Planned application, Supabase, Python, public asset, and workflow directories materialized with placeholders.
- `.env.example`, `python/requirements.txt`, and `supabase/seed.sql` added as configuration and data-science scaffolds.
- `project-plan.md` added with three-member workstream ownership, delivery phases, shared contracts, Git workflow, testing strategy, risks, and definition of done.
- Retro terminal landing page and initial `/dashboard` UI implemented from `frontend.txt`.
- Landing CTA now navigates directly to the dashboard without a login page.
- Added the shared motion system: CRT slit boot, chromatic shake, phosphor flicker, matrix rain, stepped keypresses, glitch title overlays, blinking cursors, focus flashes, segmented bar fills, and reduced-motion handling.
- Added client-side typewriter telemetry with timed line streaming and auto-scroll.
- Integrated `public/virus_sprites.png` into the landing page as three floating red, blue, and yellow virus sprites.
- Added a rotating CSS pixel Earth with orbit rings behind the landing console.
- Replaced the procedural Earth with the uploaded `public/earth.png` sprite sheet and placed it above the `BOOT / SYSTEM STATUS` panel.
- Removed the old CSS-drawn Earth and orbit implementation.
- Corrected the Earth animation to address all 30 atlas cells explicitly in 5-column by 6-row order, then loop back to the first frame.
- Reworked `virus_sprites.png` as a 301x830 atlas with three 7-frame animation rows for the red, blue, and yellow enemies.
- Positioned the three independently animated enemies around the Earth inside the shared Earth stage instead of across the whole landing viewport.
- Shifted the grouped Earth-and-virus stage upward without changing the status panel's document flow.
- Made each virus an accessible clickable target; clicking it switches to its color-specific second atlas row and plays a downward falling sequence before resetting to idle.
- Fixed the red virus hit animation override by matching its selector specificity with the blue and yellow hit states.
- Python environment and CI workflow scaffolds are now present.
- Backend foundation started: Supabase client dependency, Zod environment validation, shared TypeScript contracts, and initial Supabase migration added.
- Backend vertical slice implemented: health, protected fixture/live ingestion, metrics, and paginated articles routes.
- GDELT query construction, response normalization, deterministic entity extraction, and daily metric aggregation added.
- Dashboard now fetches metrics and articles from the API with disease filtering, loading/error/empty states, and live evidence cards.
- Disease handling generalized from a fixed Dengue/Malaria union to any non-empty configured disease list, with the initial `.env` values retained as Dengue and Malaria.
- Added a follow-up Supabase migration to remove fixed disease checks for projects that already applied the first migration.
- Python data-science layer added: configurable NLP extraction, GDELT fixture loading, daily pandas aggregation, and leakage-safe rolling anomaly scoring.
- Added `python/notebooks/01_data_exploration.ipynb` and four focused Python tests.
- TypeScript ingestion now computes a prior-only seven-day rolling baseline, population standard deviation, z-score, and anomaly flag with a three-observation minimum and threshold 2.
- Dashboard alert cards now render actual anomaly metrics and explicitly label them as news signals.
- Repeated ingestion now reports only genuinely new article URLs in `articlesInserted`; upserts remain idempotent.
- Live GDELT ingestion is available by calling `/api/ingest` without `source=fixture`; fixture mode remains the deterministic test path.
- Live GDELT testing reached the upstream service, which returned `429 Too Many Requests`; ingestion now exposes that as an actionable `429` with `Retry-After` metadata instead of a generic `500`.
- Replaced the dashboard bar mock with a responsive Recharts signal chart and added a coordinate-safe Mumbai hotspot map module.
- Added `.github/workflows/daily-ingestion.yml` with scheduled and manual ingestion triggers.
- Added 7/14/30-day dashboard windows, refresh status/control, and line/bar/area chart modes.
- Added locality-derived Mumbai coordinates for recognized article mentions and connected them to the hotspot module without inventing coordinates.
- Retried live GDELT ingestion; the existing dev process returned the older generic `500`, so restart is required to exercise the newer upstream `429` response handling.
- Fixed graph rendering by switching to `ComposedChart`, aggregating multiple disease metrics by date, and replacing the native chart select with aligned pixel mode buttons.
- Latest dashboard changes are currently uncommitted: locality coordinate mapping, chart control fixes, graph aggregation, and live GDELT timeout/rate-limit classification.

## Implemented This Session

- Defined the hybrid Next.js App Router and Python/Jupyter folder structure.
- Documented the GDELT DOC 2.0 daily ingestion contract and Mumbai/Dengue/Malaria query restriction.
- Documented the initial API routes and Supabase schema for articles, entities, daily metrics, and pipeline runs.
- Documented baseline anomaly detection, rule-based NLP scope, security requirements, and first-milestone definition of done.
- Initialized `package.json`, `package-lock.json`, TypeScript, ESLint, Tailwind, Next.js config, and starter App Router page.
- Recorded all scaffold-installed npm packages and planned future packages in `library.md`.
- Verified the scaffold with `npm run lint` and `npm run build`.
- Confirmed the repository has an `origin` remote pointing to `Shade555/spatiotemporal-disease-tracker` on `main`.
- Pushed the initial repository structure as commit `06d768f`.
- Verified the landing-to-dashboard flow in a browser at `http://localhost:3000`.
- Installed `@supabase/supabase-js` and `zod`; npm reported zero vulnerabilities.
- Fixed dashboard KPI label: `ARTICLES / 7D` now tracks the selected window (7D/14D/30D).
- Fixed hardcoded dashboard date header: now computes the current date in `Asia/Kolkata` at render time.
- Added GDELT DOC 2.0 retry logic: exponential backoff with 6s minimum interval, up to 3 retries, honouring `Retry-After`.
- Switched primary ingestion source from GDELT DOC 2.0 API to **Google BigQuery** (`gdelt-bq.gdeltv2.gkg` public table) due to ongoing GDELT infrastructure changes making the DOC 2.0 API unreliable.
- Installed `@google-cloud/bigquery@^7`.
- Added `fetchGdeltArticlesBigQuery()` in `lib/gdelt.ts`: queries GKG v2 partitioned by last 24 hours, filters by disease themes and Mumbai/India location, normalizes rows to `NormalizedArticle`.
- Added `GOOGLE_CLOUD_PROJECT` to `lib/env.ts` schema and both `.env` / `.env.example`.
- Updated `app/api/ingest/route.ts` to route by `?source=` param: default (no param) → BigQuery, `?source=doc2` → legacy DOC 2.0 API, `?source=fixture` → local fixture. Response `source` field reflects actual path used.
- Updated `library.md` with `@google-cloud/bigquery` entry.

## Bugs and Blockers

- No known application code defects; the map uses a retro coordinate grid and only plots recognized locality coordinates.
- Browser animation smoke test was not rerun after this motion pass; static validation is green.
- Asset integration build command was skipped; editor diagnostics report no errors in the new Earth, sprite, or global CSS files.
- The production build emits a non-blocking Turbopack workspace-root warning because npm detects a lockfile in the parent user directory.
- Supabase health, fixture ingestion, persistence, and dashboard reads have been verified manually.
- GDELT DOC 2.0 API is currently rate-limiting (429) due to an ongoing infrastructure change on GDELT's side; the BigQuery path is now the primary data source.
- Python data-science tests now pass with 4/4 cases; source compilation and notebook JSON validation also pass.
- GitHub Actions automation requires repository secrets `APP_URL` and `CRON_SECRET` before enabling scheduled runs.
- Recharts and map controls are implemented; the map remains intentionally empty for articles without recognized locality text.
- Existing Supabase projects must apply `202609150002_generalize_disease_values.sql` before ingesting additional diseases.
- BigQuery path uses Application Default Credentials locally (`gcloud auth application-default login`); deployment will require a service account key or Workload Identity when moving off sandbox.

## Remaining Work

1. Test live BigQuery ingestion: call `POST /api/ingest` (no query param) and confirm articles land in Supabase and appear on the dashboard.
2. Replace the retro map grid with a real Mumbai Leaflet/OpenStreetMap layer when geographic data requirements are approved.
3. Add API/integration tests for authorization, ingestion idempotency, GDELT payloads, anomalies, and query filters.
4. Compare TypeScript and Python anomaly outputs on a shared multi-day fixture.
5. Add Python model-comparison notebooks after enough historical data is available.
6. Configure GitHub Actions secrets `APP_URL` and `CRON_SECRET`, then manually run the workflow.
7. Deploy the application and enable scheduled ingestion.
8. Rotate the exposed Supabase service-role key and cron secret before deployment.
9. When upgrading from BigQuery sandbox to a standard GCP project, create a service account key and add it to the deployment environment as `GOOGLE_APPLICATION_CREDENTIALS`.

## Session Handoff Notes

The root state files are now the only project artifacts besides the license. Future agents must read `context.md` before changing architecture or data contracts and append an accurate update to this file at the end of each session.

The Next.js scaffold and hybrid folder structure are now the repository baseline. Keep `library.md` synchronized with every npm dependency change.

Use `project-plan.md` for team assignment and sequencing. The first concrete milestone is the contract-lock session followed by a fixture-to-dashboard vertical slice.

The frontend baseline is ready for API integration: `/` is the retro terminal entry screen and `/dashboard` is the first monitoring surface.

The motion baseline is implemented in shared CSS plus `components/ui/MatrixRain.tsx` and `components/ui/TelemetryStream.tsx`. Keep effects stepped and lightweight as interactive data modules are added.

Landing artwork is implemented with `components/ui/RetroEarth.tsx`, `components/ui/VirusSprites.tsx`, `public/earth.png`, and `public/virus_sprites.png`. Editor diagnostics pass after the latest positioning change; the requested lint/build command was skipped. The Earth sheet is measured as 456x547 and treated as a 5x6 atlas; the virus sheet is measured as 301x830 and uses three 7-frame idle rows plus second-row hit animations.

Backend setup now includes the first vertical slice. The next checkpoint is external verification: apply the migration, call health, run fixture ingestion, and confirm the dashboard reads persisted data.