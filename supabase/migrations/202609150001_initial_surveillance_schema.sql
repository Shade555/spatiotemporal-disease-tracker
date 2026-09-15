create extension if not exists pgcrypto;

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
  location text not null default 'Mumbai' check (location = 'Mumbai'),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  disease text not null check (char_length(trim(disease)) > 0),
  entity_type text not null check (entity_type in ('symptom', 'location', 'epidemiological_term')),
  normalized_value text not null,
  source_text text,
  confidence numeric(4,3) not null default 1.000 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (article_id, disease, entity_type, normalized_value)
);

create table public.daily_metrics (
  metric_date date not null,
  location text not null default 'Mumbai' check (location = 'Mumbai'),
  disease text not null check (char_length(trim(disease)) > 0),
  article_count integer not null default 0 check (article_count >= 0),
  symptom_count integer not null default 0 check (symptom_count >= 0),
  unique_source_count integer not null default 0 check (unique_source_count >= 0),
  rolling_mean numeric,
  rolling_stddev numeric,
  anomaly_score numeric,
  is_anomaly boolean not null default false,
  forecast_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (metric_date, location, disease)
);

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

create index articles_published_at_idx on public.articles (published_at desc);
create index articles_location_published_at_idx on public.articles (location, published_at desc);
create index extracted_entities_disease_value_idx on public.extracted_entities (disease, normalized_value);
create index daily_metrics_location_disease_date_idx on public.daily_metrics (location, disease, metric_date desc);

alter table public.articles enable row level security;
alter table public.extracted_entities enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.pipeline_runs enable row level security;

create policy "public can read articles"
  on public.articles for select
  using (true);

create policy "public can read extracted entities"
  on public.extracted_entities for select
  using (true);

create policy "public can read daily metrics"
  on public.daily_metrics for select
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger daily_metrics_set_updated_at
  before update on public.daily_metrics
  for each row execute function public.set_updated_at();
