# Spatiotemporal Epidemic Tracking and Early Warning System

Status: Authoritative project specification
Last initialized: 2026-09-08

This file is the source of truth for the project. Changes to architecture, data contracts, schema, or pipeline behavior must be reflected here before implementation proceeds.

## 1. Project Goal

Build a real-time public health monitor for early signals of configured infectious diseases in the Mumbai region. Dengue and Malaria are the initial examples; the data model, ingestion query, NLP extraction, metrics API, and dashboard must support adding other diseases through configuration without a schema rewrite.

The system is an early-warning research tool, not a clinical diagnostic system. News-derived signals must be labeled as indicative and must not be presented as confirmed case counts.

## 2. Hybrid Repository Structure

```text
spatiotemporal-disease-tracker/
|-- app/                              # Next.js App Router
|   |-- api/
|   |   |-- ingest/route.ts           # Protected GDELT ingestion endpoint
|   |   |-- metrics/route.ts           # Dashboard time-series API
|   |   |-- articles/route.ts          # Article and entity API
|   |   `-- health/route.ts            # Runtime and database health check
|   |-- dashboard/page.tsx             # Main monitoring dashboard
|   |-- layout.tsx
|   `-- page.tsx
|-- components/                       # Reusable React dashboard components
|   |-- charts/                        # Recharts visualizations
|   |-- maps/                          # React-Leaflet map components
|   |-- dashboard/                     # KPI, alert, filter, and article components
|   `-- ui/                            # Small shared UI primitives
|-- lib/
|   |-- gdelt.ts                       # GDELT client and query construction
|   |-- supabase.ts                    # Browser/server Supabase clients
|   |-- metrics.ts                     # Aggregation and anomaly helpers
|   |-- validation.ts                  # Zod/API input validation
|   `-- types.ts                       # Shared TypeScript contracts
|-- public/                            # Static assets and map resources
|-- supabase/
|   |-- migrations/                    # Versioned SQL migrations
|   `-- seed.sql                       # Optional local development seed data
|-- python/
|   |-- notebooks/
|   |   |-- 01_data_exploration.ipynb
|   |   |-- 02_temporal_anomaly_detection.ipynb
|   |   `-- 03_rule_based_nlp.ipynb
|   |-- src/
|   |   |-- nlp/                       # Symptom and epidemiological entity extraction
|   |   |-- modeling/                  # ARIMA and anomaly detection experiments
|   |   `-- data/                      # Dataset loading and export helpers
|   |-- tests/
|   `-- requirements.txt
|-- .github/workflows/daily-ingestion.yml
|-- .env.example
|-- context.md
|-- progress.md
|-- next.config.ts
|-- package.json
|-- postcss.config.mjs
|-- tailwind.config.ts
|-- tsconfig.json
`-- README.md
```

The Next.js application owns production ingestion, persistence, API contracts, and visualization. Python owns exploratory analysis and reproducible data-science experiments. Shared production data is exchanged through Supabase tables or explicitly versioned exports; Python must not write directly to production without a documented job contract.

## 3. Technology Stack

### Web and API

- Next.js with App Router and TypeScript.
- Serverless route handlers for ingestion and read APIs.
- Tailwind CSS for responsive styling.
- Recharts for daily time-series charts and anomaly overlays.
- React-Leaflet with OpenStreetMap-compatible tiles for geographic visualization.
- Zod for validating external and API payloads.

### Data and infrastructure

- GDELT DOC 2.0 API as the news source.
- Supabase PostgreSQL for articles, extracted entities, daily metrics, alerts, and pipeline audit records.
- GitHub Actions or Vercel Cron for one daily ingestion run.
- Environment variables for all credentials and deployment-specific configuration.

### Data science

- Python 3 with pandas, NumPy, statsmodels, scikit-learn, and NLTK or a similarly lightweight NLP toolkit.
- Jupyter notebooks for exploration and model evaluation.
- Rule-based NLP initially, with explicit dictionaries and normalization rules for reproducibility.
- ARIMA or a comparable seasonal time-series method for experimentation. Production alerting begins with a transparent rolling baseline and z-score; model-based forecasts are advisory until validated.

## 4. GDELT Ingestion Contract

### Request

Use the GDELT DOC 2.0 endpoint:

```text
https://api.gdeltproject.org/api/v2/doc/doc
```

Each daily request must use:

- `format=json`
- `mode=artlist`
- `maxrecords=250` (or a configured lower value)
- `timespan=1d`
- `sort=datedesc`
- A query restricted to the Mumbai region and the configured disease list, initially encoded as `Mumbai (Dengue OR Malaria)`.

The query builder must keep `Mumbai` mandatory and must reject requests that do not include the configured location token. The initial `.env` list is `Dengue,Malaria`, but any non-empty comma-separated disease list is valid. Adding diseases requires configuration and test/fixture coverage, not a database schema rewrite.

### Normalization

For every returned article:

1. Validate the JSON response and tolerate missing optional fields.
2. Normalize the URL and use it as the idempotency key where available.
3. Parse the publication timestamp into UTC.
4. Store title, URL, domain, language, source country, publication time, query, and the available snippet or summary.
5. Run rule-based extraction on searchable text from title and snippet.
6. Upsert the article, then upsert its extracted entities.
7. Recompute or upsert the affected daily disease metrics.
8. Record counts, duration, query, and any error in `pipeline_runs`.

The ingestion endpoint must be authenticated with `CRON_SECRET`, rate-limit or serialize concurrent runs, and return a structured summary. A repeated request for the same day must be safe and idempotent.

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/ingest` | POST | Fetch, normalize, extract, persist, and summarize one daily batch. Protected. |
| `/api/metrics` | GET | Return filtered daily metrics and anomaly fields for a date range and disease. |
| `/api/articles` | GET | Return paginated article metadata and extracted entities. |
| `/api/health` | GET | Report application and Supabase connectivity. |

