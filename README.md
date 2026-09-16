# MUMBAI // SIGNAL WATCH

```text
  __  __ _   _ __  __ ____    _    ___
+ |  \/  | | | |  \/  | __ )  / \  |_ _|
  | |\/| | | | | |\/| |  _ \ / _ \  | |
  | |  | | |_| | |  | | |_) / ___ \ | |
  |_|  |_|\___/|_|  |_|____/_/   \_\___|

  SPATIOTEMPORAL EPIDEMIC TRACKING + EARLY WARNING SYSTEM
  REGION: MUMBAI        SIGNAL TYPE: NEWS-DERIVED        STATUS: RESEARCH BUILD
```

> A retro-tech public-health monitor for detecting unusual infectious-disease news activity in Mumbai.

This project is a Sem VII Data Science Honours research system. It collects public news metadata from **NewsAPI**, extracts configurable disease and symptom signals, aggregates daily activity, detects unusual volume using a transparent rolling baseline, and presents the evidence through a CRT-style dashboard.

**Data sources (in order of preference):**
1. **NewsAPI** (primary) — free tier, 100 requests/day, no quota issues
2. **GDELT DOC 2.0 API** (fallback) — rate-limited to 1 req/5sec, currently unreliable
3. **Google BigQuery GKG** (reference only) — sandbox quota exhausted, not viable without paid GCP project

**Important research boundary:** this system detects news signals. It does not produce confirmed case counts, diagnose patients, or replace official epidemiological surveillance.

## Current Status

```text
[ONLINE] Next.js application with real Leaflet map
[ONLINE] Supabase persistence with live ingestion
[ONLINE] Dynamic disease detection from article entities
[ONLINE] NewsAPI as primary data source (100 req/day, no quota issues)
[ONLINE] Telemetry card showing live ingestion status logs
[ONLINE] Python NLP and anomaly-analysis layer (research, not in pipeline)
[ONLINE] Dashboard with disease filtering, chart modes, alerts
[READY ] GitHub Actions workflow (awaiting Vercel deployment URL)
[DEFER ] GDELT DOC 2.0 API (rate-limited, kept as fallback)
[DEFER ] BigQuery GKG (quota-exhausted sandbox, reference only)
```

The ingestion pipeline with three paths:

```text
Primary (NewsAPI)
    NewsAPI: disease + health keywords in Mumbai/India
        |
        v
POST /api/ingest   (or auto-triggered by GitHub Actions daily)
        |
        v
Supabase: articles -> extracted_entities -> daily_metrics -> pipeline_runs
        |
        +--> GET /api/metrics
        +--> GET /api/articles
        +--> GET /api/ingest-status (for telemetry)
        |
        v
Dashboard: live Leaflet map, dynamic disease buttons, filtered articles

Fallback paths
    ?source=doc2 → GDELT DOC 2.0 API (rate-limited)
    ?source=bigquery → BigQuery GKG (sandbox quota exhausted)
    ?source=fixture → Local test fixture
```

## What The System Does

1. Builds a GDELT query that always includes `Mumbai` and the configured disease list.
2. Queries the GDELT GKG v2 BigQuery table (`gdelt-bq.gdeltv2.gkg`), filtering by disease themes and Mumbai/India location mentions from the last 24 hours.
3. Validates and normalizes each row into a common article shape.
4. Uses the article URL as the idempotency key — re-running ingestion for the same articles is safe.
5. Extracts disease, symptom, location, and epidemiological entities using rule-based NLP.
6. Upserts articles and entities into Supabase.
7. Aggregates daily article volume, symptom count, and source count by disease.
8. Calculates a prior-only rolling baseline and anomaly score.
9. Stores pipeline success/failure audit information in `pipeline_runs`.
10. Serves metrics and evidence through typed API routes.
11. Displays filters, KPI cards, chart modes, alert cards, article evidence, and locality-derived map points.

## Visual Language

The interface deliberately behaves like a public-health command terminal:

