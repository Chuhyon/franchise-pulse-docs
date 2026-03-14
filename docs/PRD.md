# PRD: Franchise Pulse Korea (v1.1, Structured)

이 문서는 PRD 핵심 의사결정만 유지하고, 메뉴/기능별 상세는 하위 문서로 분리한 인덱스다.

## 핵심 요약

- 제품 목표: 월별 프랜차이즈 `개업/폐업 Top 100`을 투명하고 비교 가능하게 제공
- 사용자: 예비 창업자, 데이터 분석가, 운영 담당자, 미디어/리서치 사용자
- 공개 방식: Vercel 기반 웹 서비스(`web-test` 검증 후 공개)
- 데이터 방향: `data.go.kr` 중심 + 전환기/보강 소스 결합

## PRD 문서 구조

### 코어

- 제품/문제/사용자: `docs/prd/core/product-overview.md`
- 목표/범위/KPI: `docs/prd/core/goals-scope-kpi.md`
- 리스크/릴리스/거버넌스: `docs/prd/core/risk-release-governance.md`

### 메뉴/기능별

- 대시보드(`/`): `docs/prd/features/dashboard.md`
- 브랜드 상세(`/brand/[brandId]`): `docs/prd/features/brand-detail.md`
- 데이터 소개(`/about-data`): `docs/prd/features/about-data.md`
- 운영 기능(`ops/rebuild`, 신선도/품질 표기): `docs/prd/features/operations.md`

## 문서 경계

- PRD는 제품 의사결정, 우선순위, 성공 기준에 집중한다.
- 구현 계약(API, 모델, SQL, 장애정책, 인수기준)은 `docs/FRD.md` 및 `docs/frd/*`에서 관리한다.
