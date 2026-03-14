# FRD: Franchise Pulse Korea (v1.1, Structured)

이 문서는 FRD 기술 요구사항의 상위 인덱스다. 구현 세부는 도메인별 하위 문서로 분리했다.

## FRD 문서 구조

### 데이터 영역

- 소스/어댑터 정책: `docs/frd/data/sources-adapters.md`
- 도메인 모델/표준 스키마: `docs/frd/data/domain-model.md`
- 비즈니스 규칙(분류/랭킹/순증): `docs/frd/data/business-rules.md`
- 수집/집계 파이프라인 및 스케줄: `docs/frd/data/pipeline-schedule.md`
- 저장소 설계(SQL): `docs/frd/data/storage-schema.md`

### API/UI

- Internal BFF 계약: `docs/frd/api/bff-contract.md`
- 메뉴/페이지/UI 컴포넌트: `docs/frd/ui/menu-pages.md`

### 운영/품질

- 배포/보안/관측성/SLO: `docs/frd/ops/deployment-security-observability.md`
- 인수기준/데이터 품질 규칙: `docs/frd/quality/acceptance-validation.md`
- v1 고정 결정사항/테스트 기준: `docs/frd/decisions/v1-locked-decisions.md`

## 구현 착수 체크리스트

- 소스 어댑터 모듈 작성 (`localdata`, `data_go_kr`, `kftc`)
- 표준 매퍼 및 이벤트 분류 로직 구현
- 집계 SQL 잡 및 인덱스 구축
- `/api/v1/rankings`, `/api/v1/brands/:id/trends` 구현
- 대시보드 및 데이터 소개 페이지 구현
- Cron, 모니터링, 경보 설정