- CRT scanlines, phosphor flicker, boot slit, and chromatic startup shake
- Pixel display typography with terminal body text
- Hard-edged windows and mechanical button states
- Animated matrix background
- Pixel-art Earth sprite sheet
- Interactive red, blue, and yellow virus sprites
- Click-to-hit virus pose animation
- Typewriter telemetry stream
- Stepped line, bar, and area chart modes
- Responsive mobile and desktop layouts

The styling is implemented primarily in [app/globals.css](app/globals.css), with reusable UI modules under [components/ui](components/ui).

## Technology Stack

### Application

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.4 App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS 4 + custom CRT CSS |
| Fonts | `Press Start 2P` and `VT323` through `next/font` |
| Charts | Recharts |
| Map | Leaflet with CartoDB dark tiles (React-Leaflet) |
| Validation | Zod |
| Database client | `@supabase/supabase-js` |
| News API | Native `fetch` (no dependency needed) |
| BigQuery | `@google-cloud/bigquery` (reference, not active) |

### Data source and storage

- **NewsAPI** (primary, free tier, 100 requests/day)
- GDELT DOC 2.0 Article List API (fallback, rate-limited)
- Google BigQuery GKG v2 (reference, quota-exhausted on sandbox)
- Supabase PostgreSQL
- Supabase Row Level Security for public read policies
- Server-only service-role access for ingestion writes
- GitHub Actions for scheduled daily ingestion

### Data science

- Python 3.12+
- pandas
- NumPy
- JupyterLab
- Matplotlib
- Rule-based NLP
- Rolling z-score anomaly detection

All installed npm packages are tracked in [library.md](library.md). Python dependencies are tracked in [python/requirements.txt](python/requirements.txt).

## Repository Layout

```text
spatiotemporal-disease-tracker/
|-- app/
|   |-- api/
|   |   |-- articles/route.ts       # Paginated article evidence API
|   |   |-- health/route.ts         # Configuration + Supabase health check
|   |   |-- ingest/route.ts         # Protected fixture/live ingestion
|   |   `-- metrics/route.ts        # Daily metrics API
|   |-- dashboard/page.tsx          # Dashboard shell
|   |-- globals.css                 # CRT design system and animations
|   |-- layout.tsx                  # Metadata and fonts
|   `-- page.tsx                    # Landing terminal
|-- components/
|   |-- charts/SignalChart.tsx      # Recharts line/bar/area views
|   |-- dashboard/DashboardClient.tsx
|   |-- maps/MumbaiHotspotMap.tsx   # Coordinate-aware map module
|   `-- ui/                         # Matrix, telemetry, sprite modules
|-- fixtures/gdelt/
|   `-- sample-response.json        # Deterministic development input
|-- lib/
|   |-- env.ts                      # Server environment validation
|   |-- gdelt.ts                    # BigQuery + DOC 2.0 fetch, normalization, retry logic
|   |-- geo.ts                      # Recognized Mumbai locality coordinates
|   |-- metrics.ts                  # Aggregation + anomaly calculations
|   |-- supabase.ts                 # Server-only Supabase client
|   |-- types.ts                    # Shared TypeScript contracts
|   `-- validation.ts               # Zod + rule-based extraction
|-- python/
|   |-- notebooks/01_data_exploration.ipynb
|   |-- src/data/gdelt.py
|   |-- src/modeling/anomaly.py
|   |-- src/nlp/extractor.py
|   `-- tests/test_data_science.py
|-- public/
|   |-- earth.png
|   `-- virus_sprites.png
|-- supabase/migrations/
|   |-- 202609150001_initial_surveillance_schema.sql
|   `-- 202609150002_generalize_disease_values.sql
|-- .github/workflows/daily-ingestion.yml
|-- context.md                     # Authoritative architecture contract
|-- project-plan.md                # Team execution plan
|-- progress.md                    # Cross-session handoff state
|-- library.md                     # npm dependency ledger
`-- package.json
```

## Prerequisites

- Node.js compatible with the current Next.js release
- npm
- Python 3.12 or newer recommended
- A Supabase project
- A Google Cloud project (BigQuery Sandbox is sufficient) with the BigQuery API enabled
- Google Cloud CLI (`gcloud`) — for local Application Default Credentials
- A GitHub repository if scheduled ingestion is required

## Local Setup

### 1. Install JavaScript dependencies

```powershell
npm install
```

### 2. Install Python dependencies

```powershell
python -m pip install -r python/requirements.txt
```

### 3. Create local environment variables

Copy [.env.example](.env.example) to `.env` and fill in the values:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key

CRON_SECRET=your-long-random-secret

GDELT_API_URL=https://api.gdeltproject.org/api/v2/doc/doc
GDELT_QUERY_LOCATION=Mumbai
GDELT_QUERY_DISEASES=Dengue,Malaria

GOOGLE_CLOUD_PROJECT=your-gcp-project-id
```

