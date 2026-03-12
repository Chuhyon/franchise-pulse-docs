# FRD: Franchise Pulse Korea (v1.0)

## 1. 기능 개요

본 FRD는 월별 프랜차이즈 개업/폐업 Top 100 대시보드 구현을 위한 상세 기능 요구사항을 정의한다. 범위는 데이터 수집, 정규화, 랭킹 집계, API 제공, UI 노출, 운영/관측까지 포함한다.

## 2. 소스 인벤토리

## 2.1 1차 소스

- 공공데이터포털 (`data.go.kr`): 통합 인허가/생활 데이터 생태계의 기본 소스
- 공정거래위원회 가맹정보 API (`data.go.kr`): 프랜차이즈 브랜드 메타데이터 및 통계 보강

## 2.2 전환기 소스

- LOCALDATA (`localdata.go.kr`): 레거시 연동 및 마이그레이션 브리지

## 2.3 보조 소스

- 시/도 오픈데이터 포털: 국가 포털 데이터 지연 시 커버리지 보완

## 2.4 소스 어댑터 정책

- 각 소스는 공통 인터페이스를 구현한 어댑터로 캡슐화한다.
  - `fetchIncremental(startDate, endDate, page)`
  - `fetchSnapshot(snapshotDate)`
  - `mapToCanonical(rawRecord)`
  - `healthCheck()`

## 3. 표준 도메인 모델

## 3.1 핵심 엔터티

- `EstablishmentEvent`: 인허가/가맹 변동 원천을 정규화한 이벤트 레코드
- `Brand`: 표준화된 프랜차이즈 브랜드 식별자
- `Location`: 주소 및 행정구역 표준 차원
- `MonthlyBrandMetric`: 월별 집계 지표(랭킹 산정용)

## 3.2 표준 이벤트 스키마

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

## 4. 비즈니스 규칙

## 4.1 이벤트 분류 규칙

- `OPEN`: 최초 영업 개시 또는 상태가 영업/정상으로 전환된 경우
- `CLOSE`: 상태가 폐업/취소/말소 계열로 전환된 경우
- `UPDATE`: 개업/폐업 이외의 일반 변경
- `OTHER`: 분류 불가 상태 전이

## 4.2 월 버킷 규칙

- 타임존은 `Asia/Seoul`로 고정
- 버킷 키는 이벤트 유효일 기준 `YYYY-MM`
- 지연 도착 데이터는 영향 월에 대해 재집계 수행

## 4.3 Top 100 랭킹 규칙

- 월/지표(`OPEN`, `CLOSE`)별 독립 랭킹 생성
- 1차 정렬: `count DESC`
- 2차 정렬: `latest_event_date DESC`
- 3차 정렬: `brand_name ASC`

## 4.4 순증 지표 규칙

- `net_change = open_count - close_count`
- 롤링 지표: `3m`, `6m`, `12m`

## 5. 데이터 파이프라인

## 5.1 수집 플로우

1) 과거 백필
- 스냅샷/파일 데이터를 스테이징에 적재
- `source_system + source_record_id + updated_at_source` 기준 중복 제거

2) 일 증분
- Cron 기반 증분 수집
- 지수 백오프 재시도
- 복구 불가 payload는 DLQ 처리

3) 정규화 및 매칭
- 상태/지역/업종 차원 표준화
- 브랜드 매칭(정확 일치 + 유사 일치)

4) 집계
- 월별 브랜드 지표 물질화
- 월/지표별 Top 100 뷰 갱신

## 5.2 스케줄

- 일 증분 기본 배치: 02:30 KST
- 복구 배치: 05:30 KST
- 운영 수동 재실행 엔드포인트 제공

## 5.3 장애 대응 정책

- 재시도: 최대 3회 (1분, 5분, 15분)
- 반복 실패 시 어댑터 상태를 degraded로 전환하고 마지막 정상 집계 유지
- DLQ 레코드는 `ops_data_quality_issue`에 격리 후 재처리
- 소스 우선순위 폴백: `data.go.kr` -> `KFTC 보강` -> `legacy/local backup`

## 6. 저장소 설계 (PostgreSQL)

## 6.1 테이블 목록

- `stg_events_raw`
- `dim_brand`
- `dim_location`
- `fact_establishment_event`
- `agg_monthly_brand_metric`
- `ops_ingestion_run`
- `ops_data_quality_issue`

## 6.2 SQL 초안

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

## 7. API 계약 (Internal BFF)

기본 경로: `/api/v1`

## 7.0 버전/제한/CORS 정책

- 버전 관리: URI 버전(`/api/v1`) 사용, 마이너 릴리스는 additive 변경만 허용
- 호출 제한: 공개 조회 API는 IP당 분당 60회
- CORS: 운영 환경에서는 대시보드 도메인만 허용
- 캐시 헤더: 랭킹 API에 `s-maxage=300, stale-while-revalidate=600`

### 에러 응답 규약

