# FRD: Franchise Pulse Korea (v1.0)

## 1. Functional Overview

This FRD defines detailed behavior for data ingestion, normalization, ranking, API delivery, and UI presentation for monthly franchise opening/closure Top 100 dashboards.

## 2. Source Inventory

## 2.1 Primary sources

- Public Data Portal (`data.go.kr`): integrated local permit/open data ecosystem
- KFTC franchise APIs (`data.go.kr`): franchise brand metadata and statistics

## 2.2 Transition source

- LOCALDATA (`localdata.go.kr`): legacy integration and migration bridge

## 2.3 Optional supporting sources

- City/provincial open data portals for coverage fallback (when national feed delayed)

## 2.4 Source adapter policy

- Each source is wrapped by an adapter implementing a common interface:
  - `fetchIncremental(startDate, endDate, page)`
  - `fetchSnapshot(snapshotDate)`
  - `mapToCanonical(rawRecord)`
  - `healthCheck()`

## 3. Canonical Domain Model

## 3.1 Core entities

- `EstablishmentEvent`: normalized event record from permit/franchise updates
- `Brand`: canonical franchise brand identity
- `Location`: normalized address and region hierarchy
- `MonthlyBrandMetric`: aggregated monthly metrics used for ranking

## 3.2 Canonical event schema

```text
event_id
source_system                 # localdata | data_go_kr | kftc
source_record_id
event_date                    # yyyy-mm-dd (Asia/Seoul)
event_month                   # yyyy-mm
event_type                    # OPEN | CLOSE | UPDATE | OTHER
business_name_raw
brand_name_raw
brand_id                      # nullable before matching
industry_major
industry_minor
status_code_raw
status_label_raw
permit_date
close_date
address_raw
sido
sigungu
dong
lat
lng
updated_at_source
ingested_at
match_confidence              # 0.0 - 1.0
```

## 4. Business Rules

## 4.1 Event classification

- `OPEN`: first active operation event or status transition to active/open
- `CLOSE`: status transition to closed/canceled/terminated
- `UPDATE`: non-open/close update
- `OTHER`: uncategorized transitions

## 4.2 Monthly bucket logic

- Timezone fixed to `Asia/Seoul`
- Bucket key is `YYYY-MM` using event effective date
- Late-arriving records are re-aggregated for impacted month(s)

## 4.3 Top 100 ranking rules

- Separate rankings per month and metric (`OPEN`, `CLOSE`)
- Primary sort: `count DESC`
- Tie-break 1: `latest_event_date DESC`
- Tie-break 2: `brand_name ASC`

## 4.4 Net metrics

- `net_change = open_count - close_count`
- Rolling metrics: `3m`, `6m`, `12m` windows

## 5. Data Pipeline

## 5.1 Ingestion flows

1) Historical backfill
- Source snapshots/files loaded into staging
- Deduplicate by `source_system + source_record_id + updated_at_source`

2) Daily incremental
- Cron-triggered incremental fetch
- Retry with exponential backoff
- Dead-letter queue for irrecoverable payloads

3) Normalize and match
- Standardize status, region, and category dimensions
- Brand matching with exact + fuzzy strategy

4) Aggregate
- Materialize monthly brand metrics
- Refresh Top 100 views per month and metric

## 5.2 Schedule

- Daily full increment: 02:30 KST
- Secondary recovery run: 05:30 KST
- Manual re-run endpoint for operations

## 6. Storage Design (PostgreSQL)

## 6.1 Table list

- `stg_events_raw`
- `dim_brand`
- `dim_location`
- `fact_establishment_event`
- `agg_monthly_brand_metric`
- `ops_ingestion_run`
- `ops_data_quality_issue`

## 6.2 SQL draft

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
  latest_event_date date,
  primary key (metric_month, brand_id)
);
```

## 7. API Contract (Internal BFF)

Base path: `/api/v1`

## 7.1 GET /rankings

Query params:
- `month=YYYY-MM` (required)
- `metric=open|close` (required)
- `sido` (optional)
- `sigungu` (optional)
- `industryMajor` (optional)
- `q` brand keyword (optional)
- `limit` default 100, max 100

Response:

```json
{
  "month": "2026-02",
  "metric": "open",
  "generatedAt": "2026-03-12T03:30:00+09:00",
  "items": [
    {
      "rank": 1,
      "brandId": 123,
      "brandName": "Example Brand",
      "openCount": 42,
      "closeCount": 8,
      "netChange": 34,
      "latestEventDate": "2026-02-28"
    }
  ]
}
```

## 7.2 GET /brands/:brandId/trends

Query params:
- `from=YYYY-MM` (required)
- `to=YYYY-MM` (required)

Returns monthly open/close/net series.

## 7.3 GET /meta/sources

Returns source health, last sync, and data latency.

## 7.4 POST /ops/rebuild

Protected endpoint for monthly re-aggregation by month range.

## 8. UI Requirements

## 8.1 Pages

- `/` Dashboard (rankings + filters + charts)
- `/brand/[brandId]` Brand detail
- `/about-data` Data sources, logic, caveats

## 8.2 Dashboard components

- Header: month selector + metric toggle (`Open Top 100`, `Close Top 100`)
- Filter row: region, industry, brand search
- Ranking table: sortable columns and CSV download
- Trend panel: selected brand sparkline + 12-month summary
- Data status badge: source freshness and quality

## 8.3 Wireframe (text)

```text
+---------------------------------------------------------------+
| Franchise Pulse Korea                          [Month][Metric]|
+---------------------------------------------------------------+
| Region [v] | Industry [v] | Brand Search [___________] [CSV] |
+---------------------------+-----------------------------------+
| Top 100 Table             | Trend Snapshot                   |
| rank brand open close net | 12-month open/close chart       |
| ...                       | selected brand details          |
+---------------------------+-----------------------------------+
| Data Freshness: 2026-03-12 05:31 KST | Source: data.go.kr     |
+---------------------------------------------------------------+
```

## 9. Vercel Deployment Design

- Framework: Next.js (App Router, TypeScript)
- DB: Supabase Postgres or Neon Postgres
- Scheduler: Vercel Cron + protected ops route
- Secrets: Vercel Environment Variables only
- Caching: ISR + server response cache + DB materialized aggregates

## 10. Security and Compliance

- Never expose source API keys to browser
- Rate-limit internal API endpoints
- Store operational audit logs for pipeline actions
- Respect each source license and attribution requirement

## 11. Observability

- Metrics: ingestion success rate, source latency, row delta, API p95
- Logs: ingestion run logs, parse failures, match confidence distributions
- Alerts: scheduler failures, zero-ingestion anomalies, schema drift

## 12. Acceptance Criteria

- AC-01: For a selected month, open and close Top 100 render under 3 seconds (cache hit).
- AC-02: Daily ingestion job updates rankings and freshness timestamp.
- AC-03: Region and industry filters produce deterministic ranking output.
- AC-04: CSV export equals visible filtered table ordering.
- AC-05: Source health page reflects last successful sync for each adapter.

## 13. Open Decisions (Tracked)

- Final canonical mapping table for status codes across sources
- Brand fuzzy matching threshold default (proposal: 0.88)
- Fallback precedence when source records conflict

## 14. Implementation Starter Checklist

- Create source adapter modules (`localdata`, `data_go_kr`, `kftc`)
- Implement canonical mapper and classification logic
- Build aggregation SQL jobs and indexes
- Implement `/api/v1/rankings` and `/api/v1/brands/:id/trends`
- Build dashboard and data-about pages
- Add cron, monitoring, and alerting
