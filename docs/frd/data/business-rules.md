# FRD Data: Business Rules

## 이벤트 분류 규칙

- `OPEN`: 최초 영업 개시 또는 상태가 영업/정상으로 전환
- `CLOSE`: 상태가 폐업/취소/말소 계열로 전환
- `UPDATE`: 개업/폐업 이외 변경
- `OTHER`: 분류 불가 상태 전이

## 월 버킷 규칙

- 타임존: `Asia/Seoul`
- 버킷 키: 이벤트 유효일 기준 `YYYY-MM`
- 지연 도착 데이터는 영향 월 재집계

## Top 100 랭킹 규칙

- 월/지표(`OPEN`, `CLOSE`)별 독립 랭킹
- 1차 정렬: `count DESC`
- 2차 정렬: `latest_event_date DESC`
- 3차 정렬: `brand_name ASC`

## 순증 지표 규칙

- `net_change = open_count - close_count`
- 롤링 지표: `3m`, `6m`, `12m`
