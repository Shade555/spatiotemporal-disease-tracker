# Project Execution Plan

## 1. Mission

Build a research-grade web application that detects early news-derived signals for configured infectious diseases in Mumbai. Dengue and Malaria are the initial examples, but the application will fetch GDELT articles, extract epidemiological terms and symptoms, aggregate daily metrics, flag unusual activity, and present the evidence in a public-health dashboard for any configured disease list.

This is an early-warning research system. It does not report confirmed case counts, diagnose patients, or replace official public-health surveillance.

This plan is the execution companion to `context.md`. `context.md` defines the system contract; this file defines how the team will deliver it.

## 2. Team Split

Use the real names in the assignment sheet, but keep these ownership boundaries.

### Member 1: Platform and Backend Lead

Owns the production application foundation and data pipeline.

- Next.js route handlers and server-side code.
- GDELT client, Mumbai query guard, normalization, retries, and deduplication.
- Supabase migrations, indexes, RLS, seed data, and typed database access.
- `/api/ingest`, `/api/health`, `/api/metrics`, and `/api/articles`.
- Cron/GitHub Actions automation.
- Secrets, environment variables, error handling, and integration tests.

Primary folders: `app/api/`, `lib/`, `supabase/`, `.github/workflows/`, `.env.example`.

### Member 2: Data Science and NLP Lead

Owns the analytical method and reproducible Python work.

- GDELT fixture preparation and data-quality checks.
- Rule-based disease, symptom, location, and epidemiological-term extraction.
- Daily aggregation and anomaly baseline.
- ARIMA or another forecasting experiment, with evaluation against the baseline.
- Notebooks, Python modules, test data, metrics interpretation, and limitations.
- Research methodology, charts for the report, and model evaluation tables.

Primary folders: `python/`, plus documented contracts in `context.md`.

### Member 3: Frontend and Visualization Lead

Owns the user-facing monitoring experience.

- Dashboard information architecture and responsive layout.
- KPI cards, date range and disease filters, alert presentation, and article list.
- Recharts time-series visualizations.
- React-Leaflet Mumbai map and valid coordinate handling.
- Loading, empty, error, mobile, and accessibility states.
- Frontend smoke tests and screenshots for the project report.

Primary folders: `app/dashboard/`, `components/`, `public/`, and frontend types in `lib/types.ts`.

### Integration Owner: Shared Responsibility

The person acting as project lead does not own every file. They own integration quality.

- Keep `context.md`, `project-plan.md`, `progress.md`, and `library.md` current.
- Review pull requests for contract changes.
- Resolve merge conflicts and approve cross-workstream changes.
- Run the full validation checklist before demonstrations.
- Maintain the final report, presentation, and demo script.

Rotate this role if the group wants equal leadership practice.

## 3. Non-Negotiable Shared Contracts

These must be agreed before parallel implementation begins.

### Disease values

Disease values are non-empty configured strings. The initial examples are `Dengue` and `Malaria`; preserve the configured spelling in database rows and API responses.

### Location

The initial location is exactly `Mumbai`. Internal timestamps use UTC; display timestamps use `Asia/Kolkata`.

### Article identity

`articles.url` is the deduplication key. Re-running ingestion for the same article must not create a second article.

### Metric identity

A daily metric is uniquely identified by `(metric_date, location, disease)`.

### Metric response shape

The metrics API should return objects equivalent to:

```ts
{
  metricDate: string;
  location: "Mumbai";
  disease: "Dengue" | "Malaria";
  articleCount: number;
  symptomCount: number;
  uniqueSourceCount: number;
  rollingMean: number | null;
  rollingStddev: number | null;
  anomalyScore: number | null;
  isAnomaly: boolean;
  forecastValue: number | null;
}
```

### Alert language

Use terms such as `news signal`, `unusual activity`, and `article volume`. Never label a news-derived anomaly as a confirmed outbreak.

### Dependency tracking

Every npm installation must update `library.md`. Every Python package must be pinned or documented in `python/requirements.txt`.

## 4. Delivery Phases

### Phase 0: Agreement and environment, Day 1

Owner: all members; integration owner coordinates.

- Read `context.md` and this plan.
- Install Node.js/npm and confirm `npm run lint` and `npm run build` work.
- Create local `.env` from `.env.example` without committing it.
- Decide whether daily automation will use GitHub Actions or Vercel Cron.
- Create a shared Supabase project or agree on a local development strategy.
- Add team names, roles, and the chosen automation method to the project documentation.

Exit criteria:

- Every member can clone the repository and run the app locally.
- No secrets are in Git.
- All three members understand the shared contracts.

### Phase 1: Database and fixtures, Days 2-3

Owners: Member 1 and Member 2.

Member 1:

