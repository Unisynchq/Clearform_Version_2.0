# Backend Handoff — Clearform v2 (Frontend)

This document is for the **backend team**: what exists today, what the UI expects, and what to implement first.

**Start here:** The section below (**READ THIS FIRST**) comes from product QA on the live frontend. It lists what is broken or missing, what you must build, and how the frontend will connect. The rest of this file (from **Current state**) is the original technical handoff — endpoints, snapshot schema, and migration checklist. Read both.


---

## Frontend implementation log (for backend + frontend context)

Use this section to see what shipped on `main` without re-reading git history. Backend work is still required where noted below; these entries are **frontend-only** unless stated otherwise.

### 2026-06-04 11:38 — Published form matches builder Preview (frontend)

| Field | Value |
|-------|--------|
| **Date / time** | 2026-06-04 11:38 (local) |
| **Git branch** | `main` |
| **Commit** | `25b56eb` — *Align published form with builder preview using shared ContentCard renderer.* |
| **Repo** | https://github.com/Unisynchq/Clearform_Version_2.0 |
| **Backend changes** | **None** — no API routes, DTOs, or server code modified |

#### Problem (before)

- Builder **Preview** used `BuilderContentCard.jsx` (full design, motion, page indicator, step nav).
- Public **`/f/:formId`** used `FormRespondentView` + `RespondentScreenFields` (plain inputs, different layout, missing block types).
- Publish snapshot omitted some preview fields (`accentColor`, intro logo, intro essential block, merged logic-else branches).

#### What we fixed (frontend)

Published respondents now use the **same renderer path as preview**:

- `FormRespondentView` → `BuilderContentCard` (`isPreviewMode`) + `previewCanvasConfigsFromScreen.js`
- Same chrome: `PreviewPageIndicator`, `PreviewCardStepNav`, `PreviewPoweredBy`
- Same screen transitions: `motion` / `AnimatePresence`
- No extra Clearform header on `/f/:formId` (matches preview canvas)
- Richer publish snapshot from `FormBuilderPage` (see files below)

#### Files changed (this release only)

| File | What changed |
|------|----------------|
| `src/features/forms/components/FormRespondentView.jsx` | Rebuilt public runner: `ContentCard`, preview chrome, intro/end parity, logic runner, response submit unchanged |
| `src/features/forms/pages/PublicFormPage.jsx` | Loads published snapshot only; delegates all UI to `FormRespondentView` (no duplicate wrapper/header) |
| `src/features/forms/utils/respondentThemeStyles.js` | `resolveThemeFromSnapshot()` — typography id, card opacity, gradients, accent from `snapshot.theme` |
| `src/features/forms/pages/FormBuilderPage.jsx` | Snapshot adds `theme.accentColor`, `theme.fullCanvas`, `intro.logo`, `intro.essential`; merges `logicElseByScreen` into `logicIfRulesByEdge` on publish |
| `src/features/forms/utils/publishedFormLogic.test.js` | Tests for theme/intro round-trip and `previewCanvasConfigsFromScreen` |

**Not modified:** `src/api/endpoints.js`, backend services contract, Firebase, analytics API facades (beyond existing client usage).

#### Snapshot fields backend must preserve (new / important)

When implementing `POST /forms/:id/publish` and `GET /forms/:id/published`, round-trip these without renaming or dropping:

```json
{
  "intro": {
    "title", "description", "buttonText", "textSize", "alignment",
    "logo": "data:image/... or null",
    "essential": "CTA | Heading | ... | null"
  },
  "theme": {
    "layoutStyle", "fullCanvas", "background", "cardColor", "cardImage",
    "cardOpacity", "textColor", "accentColor", "typography"
  },
  "logicIfRulesByEdge": { "...": { "rules": [], "elseScreenId": number | null } }
}
```

#### Backend action still required

- Store and return the **full** snapshot JSON on publish/published (see **B.4** and **Snapshot schema**).
- Forms published **before** this commit should be **republished once** from the builder so new `intro` / `theme` fields exist in the live snapshot.
- Response quality on live forms still uses `POST /forms/:id/response-quality/evaluate` when `VITE_API_BASE_URL` is set (unchanged).

#### How to verify

1. Builder → Preview → note theme, blocks, logic.
2. Publish → open `/f/:formId` in incognito.
3. Confirm visual parity (card, indicator, Back/Continue, Powered by, animations).

---

## READ THIS FIRST — Product review and backend obligations

This block was added after hands-on QA of the Clearform v2 frontend on `main`. The UI is largely complete but still runs on **localStorage** and **demo data** in several places. Your APIs are what turn this into a real product. Do not skip this section.


### A. Data, tasks, and outcomes

#### A.1 Context


The frontend on `main` is structurally ready for backend integration: API client, endpoint map, and service facades exist under `src/api/`. Today, many flows still work offline via `localStorage` and seeded demo forms. Product testing found specific gaps between what users see and what a production backend must provide. The items below are **blocking** for a proper handoff — not nice-to-haves.

Frontend will wire each endpoint as you ship it (`VITE_API_BASE_URL` + `VITE_USE_MOCK_API=false`). Until then, demo fallbacks remain visible in places (called out below).


#### A.2 The `formId` rule (read this before any endpoint design)


Every feature must hang off a single **form id**. Do not store responses, analytics, webhooks, or AI results without a clear `formId` foreign key. Do not return aggregates that mix multiple forms.

