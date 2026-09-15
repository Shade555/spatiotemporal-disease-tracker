alter table public.extracted_entities
  drop constraint if exists extracted_entities_disease_check;

alter table public.daily_metrics
  drop constraint if exists daily_metrics_disease_check;

alter table public.extracted_entities
  add constraint extracted_entities_disease_nonempty
  check (char_length(trim(disease)) > 0);

alter table public.daily_metrics
  add constraint daily_metrics_disease_nonempty
  check (char_length(trim(disease)) > 0);