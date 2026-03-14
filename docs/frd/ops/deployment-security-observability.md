# FRD Ops: Deployment, Security, Observability

## Vercel 배포 설계

- Framework: Next.js (App Router, TypeScript)
- DB: Supabase Postgres 또는 Neon Postgres
- Scheduler: Vercel Cron + 보호된 ops route
- Secrets: Vercel Environment Variables만 사용
- Caching: ISR + 서버 응답 캐시 + DB 물질화 집계

## 보안 및 컴플라이언스

- 소스 API 키 브라우저 노출 금지
- 내부 API 호출 제한 적용
- 파이프라인 운영 감사 로그 저장
- 소스 라이선스/출처 표기 준수
- 보관 정책
  - 수집 메타데이터: 90일
  - 정규화 이벤트: 최소 24개월
  - 월 집계: 장기 보관

## 관측성

- Metrics: 수집 성공률, 소스 지연, 행 단위 증감, API p95
- Logs: 수집 실행 로그, 파싱 실패 로그, 매칭 신뢰도 분포
- Alerts: 스케줄 실패, 0건 수집 이상치, 스키마 드리프트

## SLO

- API 가용성: 월 99.0%
- 랭킹 API p95: <= 800ms (캐시 히트)
- 최신성: 일 단위 소스 기준 24시간 내 반영
- 파이프라인 스케줄 성공률: 99% 이상
- 데이터 최신성 운영지표: 95% 이상