```text
formId
  → PUT/GET  /forms/:id/builder-snapshot     (draft while editing)
  → POST     /forms/:id/publish              (canonical live version)
  → GET      /forms/:id/published            (public respondent reads this)
  → POST/GET /forms/:id/responses            (submissions)
  → GET      /analytics/forms/:id/*          (dashboard analytics)
  → GET/PATCH /forms/:id/integrations        (per-form connections)
  → POST     /forms/:id/webhooks             (delivery on new response, etc.)
  → POST     /forms/:id/logic/generate       (AI branching)
  → POST     /forms/:id/response-quality/evaluate
  → POST     /analytics/forms/:id/ai-insights
```

Public routes (`GET /forms/:id/published`, `POST /forms/:id/responses`) must not require auth but must validate that the form exists and is **live**.


#### A.3 Task list (who does what)


| # | Task | Primary owner | Outcome when done |
|---|------|---------------|-------------------|
| 1 | Form builder **Back** goes to Dashboard, not Sign in | Frontend | User never lands on `/signin` after Back from builder |
| 2 | **Responses** tied to the correct form | Backend + Frontend | Submit on `/f/:formId` creates a row; Analytics shows it for that `formId` only |
| 3 | **Response Quality AI** uses question + answer + sidebar parameters | Backend (+ Frontend wire) | Same quality feedback on live form as in builder preview |
| 4 | **Published form** matches builder **Preview** (design + logic) | Backend stores snapshot; Frontend renders it | `/f/:id` looks and behaves like preview mode |
| 5 | **Settings** — delete account, password reset, profile, integrations | Backend + Frontend | No “not available in this demo” toasts |
| 6 | **Do not save draft** many times for one edit | Frontend (debounce/dedupe); Backend accepts PUT | One meaningful snapshot write per edit burst + on leave/publish |
| 7 | Logic tab — **Generate Logic** control always visible | Frontend | User can always re-run or start AI logic from Logic tab |
| 8 | **Form ↔ Integrations ↔ Analytics** all use same `formId` | Backend scoped APIs + Frontend URLs | Picking form 123 in builder = analytics `?form=123` = webhooks for 123 |
| 9 | **Integrations** actually connect and fire | Backend OAuth/webhooks | Connect, test, and deliver events from UI |
| 10 | **Remove demo** surfaces when APIs are live | Frontend (after your APIs) | No “Sample data”, seed counts, or demo toasts in production |


#### A.4 Outcomes (what “done” looks like for users)


When this work is complete, all of the following must be true:

- A respondent finishes a public form → that submission appears under **that form’s** Analytics → Responses tab (after refresh or live update).
- The **responses count** on the dashboard form card matches the number of stored responses for that `formId` (not a fake seed number).
- **Response quality** nudges on the live form use the **question text**, the **current answer**, and the **criteria configured in the builder** (min words, vague words, etc.).
- The **published** form at `/f/:formId` matches what the builder **Preview** showed: theme, layout, field chrome, branching logic, and quality feedback.
- **Delete account**, password reset, and profile save hit real APIs and succeed or show real errors — not demo toasts.
- Editing the builder does not feel like it is “saving” ten times per minute; publish still saves one canonical snapshot.
- The Logic tab always shows a way to **Generate Logic** (not only before the first generation).
- Opening Analytics for form A never shows responses or stats from form B.
- Integrations are configured **per form** (or per account with explicit `formId` in webhook payload) and fire when a new response arrives.
- With `VITE_API_BASE_URL` set, end users do not see “Sample data” badges or mock AI copy pretending to be real insights.


---

### B. Detailed requirements (product QA items 1–10)


Each item below follows the same structure: what we saw, what should happen, frontend today, what backend must build (with contracts), how frontend connects, and how to verify.


---

#### B.1 Form builder — Back must go to Dashboard (not Sign in)


**What we saw**

In the form builder, pressing the header **Back** control sometimes navigates to the **Sign in** page instead of the **Dashboard**.

**What should happen**

- From a normal workflow (user signed in → dashboard → open form builder → Back), the user must land on **`/dashboard`**.
- Only the onboarding path may return to **`/onboarding`** when the user entered the builder with `fromOnboarding` state.

**What the frontend does today**

In `src/features/forms/pages/FormBuilderPage.jsx`, `performLeaveBuilder()` calls `navigate(-1)` when browser history length is greater than 1. If the user’s history stack includes `/signin` before `/dashboard`, Back goes to sign-in. This is a **frontend routing bug**; no API is involved.

**What backend must build**

Nothing. No endpoint change.

**How frontend will connect**

Frontend will remove `navigate(-1)` and always use explicit routes: `/dashboard` or `/onboarding` when `fromOnboarding` is true.

**Done when**

Sign in → dashboard → open any form → Back → dashboard. Sign in must never appear.

---

#### B.2 Responses must be connected to the form

**What we saw**

The Analytics **Responses** tab and dashboard **response counts** do not reliably reflect real submissions for the form being viewed. Data feels disconnected — counts can come from demo seed data while the responses table is empty (or the opposite).

**What should happen**

- Every submission on the public form URL is stored under **`formId`**.
- `GET /forms` and `GET /forms/:id` return an accurate **`responses`** count.
- Analytics → Responses lists only rows for the selected form.
- Performance / funnel / compare tabs aggregate only that form’s data.