The disease list is configuration-driven. For example:

```dotenv
GDELT_QUERY_DISEASES=Dengue,Malaria,Chikungunya,Typhoid
```

Any non-empty comma-separated disease list is accepted. The database does not require a schema change for new disease names.

### 4. Authenticate with Google Cloud (BigQuery)

The BigQuery client uses Application Default Credentials. Run this once:

```powershell
gcloud auth application-default login
```

This opens a browser for sign-in and saves credentials locally. No key file or extra environment variable is needed for local development.

> **Sandbox note:** BigQuery Sandbox (no billing account) works for local development. It cannot create service account keys, so ADC is the only auth method. When deploying, upgrade to a standard GCP project and add a service account key as `GOOGLE_APPLICATION_CREDENTIALS`.

### 5. Apply Supabase migrations

In Supabase **SQL Editor**, run these files in order:

1. [202609150001_initial_surveillance_schema.sql](supabase/migrations/202609150001_initial_surveillance_schema.sql)
2. [202609150002_generalize_disease_values.sql](supabase/migrations/202609150002_generalize_disease_values.sql)

The first migration creates the tables, indexes, RLS, and timestamp triggers. The second migration removes the original fixed disease constraints for projects that already applied the first migration.

### 6. Start the app

```powershell
npm run dev
```

Open:

- Landing terminal: <http://localhost:3000>
- Dashboard: <http://localhost:3000/dashboard>
- Health API: <http://localhost:3000/api/health>

If port `3000` is occupied, Next.js may use another port. Use the URL printed in the terminal.

## Runtime Verification

### Health check

```powershell
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3000/api/health"
```

Expected result:

```json
{"status":"ok","service":"api","database":"ok"}
```

### Fixture ingestion

Use a second PowerShell terminal while the dev server is running:

```powershell
$cronSecret = (Get-Content .env |
  Where-Object { $_ -match '^CRON_SECRET=' } |
  Select-Object -First 1) -replace '^CRON_SECRET=', ''

$headers = @{ Authorization = "Bearer $cronSecret" }

Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3000/api/ingest?source=fixture" `
  -Method POST `
  -Headers $headers
```

Expected first-run behavior:

```json
{
  "status": "succeeded",
  "source": "fixture",
  "articlesSeen": 2,
  "articlesInserted": 2,
  "entitiesExtracted": 11
}
```

Run the same command again. The second run should remain successful but report:

```json
"articlesInserted": 0
```

That confirms URL-based idempotency.

### Live BigQuery ingestion

The default path — no `source` param — queries BigQuery:

```powershell
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3000/api/ingest" `
  -Method POST `
  -Headers $headers
```

This queries `gdelt-bq.gdeltv2.gkg` for Mumbai Dengue/Malaria articles from the last 24 hours using your Application Default Credentials. A successful response looks like:

```json
{
  "status": "succeeded",
  "source": "bigquery",
  "query": "Mumbai (Dengue OR Malaria)",
  "articlesSeen": 12,
  "articlesInserted": 12,
  "entitiesExtracted": 47
}
```

### Legacy DOC 2.0 fallback (unreliable)

