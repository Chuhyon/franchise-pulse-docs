# FRD Decisions: v1 Locked

## 상태코드 표준 매핑

- 우선순위: `CLOSE > OPEN > UPDATE > OTHER`
- `CLOSE`: 폐업/취소/말소 계열
- `OPEN`: 영업/정상/개시 계열
- `UPDATE`: 정정/변경/갱신 계열
- `OTHER`: 분류 불가

## 브랜드 유사 매칭 임계값

- 기본값: `0.88`
- `>= 0.93`: 자동 확정
- `0.88 <= score < 0.93`: 운영 검토 큐
- `< 0.88`: 미매칭

## 소스 충돌 우선순위

- 사실 이벤트 우선순위: `data.go.kr > legacy/local backup`
- 브랜드/가맹 메타 보강: `KFTC` 사용(사실 이벤트 덮어쓰기 금지)
- 타이브레이커: `updated_at_source 최신 > source priority > ingested_at 최신`

## 감사/경보 규칙

- 충돌 결과 로그: `winner_source`, `loser_source`, `resolution_reason`
- 미분류(`OTHER`) 비율 2% 초과 시 경보

## 웹 테스트 버전 운영 기준

- `web-test` 환경에서 성능/품질 선검증
- 운영과 동일 API 계약(`/api/v1`) 및 집계 규칙 적용
- 테스트 환경 도메인은 CORS 허용 목록에 명시
- 테스트 배포 승인 기준
  - AC-01 ~ AC-07 충족
  - 최근 7일 스케줄 성공률 99% 이상
  - 최근 7일 최신성 지표 95% 이상