- Add the initial migration for `articles`, `extracted_entities`, `daily_metrics`, and `pipeline_runs`.
- Add required indexes, constraints, timestamps, and RLS policies.
- Add deterministic seed data for local development.
- Add typed database models or a shared TypeScript type file.

Member 2:

- Create a small sanitized GDELT response fixture.
- Document expected missing-field and duplicate behavior.
- Create expected entity-extraction outputs for representative snippets.
- Define the anomaly calculation examples, including zero standard deviation.

Member 3, in parallel:

- Produce a low-fidelity dashboard wireframe.
- Define the chart, alert, article, and map states using mocked metric data.

Exit criteria:

- Migration applies to the target Supabase project.
- Fixtures are committed and contain no credentials.
- The frontend can render mocked API-shaped data.
- Schema and response contracts are reviewed by all members.

### Phase 2: Ingestion and analytical pipeline, Days 4-7

Owners: Member 1 and Member 2.

Member 1:

- Implement a typed GDELT query builder that always includes Mumbai.
- Implement response validation and article normalization.
- Implement URL-based upsert behavior.
- Implement protected `POST /api/ingest` using `CRON_SECRET`.
- Record every run in `pipeline_runs`.
- Add `/api/health`.

Member 2:

- Implement normalization and rule-based extraction in Python.
- Define disease aliases, symptom dictionary, and canonical values.
- Implement daily aggregation and rolling anomaly score.
- Compare the transparent rolling baseline with an ARIMA experiment.
- Export a small expected metrics dataset for frontend development.

Coordination rule:

The production route may initially use a TypeScript implementation of the agreed rules. Python remains the research and validation implementation until a deliberate production integration decision is made. Do not silently create two different definitions of an anomaly.

Exit criteria:

- A mocked GDELT response can travel through validation, extraction, upsert, and metric aggregation.
- Repeating the same fixture is idempotent.
- Unauthorized ingestion requests fail.
- Python tests cover representative disease and symptom phrases.
- Anomaly outputs match documented examples.

### Phase 3: Read APIs and dashboard, Days 8-12

Owners: Member 1 and Member 3.

Member 1:

- Implement `GET /api/metrics` with disease, date range, and location filters.
- Implement paginated `GET /api/articles` with optional disease/entity filters.
- Return stable error shapes and validate query parameters.
- Add API tests using seeded or mocked data.

Member 3:

- Implement `/dashboard` as the first real application screen.
- Add summary KPIs: article volume, active signals, latest date, and source count.
- Add time-series chart with observed volume, baseline, and anomaly points.
- Add disease and date controls.
- Add article evidence list with source, timestamp, disease, and extracted terms.
- Add the Mumbai map with only validated coordinates and a clear no-coordinate state.
- Add responsive, loading, empty, error, and accessibility states.

Exit criteria:

- Dashboard works with mocked data before the live database is connected.
- Dashboard works with live API responses after integration.
- A user can filter any configured disease and inspect the evidence behind a signal.
- No chart or map claims that news volume equals confirmed cases.

### Phase 4: Automation and hardening, Days 13-15

Owner: Member 1; all members test their surfaces.

- Add the chosen daily GitHub Actions workflow or Vercel Cron configuration.
- Protect secrets through repository/deployment secret settings.
- Add retry and timeout behavior for GDELT.
- Prevent concurrent ingestion runs or document the locking strategy.
- Add structured logs and useful failure records.
- Add rate-limit awareness and a manual dry-run mode if appropriate.
- Run a full end-to-end path against fixture data.

Exit criteria:

- A scheduled run can be observed and audited.
- Failed runs do not corrupt metrics.
- Credentials are absent from logs and repository history.
- The app remains usable when the external API or database is unavailable.

### Phase 5: Research validation and presentation, Days 16-20

Owners: Member 2 for analysis; Member 3 for visuals; Member 1 for deployment; all members for review.

- Evaluate precision of rule-based extraction on a labeled sample.
- Explain false positives from ambiguous news language.
- Compare rolling baseline and ARIMA outputs using a time-based split.
- Document data limitations, GDELT coverage, reporting bias, and lack of clinical confirmation.
- Capture dashboard screenshots and a short demo flow.
- Write methodology, architecture, schema, results, limitations, and future work.
- Rehearse a five-minute demo and a question set for the viva.

Exit criteria:

- Results are reproducible from committed fixtures or documented exports.
- The report separates implementation facts from research findings.
- The demo can be completed without manually editing database rows.

## 5. Dependency Graph

```text
Shared contracts
      |
      +--> Supabase migration ----------+
      |                                 |
      +--> GDELT fixture --> ingestion  +--> read APIs --> dashboard
      |                 \-> Python NLP -+                 |
      |                                                  map/charts
      +--> wireframe and mock response ------------------+

Python evaluation and report writing can proceed in parallel after the fixture and metric contract exist.
Automation depends on a tested ingestion route.
Deployment depends on the dashboard, environment variables, and a successful production build.
```