**What the frontend does today**

- Analytics reads `selectFormResponses` from Redux `forms.responsesByFormId[formId]` (`src/store/slices/formsSlice.js`).
- `src/components/analytics/AnalyticsResponsesPanel.jsx` builds table columns from the builder draft + stored responses.
- `src/features/forms/pages/PublicFormPage.jsx` and `src/features/forms/components/FormRespondentView.jsx` run the form to completion but **do not** call `addFormResponse` or `appendFormResponse` (`src/features/forms/utils/formResponsesStorage.js`) when the respondent finishes.
- Demo forms in `src/constants/index.js` can show `responses: 500` (etc.) while `responsesByFormId` has no rows for that id.

**What backend must build**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/forms/:formId/responses` | Public (optional rate limit / captcha) | Create one submission when respondent completes or abandons per your product rules |
| GET | `/forms/:formId/responses` | User owns form | Paginated list for Analytics table |
| GET | `/forms/:formId/responses/:responseId` | User owns form | Detail drawer |
| GET | `/forms/:formId/responses/export?format=csv` | User owns form | Export |
| PATCH/GET | `/forms/:id` | User | `responses` count must match DB |

**Example POST body (public submit)**

```json
{
  "submittedAt": "2026-05-31T10:15:00.000Z",
  "answersByScreenId": {
    "12": {
      "shortTextDraft": "The onboarding flow was confusing at step 3.",
      "previewFields": {},
      "previewPicks": []
    },
    "15": {
      "ratingValue": 4
    }
  },
  "metadata": {
    "userAgent": "optional",
    "referrer": "optional",
    "durationMs": 120000
  }
}
```

Shape should mirror what the frontend stores locally today (`formResponsesStorage` + `formResponseBuilder.js` for display). At minimum: stable `responseId`, `formId`, `submittedAt`, and per-screen answer blobs.

**Example GET list item**

```json
{
  "id": "resp_abc123",
  "formId": 42,
  "submittedAt": "2026-05-31T10:15:00.000Z",
  "respondentLabel": "Anonymous",
  "responseType": "Completed",
  "answersByScreenId": { }
}
```

**How frontend will connect**

On end-screen completion (or final submit), `FormRespondentView` will `POST` to your API, then dispatch `addFormResponse` for immediate UI. Analytics panels will call `GET` when `isApiConfigured()`. Dashboard form cards will use API `responses` field.

**Done when**

Complete `/f/42` as a respondent → open Analytics with `?form=42` → new row appears → dashboard card for form 42 increments by 1.

---

#### B.3 Response Quality AI — question, answer, and builder parameters (prompt context)

**What we saw**

Response quality scoring in the builder preview can nudge the user about answer quality, but it does not consistently use the **full context**: the **question being asked**, what the user is **typing**, and the **parameters set in the right-hand panel** (min words, sensitivity, vague words, topic keywords, which criteria are enabled).

**What should happen**

- The AI (or rules engine) evaluates the answer **in context of that specific question**.
- Only **enabled criteria** from the builder settings apply (length, specificity, relevance, completeness).
- The same feedback appears on the **published** form while typing, not only in the builder preview.

**What the frontend does today**

- `src/features/forms/utils/responseQualityScoring.js` — client-side heuristics only; file comment says “Dummy … (no AI)”.
- `src/features/forms/formBuilder/BuilderContentCard.jsx` calls `evaluateResponseQuality()` in **preview mode** only.
- Settings live in screen `config` and in panel state, synced via `screenConfigSync.js` into the publish snapshot (`longTextResponseQualityEnabled`, `longTextResponseQualityOptions`, `shortTextResponseQuality*`).
- `PublicFormPage` / `FormRespondentView` **do not** call quality evaluation today.

**What backend must build**

**Endpoint:** `POST /forms/:formId/response-quality/evaluate`

Call this on debounced keystrokes (frontend will throttle) for long-text and short-text screens when quality is enabled in the published snapshot.

**Full request body (required fields)**

```json
{
  "formId": 123,
  "screenId": 5,
  "fieldId": "long-text",
  "questionText": "What went wrong during onboarding?",
  "fieldType": "Long text",
  "helperText": "Be specific — mention steps, screens, or errors.",
  "answerText": "It was fine I guess",
  "options": {
    "minWords": 10,
    "sensitivity": "Medium",
    "vagueWords": "good, fine, okay, great",
    "topicKeywords": "onboarding, step, error, confusing",
    "keywordThreshold": 1,
    "criteria": {
      "length": { "enabled": true, "minWords": 10 },
      "specificity": { "enabled": true, "sensitivity": "Medium", "vagueWords": "good, fine, okay, great" },
      "relevance": { "enabled": true, "topicKeywords": "onboarding, step, error", "keywordThreshold": 1 },
      "completeness": { "enabled": true }
    }
  }
}
```

**Response body (must match frontend UI)**

```json
{
  "level": "amber",
  "message": "Your answer uses vague language. Replace words like \"fine\" with specific details about what happened at which step.",
  "failedIds": ["specificity"]
}
```

- `level`: `"green"` | `"amber"` | `"red"`
- `message`: one short, actionable sentence shown to the respondent
- `failedIds`: subset of `length`, `specificity`, `relevance`, `completeness`

**Suggested system prompt (copy into your LLM service)**

```text
You evaluate survey response quality for a single question.

