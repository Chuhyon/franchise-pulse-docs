# FRD Data: Pipeline & Schedule

## 수집 플로우

1) 과거 백필
- 스냅샷/파일 데이터를 스테이징 적재
- `source_system + source_record_id + updated_at_source` 기준 중복 제거

2) 일 증분
- Cron 기반 증분 수집
- 지수 백오프 재시도
- 복구 불가 payload는 DLQ 처리

3) 정규화/매칭
- 상태/지역/업종 차원 표준화
- 브랜드 매칭(정확 일치 + 유사 일치)

4) 집계
- 월별 브랜드 지표 물질화
- 월/지표별 Top 100 뷰 갱신

## 스케줄

- 일 증분 기본 배치: 02:30 KST
- 복구 배치: 05:30 KST
- 운영 수동 재실행 엔드포인트 제공

## 장애 대응 정책

- 재시도: 최대 3회 (1분, 5분, 15분)
- 반복 실패 시 어댑터 상태 `degraded` 전환 + 마지막 정상 집계 유지
- DLQ 레코드는 `ops_data_quality_issue` 격리 후 재처리
- 소스 폴백: `data.go.kr -> KFTC 보강 -> legacy/local backup`