## 6. Git and Collaboration Rules

### Branches

Use one branch per focused task:

- `feat/backend-ingestion`
- `feat/database-schema`
- `feat/python-nlp`
- `feat/anomaly-model`
- `feat/dashboard`
- `feat/map-visualization`
- `chore/automation`
- `docs/research-methodology`

Do not work directly on `main` except for emergency documentation fixes.

### Pull requests

Every pull request must include:

- What changed and why.
- Which plan phase and acceptance criteria it addresses.
- How it was tested.
- Screenshots for frontend changes.
- Any API, schema, environment, or dependency change.
- Updates to `context.md`, `progress.md`, or `library.md` when applicable.

At least one other member reviews every pull request. Contract changes require review from the integration owner and the affected workstream owner.

### Commit style

Use focused commits such as:

- `feat(db): add initial surveillance schema`
- `feat(ingest): normalize GDELT article results`
- `feat(ui): add disease volume chart`
- `test(nlp): cover symptom extraction aliases`
- `docs: record anomaly evaluation method`

Avoid mixing formatting changes, dependency upgrades, and feature logic in one commit.

## 7. Testing Strategy

### Backend tests

- Mumbai is mandatory in generated GDELT queries.
- Invalid external payloads are rejected safely.
- Duplicate URLs are idempotent.
- Missing optional GDELT fields do not crash ingestion.
- Cron authorization is enforced.
- API filters reject invalid dates and diseases.
- Database failures produce stable errors and pipeline records.

### Python tests

- Disease aliases normalize to canonical disease values.
- Symptoms are extracted without case sensitivity.
- Overlapping terms do not create duplicate entities.
- Empty and malformed text are safe.
- Rolling statistics handle insufficient history and zero variance.
- Model evaluation uses time order and avoids future leakage.

### Frontend checks

- Dashboard renders loading, empty, error, and populated states.
- Dengue and Malaria filters change the data request.
- Anomaly markers show evidence and warning language.
- Mobile layout has no horizontal overflow.
- Map handles articles without coordinates.
- Important controls are keyboard reachable and have accessible labels.

### Release checks

```text
npm run lint
npm run build
Python test command from the active environment
Migration verification against the shared Supabase project
Manual dashboard smoke test
```

## 8. Risks and Mitigations

| Risk | Mitigation | Owner |
|---|---|---|
| News mentions are not confirmed cases | Use explicit UI/report wording and a research disclaimer | All |
| GDELT fields vary or are missing | Validate optional fields and keep fixtures for edge cases | Member 1 |
| Duplicate articles inflate metrics | Upsert by URL and test repeated ingestion | Member 1 |
| Rule-based NLP produces false positives | Keep matched source text, evaluate a labeled sample, document limitations | Member 2 |
| Forecasting leaks future information | Use time-based splits and rolling features only | Member 2 |
| Frontend and API drift | Review the shared response shape before merging | Member 3 + integration owner |
| Secrets reach Git | `.env` ignored, `.env.example` only has names, review logs | Member 1 |
| Scope expands beyond a semester | Freeze Mumbai and news signals for v1, while keeping disease names configuration-driven | All |

## 9. Version 1 Definition of Done

The project is ready for demonstration when:

- A fresh clone can install dependencies and run the Next.js app.
- A documented fixture can be ingested safely and repeatedly.
- Supabase stores articles, entities, daily metrics, and pipeline audit records.
- Dashboard users can filter and inspect configured disease news signals for Mumbai.
- The chart displays volume, baseline, and anomaly evidence.
- The map handles available location data without inventing coordinates.
- Python notebooks reproduce the extraction and anomaly methodology.
- The scheduled workflow is configured or explicitly demonstrated manually.
- Lint, build, tests, and the manual smoke test pass.
- The report states limitations and does not present article volume as official case data.

## 10. First Three Work Sessions

### Session 1: Contract lock

- Team reads this plan and `context.md`.
- Assign names to Member 1, Member 2, and Member 3.
- Agree on Supabase project access and automation choice.
- Member 3 drafts the dashboard wireframe.
- Member 2 prepares the first fixture and expected extraction table.
- Member 1 drafts the migration and shared TypeScript types.

### Session 2: Vertical slice

- Member 1 connects the migration and fixture ingestion.
- Member 2 implements the first extraction and anomaly functions.
- Member 3 renders the chart and article list from static mock data.
- All members review the exact metric response shape.

### Session 3: First integration demo

- Ingest the fixture through `/api/ingest`.
- Read metrics through `/api/metrics`.
- Render those metrics in `/dashboard`.
- Show one normal day, one anomalous day, and one empty state.
- Record issues in `progress.md` and assign the next tasks.
