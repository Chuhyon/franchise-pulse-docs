# FRD API: Internal BFF Contract

기본 경로: `/api/v1`

## 버전/제한/CORS 정책

- URI 버전(`/api/v1`) 사용
- 공개 조회 API 제한: IP당 분당 60회
- 운영 CORS: 대시보드 도메인만 허용
- 캐시 헤더: `s-maxage=300, stale-while-revalidate=600`

## 에러 응답 규약

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

## GET /rankings

Query params:
- `month=YYYY-MM` (required)
- `metric=open|close` (required)
- `sido` (optional)
- `sigungu` (optional)
- `industryMajor` (optional)
- `q` brand keyword (optional)
- `limit` default 100, max 100

## GET /brands/:brandId/trends

Query params:
- `from=YYYY-MM` (required)
- `to=YYYY-MM` (required)

## GET /meta/sources

- 소스 상태, 마지막 동기화 시각, 데이터 지연 반환

## POST /ops/rebuild

- 월 범위 재집계 보호 엔드포인트
- 인증: `Authorization: Bearer <OPS_TOKEN>`
