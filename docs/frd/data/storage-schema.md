# FRD Data: Storage Schema (PostgreSQL)

## 테이블 목록

- `stg_events_raw`
- `dim_brand`
- `dim_location`
- `fact_establishment_event`
- `agg_monthly_brand_metric`
- `ops_ingestion_run`
- `ops_data_quality_issue`

## SQL 초안

```sql
create table if not exists dim_brand (
  brand_id bigserial primary key,
  brand_name text not null,
  brand_name_normalized text not null,
  industry_major text,
  industry_minor text,
  is_franchise boolean default true,
  source_priority text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ux_dim_brand_name_norm
  on dim_brand (brand_name_normalized);

create table if not exists fact_establishment_event (
  event_id bigserial primary key,
  source_system text not null,
  source_record_id text not null,
  event_date date not null,
  event_month char(7) not null,
  event_type text not null,
  brand_id bigint references dim_brand(brand_id),
  business_name_raw text,
  industry_major text,
  industry_minor text,
  sido text,
  sigungu text,
  status_code_raw text,
  status_label_raw text,
  updated_at_source timestamptz,
  ingested_at timestamptz default now(),
  match_confidence numeric(4,3),
  unique (source_system, source_record_id, updated_at_source)
);

create index if not exists ix_fact_event_month_type
  on fact_establishment_event (event_month, event_type);

create index if not exists ix_fact_brand_month
  on fact_establishment_event (brand_id, event_month);

create table if not exists agg_monthly_brand_metric (
  metric_month char(7) not null,
  brand_id bigint not null references dim_brand(brand_id),
  open_count integer not null default 0,
  close_count integer not null default 0,
  net_change integer not null default 0,
  open_count_3m integer not null default 0,
  close_count_3m integer not null default 0,
  net_change_3m integer not null default 0,
  open_count_6m integer not null default 0,
  close_count_6m integer not null default 0,
  net_change_6m integer not null default 0,
  open_count_12m integer not null default 0,
  close_count_12m integer not null default 0,
  net_change_12m integer not null default 0,
  latest_event_date date,
  primary key (metric_month, brand_id)
);

create table if not exists dim_location (
  location_id bigserial primary key,
  sido text,
  sigungu text,
  dong text,
  address_raw text,
  lat numeric(12,8),
  lng numeric(12,8),
  unique (sido, sigungu, dong, address_raw)
);

create table if not exists stg_events_raw (
  stg_id bigserial primary key,
  source_system text not null,
  source_record_id text,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  parse_status text not null default 'pending'
);

create table if not exists ops_ingestion_run (
  run_id bigserial primary key,
  source_system text not null,
  run_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null,
  rows_fetched integer default 0,
  rows_upserted integer default 0,
  error_message text
);

create table if not exists ops_data_quality_issue (
  issue_id bigserial primary key,
  source_system text not null,
  source_record_id text,
  issue_type text not null,
  issue_detail text,
  payload jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);
```