```powershell
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3000/api/ingest?source=doc2" `
  -Method POST `
  -Headers $headers
```

The route uses exponential backoff (6s minimum, up to 3 retries) but GDELT's DOC 2.0 infrastructure is currently unreliable. Use BigQuery or the fixture path instead.

## API Reference

### `GET /api/health`

Checks validated server configuration and reads `pipeline_runs` through Supabase.

### `POST /api/ingest`

Protected route. Requires:

```http
Authorization: Bearer <CRON_SECRET>
```

Source selection via query param:

| `?source=` | Behaviour |
|---|---|
| *(omitted)* | **BigQuery** — queries `gdelt-bq.gdeltv2.gkg` (primary, recommended) |
| `fixture` | Local fixture file — deterministic, no network, for development |
| `doc2` | GDELT DOC 2.0 API — legacy fallback, currently unreliable |

Successful ingestion response:

```json
{
  "status": "succeeded",
  "source": "bigquery",
  "query": "Mumbai (Dengue OR Malaria)",
  "articlesSeen": 12,
  "articlesInserted": 12,
  "entitiesExtracted": 47,
  "startedAt": "2026-09-16T08:00:00.000Z"
}
```

### `GET /api/metrics`

Supported query parameters:

```text
disease=Dengue
from=2026-09-09
to=2026-09-15
location=Mumbai
```

Returns daily metrics in the frontend contract:

```json
{
  "metricDate": "2026-09-15",
  "location": "Mumbai",
  "disease": "Dengue",
  "articleCount": 4,
  "symptomCount": 3,
  "uniqueSourceCount": 2,
  "rollingMean": null,
  "rollingStddev": null,
  "anomalyScore": null,
  "isAnomaly": false,
  "forecastValue": null
}
```

### `GET /api/articles`

Supported query parameters:

```text
page=1
pageSize=20
disease=Dengue
from=2026-09-09
to=2026-09-15
location=Mumbai
```

Returns article metadata, extracted entities, pagination information, and locality-derived coordinates when a recognized Mumbai locality appears in the article text.

## Database Model

### `articles`

Stores normalized article metadata. `url` is unique and is the ingestion idempotency key.

### `extracted_entities`

Stores normalized disease, symptom, location, and epidemiological terms linked to articles. Duplicate entity rows are prevented by a compound unique constraint.

### `daily_metrics`

Stores one row per `(metric_date, location, disease)`. It contains article volume, symptoms, unique sources, rolling statistics, anomaly score, and forecast placeholder.

### `pipeline_runs`

Audits every ingestion attempt as `running`, `succeeded`, or `failed` with counts and safe error metadata.

## NLP and Anomaly Method

The initial NLP layer is intentionally transparent and reproducible.

### Entity extraction

Text is normalized for case and whitespace. Disease names come from `GDELT_QUERY_DISEASES`. The current symptom vocabulary includes:

```text
high fever, fever, headache, muscle pain, joint pain,
rash, nausea, vomiting, chills, fatigue
```

Nested phrases are deduplicated, so `high fever` does not also emit a duplicate `fever` entity for the same match.

### Rolling anomaly score

For each disease, the current day is compared only with previous observations:

```text
rolling_mean = mean(previous up to 7 article counts)
rolling_stddev = population standard deviation(previous counts)
anomaly_score = (current count - rolling_mean) / rolling_stddev
```

Rules:

- At least 3 prior observations are required.
- Anomaly threshold is `score >= 2`.
- Zero standard deviation produces no anomaly instead of infinity.
- An anomaly is a news-volume signal, not an outbreak confirmation.

The TypeScript production path and Python research path are designed to use the same semantics.

## Python Data-Science Workflow

Run the tests:

```powershell
python -m unittest discover -s python\tests -p 'test_*.py' -v
```

Validate syntax:

```powershell
python -m py_compile `
  python\src\nlp\extractor.py `
  python\src\data\gdelt.py `
  python\src\modeling\anomaly.py `
  python\tests\test_data_science.py
```

