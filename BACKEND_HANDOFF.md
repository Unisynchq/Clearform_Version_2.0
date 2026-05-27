# Backend Handoff — Clearform v2 (Frontend)

This document is for the **backend team**: what exists today, what the UI expects, and what to implement first.

---

## Current state (frontend)

| Layer | Today | After backend |
|-------|--------|----------------|
| Auth | Redux + local session | `POST /auth/sign-in`, JWT in `Authorization` header |
| Forms list | `localStorage` + Redux (`formsSlice`) | `GET /forms` |
| Builder draft | `writeBuilderDraft` / `readBuilderDraft` | `PUT /forms/:id/builder-snapshot` |
| Publish | `writePublishedForm` + Redux `status: 'live'` | `POST /forms/:id/publish` |
| Public respondent | `readPublishedForm` | `GET /forms/:id/published` (or CDN JSON) |
| Responses | `formResponsesStorage` | `GET/POST /forms/:id/responses` |
| Workspaces | `workspacesStorage` | `GET/POST/PATCH/DELETE /workspaces` |
| Templates | Static catalog + `fetchTemplates` stub | `GET /templates` |
| Analytics | **Demo / sample data in components** | Real aggregates + time series |
| AI logic | Local stub (`buildLocalAiLogicSuggestion`) | `POST /forms/:id/logic/generate` |
| Notifications | `notificationsStorage` | `GET /notifications` |

Frontend API scaffolding (ready to wire):

- `src/api/client.js` — `fetch` wrapper, `ApiError`, Bearer token from `sessionStorage['clearform:auth-token']`
- `src/api/endpoints.js` — path map
- `src/api/services/formsService.js` — falls back to localStorage when `VITE_API_BASE_URL` is empty
- `src/api/services/analyticsService.js`
- `src/api/services/logicService.js`
- `src/config/env.js` — `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`
- `.env.example`

Set in deployment:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/v1
VITE_USE_MOCK_API=false
```

---

## Priority 1 — Core product

### 1. Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/sign-up` | email, password, name |
| POST | `/auth/sign-in` | returns `{ token, user }` |
| POST | `/auth/sign-out` | invalidate session |
| GET | `/auth/me` | current user profile |

Frontend stores token: `sessionStorage.setItem('clearform:auth-token', token)` (already read in `apiClient`).

### 2. Forms CRUD

| Method | Path | Body / response |
|--------|------|------------------|
| GET | `/forms` | `[{ id, title, status, workspace, responses, timeAgo, builderSnapshot?, ... }]` |
| GET | `/forms/:id` | single form meta |
| POST | `/forms` | create blank or from `templateId` |
| PATCH | `/forms/:id` | title, workspace, status |
| DELETE | `/forms/:id` | soft delete or archive |

### 3. Builder snapshot (draft)

| Method | Path | Body |
|--------|------|------|
| GET | `/forms/:id/builder-snapshot` | — |
| PUT | `/forms/:id/builder-snapshot` | see **Snapshot schema** below |

Frontend auto-saves every ~1s while editing (debounced in `FormBuilderPage.jsx`).

### 4. Publish

| Method | Path | Body |
|--------|------|------|
| POST | `/forms/:id/publish` | same snapshot shape as draft |
| GET | `/forms/:id/published` | public respondent payload (no auth) |

Published JSON is what `PublicFormPage` and `/f/:formId` consume.

---

## Snapshot schema (builder + publish)

Produced by `buildPublishSnapshot()` in `src/features/forms/utils/buildPublishSnapshot.js`:

```json
{
  "version": 1,
  "formId": 123,
  "templateId": "optional",
  "formTitle": "My Form",
  "screens": [],
  "nextId": 100,
  "intro": { "title", "description", "buttonText", "textSize", "alignment" },
  "end": { "title", "description", "buttonText" },
  "logicConnections": [{ "from": 1, "to": 2, "kind": "next" }],
  "logicIfRulesByEdge": { "1-2": { "rules": [], "elseScreenId": null } },
  "logicMeta": {
    "logicModeManual": true,
    "logicCardOffsets": {},
    "aiLogicGenStatus": "idle"
  },
  "theme": {},
  "settings": {},
  "savedAt": 1710000000000
}
```

**Logic engine (respondent runtime):** `src/features/forms/utils/logicEngine.js` — backend does not need to reimplement; store snapshot as-is.

---

## Priority 2 — Responses & analytics

### Responses

| Method | Path |
|--------|------|
| GET | `/forms/:formId/responses?page=1&range=` |
| GET | `/forms/:formId/responses/:responseId` |
| POST | `/forms/:formId/responses` | public submit (no auth) |
| GET | `/forms/:formId/responses/export?format=csv` |

### Analytics (replace demo data)

| Method | Path | Used by |
|--------|------|---------|
| GET | `/analytics/forms/:formId/performance?range=` | Performance tab |
| GET | `/analytics/forms/:formId/responses?range=` | Responses tab |
| GET | `/analytics/forms/:formId/compare?range=` | Compare tab |
| POST | `/analytics/forms/:formId/ai-insights` | AI Insights tab |

Until these exist, the UI shows **sample series** (hardcoded in dashboard components).

---

## Priority 3 — Workspaces, templates, AI logic

| Area | Path | Notes |
|------|------|--------|
| Workspaces | `/workspaces` | id, label, color, count |
| Templates | `/templates` | match `TEMPLATE_CATALOG` shape in frontend |
| AI logic | `POST /forms/:id/logic/generate` | body: screens + questions; response: `{ connections, ifRulesByEdge }` — see `applyAiLogicPayload` |

---

## Priority 4 — Billing / profile (placeholders)

- Razorpay checkout is UI placeholder (`RazorpayCheckoutPlaceholder.jsx`)
- Profile billing tab uses computed usage from Redux + localStorage

---

## Migration checklist (frontend will do when API is ready)

1. Replace `readPersistedForms` bootstrap in `formsSlice` with `formsService.listForms()` on app load.
2. Replace `writeBuilderDraft` / `readBuilderDraft` calls with `formsService.saveBuilderSnapshot` / `getBuilderSnapshot`.
3. Replace `writePublishedForm` in `handlePublishForm` with `formsService.publishForm`.
4. Point `runAiLogicGeneration` to `logicService.generateFormLogic` when `isApiConfigured()`.
5. Swap analytics panels to `analyticsService.*` and remove demo constants.
6. Add error toasts on `ApiError` (status 401 → sign out).

---

## Questions for product/backend

1. Public form URL: subdomain per form vs path `/f/:id`?
2. Snapshot versioning / conflict if two tabs edit same form?
3. File uploads (images, uploads): S3 presigned URLs?
4. Rate limits on AI logic + AI insights endpoints?

---

## Contact / code pointers

| Topic | File |
|-------|------|
| Publish pipeline | `FormBuilderPage.jsx` → `handlePublishForm` |
| Readiness rules | `formPublishReadiness.js` |
| Respondent logic | `logicEngine.js`, `PublicFormPage.jsx` |
| API facades | `src/api/services/*` |
| Endpoint list | `src/api/endpoints.js` |