You will receive:
- questionText: the exact question shown to the respondent
- helperText: optional instructions shown under the question
- answerText: what the respondent has typed so far (may be partial)
- options.criteria: which checks are enabled and their parameters (minWords, sensitivity, vagueWords, topicKeywords, keywordThreshold)

Rules:
1. Only evaluate criteria marked enabled: true. Ignore disabled criteria entirely.
2. Use questionText and helperText to judge relevance — do not expect topics not related to the question.
3. For length, count words in answerText against minWords when length is enabled.
4. For specificity, flag vague words from vagueWords when sensitivity is enabled.
5. For relevance, check topicKeywords appear when relevance is enabled.
6. For completeness, detect incomplete sentences or trailing fragments when completeness is enabled.
7. Return JSON only: { "level": "green"|"amber"|"red", "message": string, "failedIds": string[] }
8. green = passes all enabled checks; amber = one issue; red = two or more issues or severe failure.
9. message must be helpful and refer to the question context, not generic praise.

Do not invent criteria. Do not return markdown.
```

**Optional:** `GET /analytics/forms/:formId/response-quality` for aggregate “high quality %” on Compare tab.

**How frontend will connect**

When `VITE_API_BASE_URL` is set, preview and public form will POST evaluate payload built from screen `config` + current draft text. Until then, local `responseQualityScoring.js` remains fallback in preview only.

**Done when**

Enable quality on a long-text question with min 10 words → type “good” on live `/f/:id` → amber/red message references the question and vague wording → full sentence passes → green.

---

#### B.4 Published form must match builder Preview (design and logic)

**What we saw**

What the form owner sees in **Preview** inside the builder (styled card, theme, page chrome, logic paths) does not fully match what respondents see on the **published** public URL. Published UI is simpler and may miss theme, response quality, and visual parity.

**What should happen**

- **Preview** and **`/f/:formId`** must use the **same published snapshot** and the **same rendering approach** for screens, theme, and logic.
- Branching defined in `logicConnections` and `logicIfRulesByEdge` must behave the same (logic runs in the browser via `logicEngine.js` / `formLogicRunner.js` — you do not execute logic on the server for navigation).

**What the frontend does today**

- **Preview** and **published** (`/f/:formId`) both use `BuilderContentCard.jsx` via `FormRespondentView.jsx` with `previewCanvasConfigsFromScreen.js` (shipped **2026-06-04**, commit `25b56eb`).
- `PublicFormPage.jsx` loads published snapshot only (`getPublishedForm` / `readPublishedForm`) — no builder-draft fallback.
- Logic runs in the browser (`formLogicRunner.js` / `logicEngine.js`); branching works when snapshot includes `logicConnections`, `logicIfRulesByEdge` (with `elseScreenId`), and per-screen `config`.

**What backend must build**

- `POST /forms/:id/publish` must persist the **full** snapshot from `buildPublishSnapshot()` (see **Snapshot schema** later in this file).
- `GET /forms/:id/published` must return that JSON **unchanged** for anonymous respondents.
- Do not maintain a separate “simplified” public schema.

**How frontend will connect**

Frontend already uses one respondent renderer for preview and public. Backend must return the complete snapshot (including `theme.accentColor`, `intro.logo`, `intro.essential`) on `GET /forms/:id/published`.

**Done when**

Change theme and add a logic branch in builder → publish → open `/f/:id` → respondent sees the same colors, fonts, screen order, branches, and quality nudges as preview.

---

#### B.5 Settings — delete account and other settings must work

**What we saw**

Profile and settings actions show toast messages like **“not available in this demo”** instead of performing real operations (delete account, password reset email, some integration configuration).

**What should happen**

- Delete account removes the user and their session.
- Password reset sends email (or your auth provider flow).
- Profile fields save to the server.
- Integration connect/disconnect persists and reflects in the form builder / integrations UI.

**What the frontend does today**

| Action | File |
|--------|------|
| Delete account | `src/features/profile/pages/ProfilePage.jsx` |
| Password reset | `src/features/profile/components/ProfileSecurityPanel.jsx` |
| Integration config toast | `src/features/profile/components/ProfileIntegrationsPanel.jsx` |
| Integrations modal | `src/features/forms/components/ManageIntegrationsModal.jsx` (local storage via `profileIntegrationDefaults`) |

**What backend must build**

| Action | Suggested API |
|--------|----------------|
| Delete account | `DELETE /auth/me` or `POST /auth/delete-account` (confirm body if needed) |
| Password reset | `POST /auth/forgot-password` with `{ "email" }` |
| Update profile | `PATCH /auth/me` — name, email, display name, avatar |
| Change password | `POST /auth/change-password` when logged in |
| Sign out | `POST /auth/sign-out` |

Integrations are covered in B.8 and B.9.

**How frontend will connect**

Replace demo toasts with API calls; on 401 use existing `ApiError` handling (sign out). Show success/error toasts from server messages.

**Done when**

Delete account → user logged out and cannot sign in with same credentials. Forgot password → email flow triggered (or valid error). No demo toast strings in production.

---

#### B.6 Do not save draft multiple times (one save is enough)

**What we saw**

The form builder feels like it saves the draft **over and over** while editing (many writes for one editing session).

**What should happen**

- While typing, at most **one autosave per meaningful pause** (not every second on every keystroke if nothing changed).
- Always save once when the user **leaves** the builder or **publishes**.
- Backend should accept **full snapshot** PUTs, not require micro-patch chatter.

**What the frontend does today**

`FormBuilderPage.jsx` (~lines 3800–3844): **1 second debounced** `useEffect` with a **large dependency list** (screens, logic, theme, settings, AI status, etc.). Each firing calls `writeBuilderDraft()` and Redux `updateForm`. Identical snapshots may still rewrite localStorage.

**What backend must build**

| Method | Path | Notes |
|--------|------|--------|
| PUT | `/forms/:id/builder-snapshot` | Full body; include `savedAt` timestamp |
| Optional | `If-Match` / `version` | Conflict if two tabs edit same form (see Questions section) |

Do not implement partial field-level PATCH unless agreed with frontend — the UI sends the whole snapshot from `buildPublishSnapshot()`.

**How frontend will connect**

Frontend will increase debounce, skip write when snapshot hash unchanged, and keep `flushBuilderDraft()` on leave/publish. Will call `formsService.saveBuilderSnapshot` when API is configured instead of direct `writeBuilderDraft`.

**Done when**

Edit one field, wait — only one network PUT (or one local write) after pause; leaving builder always persists latest snapshot once.

---

#### B.7 Logic tab — Generate / Create logic control must always stay visible

**What we saw**

On the Logic tab, the **“Generate Logic”** banner (AI-Driven Logic) **disappears** after logic exists on the canvas. Users expect a persistent way to regenerate or start logic, similar to always having a **Create / Generate** action available.

**What should happen**

- The Logic tab should **always** expose **Generate Logic** (AI) even after connections exist.
- Manual **If/Then** editing (`IfThenLogicPanel.jsx`, **Save Logic** button) remains available on edges; AI regenerate must not be hidden after first success.

**What the frontend does today**

- `AiLogicIdleBanner.jsx` — “Generate Logic” button.
- Shown only when `!showLogicCanvas`, where `showLogicCanvas = logicModeManual || aiLogicReady || hasLogicOnCanvas`. Once connections exist, the banner is **hidden**.
- AI generation API: `POST /forms/:id/logic/generate` — already documented; `logicService` wired when API configured.

**What backend must build**

Existing contract (see **Priority 2.5 — AI integration** below):

```json
POST /forms/:formId/logic/generate
{
  "screens": [...],
  "contentScreens": [...],
  "formTitle": "optional"
}
```

Response: `{ "connections", "ifRulesByEdge", "showIfByScreenId" }` per `applyAiLogicResult.js`. Support **regenerate** (replace or merge — document your behavior; frontend can replace canvas state). Rate limit with **429** and clear JSON error message.

**How frontend will connect**

Frontend will use a **sticky** Logic tab header with always-visible Generate Logic; calling `logicService.generateFormLogic` on each click when API is set.

**Done when**

After AI logic is applied and canvas shows wires, user still sees **Generate Logic** at top of Logic tab and can run it again.

---

#### B.8 Form, Integrations, and Analytics must all reference the same form

**What we saw**

Analytics, integrations, and the form builder can feel like separate apps — e.g. integrations open a generic profile tab without clear `formId`, while analytics uses `?form=` in the URL.

**What should happen**

- When the user is editing form **123**, integrations and webhooks for that form apply to **123**.
- Analytics at `/dashboard/analytics?form=123` shows only data for **123**.
- Webhook payloads and AI insights requests include **`formId`**.

**What the frontend does today**

- Analytics: `useAnalyticsPageState.js` — `?form=` query param (good pattern).
- Builder settings: “Manage integrations” may navigate to profile without scoping to `activeFormId`.
- `IntegrationsPanel.jsx` redirects to `/dashboard/profile?tab=integrations`.

**What backend must build**

All analytics and integration routes must include `formId`:

```http
GET    /analytics/forms/:formId/performance
GET    /analytics/forms/:formId/responses
GET    /analytics/forms/:formId/compare
POST   /analytics/forms/:formId/ai-insights

