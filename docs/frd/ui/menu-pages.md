# FRD UI: Menu & Pages

## 페이지 구성

- `/`: 대시보드 (랭킹 + 필터 + 차트)
- `/brand/[brandId]`: 브랜드 상세
- `/about-data`: 데이터 출처/기준/주의사항

## 대시보드 컴포넌트

- 헤더: 월 선택 + 지표 토글
- 필터: 지역/업종/브랜드 검색
- 랭킹 테이블: 정렬 가능 컬럼 + CSV 다운로드
- 추이 패널: 선택 브랜드 스파크라인 + 12개월 요약
- 상태 배지: 소스 최신성/품질

## CSV 내보내기 규격

- 인코딩: UTF-8
- 구분자: `,`
- 헤더: `rank,brandName,openCount,closeCount,netChange,latestEventDate`
- 정렬 기준: 화면 표시 순서와 동일

## 와이어프레임 (텍스트)

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