```json
{
  "error": {
    "code": "SOURCE_TIMEOUT",
    "message": "Upstream source timed out",
    "requestId": "req_123",
    "retryable": true
  }
}
```

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

월별 개업/폐업/순증 시계열을 반환한다.

## 7.3 GET /meta/sources

소스 상태, 마지막 동기화 시각, 데이터 지연을 반환한다.

## 7.4 POST /ops/rebuild

월 범위 기준 재집계를 수행하는 보호된 운영 엔드포인트.
- 인증 방식: `Authorization: Bearer <OPS_TOKEN>` (서버 환경변수와 비교 검증)

## 8. UI 요구사항

## 8.1 페이지 구성

- `/` 대시보드 (랭킹 + 필터 + 차트)
- `/brand/[brandId]` 브랜드 상세
- `/about-data` 데이터 출처, 기준 로직, 주의사항

## 8.2 대시보드 컴포넌트

- 헤더: 월 선택 + 지표 토글 (`개업 Top 100`, `폐업 Top 100`)
- 필터 영역: 지역, 업종, 브랜드 검색
- 랭킹 테이블: 정렬 가능 컬럼 + CSV 다운로드
- 추이 패널: 선택 브랜드 스파크라인 + 12개월 요약
- 상태 배지: 소스 최신성 및 품질 상태

### CSV 내보내기 규격

- 인코딩: UTF-8
- 구분자: `,`
- 헤더 포함: `rank,brandName,openCount,closeCount,netChange,latestEventDate`
- 정렬 기준: 화면 표시 순서와 동일

## 8.3 와이어프레임 (텍스트)

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

## 9. Vercel 배포 설계

- Framework: Next.js (App Router, TypeScript)
- DB: Supabase Postgres 또는 Neon Postgres
- Scheduler: Vercel Cron + 보호된 ops route
- Secrets: Vercel Environment Variables만 사용
- Caching: ISR + 서버 응답 캐시 + DB 물질화 집계

## 10. 보안 및 컴플라이언스

- 소스 API 키를 브라우저에 노출하지 않는다
- 내부 API에 호출 제한을 적용한다
- 파이프라인 운영 감사 로그를 저장한다
- 각 소스의 라이선스와 출처 표기 요구사항을 준수한다
- 데이터 보관 정책:
  - 수집 메타데이터: 90일
  - 정규화 이벤트: 최소 24개월
  - 월 집계: 장기 추세 분석 목적 보관

## 11. 관측성

- Metrics: 수집 성공률, 소스 지연, 행 단위 증감, API p95
- Logs: 수집 실행 로그, 파싱 실패 로그, 매칭 신뢰도 분포
- Alerts: 스케줄 실패, 0건 수집 이상치, 스키마 드리프트

## 11.1 SLO 목표

- API 가용성 SLO: 월 99.0%
- 랭킹 API p95 지연: <= 800ms (캐시 히트)
- 최신성 SLO: 일 단위 소스 기준 24시간 내 반영
- 파이프라인 SLO: 일 스케줄 실행 성공률 99% 이상
- 데이터 최신성 운영지표: 일 단위 갱신 성공률 95% 이상

## 12. 인수 기준 (Acceptance Criteria)

- AC-01: 특정 월 선택 시 개업/폐업 Top 100이 3초 이내 렌더링된다(캐시 히트 기준).
- AC-02: 일 수집 작업이 랭킹과 최신성 시각을 갱신한다.
- AC-03: 지역/업종 필터 적용 결과가 결정론적으로 일관된다.
- AC-04: CSV 내보내기 결과가 화면 테이블 정렬과 일치한다.
- AC-05: 소스 상태 페이지가 어댑터별 마지막 정상 동기화를 표시한다.
- AC-06: 샘플 대사 검증 시 월 집계 오차가 1% 미만이다.
- AC-07: 단일 소스 어댑터 장애 시 degraded 배지와 함께 마지막 정상 집계를 계속 제공한다.

## 12.1 데이터 품질 검증 규칙

- 중복 검증: 소스 키 + 소스 갱신시각 조합 유일성
- Null 검증: 필수 차원(`event_date`, `event_type`, `source_record_id`) 누락 금지
- 범위 검증: 비정상 미래 날짜 이벤트 차단
- 분류 검증: 상태 매핑 커버리지 모니터링, 미분류 비율 2% 초과 시 경보

## 13. 미결정 항목 (Tracked)

- 소스별 상태코드 표준 매핑 테이블 최종안
- 브랜드 유사 매칭 임계값 기본값(제안: 0.88)
- 소스 간 충돌 발생 시 우선순위 최종 규칙

## 14. 구현 시작 체크리스트

- 소스 어댑터 모듈 작성 (`localdata`, `data_go_kr`, `kftc`)
- 표준 매퍼 및 이벤트 분류 로직 구현
- 집계 SQL 잡 및 인덱스 구축
- `/api/v1/rankings`, `/api/v1/brands/:id/trends` 구현
- 대시보드 및 데이터 소개 페이지 구현
- Cron, 모니터링, 경보 설정