GET    /forms/:formId/integrations
PATCH  /forms/:formId/integrations
POST   /forms/:formId/webhooks
POST   /forms/:formId/webhooks/:webhookId/test
DELETE /forms/:formId/webhooks/:webhookId
```

Webhook JSON on `response.created` example:

```json
{
  "event": "response.created",
  "formId": 123,
  "responseId": "resp_abc",
  "submittedAt": "2026-05-31T10:15:00.000Z",
  "formTitle": "Customer feedback Q2"
}
```

**How frontend will connect**

Pass `activeFormId` into integration modals; link from form overlay to `/dashboard/analytics?form={id}`; store integration config keyed by form on server, not only in profile localStorage.

**Done when**

Two forms A and B — webhook test for A fires only on A’s submit; analytics for `?form=A` never includes B’s responses.

---

#### B.9 Integrations must work (not just UI placeholders)

**What we saw**

Integrations UI exists (webhook URL, Google Sheets, etc.) but connection is **local/profile storage** or demo — not a live backend.

**What should happen**

- User can connect Google Sheets (or your supported providers), save webhook URL, **test** delivery, and receive events on new responses.
- Connection status (connected / error) is visible per form or per account per your product model.

**What the frontend does today**

- `ManageIntegrationsModal.jsx`, `IntegrationsPanel.jsx`, `profileIntegrationDefaults.js`, `readIntegrationSettings(email)`.
- Razorpay billing remains placeholder (`RazorpayCheckoutPlaceholder.jsx`) — separate from form integrations.

**What backend must build**

- OAuth flows or API keys per provider (at minimum **webhook** + one of Sheets/Slack if product requires).
- Persist connection per user and/or per `formId`.
- `POST .../webhooks/.../test` returns success/failure with log snippet.
- Delivery queue with retries; store last error on integration record.

**How frontend will connect**

Replace localStorage merge with GET/PATCH integrations API; show connected badges from server truth.

**Done when**

Paste webhook URL → Test → 200 and sample payload received; submit real response → webhook receives `response.created`.

---

#### B.10 Remove all demo pieces when APIs are live

**What we saw**

Parts of the app still show **demo / sample** behavior: fake analytics, seed forms, demo toasts, mock AI insights copy, `client-demo` service fallbacks.

**What should happen**

When `VITE_API_BASE_URL` is set and your endpoints return real data, users should never see misleading demo content.

**What the frontend does today (remove as you ship APIs)**

| Demo surface | Location | Remove when |
|--------------|----------|-------------|
| “Sample data” badge | `src/pages/AnalyticsPage.jsx` | Analytics APIs return real series |
| Hardcoded AI insights | `src/components/analytics/AnalyticsAiInsightsPanel.jsx` | `POST .../ai-insights` |
| Demo performance/compare charts | `analyticsStats.js`, compare panels | `GET performance`, `GET compare` |
| Seed forms | `src/constants/index.js` bootstrap | `GET /forms` on app load |
| Demo toasts | Profile pages | Real auth/profile APIs |
| `source: 'client-demo'` | `src/api/services/analyticsService.js` | API configured |
| Local-only responses | `formResponsesStorage` | `POST/GET responses` |

**What backend must build**

Ship the endpoints in Priorities 1–2 and 2.5 so frontend can delete fallbacks. Return explicit empty states (`{ items: [], total: 0 }`) instead of errors when no data.

**How frontend will connect**

Frontend removes mock constants in the same PR that wires your endpoint; coordinates with you on field names.

**Done when**

Production `.env` has API URL — no “Sample data”, no demo toasts, empty analytics shows “no responses yet” not fake charts.


---

### C. General advice — building this backend properly

Read this before you start coding. These are lessons from how this frontend is built and where teams usually go wrong.

#### C.1 Read the contract before you invent fields

Start with `src/api/endpoints.js` and the **Snapshot schema** section in this file. For AI logic, read `src/features/forms/utils/applyAiLogicResult.js` — the frontend normalizes your JSON into canvas state. If you use snake_case (`if_rules_by_edge`, `then_screen_id`), that is fine **only** if you match what the normalizer expects. When in doubt, return the camelCase shapes shown in the examples above.

Do not add required fields the frontend does not send yet without coordinating — the UI will send `undefined` and your validator may 400 valid requests.

#### C.2 Scope everything by `formId` and ownership

For authenticated routes, verify the form belongs to the current user (or workspace). Return **404** for wrong id, not **403** with leaked existence, unless product prefers otherwise.

Public exceptions:

- `GET /forms/:id/published` — only if `status === live`
- `POST /forms/:id/responses` — only if form is live; rate-limit by IP

#### C.3 Auth and errors

- JWT in header: `Authorization: Bearer <token>`
- Frontend stores token at `sessionStorage['clearform:auth-token']`
- On **401**, frontend should sign the user out — return a clear JSON body `{ "message": "..." }`
- On **429** (AI endpoints), return retry guidance — logic UI already mentions API 429

#### C.4 Published snapshot is the source of truth for respondents

The browser runs all branching locally from `GET /forms/:id/published`. Your job is to **store and serve** the snapshot accurately, not to reinterpret it. Theme, screens, logic, and per-screen `config` (including response quality options) must round-trip without loss.

#### C.5 Full snapshot on PUT, not silent partial updates

The builder sends the entire `buildPublishSnapshot()` payload on draft save and publish. If you support versioning, return `savedAt` or `version` on PUT so two tabs can detect conflicts later.

#### C.6 Responses are the hub for analytics and webhooks

When a response is created:

1. Persist row with `formId`
2. Atomically increment `forms.responses` count (or compute via COUNT — but be consistent with list endpoints)
3. Enqueue webhooks and async analytics aggregation if needed

Analytics tabs should read from the same tables, filtered by `formId` and date `range`.

#### C.7 AI endpoints: throttle and log

`logic/generate`, `response-quality/evaluate`, and `ai-insights` will be expensive. Rate limit per user and per form. Log prompt inputs for debugging but respect privacy policy on answer text.

For **response-quality**, the model must receive **questionText**, **helperText**, **answerText**, and **options.criteria** — not just the answer alone.

#### C.8 Webhooks

- Events at minimum: `response.created` (and optionally `form.published`)
- Payload must include `formId`, `responseId`, `submittedAt`
- Provide a **test** endpoint the UI can call without creating a fake response
- Implement retries with backoff; surface `lastError` on integration status

#### C.9 CORS, base URL, and environments

Frontend uses `VITE_API_BASE_URL` (e.g. `https://api.yourdomain.com/v1`). Enable CORS for the web app origin. Keep all routes under the same version prefix the frontend expects.

