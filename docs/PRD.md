# PRD: Franchise Pulse Korea (v1.0)

## 1. Product Summary

- Product: monthly franchise opening/closure Top 100 dashboard
- Primary users: prospective founders, analysts, operators, media/research users
- Deployment target: Vercel (public web)
- Data strategy: use all available government public data sources, with migration-safe design

## 2. Problem

- Franchise opening/closure data is fragmented across portals and formats.
- Users cannot easily compare monthly brand-level opening and closure trends.
- LOCALDATA portal sunset requires continuity planning.

## 3. Goals

- Provide monthly `Open Top 100` and `Close Top 100` rankings.
- Enable filtering by month, region, business category, and brand.
- Publish transparent data lineage and refresh timestamps.
- Maintain service continuity before/after LOCALDATA sunset.

## 4. Data Sources (All-In)

- LOCALDATA (`localdata.go.kr`) for historical structure and legacy access.
- Public Data Portal (`data.go.kr`) as primary source after integration.
- KFTC franchise APIs on `data.go.kr` (brand/franchise metadata and statistics).
- Optional local government open data portals for fallback/coverage gap handling.

### Migration decision

- `data.go.kr` is the long-term primary source.
- `localdata.go.kr` is treated as transition source until shutdown window.

## 5. In Scope

- Dashboard: monthly open/close Top 100
- Filters: month, region, category, brand search
- Brand detail: monthly trend and net change
- CSV export for current filtered view
- Source and quality badges (last sync, source confidence)

## 6. Out of Scope (v1)

- User accounts/subscriptions
- Real-time minute-level ingestion
- Predictive modeling and recommendation engine

## 7. Success Metrics

- Data freshness: daily refresh success >= 95%
- Pipeline reliability: scheduled job success >= 99%
- User utility: filter usage rate >= 40% sessions
- Accuracy: sampled reconciliation error < 1%
- Availability: public dashboard uptime >= 99.0%

## 7.1 Governance baseline

- Licensing/attribution requirements from each source must be stored and shown in `about-data`.
- PII policy: only public business data is ingested; no user personal data collection in v1.
- Retention: raw ingest logs 90 days, normalized events 24 months minimum, aggregated monthly metrics retained indefinitely.

## 8. Risks and Mitigations

- API schema changes -> source adapters + schema validation + alerts
- Brand matching ambiguity -> confidence scoring + manual override table
- Rate limits/outages -> retry/backoff + cache snapshots + fallback source
- Portal migration changes -> adapter abstraction and cutover runbook

## 8.1 Migration and continuity policy

- Initial backfill from available historical files/snapshots before public launch.
- Incremental refresh target: daily at least once; retry windows for transient source failures.
- Source fallback order: `data.go.kr` -> `KFTC supplemental` -> `legacy/local backup` where applicable.
- Kill switch: disable failing source adapter without stopping dashboard serving from last good aggregates.

## 9. Release Plan

- Phase 1: source onboarding + historical backfill
- Phase 2: monthly aggregation + ranking service
- Phase 3: dashboard UI + export
- Phase 4: reliability hardening + observability + public launch

## 9.1 Launch gates

- Freshness SLA validated (latest successful sync <= 24h for daily sources)
- Accuracy check completed against sampled source records
- Public API error contract and CORS policy locked
- Incident runbook and rollback process tested once in staging

## 10. Document boundary

- This PRD stays concise by design.
- Detailed feature behavior, data model, API contract, and UI wireframes are in `docs/FRD.md`.
