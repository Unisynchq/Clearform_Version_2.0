# Plan — Implementation History & Architecture

## Phase 1 — Builder core (completed)

- Logic canvas port alignment (`LOGIC_PORT_STUB`, zoom-correct rects)
- If/Else gating in `logicFieldCatalog.jsx` / `logicCardDefaults.js`
- Publish restore: `buildPublishSnapshot`, `handlePublishForm`, `FormPublishView` props
- Builder lifecycle animations: `builderMotion.js`, `BuilderRightPanelShell`, 22 panel shells

## Phase 2 — Motion tuning (completed)

- Slowed builder tab/panel/sidebar tokens (~0.3–0.34s)
- Panel switch delay 280ms between content → configure

## Phase 3 — Analytics & search (completed)

### Analytics

- Loading skeleton all tabs (`AnalyticsPanelSkeleton`, `AnalyticsPerformanceSkeleton`)
- `AnimatePresence` fade between skeleton and content (`fadeUp` presets)
- `useHydrationFrame` + 280ms view delay on tab/form change

### Global search (`SearchPalette.jsx`)

- Removed hardcoded `RECENT_SEARCHES`
- Search real forms from Redux; workspace labels from `selectNavWorkspaces`
- Recent queries in `searchRecentStorage.js`
- Actions: edit builder, view responses, copy link, navigate
- Slower dropdown animation (~0.32s)

## Phase 4 — Logic persistence fix (completed)

**Problem:** Draft hydration skipped localStorage; empty snapshot overwrote saved logic.

**Solution:**

- Save `logicMeta` in `buildPublishSnapshot` (mode, offsets, AI status)
- Merge localStorage when snapshot has no logic
- `showLogicCanvas` includes existing connections in AI mode
- Guard saves until `builderHydrated` + `logicStorageHydratedRef`

## Phase 5 — Configure UI (completed)

- Replaced native `<select>` with `@/components/ui/Select` for video source, short/long text validation

## Phase 6 — Dashboard polish (completed)

- `useDashboardHydration` — min 420ms skeleton
- `dashboardMotion.js` — route enter, heading, section, grid stagger
- `RouteTransitionShell` dashboard variant uses slower ease

## Phase 7 — Backend readiness (completed)

| Artifact | Purpose |
|----------|---------|
| `src/api/client.js` | HTTP wrapper + auth header |
| `src/api/endpoints.js` | REST path map |
| `src/api/services/formsService.js` | Forms draft/publish facade |
| `src/api/services/analyticsService.js` | Analytics facade |
| `src/api/services/logicService.js` | AI logic facade |
| `src/config/env.js` | `VITE_API_BASE_URL` |
| `.env.example` | Env template |
| `BACKEND_HANDOFF.md` | Backend team spec |

---

## Wiring backend (future — not started in UI)

1. Bootstrap `formsSlice` from `formsService.listForms()`
2. Replace draft read/write in `FormBuilderPage` with API
3. Replace `writePublishedForm` on publish
4. Point `runAiLogicGeneration` to `logicService.generateFormLogic`
5. Analytics panels consume `analyticsService.*`

---

## Verification plan

```bash
npm run build
npm run test:smoke
npm run test:published   # optional
```

Manual: `progress.md` checklist.

---

## Files map (quick reference)

```
src/
  api/                    # Backend-ready facades
  config/env.js
  motion/
    dashboardMotion.js
    presets.js
  hooks/
    useDashboardHydration.js
    useHydrationFrame.js
  features/forms/
    pages/FormBuilderPage.jsx
    pages/AllFormsPage.jsx
    formBuilder/builderMotion.js
    utils/buildPublishSnapshot.js
  components/layout/SearchPalette.jsx
  pages/AnalyticsPage.jsx
```