#### C.10 Test with the real UI

Recommended manual path:

1. Sign up → onboarding → create form in builder
2. Add questions, theme, logic (AI or manual)
3. Publish
4. Open `/f/:formId` in incognito, complete submission
5. Sign in → Analytics `?form=thatId` → Responses tab
6. Connect webhook → test → submit again → verify delivery

Run frontend with:

```env
VITE_API_BASE_URL=https://your-api/v1
VITE_USE_MOCK_API=false
```

#### C.11 Coordinate releases with frontend

When an endpoint is ready, tell frontend which service method will call it (`formsService`, `analyticsService`, etc.). Frontend will remove the matching demo fallback in the same release. Partial handoffs confuse QA (half real, half mock).

#### C.12 Open questions

Add rows to **Questions for product/backend** at the end of this file if you need decisions (merge vs replace on AI logic regenerate, subdomain vs `/f/:id`, upload presigns, etc.). Do not guess silently.


---

## END OF “READ THIS FIRST” — original handoff continues below


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
| AI logic | Local stub when no API; **`logicService` wired** when `VITE_API_BASE_URL` set | `POST /forms/:id/logic/generate` |
| Response quality | Frontend heuristics (builder preview only) | `POST /forms/:id/response-quality/evaluate` (proposed) |
| Notifications | `notificationsStorage` | `GET /notifications` |

