# Worklog: Web-Test Rollout (2026-03-12)

## 1) 요청 목적

- PRD/FRD 정리 이후, 실제로 확인 가능한 웹 테스트 버전 생성
- Git 반영 및 Vercel 배포까지 완료

## 2) 문서 업데이트

- `docs/PRD.md`
  - 릴리스 단계를 `web-test` 검증 단계 포함 형태로 재정의
  - 테스트 버전 정책(`9.0`) 추가
- `docs/FRD.md`
  - `13. 미결정 항목`을 `결정 완료 항목 (Locked for v1)`으로 전환
  - 상태코드 매핑, 브랜드 유사매칭 임계값, 소스 충돌 우선순위 확정
  - `13.1 웹 테스트 버전 운영 기준` 추가

## 3) 웹 테스트 버전 구현

- 대시보드 페이지: `index.html`
  - 월/지표/지역/업종/브랜드 검색 필터
  - 랭킹 테이블 렌더링
  - CSV 다운로드
- 브랜드 상세: `brand.html`, `web-test-brand.js`
  - 브랜드별 월 추이 조회
- 데이터 소개 페이지: `about-data.html`
  - 소스 우선순위/지표 산정/운영 기준 안내
- 공통 스타일/스크립트
  - `styles.css`, `web-test-app.js`, `web-test-data.js`
- Vercel 라우팅
  - `vercel.json` (`/`, `/about-data`, `/brand` rewrite)

## 4) 검증 내역

- 로컬 스모크 테스트
  - `python3 -m http.server 4173`
  - `/`, `/about-data.html`, `/brand.html?brandId=101` 응답 확인
- 정적 자산 배포 검증
  - Vercel 배포 후 `/`, `/about-data`, `/brand?brandId=101` 응답 확인

## 5) Git 반영 내역

- 반영 커밋(요약)
  - `6fc17e8` Finalize v1 decisions and web-test policy in PRD/FRD
  - `af2af92` Add web-test dashboard with filters and CSV export
  - `b07a478` Add brand and about pages with Vercel routing
  - `71ce3c0` Document web-test local preview and Vercel deploy
  - `38b6641` Ignore Vercel local metadata
- 원격 반영
  - `origin/main` 동기화 완료 (`main...origin/main`)

## 6) Vercel 배포 결과

- 프로덕션 도메인: `https://franchise-pulse-docs.vercel.app`
- 최근 배포 인스펙트:
  - `https://vercel.com/chuhyons-projects/franchise-pulse-docs/8GQNygmp9b15bJRztS91xCte9EHq`

## 7) 후속 권장 사항

- 테스트 데이터(`web-test-data.js`)를 API 연동 형태로 점진 전환
- `AC-01 ~ AC-07` 점검 체크리스트를 테스트 케이스로 분리
- 배포/인증 토큰은 정기 회전 정책으로 관리
