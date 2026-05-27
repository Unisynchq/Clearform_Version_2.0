# Context — Clearform Form Builder

## Workspace

| Item | Value |
|------|--------|
| Path | `c:\Users\abbub\OneDrive\Desktop\Final work 2` |
| App | Clearform form builder (`clearform-version-2`) |
| Stack | React 19, Vite 8, Redux Toolkit, Tailwind 4, Motion (`motion/react`), Radix UI |

## Project status (May 2026)

Frontend prototype is **feature-complete for demo and assignment**. Persistence is **localStorage + Redux** until backend is connected via `VITE_API_BASE_URL`.

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