Frontend API scaffolding (ready to wire):

- `src/api/client.js` — `fetch` wrapper, `ApiError`, Bearer token from `sessionStorage['clearform:auth-token']`
- `src/api/endpoints.js` — path map (includes response-quality routes)
- `src/api/services/formsService.js` — falls back to localStorage when `VITE_API_BASE_URL` is empty
- `src/api/services/analyticsService.js` — includes `fetchCompareAnalytics`
- `src/api/services/logicService.js` — **called from Form Builder when API configured**
- `src/config/env.js` — `VITE_API_BASE_URL`, `VITE_USE_MOCK_API`
- `.env.example`

Set in deployment:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/v1
VITE_USE_MOCK_API=false
```

Run handoff audit before release: `npm run audit:handoff`

---

## Routing contract (verified)

| Flow | Destination | Notes |
|------|-------------|--------|
| **Sign-up success** | `/onboarding` | Dispatches `startOnboarding()`, resets demo forms |
| **Sign-in success** | `/dashboard` | Or `location.state.from` if user was redirected from a protected route |
| **Sign-in** | Never onboarding | `dismissOnboardingSession()` on login |
| **Onboarding skip** | `/dashboard` | `completeOnboarding()` |
| **Onboarding publish → Home** | `/dashboard` | `completeOnboarding()` when `fromOnboarding` |
| **Guest route while authed** | `/onboarding` if onboarding active, else `/dashboard` | `GuestOnly.jsx` |
| **Unauthenticated protected route** | `/signin` with `state.from` | `RequireAuth.jsx` |

Implementation: `src/features/onboarding/utils/authOnboarding.js`, `src/routes/AppRoutes.jsx`

---

## Browser tab metadata

- **Favicon:** `public/favicon.png` (Clearform C mark)
- **Default title:** `Clearform` in `index.html`
- **Dynamic titles:** `src/constants/pageTitles.js` + `src/hooks/usePageTitle.js` — e.g. `Dashboard · Clearform`, `Analytics · Clearform`, `{formTitle} · Clearform` on builder/public routes

Backend SSR (if added later) should follow the same `{Page} · Clearform` pattern.

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

**Stubs (no backend yet):** Google/Microsoft OAuth buttons, forgot-password link on sign-in.

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

Frontend auto-saves every ~1s while editing (debounced in `FormBuilderPage.jsx`). Today uses `writeBuilderDraft` directly; swap to `formsService.saveBuilderSnapshot` when API is live.

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

Per-screen config includes response-quality flags (`longTextResponseQualityEnabled`, `shortTextResponseQualityOptions`, etc.) via `screenConfigSync.js`.

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

Until these exist, the UI shows **sample series** and an Analytics **“Sample data”** badge.

---

## Priority 2.5 — AI integration

### A. Form Builder AI Logic

**Endpoint:** `POST /forms/:formId/logic/generate`

**Purpose:** Generate branching connections and if/then rules from form structure. Respondent navigation uses the stored snapshot only — backend does not execute logic at submit time.

**Frontend wiring:** When `VITE_API_BASE_URL` is set, `FormBuilderPage.jsx` calls `logicService.generateFormLogic(formId, context)` via `runAiLogicGeneration`. Otherwise uses local stub (`buildLocalAiLogicSuggestion`).

**Request body:**

```json
{
  "screens": [{ "id": 1, "label": "...", "type": "...", "config": {} }],
  "contentScreens": [{ "id": 2, "label": "Question 1", "fields": [] }],
  "formTitle": "optional"
}
```

**Response** (normalized by `applyAiLogicResult.js`; snake_case aliases accepted):

```json
{
  "connections": [{ "from": 1, "to": 2, "kind": "next" | "if" | "end" }],
  "ifRulesByEdge": {
    "1-2": {
      "rules": [{ "id": "...", "thenScreenId": 3, "conditions": [{ "sourceScreenId": 2, "fieldId": "...", "operator": "equals", "value": "..." }] }],
      "elseScreenId": 4
    }
  },
  "showIfByScreenId": {}
}
```

**Backend requirements:**

- Analyze screen graph + field types from `logicFieldCatalog.jsx`
- Return at least one valid connection or 422 with message
- Rate limit (UI default error copy references HTTP 429)

---

### B. Response Quality AI

**Current state:** Rule-based heuristics in `responseQualityScoring.js` (“Dummy … no AI”). Works in **builder preview only**; not on live `PublicFormPage` yet.

**Config in snapshot** per screen: `longTextResponseQualityEnabled`, `longTextResponseQualityOptions`, `shortTextResponseQuality*`.

**Options shape:**

```json
{
  "minWords": 10,
  "sensitivity": "Low" | "Medium" | "High",
  "vagueWords": "good, fine, okay",
  "topicKeywords": "experience, product",
  "keywordThreshold": 1,
  "criteria": ["length", "specificity", "relevance", "completeness"]
}
```

**Proposed endpoints** (defined in `endpoints.js`):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/forms/:formId/response-quality/evaluate` | Real-time scoring while respondent types |
| GET | `/analytics/forms/:formId/response-quality` | Aggregate “high quality %” for compare tab |

