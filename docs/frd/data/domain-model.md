# FRD Data: Domain Model

## 핵심 엔터티

- `EstablishmentEvent`
- `Brand`
- `Location`
- `MonthlyBrandMetric`

## 표준 이벤트 스키마

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
