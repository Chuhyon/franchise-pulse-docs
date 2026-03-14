# FRD Data: Sources & Adapters

## 소스 인벤토리

### 1차 소스

- 공공데이터포털 (`data.go.kr`)
- 공정거래위원회 가맹정보 API (`data.go.kr`)

### 전환기 소스

- LOCALDATA (`localdata.go.kr`)

### 보조 소스

- 시/도 오픈데이터 포털

## 소스 어댑터 정책

- 각 소스는 공통 인터페이스를 구현한다.
  - `fetchIncremental(startDate, endDate, page)`
  - `fetchSnapshot(snapshotDate)`
  - `mapToCanonical(rawRecord)`
  - `healthCheck()`

## 폴백 우선순위

- `data.go.kr -> KFTC 보강 -> legacy/local backup`