**Evaluate request:**

```json
{
  "screenId": 3,
  "fieldId": "long-text-1",
  "text": "user answer...",
  "options": { "minWords": 10, "criteria": ["length", "specificity"] }
}
```

**Evaluate response:**

```json
{
  "level": "green" | "amber" | "red",
  "message": "Human-readable nudge",
  "failedIds": ["length", "specificity"]
}
```

---

### C. Analytics AI modules

**Endpoint:** `POST /analytics/forms/:formId/ai-insights`

**UI:** `AnalyticsAiInsightsPanel.jsx` — mock until API returns data (simulated 1.8s load today).

**Modules backend should populate:**

| Module | Frontend file | Payload fields |
|--------|---------------|----------------|
| AI Summary + NPS | `AnalyticsAiInsightsPanel.jsx` | `summaryText`, `npsScore`, sentiment |
| Priority Focus | same | `priorityTitle`, `priorityBody`, `impactEstimate` |
| Top Patterns | `TOP_PATTERNS` constant | `[{ percent, label, tag, description, examples[] }]` |
| Quick Stats | `aiInsights/quickStatsData.js` | 7-day counts, sentiment split |
| Recommended Actions | `aiInsights/recommendedActionsData.js` | `[{ title, description, priority, actionType }]` |
| Seven-day chart | `aiInsights/SevenDayTrendChart.jsx` | time series from quick stats |

**Gates (frontend-enforced):** min 10 responses for AI insights; min 25 for reliable Top Patterns.

**Request body:** `{ "range": "7d" | "30d" | "90d" | "all" }`

---

## Priority 3 — Workspaces, templates

| Area | Path | Notes |
|------|------|--------|
| Workspaces | `/workspaces` | id, label, color, count |
| Templates | `/templates` | match `TEMPLATE_CATALOG` shape in frontend |

---

## Priority 4 — Billing / profile (placeholders)

- Razorpay checkout is UI placeholder (`RazorpayCheckoutPlaceholder.jsx`)
- Profile billing tab uses computed usage from Redux + localStorage
- **Demo toasts (expected until backend):** account deletion, password reset email, third-party integration config — see ProfilePage, ProfileSecurityPanel, ProfileIntegrationsPanel

---

## Migration checklist (frontend will do when API is ready)

1. Replace `readPersistedForms` bootstrap in `formsSlice` with `formsService.listForms()` on app load.
2. Replace `writeBuilderDraft` / `readBuilderDraft` calls with `formsService.saveBuilderSnapshot` / `getBuilderSnapshot`.
3. Replace `writePublishedForm` in `handlePublishForm` with `formsService.publishForm`.
4. ~~Point `runAiLogicGeneration` to `logicService.generateFormLogic` when `isApiConfigured()`.~~ **Done.**
5. Swap analytics panels to `analyticsService.*` and remove demo constants.
6. Wire `PublicFormPage` to `responseQuality` evaluate endpoint when configured.
7. Add error toasts on `ApiError` (status 401 → sign out).

---

## Questions for product/backend

1. Public form URL: subdomain per form vs path `/f/:id`?
2. Snapshot versioning / conflict if two tabs edit same form?
3. File uploads (images, uploads): S3 presigned URLs?
4. Rate limits on AI logic + AI insights + response-quality endpoints?

---

## Contact / code pointers

| Topic | File |
|-------|------|
| Routing / auth navigation | `authOnboarding.js`, `AppRoutes.jsx` |
| Page titles | `pageTitles.js`, `usePageTitle.js` |
| Publish pipeline | `FormBuilderPage.jsx` → `handlePublishForm` |
| Readiness rules | `formPublishReadiness.js` |
| Respondent logic | `logicEngine.js`, `PublicFormPage.jsx` |
| AI logic apply | `applyAiLogicResult.js`, `aiLogicGeneration.js` |
| Response quality (client) | `responseQualityScoring.js` |
| Analytics AI UI | `AnalyticsAiInsightsPanel.jsx` |
| API facades | `src/api/services/*` |
| Endpoint list | `src/api/endpoints.js` |
| Handoff audit script | `scripts/audit-handoff.mjs` |
