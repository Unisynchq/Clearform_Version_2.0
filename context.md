# Context — Clearform Form Builder

## Workspace

| Item | Value |
|------|--------|
| Path | `/Users/rahulpandey187/Documents/future-products/Professional/UniSync/Clearform_Version_2.0` |
| App | Clearform form builder (`clearform-version-2`) |
| Stack | React 19, Vite 8, Redux Toolkit, Tailwind 4, Motion (`motion/react`), Radix UI |
| Production app | https://app.clearform.in (Vercel) |
| Production API | https://api.clearform.in/api/v1 (VPS) |

## Project status (May 2026 — updated 30 May)

Frontend is **connected to the NestJS backend** (local dev + production URLs documented).

- **Dev:** `VITE_API_BASE_URL=http://localhost:3000/api/v1`, `VITE_USE_MOCK_API=false` in `.env.local`
- **Prod:** `VITE_API_BASE_URL=https://api.clearform.in/api/v1` on Vercel (see runbook)
- All dashboard sub-routes in `AppRoutes.jsx` (profile, analytics, templates, help)
- Firebase ID Token auth: `sessionStorage['clearform:auth-token']`, `Authorization: Bearer` via `src/api/client.js`
- iCloud Drive may create `node_modules 2/` — Vite watcher ignores them (`vite.config.js`)

See also:

- `ASSIGNMENT_REPORT.md` — submission readiness
- `BACKEND_HANDOFF.md` — API contract
- `.env.example` — environment variables
- **Production runbook:** [`../clearform-backend/docs/PRODUCTION.md`](../clearform-backend/docs/PRODUCTION.md)

## Major feature areas

| Area | Key files |
|------|-----------|
| Dashboard (All forms) | `AllFormsPage.jsx`, `dashboardMotion.js`, `useDashboardHydration.js` |
| Global search | `SearchPalette.jsx`, `Topbar.jsx`, `searchRecentStorage.js` |
| Form builder | `FormBuilderPage.jsx`, `FormBuilderRightPanels.jsx` |
| Builder motion | `builderMotion.js`, `BuilderRightPanelShell.jsx` |
| Logic canvas | `FormBuilderPage.jsx`, `logicEngine.js`, `logicFieldCatalog.jsx` |
| Publish | `buildPublishSnapshot.js`, `FormPublishView.jsx`, `formPublishReadiness.js` |
| Analytics UI | `AnalyticsPage.jsx`, `components/analytics/*` |
| API layer | `src/api/client.js`, `src/api/endpoints.js`, `src/api/services/*` |

## Logic

- **If/Else:** Single, Multiple, Media, Images, Rating, Date, Time, Short text, Long text, Contact, Address, Work Info
- **Next/Skip/End only:** Upload, Multi-image upload, Captcha, CTA, Heading, Description, Video, Start screen intro
- Persisted: `logicConnections`, `logicIfRulesByEdge`, `logicMeta` in draft snapshot + `clearform-builder-logic-v1-{formId}` localStorage

## Motion tokens

| Surface | File |
|---------|------|
| Builder tabs/panels | `builderMotion.js` |
| Dashboard | `dashboardMotion.js` |
| Page fade | `motion/presets.js` |

## Do not re-introduce (unless asked)

- Logic edge draw animations
- `LogicEdgePathGroup` extraction
- Logic card enter animations on flow cards

## Running locally

```bash
# Frontend (from Clearform_Version_2.0/)
npm run dev          # localhost:5173 (or 5174)

# Backend (from clearform-backend/)
bun run start:dev    # localhost:3000/api/v1
```

## Package management

> **CRITICAL:** Frontend uses **npm** only. Backend uses **bun** only. Mixing managers can trigger macOS stale file-handle issues with `node_modules`.

## Verification

```bash
npm run build
npm run test:smoke
```

## Related docs

- `Goal.md` — objectives
- `Plan.md` — implementation history
- `Research.md` — root causes and decisions
- `progress.md` — checklist and status
- `../clearform-backend/docs/PRODUCTION.md` — DNS, Vercel, Firebase, VPS runbook
