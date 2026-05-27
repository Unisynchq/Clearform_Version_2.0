# Context — Clearform Form Builder

## Workspace

| Item | Value |
|------|--------|
| Path | `c:\Users\abbub\OneDrive\Desktop\Final work 2` |
| App | Clearform form builder (`clearform-version-2`) |
| Stack | React 19, Vite 8, Redux Toolkit, Tailwind 4, Motion (`motion/react`), Radix UI |

## Project status (May 2026 — updated 28 May)

Frontend is **connected to the NestJS backend** running at `localhost:3000/api/v1`.
- `VITE_API_BASE_URL=http://localhost:3000/api/v1` and `VITE_USE_MOCK_API=false` are set in `.env.local`
- All 4 dashboard sub-routes now registered in `AppRoutes.jsx` (profile, analytics, templates, help)
- Firebase ID Token auth: token stored in `sessionStorage['clearform:auth-token']`, sent as `Authorization: Bearer` header
- iCloud Drive creates `node_modules 2/` duplicates — Vite watcher is configured to ignore them (`vite.config.js`)

See also:

- `ASSIGNMENT_REPORT.md` — submission readiness
- `BACKEND_HANDOFF.md` — API contract for backend team
- `.env.example` — environment variables

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
| API layer (stubs) | `src/api/client.js`, `src/api/endpoints.js`, `src/api/services/*` |

## Logic

- **If/Else:** Single, Multiple, Media, Images, Rating, Date, Time, Short text, Long text, Contact, Address, Work Info
- **Next/Skip/End only:** Upload, Multi-image upload, Captcha, CTA, Heading, Description, Video, Start screen intro
- Persisted: `logicConnections`, `logicIfRulesByEdge`, `logicMeta` (mode, card offsets, AI status) in draft snapshot + `clearform-builder-logic-v1-{formId}` localStorage

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
bun run dev          # starts at localhost:5173 (or 5174 if 5173 is taken)

# Backend (from clearform-backend/) — must be running for API calls to work
bun run start:dev    # starts at localhost:3000
```

## Verification

```bash
bun run build
npm run test:smoke
```

## Related docs

- `Goal.md` — objectives
- `Plan.md` — implementation history
- `Research.md` — root causes and decisions
- `progress.md` — checklist and status