Notebook:

```text
python/notebooks/01_data_exploration.ipynb
```

The notebook consumes the same committed fixture used by the TypeScript ingestion path. This keeps early research reproducible without depending on live GDELT availability.

## GitHub Actions

The workflow is located at [.github/workflows/daily-ingestion.yml](.github/workflows/daily-ingestion.yml).

It supports:

- Daily scheduled execution at `03:17 UTC`
- Manual execution through `workflow_dispatch`

Configure these repository secrets under **Settings -> Secrets and variables -> Actions**:

```text
APP_URL=https://your-deployed-app.example
CRON_SECRET=your-cron-secret
```

The workflow calls:

```text
POST ${APP_URL}/api/ingest
Authorization: Bearer ${CRON_SECRET}
```

## Quality Checks

Run the web checks:

```powershell
npm run lint
npm run build
```

Run the Python checks:

```powershell
python -m unittest discover -s python\tests -p 'test_*.py' -v
```

Before a milestone is merged, also check:

- `git diff --check`
- Fixture ingestion succeeds twice
- Second fixture run reports zero new article inserts
- API responses contain no secrets
- Dashboard uses explicit research-signal wording
- No `.env` file or service-role key is committed

## Security Notes

- `.env*` files are ignored by Git. Never commit local secrets.
- The Supabase service-role key must only be used server-side.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not a substitute for the service-role key in ingestion.
- Rotate credentials that have been exposed in chat, logs, screenshots, or shell history.
- Do not print authorization headers or raw Supabase keys while debugging.
- GDELT rate limits must be respected; scheduled ingestion should run once per day.

## Collaboration Guide

Read these files before changing architecture:

- [context.md](context.md): authoritative system specification
- [project-plan.md](project-plan.md): three-member work split and delivery phases
- [progress.md](progress.md): current session handoff
- [library.md](library.md): npm dependency ledger

Suggested ownership:

```text
Member 1  Backend, Supabase, GDELT, API routes, automation
Member 2  Python NLP, anomaly modeling, notebooks, research evaluation
Member 3  Dashboard, charts, map, responsive states, presentation visuals
```

Use focused branches and commits:

```text
feat/backend-ingestion
feat/python-nlp
feat/dashboard-controls
test/api-contracts
docs/research-methodology
```

## Known Limitations

- The BigQuery path uses Application Default Credentials locally; deployment requires a service account key (not available on BigQuery Sandbox — upgrade to a standard GCP project for production).
- GKG rows don't carry clean article titles; derived titles use source domain + disease name.
- GDELT DOC 2.0 API is retained as `?source=doc2` but is currently unreliable due to upstream infrastructure changes.
- The current map plots recognized locality coordinates on a retro grid; a full tile-backed geographic map remains future work.
- Article volume is a media signal and is affected by reporting bias, duplicate coverage, and source availability.
- Rule-based NLP can produce false positives and false negatives.
- ARIMA and other model-based forecasts are research work, not production alerts yet.
- Historical backfill and multi-day model validation are still required for meaningful forecasting.

## Roadmap

```text
[DONE]  Scaffold Next.js + Python repository
[DONE]  Supabase schema and fixture ingestion
[DONE]  Configurable disease extraction
[DONE]  Rolling anomaly baseline and alert cards
[DONE]  Dashboard chart modes and controls
[DONE]  GitHub Actions workflow scaffold
[DONE]  BigQuery GDELT GKG ingestion (primary data source)
[DONE]  GDELT DOC 2.0 retry + exponential backoff (kept as fallback)
[NEXT]  Test live BigQuery ingestion end-to-end
[NEXT]  Add API and ingestion integration tests
[NEXT]  Add real geographic map layer
[NEXT]  Compare Python and TypeScript anomaly outputs
[NEXT]  Deploy and enable scheduled ingestion
[NEXT]  Upgrade GCP project for service account key (deployment auth)
[NEXT]  Rotate exposed credentials before deployment
```

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
