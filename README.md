# Franchise Pulse Korea Docs

This repository contains product documentation for a web service that tracks monthly franchise store openings and closures in Korea.

## Web Test Version

This repo now includes a lightweight web test dashboard that reflects the current PRD/FRD scope.

- `index.html`: dashboard (`/`)
- `brand.html`: brand detail (`/brand/[brandId]` equivalent test page)
- `about-data.html`: data source and metric policy (`/about-data`)
- `web-test-data.js`: sample dataset for test rendering
- `web-test-app.js`, `web-test-brand.js`: client logic
- `styles.css`: shared styles

### Local preview

Run a static server from repository root (example):

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

### Vercel deployment

```bash
vercel --prod --yes
```

The command deploys this static web test version directly from repository root.

## Documents

- `docs/PRD.md`: Core product requirements (concise, decision-focused)
- `docs/FRD.md`: Functional requirements and implementation details

## Scope split policy

- Keep PRD concise: goals, scope, KPIs, risks, release plan
- Move feature detail, data model, API contracts, and wireframes into FRD