## 5. Supabase Database Schema

The following is the initial logical schema. Implement it through versioned migrations in `supabase/migrations/`.

### `articles`

```sql
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null,
  snippet text,
  source_domain text,
  source_country text,
  language text,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now(),
  query text not null,
  location text not null default 'Mumbai',
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `extracted_entities`

```sql
create table public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  disease text not null check (char_length(trim(disease)) > 0),
  entity_type text not null check (entity_type in ('symptom', 'location', 'epidemiological_term')),
  normalized_value text not null,
  source_text text,
  confidence numeric(4,3) not null default 1.000,
  created_at timestamptz not null default now(),
  unique (article_id, disease, entity_type, normalized_value)
);
```

### `daily_metrics`

```sql
create table public.daily_metrics (
  metric_date date not null,
  location text not null default 'Mumbai',
  disease text not null check (char_length(trim(disease)) > 0),
  article_count integer not null default 0,
  symptom_count integer not null default 0,
  unique_source_count integer not null default 0,
  rolling_mean numeric,
  rolling_stddev numeric,
  anomaly_score numeric,
  is_anomaly boolean not null default false,
  forecast_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (metric_date, location, disease)
);
```

### `pipeline_runs`

```sql
create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  query text not null,
  articles_seen integer not null default 0,
  articles_inserted integer not null default 0,
  entities_extracted integer not null default 0,
  error_message text,
  metadata jsonb
);
```

Required indexes: `articles(published_at desc)`, `articles(location, published_at desc)`, `extracted_entities(disease, normalized_value)`, and `daily_metrics(location, disease, metric_date desc)`. Enable Row Level Security and expose only read access to public dashboard data; ingestion writes use a server-only Supabase service role.

## 6. NLP and Alerting Rules

The first NLP version is deterministic and versioned. Normalize case, punctuation, and whitespace before matching. Maintain disease aliases and symptom dictionaries for fever, high fever, headache, muscle pain, joint pain, rash, nausea, vomiting, chills, and fatigue. Store the canonical term and matched source text.

The production anomaly baseline uses a configurable rolling window, default seven days, and only prior observations. Compute:

```text
anomaly_score = (article_count - rolling_mean) / rolling_stddev
```

When standard deviation is zero, leave `anomaly_score` null and mark `is_anomaly` false rather than emitting infinity. The default minimum history is three prior observations and the default alert threshold is a z-score of 2. The UI must display the date, disease, observed volume, baseline, score, and an explicit non-clinical warning.

## 7. Security, Reliability, and Ethics

- Never commit Supabase keys, cron secrets, or raw credentials.
- Validate all external data before persistence.
- Keep ingestion idempotent and log failures without exposing secrets.
- Use UTC internally and render the Mumbai timezone (`Asia/Kolkata`) in the dashboard.
- Respect GDELT availability and avoid excessive request frequency.
- Clearly distinguish article mentions, model signals, and confirmed epidemiological reports.
- Add tests for query restriction, deduplication, date normalization, NLP matching, anomaly edge cases, and API authorization.

## 8. Definition of Done for the First Milestone

The repository has a runnable Next.js application, a Supabase migration for the schema above, a protected ingestion route that can persist a mocked GDELT response, a metrics API, one dashboard chart, a Python notebook with exploratory metrics, and automated tests for the ingestion and anomaly-critical paths.