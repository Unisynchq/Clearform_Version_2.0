# Backend Handoff — Clearform v2 (Frontend)

This document is for the **backend team**: what exists today, what the UI expects, and what to implement first.

**Start here:** The section below (**READ THIS FIRST**) comes from product QA on the live frontend. It lists what is broken or missing, what you must build, and how the frontend will connect. The rest of this file (from **Current state**) is the original technical handoff — endpoints, snapshot schema, and migration checklist. Read both.


---

## Frontend implementation log (for backend + frontend context)

Use this section to see what shipped on `main` without re-reading git history. Backend work is still required where noted below; these entries are **frontend-only** unless stated otherwise.

### 2026-07-03 — Response quality redesign + builder hydration hardening (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-07-03 |
| **Scope** | Frontend-only UI/state pass for response quality, plus client-side builder hydration hardening for template-created forms |
| **Backend changes** | **No new endpoint.** Existing `POST /forms/:id/response-quality/evaluate` contract is still the path, but the frontend now sends richer context: `sessionId`, optional `conversationHistory`, and owner `customInstructions` inside `options`. Backend should also apply a **default internal prompt/fallback instruction set** when `customInstructions` is empty so quality feedback remains stable even when the form owner has not saved a preference |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Response quality panel** | Rebuilt the short-text/long-text configure UI into a flatter “Response quality” section with AI preference editing, saved/edit/delete states, advanced-options disclosure, stronger disabled states, and cleaner typography |
| **Preference persistence** | Owner AI guidance is now stored in `customInstructions` on the existing response-quality options object; no schema break on the frontend side, but published/draft snapshots must continue to round-trip that field exactly |
| **Live builder UX** | Removed repetitive success toasts for AI preference saves; added explicit loading state for “Improve with AI” |
| **Template-created builder sessions** | Seeded `builderSnapshot` earlier and hardened hydration guards so first-save navigation does not snap the builder back to the Start screen |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/components/ResponseQualityScoringCard.jsx` | Redesigned response-quality UI; added `customInstructions`; advanced options; loading/saved states |
| `src/features/forms/components/ResponseQualityScoringCard.test.js` | Added focused coverage for saved state, loading state, and disabled criteria styling |
| `src/features/forms/pages/FormBuilderPage.jsx` | Removed noisy success toasts for AI preference saves; preserved active builder content across first-save hydration |
| `src/features/forms/utils/createFormFromTemplateFlow.js` | Seeds `builderSnapshot` before navigating to the builder |
| `src/features/forms/utils/createFormFromTemplateFlow.test.js` | Verifies `builderSnapshot` is created when forms are built from templates |

**Backend note:** if `options.customInstructions` is blank, do **not** skip quality guidance. Use a backend-owned default prompt/template that still evaluates the enabled criteria against the question context.

---

### 2026-07-01 — Fix: builder jumped to Start screen on first save of a new form (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-07-01 |
| **Scope** | Frontend-only — form builder hydration / active-screen preservation |
| **Backend changes** | **None.** No API, endpoint, or snapshot change. Context for backend: this bug only reproduced **when the API is configured** (`isApiConfigured()`), because editing a brand-new form triggers the auto-persist flow that creates the draft (`createFormAndSaveSnapshot`) and then navigates to the new form URL. That create-then-navigate flow is expected and unchanged |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Builder hydration** | Creating a form and clicking into the first question snapped the canvas back to the Start/intro screen. Cause: the first-save auto-persist does `navigate(replace)` to the new form id, which changes `activeFormId` + `location.key` and resets the `builderActiveHydratedRef` guard; the follow-up re-hydration then treated it as a first load and forced the active screen to `screens[0]` (intro). Added `preserveActiveScreenOnNextHydrateRef` (set right before that self-navigation); `applyBuiltFormState` keeps the screen being edited when the flag is set (or on a normal re-hydrate) and it still exists in the hydrated screens. Genuine first loads still focus the intro |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/pages/FormBuilderPage.jsx` | `preserveActiveScreenOnNextHydrateRef` set before first-save nav; `applyBuiltFormState` honors it to preserve the active screen across the id-swap re-hydration |

**No snapshot/schema change.** The create-draft-then-navigate persistence flow is unchanged; this is purely a client-side active-screen preservation fix.

---

### 2026-07-01 — Builder UX pass: logic canvas, inline editing, themes, dashboard polish (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-07-01 |
| **Scope** | Frontend-only — form builder canvas/logic, inline editing, theme picker, sidebar, dashboard/analytics |
| **Backend changes** | **None required.** All items are frontend-only. Two persistence notes: (1) **Saved custom themes** are stored in `localStorage` keyed per account email (`clearform_saved_themes`) — this is a client-only convenience, no API/snapshot field yet; if theme sync across devices is wanted later, that becomes a backend task. (2) **Screen-id integrity fix** hardens the frontend id generator so restored snapshots that omit `nextId` can no longer produce duplicate screen ids — the snapshot schema is unchanged, but backends persisting builder snapshots **should round-trip `nextId`** (already documented in the snapshot schema) to keep ids stable |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Logic canvas — screen ids** | Newly added screens could get a duplicate id when a restored snapshot omitted `nextId` (fell back to `100`, colliding with existing content ids `≥101`). Id-keyed lookups (e.g. the logic reorder `Map`) collapsed the pair, so the new screen vanished from Logic. `applyBuiltFormState` now sets the id counter to `max(built.nextId, maxExistingScreenId + 1, 100)`; `addContentScreen` also guards against reusing a live id |
| **Logic canvas — panning** | Fixed locked/jerky horizontal panning (`clampLogicCanvasPan` was pinning X); then refactored to momentum/inertia panning via a single `requestAnimationFrame` loop with direct `translate3d` DOM writes (decoupled from React state), and made the zoom `%` readout click-to-edit (25–250%) |
| **Logic canvas — drag + banner** | Fixed screen cards not being draggable (moved drag tracking to window-level pointer listeners so `setPointerCapture` survives re-renders); added a dismiss (×) button to the "AI logic applied" banner |
| **Inline editing** | Intro title, End-screen title + description are now editable directly on the canvas; End "Edit" enters edit mode with a fade/slide animation |
| **Required master toggle** | Contact + Address configure panels have a master "Required" toggle that cascades to all sub-fields, with per-field override preserved |
| **Theme picker** | Save/apply/delete custom themes (account-scoped by email); smaller preset cards; smooth animation for the "save current theme" inline row |
| **Content blocks** | Captcha shows a "coming soon" badge in the content-creation grid; removed the stray "Change image" button from the Image block footer |
| **Dashboard / Analytics** | Right-click on a form card/row opens the same context menu as the "···" button; Create-Form button shows a "Creating…" spinner + disabled state; Analytics header form-selector made more prominent |
| **Sidebar** | Workspace items use an animated color-filled folder tile; "Help & Support" replaced with a wired "Log out" button; session-location label now derives city + `GMT±HH:MM` from the same timezone source (fixes mismatched city/country) |

#### Files changed (this pass)

| File | What changed |
|------|----------------|
| `src/features/forms/pages/FormBuilderPage.jsx` | Screen-id collision guard; logic momentum panning + editable zoom; window-level card drag; dismissible AI banner; intro/end inline editing; master required toggles; theme save/apply/delete |
| `src/features/forms/formBuilder/FormBuilderRightPanels.jsx` | Master required toggles; captcha "coming soon"; panel wiring |
| `src/features/forms/constants/logicCanvasViewport.js` | `clampLogicCanvasPan` 2D bounding fix |
| `src/features/forms/formBuilder/BuilderContentCard.jsx` | Removed "Change image" button; CTA/logo hover affordance |
| `src/features/forms/formBuilder/builderConfiguratorConstants.js` | Captcha `comingSoon` flag |
| `src/features/forms/utils/savedThemesStorage.js` *(new)* | Per-email localStorage read/save/delete for custom themes |
| `src/components/ui/WorkspaceFolderIcon.jsx` *(new)* | Reusable animated folder icon |
| `src/components/layout/Sidebar.jsx` | Folder tile for workspaces; Log out button |
| `src/features/profile/utils/currentDeviceSession.js` | Timezone-derived city + GMT offset label |
| `src/features/forms/components/CreateNewFormModal.jsx` | Creating spinner + disabled state; folder icon |
| `src/features/forms/components/FormCard.jsx`, `FormListRow.jsx` | Right-click opens context menu |
| `src/pages/AnalyticsPage.jsx` | More prominent form selector |

**Snapshot note (no schema change):** duplicate-id fix is client-side only; backends persisting builder snapshots should continue to round-trip `nextId`.

---

### 2026-07-01 — Start screen logo default + heading/panel polish (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-07-01 |
| **Scope** | Frontend-only — intro Configure panel, Start-screen logo, conditional-logic gating, Heading Appearance controls |
| **Backend changes** | **`intro.logo` now defaults to a bundled static asset URL** (the Clearform logo shipped in the frontend bundle) instead of `null`. New forms — and any snapshot with no saved `intro.logo` — resolve to this asset path on the frontend. User-uploaded logos are still `blob:` object URLs (ephemeral, same caveat as before): real image upload/hosting remains a backend task. No new snapshot fields |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Intro Appearance** | `toggleSection` (intro panel only) is non-exclusive; `sections.appearance` defaults open so it no longer collapses when Essentials is opened |
| **Start-screen logo** | Defaults to bundled Clearform logo, rendered 1:1 edge-to-edge (`object-cover`, no black box). Clickable in builder even outside edit mode with a subtle hover/pencil-badge affordance; preview/published stays read-only |
| **Conditional Logic** | Section (Heading/Description/Image/Media/Captcha panels) is hidden when there are no prior answerable screens (`priorScreensForActive.length === 0`); `BlockVisibilityConditions` returns `null` in that case (placeholder card removed) |
| **Heading Appearance** | Text size + Alignment restyled as segmented pills, consistent with Heading level / Font weight |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/pages/FormBuilderPage.jsx` | Non-exclusive `toggleSection`; `appearance` default open; `clearformStartLogo` import + `logoImage`/`draftLogo` default + hydrate fallback; direct logo upload; logo affordance |
| `src/features/forms/formBuilder/FormBuilderRightPanels.jsx` | Gate 5 Conditional Logic sections on `priorScreensForActive.length`; restyle Heading Text size + Alignment as pills |
| `src/features/forms/components/BlockVisibilityConditions.jsx` | `return null` when no prior screens (removed placeholder) |

**Snapshot change (backend must preserve behavior):** `intro.logo` default is now a bundled asset URL rather than `null`; treat a missing/empty `intro.logo` as "use default".

---

### 2026-07-01 — CTA panel cleanup + CTA image + contact defaults (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-07-01 |
| **Scope** | Frontend-only — CTA configure panel, CTA card canvas, contact field defaults |
| **Backend changes** | **New optional snapshot field `ctaImage`** on CTA screen config — must be round-tripped like other `cta*` fields. Currently a `blob:` object URL (ephemeral, same as intro `logo`); real image upload/hosting is still a backend task |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **CTA panel** | Removed redundant “Label color” control (and its dead `+`); removed “Show icon” toggle. TEXT COLOR is the single button-label color control; button arrow stays on by default |
| **CTA card image** | Top icon box is click-to-upload in builder; renders uploaded image as 1:1 rounded square (`object-cover`), else the default black icon box |
| **Contact defaults** | All contact fields default to `required: false` (Email was `true`) |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/formBuilder/FormBuilderRightPanels.jsx` | Removed Label color block + Show icon row |
| `src/features/forms/formBuilder/BuilderContentCard.jsx` | CTA image render + click-to-upload |
| `src/features/forms/pages/FormBuilderPage.jsx` | `ctaImage` state/wiring; contact Email default `false` |
| `src/features/forms/formBuilder/buildCanvasFieldConfigs.js` | Expose `ctaImage` / `setCtaImage` in `ctaConfig` |
| `src/features/forms/utils/screenConfigSync.js` | Persist `ctaImage` (extract + apply) |
| `src/features/forms/utils/previewCanvasConfigsFromScreen.js` | Include `ctaImage` |

**Snapshot field added (backend must preserve):** `ctaImage` on CTA screen config.

---

### 2026-06-30 — Start screen & configure panel UX (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-06-30 |
| **Scope** | Frontend-only — builder configure panels, theme accents, canvas inline edit |
| **Backend changes** | **None** — `theme.accentColor` may still be stored but frontend now defaults interactive accents to `#18181a` |

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Button accent** | `builderTheme.accentColor` / published runner use `#18181a`; form header dot still uses `formAccentColor` |
| **Intro configure** | Hide Field Settings + Question Templates on Start screen; Appearance opens by default |
| **Essentials grid** | Removed Text Box; Captcha “Soon” (disabled); taller tiles (`CONFIGURE_TILE_*`) |
| **CTA panel** | Shell `#f7f7f8`; custom `+` swatch first for BUTTON COLOR and TEXT COLOR |
| **Choice options** | Inline edit option labels on canvas (`CanvasOptionLabel`) for Single/Multiple |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/formBuilder/buildCanvasFieldConfigs.js` | Export `DEFAULT_BUTTON_ACCENT`; theme accent black; pass `setSingleOptions` / `setMultipleOptions` |
| `src/features/forms/pages/FormBuilderPage.jsx` | Theme snapshot accent black; intro config opens Appearance |
| `src/features/forms/utils/respondentThemeStyles.js` | Published accent defaults to black |
| `src/features/forms/formBuilder/builderConfiguratorConstants.js` | Essentials cleanup; larger tile tokens |
| `src/features/forms/formBuilder/FormBuilderRightPanels.jsx` | Intro panel filter; essentials/captcha; CTA swatches |
| `src/features/forms/components/canvasCardText.jsx` | `CanvasOptionLabel` |
| `src/features/forms/formBuilder/BuilderContentCard.jsx` | Inline choice option editing |

---

### 2026-06-30 — Design theme parity: preview + swatch UX (frontend)

| Field | Value |
|-------|--------|
| **Date** | 2026-06-30 |
| **Scope** | Frontend-only — design panel, builder preview, published respondent view |
| **Backend changes** | **None** — existing `theme.*` snapshot fields unchanged; backend must continue round-tripping them on publish/published |

#### Problem (before)

- Builder **Preview** hardcoded canvas background `#f5f4f0` instead of `designBackground`.
- Custom color **+** swatches were **last** in each row and stayed white/dashed after picking a color (background, card color, text color).
- Default **intro welcome** screen used hardcoded `#18181a` text/button colors in builder and on live `/f/:formId` — design text color did not apply.

#### What we fixed (frontend)

| Area | Fix |
|------|-----|
| **Preview canvas** | Uses `builderTheme.canvasBackground` in preview and edit (no `#f5f4f0` override) |
| **Design swatches** | Custom `+` tile is **first** (leftmost); shows active custom color when not a preset |
| **Intro welcome** | Title, description, Start button use `textColor` / `accentColor` in builder and `FormRespondentView` |
| **End screen** | Title/description use theme text color on published runner |

#### Files changed

| File | What changed |
|------|----------------|
| `src/features/forms/pages/FormBuilderPage.jsx` | Preview background from theme; intro welcome uses `builderTheme.textColor` / `accentColor` |
| `src/features/forms/formBuilder/FormBuilderRightPanels.jsx` | Custom swatch first + color fill for background, card, text pickers |
| `src/features/forms/components/FormRespondentView.jsx` | Intro/end screens respect `theme.textColor` / `theme.accentColor` |

**Snapshot fields (unchanged — backend must preserve):** `theme.background`, `theme.cardColor`, `theme.cardOpacity`, `theme.textColor`, `theme.accentColor`, `theme.typography`, `theme.fullCanvas`, `theme.layoutStyle`, `theme.cardImage`.

#### How to verify

1. Design tab → pick custom green background → **Preview** shows green (not beige).
2. Card opacity slider → card transparency visible in preview and after publish.
3. Custom text color → intro title + Start button update in preview and `/f/:formId`.
4. Publish → incognito `/f/:formId` matches builder Preview for theme.

**Republish note:** Forms published before 2026-06-30 should be **republished once** so live snapshots include latest intro text-color wiring if owners changed design since last publish.

#### Follow-up (same day) — button accent + swatch `+`

| Issue | Fix |
|-------|-----|
| **Save / Start** buttons turned white when Text Color was `#ffffff` | `accentColor` decoupled from `textColor` via `resolveButtonAccentColor()` — buttons use dark `#18181a` fill; text color applies to copy only |
| Custom swatch lost `+` after picking a color | Custom tiles always show centered `+` with optional color fill behind |

**Additional files:** `buildCanvasFieldConfigs.js` (`resolveButtonAccentColor`), `respondentThemeStyles.js` (safe published accent fallback).

---

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

### 2026-06-04 — API wiring, demo removal, integrations & QA prep (frontend)

| Field | Value |
|-------|--------|
| **Scope** | Frontend-only — pushed on `main` (`ad5ca1d` and follow-ups) |
| **Backend changes** | **None required** for these UI changes — consumes existing contract in `src/api/endpoints.js` |

#### Shipped on frontend (when `VITE_API_BASE_URL` is set)

| Area | What changed |
|------|----------------|
| **App load** | `formsService.listForms()`; skip localStorage seed when API on |
| **Builder** | Draft/publish via services; autosave debounce 5s + unchanged-snapshot skip |
| **Back button** | `performLeaveBuilder()` → explicit `/dashboard` or `/onboarding` (never `navigate(-1)`) |
| **Logic tab** | **Generate Logic** banner sticky in AI-Driven mode |
| **Analytics** | Real API only; removed Sample data badge, mock charts, `client-demo` stubs, fake AI insights |
| **Responses** | Public submit via `responsesService`; analytics responses panel from API |
| **Response quality** | `useResponseQualityEvaluation` on builder preview **and** live `FormRespondentView` |
| **Profile** | `PATCH /auth/me`, `DELETE /auth/me`, Firebase `sendPasswordResetEmail`; no demo toasts |
| **Share modal** | Slack/Sheets OAuth, embed from share-links API, webhooks CRUD + test |
| **Integrations** | `loadIntegrationUiState()` merges workspace OAuth + per-form config; no localStorage when API on |

Key files: `ShareFormModal.jsx`, `ManageIntegrationsModal.jsx`, `IntegrationsPanel.jsx`, `integrationsService.js`, `analyticsService.js`, `ProfilePage.jsx`, `FormBuilderPage.jsx`.

#### QA after FE deploy (run before release)

```bash
npm run build
npm run audit:handoff    # must pass
npm test
npm run test:published # optional — preview/publish parity locally
```

| # | Manual step | Pass criteria |
|---|-------------|---------------|
| 1 | Sign in → dashboard → open form → **Back** | Lands on `/dashboard` (never `/signin`) |
| 2 | Publish → incognito `/f/:formId` → submit | `POST /forms/:id/responses` succeeds |
| 3 | Analytics `?form=thatId` | New response in Responses tab; performance count updates |
| 4 | Response quality | Same nudges on builder preview and live `/f/:id` (API or heuristics offline) |
| 5 | Preview vs published | Theme, intro, logic, blocks match (`FormRespondentView` + `ContentCard`) |

Requires live API + backend for steps 2–3 in production. Offline mode uses `publishedFormStorage` only.

#### One-time product note (founder + FE)

**Forms published before the preview-parity fix (`25b56eb`) must be republished once** from the builder so the server snapshot includes latest `theme`, `intro` (logo, essential), and merged `logicIfRulesByEdge`. Live `/f/:id` reads **published** JSON only — not the draft.

Suggested user-facing copy: *“Republish forms that were live before [date] so respondents see your latest design and logic.”*

#### Not frontend — do not assign to FE dev

| Owner | Item |
|-------|------|
| VPS / DevOps | `SENTRY_DSN` on server |
| VPS / DevOps | Upstash Redis quota |
| VPS / Backend | Composio dashboard + OAuth redirect URLs on server |
| VPS / Backend | API deploy, DB migrations, webhooks delivery queue |

---

### 2026-06-04 — Analytics QA: drop-off river tooltip + AI insights data (backend tasks)

| Field | Value |
|-------|--------|
| **Date** | 2026-06-04 |
| **Reported by** | Product QA on live Analytics (Performance + AI Insights tabs) |
| **Frontend status** | API calls are wired; **remaining gaps are backend payloads + one FE tooltip wiring pass** |
| **Repo** | `main` on https://github.com/Unisynchq/Clearform_Version_2.0 |

#### What QA saw (screenshots)

1. **Question drop-off river** — clicking a column (e.g. Q3) opens a tooltip card that still shows **placeholder copy**: question title `"Your name"`, **Reached `1,712`**, **Avg time `8s`**, and a generic one-line insight. Red pills above some columns show **`−100%`** for multiple steps at once.
2. **AI Insights tab** — with **13 responses**, the tab loads (no demo badge). **AI Summary** and **Priority Focus** show the **same paragraph** (13 responses, 0 completions, quality 0/100). **Quick Stats** shows **100% negative** sentiment and **100%** top issue. **Top Patterns** correctly shows “need 25+ responses”.
3. **Form overlay → Overview** — purple **AI insight** banner always shows the same demo sentence (*“Sentiment positive… Step 3 is losing 28%…”*) and **Improve with AI** does nothing. Overview KPIs also use static values when `responses > 0` (e.g. **38%** completion, **1m 42s** avg time) — see **B.13**.

#### Frontend recheck (2026-06-04)

| Area | Wired? | Notes |
|------|--------|-------|
| `GET /analytics/forms/:id/performance` | Yes | `AnalyticsPage.jsx` merges `screenDropoff` into `performanceForm` for the river |
| `POST /analytics/forms/:id/ai-insights` | Yes | Called on AI tab; polls when `status === 'processing'` |
| River column severity / `drop` string | Partial | FE reads `screenDropoff[].drop` from API — **not** seeded demo when API returns the array |
| River **tooltip card** body | **No** | `AnalyticsPerformanceDashboard.jsx` still hardcodes title, reached, avg time (Figma placeholders). FE will wire once backend extends `screenDropoff` (see **B.11**) |
| AI Summary / Priority / Quick Stats | Partial | FE displays `apiInsights.*` when `status === 'ready'`. **NPS default `78`**, trend `+5.2%`, and confidence `High (89%)` are still FE fallbacks when API omits those fields |
| Top Patterns | Yes | Empty until 25+ responses or API returns `patterns[]` |
| Form overlay **Overview AI banner** | **No** | `FormOverlayModal.jsx` — hardcoded insight text; **Improve with AI** has no handler. Needs API (see **B.13**) |
| Form overlay **Overview KPIs** | **Partial** | `form.responses` is real; completion %, avg time, week trends, Live Since date are **static placeholders** when responses &gt; 0 |

**Conclusion:** AI Insights **is hitting the API** (copy matches live counts, not removed demo text). Backend must ensure insights are generated from **actual response rows + published question labels**, not only aggregate counts. Drop-off **`−100%`** on many steps likely indicates a **backend funnel math bug** when completions are 0 — see **B.11**.

**Backend tasks:** **B.11** (drop-off river + tooltip data), **B.12** (AI insights tab — real response content), **B.13** (form overlay Overview — **Critical / Blocker** for analytics accuracy). **Frontend follow-up:** wire tooltip after B.11; wire overlay banner/KPIs after B.13 ships.

---

### 2026-06-05 — Form overlay Overview: dynamic analytics (Critical / Blocker)

| Field | Value |
|-------|--------|
| **Date** | 2026-06-05 |
| **Priority** | **Critical / Blocker** — Analytics Accuracy |
| **Reported by** | Product QA on dashboard form overlay → **Overview** tab |
| **Frontend status** | **Not wired** — KPI cards, Survey Target, Live Since, and AI insight banner use hardcoded placeholders when `responses > 0` |
| **Backend task** | **B.13** (full contract below) |
| **Endpoint** | `GET /analytics/forms/:formId/overview` (preferred) or extend `GET /analytics/forms/:formId/performance` with an `overview` block |

#### Context

The **Overview** tab inside `FormOverlayModal.jsx` (dashboard → click form card) currently renders **static frontend placeholder data**. Metrics must reflect **real-time form data** and settings from the overlay **Quick Settings** tab (especially `responseLimit` from `PATCH /forms/:id`).

#### What QA saw (circled in screenshot)

| UI element | Current behavior | Must come from API |
|------------|------------------|-------------------|
| Form ID in header | Shows real id from form record | Confirm `formId` in overview payload matches |
| **Responses / Completion / Avg. time** KPIs | Count is real; **38%**, **1m 42s**, week trends, and **“On target”** labels are hardcoded | Dynamic values + status enums |
| **Survey Target** | `{responses} of 500 filled`, ring %, “487 more responses needed” — **500 is hardcoded** in JSX | `responsesCount`, `responseLimit`, `responsesPercentage`, `responsesNeeded` from Quick Settings limit |
| **Live Since** | **“2 March 2026”** and **“7 Days”** hardcoded | `publishedAt`, `daysActive` |
| **AI insight banner** | Fixed demo sentence (*“Sentiment positive… Step 3 is losing 28%…”*) | `aiInsight.message` from drop-off + NLP/AI |
| **Improve with AI** | Button has no handler | `aiInsight.actionableStep` drives builder navigation |

#### Acceptance criteria

- No hardcoded strings remain on the frontend for these Overview cards once B.13 ships and FE wires the endpoint.
- Changing **Response Limit** in Quick Settings and refetching overview updates Survey Target fraction, ring %, and “more responses needed” immediately.
- Two forms with different drop-off profiles show **different** AI insight copy.
- **Improve with AI** opens the builder targeting the screen/step referenced in `actionableStep`.

**Frontend follow-up (after backend):** fetch overview on overlay open; replace placeholders in `FormOverlayModal.jsx` and `useFormOverlayMetrics.js`; wire **Improve with AI** → `navigateToFormBuilder(formId, actionableStep)`.

---

## READ THIS FIRST — Product review and backend obligations

This block was added after hands-on QA of the Clearform v2 frontend on `main`. The UI is largely complete; **many flows are now wired to `src/api/services/*` when `VITE_API_BASE_URL` is set.** Remaining gaps are mostly **backend endpoints**, **VPS/infra**, and **end-to-end QA on production**. Do not skip this section.


### A. Data, tasks, and outcomes

#### A.1 Context


The frontend on `main` is structurally ready for backend integration: API client, endpoint map, and service facades exist under `src/api/`. Today, many flows still work offline via `localStorage` and seeded demo forms. Product testing found specific gaps between what users see and what a production backend must provide. The items below are **blocking** for a proper handoff — not nice-to-haves.

Frontend services are wired when `VITE_API_BASE_URL` is set (`VITE_USE_MOCK_API=false`). Remaining work is **backend implementation**, **VPS/infra**, and **production QA** — not additional demo UI.


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


| # | Task | Primary owner | FE status | Outcome when done |
|---|------|---------------|-----------|-------------------|
| 1 | Form builder **Back** goes to Dashboard, not Sign in | Frontend | **Done** | User never lands on `/signin` after Back from builder |
| 2 | **Responses** tied to the correct form | Backend + Frontend | **FE wired** — needs live API | Submit on `/f/:formId` creates a row; Analytics shows it for that `formId` only |
| 3 | **Response Quality AI** uses question + answer + sidebar parameters | Backend (+ Frontend wire) | **FE wired** — needs evaluate API | Same quality feedback on live form as in builder preview |
| 4 | **Published form** matches builder **Preview** (design + logic) | Backend stores snapshot; Frontend renders it | **Done** (render); **republish** old forms | `/f/:id` looks and behaves like preview mode |
| 5 | **Settings** — delete account, password reset, profile, integrations | Backend + Frontend | **Done** (profile/OAuth UI) | No demo toasts; real APIs or Firebase reset |
| 6 | **Do not save draft** many times for one edit | Frontend (debounce/dedupe); Backend accepts PUT | **Done** (5s debounce + dedupe) | One meaningful snapshot write per edit burst + on leave/publish |
| 7 | Logic tab — **Generate Logic** control always visible | Frontend | **Done** (sticky banner) | User can always re-run or start AI logic from Logic tab |
| 8 | **Form ↔ Integrations ↔ Analytics** all use same `formId` | Backend scoped APIs + Frontend URLs | **Done** (URLs + panel `formId`) | Picking form 123 in builder = analytics `?form=123` = webhooks for 123 |
| 9 | **Integrations** actually connect and fire | Backend OAuth/webhooks | **FE wired** — needs Composio + queue | Connect, test, and deliver events from UI |
| 10 | **Remove demo** surfaces when APIs are live | Frontend (after your APIs) | **Done** | No “Sample data”, seed charts, or demo toasts when API on |
| 11 | **Drop-off river** — real per-question metrics + tooltip (no `−100%` bugs, no Figma placeholders) | Backend (+ FE wire tooltip) | **FE partial** — tooltip still placeholder | Clicking Q3 shows real question title, reached count, drop %, avg time from API |
| 12 | **AI Insights tab** — analyze real response **content**, not just counts | Backend | **FE wired** — needs correct API job | Summary, priority, sentiment, patterns grounded in stored answers for that `formId` |
| 13 | **Form overlay Overview** — dynamic KPIs, targets, live-since, AI insight (**Critical / Blocker**) | Backend (+ FE wire) | **Not wired** — demo copy + hardcoded KPIs in `FormOverlayModal.jsx` | `GET …/overview` returns real metrics linked to Quick Settings `responseLimit`; banner + **Improve with AI** driven by `aiInsight` |


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

**Fixed.** `performLeaveBuilder()` in `FormBuilderPage.jsx` navigates explicitly to `/dashboard`, or `/onboarding` when `fromOnboarding` or the onboarding stepper is active. It does **not** call `navigate(-1)`.

**What backend must build**

Nothing. No endpoint change.

**How frontend connects**

No further frontend work required for this item.

**Done when**

Sign in → dashboard → open any form → Back → dashboard. Sign in must never appear. *(Re-verify after each FE deploy — see QA table in implementation log above.)*

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
- When API is configured, `FormRespondentView.jsx` calls `submitFormResponse()` (`responsesService`) on completion; Analytics loads via `analyticsService` / `fetchFormResponses`.
- When API is **not** configured, submissions still use local `formResponsesStorage` paths only.
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
- `useResponseQualityEvaluation` in `BuilderContentCard.jsx` and `FormRespondentView.jsx` (via `responseQualityFormId`) calls `POST .../response-quality/evaluate` when API is configured; falls back to `responseQualityScoring.js` heuristics offline.

**What backend must build**

**Endpoint:** `POST /forms/:formId/response-quality/evaluate`

Call this on debounced keystrokes (frontend will throttle) for long-text and short-text screens when quality is enabled in the published snapshot.

**Full request body (required fields)**

```json
{
  "formId": 123,
  "screenId": 5,
  "fieldId": "long-text",
  "sessionId": "per-tab-session-id",
  "questionText": "What went wrong during onboarding?",
  "fieldType": "Long text",
  "helperText": "Be specific — mention steps, screens, or errors.",
  "answerText": "It was fine I guess",
  "conversationHistory": [],
  "options": {
    "customInstructions": "Focus more on specific steps or screens the respondent mentions.",
    "minWords": 10,
    "sensitivity": "Medium",
    "vagueWords": "good, fine, okay, great",
    "topicKeywords": "onboarding, step, error, confusing",
    "keywordThreshold": 1,
    "length": { "enabled": true, "minWords": 10 },
    "specificity": { "enabled": true, "sensitivity": "Medium", "vagueWords": "good, fine, okay, great" },
    "relevance": { "enabled": true, "topicKeywords": "onboarding, step, error", "keywordThreshold": 1 },
    "completeness": { "enabled": true, "detectTrailing": true, "requiredSentences": 1 },
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

**Important fallback rule:** when `options.customInstructions` is empty, backend should inject its own **default prompt / default evaluator instructions** so the model still produces consistent feedback. `customInstructions` is an owner override, not a requirement for quality evaluation to work.

**Suggested system prompt (copy into your LLM service)**

```text
You evaluate survey response quality for a single question.

You will receive:
- questionText: the exact question shown to the respondent
- helperText: optional instructions shown under the question
- answerText: what the respondent has typed so far (may be partial)
- customInstructions: optional owner preference for this question only; if empty, use your backend default prompt/instructions
- options.criteria: which checks are enabled and their parameters (minWords, sensitivity, vagueWords, topicKeywords, keywordThreshold)

Rules:
1. Only evaluate criteria marked enabled: true. Ignore disabled criteria entirely.
2. Apply customInstructions when present. If absent, apply the backend's default quality-evaluator prompt so output quality stays stable.
3. Use questionText and helperText to judge relevance — do not expect topics not related to the question.
4. For length, count words in answerText against minWords when length is enabled.
5. For specificity, flag vague words from vagueWords when sensitivity is enabled.
6. For relevance, check topicKeywords appear when relevance is enabled.
7. For completeness, detect incomplete sentences or trailing fragments when completeness is enabled.
8. Return JSON only: { "level": "green"|"amber"|"red", "message": string, "failedIds": string[] }
9. green = passes all enabled checks; amber = one issue; red = two or more issues or severe failure.
10. message must be helpful and refer to the question context, not generic praise.

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

Profile and settings actions previously showed demo toasts instead of real operations.

**What should happen**

- Delete account removes the user and their session.
- Password reset sends email via **Firebase** (not a custom backend forgot-password route).
- Profile fields save to the server when API is configured.
- Integration connect/disconnect persists and reflects in builder / share / profile UI.

**What the frontend does today**

| Action | Implementation |
|--------|----------------|
| Delete account | `DELETE /auth/me` via `authMeService.deleteAccount()` — then Firebase `signOutUser()` (`ProfilePage.jsx`) |
| Password reset | Firebase `sendPasswordResetEmail` (`ProfileSecurityPanel.jsx`) |
| Profile save | `PATCH /auth/me` via `authMeService.updateMe()` when API configured (`ProfilePage.jsx`) |
| Integrations (profile) | Workspace OAuth via `integrationsService` (`ProfileIntegrationsPanel.jsx`) |
| Integrations (form) | `ManageIntegrationsModal.jsx`, `ShareFormModal.jsx`, `IntegrationsPanel.jsx` — see **B.9** |

**What backend must build**

| Action | API |
|--------|-----|
| Delete account | `DELETE /auth/me` |
| Update profile | `PATCH /auth/me` |
| Password reset | **Firebase Auth** (frontend-only; no custom `/auth/forgot-password` required) |
| Change password (logged in) | Firebase or `POST /auth/change-password` if you add server-side validation |

Integrations are covered in B.8 and B.9.

**How frontend connects**

Wired. On 401, existing `ApiError` handling signs the user out. No `"not available in this demo"` strings remain.

**Done when**

Delete account → user logged out. Forgot password → Firebase email sent (or real error). Profile save hits `PATCH /auth/me` when API is on.

---

#### B.6 Do not save draft multiple times (one save is enough)

**What we saw**

The form builder feels like it saves the draft **over and over** while editing (many writes for one editing session).

**What should happen**

- While typing, at most **one autosave per meaningful pause** (not every second on every keystroke if nothing changed).
- Always save once when the user **leaves** the builder or **publishes**.
- Backend should accept **full snapshot** PUTs, not require micro-patch chatter.

**What the frontend does today**

**Improved.** `FormBuilderPage.jsx` autosave uses a **5 second debounce**, skips persist when `JSON.stringify(snapshot)` is unchanged (`lastPersistedSnapshotRef`), and routes through `formsService` when API is configured (no direct `writeBuilderDraft` in API mode). `flushBuilderDraft()` still runs on leave/publish.

**What backend must build**

| Method | Path | Notes |
|--------|------|--------|
| PUT | `/forms/:id/builder-snapshot` | Full body; include `savedAt` timestamp |
| Optional | `If-Match` / `version` | Conflict if two tabs edit same form (see Questions section) |

Do not implement partial field-level PATCH unless agreed with frontend — the UI sends the whole snapshot from `buildPublishSnapshot()`.

**How frontend connects**

Wired when `VITE_API_BASE_URL` is set. Backend should accept idempotent full PUTs.

**Done when**

Edit one field, wait — only one network PUT after pause; leaving builder always persists latest snapshot once.

---

#### B.7 Logic tab — Generate / Create logic control must always stay visible

**What we saw**

On the Logic tab, the **“Generate Logic”** banner (AI-Driven Logic) **disappears** after logic exists on the canvas. Users expect a persistent way to regenerate or start logic, similar to always having a **Create / Generate** action available.

**What should happen**

- The Logic tab should **always** expose **Generate Logic** (AI) even after connections exist.
- Manual **If/Then** editing (`IfThenLogicPanel.jsx`, **Save Logic** button) remains available on edges; AI regenerate must not be hidden after first success.

**What the frontend does today**

**Fixed.** `AiLogicIdleBanner` is in a **sticky Logic tab header** whenever AI-Driven mode is active (`!logicModeManual`), including after connections exist on the canvas. `logicService.generateFormLogic` is called when API is configured.

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

**How frontend connects**

Wired. No further frontend work required for visibility.

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

- Analytics: `useAnalyticsPageState.js` — `?form=` query param.
- Builder: `IntegrationsPanel.jsx` resolves `formId` from panel state → overlay → URL param; **Manage all** → `/dashboard/analytics?form={id}&tab=settings`.
- `ManageIntegrationsModal` receives `formId` + `workspaceId` from `FormBuilderSettingsPanel.jsx`.
- `uiSlice.integrationsPanel.formId` set by `openIntegrationsPanel`.

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

**How frontend connects**

Wired. Integration modals and share UI pass `formId`; server is source of truth when API is on.

**Done when**

Two forms A and B — webhook test for A fires only on A’s submit; analytics for `?form=A` never includes B’s responses.

---

#### B.9 Integrations & Share must work (not just UI placeholders)

**What we saw**

Integrations UI existed but connection was **local/profile storage** or demo — not a live backend.

**What should happen**

- **Share modal:** Slack / Sheets / Embed / Email use real OAuth + API (not local-only).
- **Integrations modal:** Read/write workspace + form integrations API; connected status from server.
- User can save webhook URL, **test** delivery, and receive events on new responses.

**What the frontend does today**

| Surface | Behavior when `VITE_API_BASE_URL` is set |
|---------|------------------------------------------|
| `ShareFormModal.jsx` | `fetchShareLinks`; Slack/Sheets OAuth via `connectIntegration` + redirect; metadata via `saveIntegrationMetadata`; webhooks CRUD + test; embed from API URL; email via `mailto:` |
| `ManageIntegrationsModal.jsx` | `loadIntegrationUiState({ workspaceId, formId })`; OAuth connect/disconnect; no localStorage |
| `IntegrationsPanel.jsx` | Server badges via `loadIntegrationUiState`; webhook connected from `listFormWebhooks` |
| `ProfileIntegrationsPanel.jsx` | Workspace `listWorkspaceIntegrations` + OAuth |
| `integrationsService.js` | `mergeWorkspaceAndFormConnections`, `loadIntegrationUiState` |

Pilot billing is implemented on the platform (`/buy/pilot`, `ProfileBillingPanel`, `billingService`) — separate from form integrations (Sheets/Slack).

**What backend must build**

- Composio (or equivalent) OAuth for `google_sheets`, `slack`, `google_drive` on workspace routes.
- `GET/PATCH /workspaces/:id/integrations` and `GET/PATCH /forms/:formId/integrations`.
- `POST .../webhooks/.../test` returns success/failure with log snippet.
- Delivery queue with retries; store last error on integration record.

**How frontend connects**

Wired. Backend must return connection rows with `provider`, `id`, `active`, `metadata` as documented in `mapConnectionsToUiState`.

**Done when**

Share → Connect Slack/Sheets → OAuth completes → connected badge shows → save spreadsheet/channel → submit response → webhook/Sheets fire.

---

#### B.10 Remove all demo pieces when APIs are live

**What we saw**

Parts of the app showed **demo / sample** behavior: fake analytics, demo toasts, mock AI insights, `client-demo` stubs.

**What should happen**

When `VITE_API_BASE_URL` is set, users should never see misleading demo content.

**What the frontend does today**

**Removed or gated** (when API configured):

| Former demo surface | Status |
|---------------------|--------|
| “Sample data” badge (`AnalyticsPage.jsx`) | Removed |
| `TOP_PATTERNS` / mock AI insights | Removed; empty or API-only |
| Demo performance/compare charts | Removed; empty states (“No responses yet”) |
| `METRIC_ROWS` compare table | Removed |
| `client-demo` in `analyticsService.js` | Removed; empty payloads offline |
| Demo integration/profile toasts | Removed; real errors or OAuth |
| Seed analytics in `deriveFormStats` display path | Removed for analytics UI |

Offline mode (no `VITE_API_BASE_URL`) still uses localStorage for forms/responses — intended for local dev only.

**What backend must build**

Return explicit empty states (`{ items: [], total: 0 }`) instead of errors when no data. Ship Priorities 1–2 endpoints so production never runs in offline mode.

**How frontend connects**

Complete for demo removal. Coordinate field names when adding new analytics/insights shapes.

**Done when**

Production `.env` has API URL — no “Sample data”, no demo toasts, empty analytics shows “No responses yet” not fake charts.

---

#### B.11 Question drop-off river — per-question metrics and tooltip (fix static `−100%`)

**What we saw (2026-06-04)**

On Analytics → **Performance** → **Question drop-off river**:

- Red severity pills show **`−100%`** on multiple questions (e.g. Q3, Q5, Q6) at the same time.
- Clicking a column opens a tooltip that still shows **dummy UI**: question **“Your name”**, **Reached `1,712`**, **Avg time `8s`**, and a generic insight line — regardless of the selected question.
- Footer captions use the form’s total **`responses`** for both “started” and “finished” (frontend limitation until funnel fields are returned).

**What should happen**

- Each content screen in the published snapshot maps to one river column (`Q1` … `QN`).
- **Drop %** between steps is computed from real session/response events for that `formId` and date `range`.
- **`−100%` on every step is wrong** unless literally zero respondents continued past each screen — verify your formula when `completed === 0` but `started > 0`.
- Tooltip shows the **real question label**, **reached** count, **drop** rate, and **average time on screen** for that step.

**What the frontend does today**

- `AnalyticsPage.jsx` calls `GET /analytics/forms/:formId/performance?range=` and merges `screenDropoff` onto the selected form.
- `dropoffRiverData.js` → `buildAdaptiveRiverColumns()` uses API `screenDropoff` when `length >= 5`; each step supports `q`, `kind`, `alert`, `drop` (display string for pills).
- **Tooltip card is not wired to API yet** — `AnalyticsDropoffRiverCard` in `AnalyticsPerformanceDashboard.jsx` hardcodes title/metrics (FE will map new fields once you ship them).

**What backend must build**

Extend **`GET /analytics/forms/:formId/performance`** (same query `range=7d|30d|90d|all`).

**Top-level funnel** (for started/finished captions and stats row):

```json
{
  "formId": 123,
  "range": "all",
  "responses": 13,
  "contentScreenCount": 6,
  "funnel": {
    "reached": 13,
    "opened": 13,
    "started": 13,
    "submitted": 0
  },
  "screenDropoff": [ /* see below */ ]
}
```

**Per-screen `screenDropoff[]` item** (one entry per **content** screen, order = respondent order):

```json
{
  "screenId": 12,
  "q": "Q3",
  "kind": "critical",
  "alert": true,
  "drop": "−34%",
  "dropPercent": 34,
  "label": "Your name",
  "fieldType": "short_text",
  "reached": 12,
  "continued": 8,
  "dropCount": 4,
  "avgTimeSeconds": 8,
  "insight": "Significant drop-off — review wording or make this field optional."
}
```

| Field | Rule |
|-------|------|
| `label` | Primary question text from **published snapshot** (`screens[].config` / field label), not a constant |
| `reached` | Distinct sessions that **viewed** this screen in range |
| `continued` | Sessions that **submitted an answer** and moved to the next screen (or end) |
| `dropPercent` | `round((1 - continued / reached) * 100)` when `reached > 0`, else `0` |
| `drop` | Display string for pills, e.g. `"−34%"` — must match `dropPercent` |
| `kind` / `alert` | `critical` if drop ≥ 70%, `attention` if 40–69%, else `healthy` (matches legend on card) |
| `avgTimeSeconds` | Mean dwell time on this screen from response metadata / events |
| `insight` | One sentence; may be rule-based or LLM — must reference **this** screen’s stats |

**Drop calculation (avoid the `−100%` bug)**

Recommended per-step formula:

```text
reached[i]   = sessions that rendered screen i
continued[i] = sessions that advanced past screen i (answer + next navigation)
dropPercent[i] = reached[i] > 0 ? round((1 - continued[i] / reached[i]) * 100) : 0
```

Do **not** set every step to `100%` just because `submitted === 0`. Partial progress (answered Q1–Q2 then abandoned) should show high drop on the **last touched** screen, not on every downstream screen with `reached === 0`.

**How frontend will connect**

Already merges `screenDropoff` for column shapes. After you ship extended fields, frontend will replace tooltip placeholders with `label`, `reached`, `drop`/`dropPercent`, `avgTimeSeconds`, `insight` (tracked in FE; no backend action).

**Done when**

- Form with 13 starts and 0 completions: river shows believable per-step drops (not identical `−100%` on all red columns).
- Clicking Q3 tooltip shows Q3’s **real label** and counts from API, not `1,712` / `Your name` / `8s` placeholders.
- Changing date range updates `screenDropoff` and funnel counts.

---

#### B.12 AI Insights — must analyze real response content (not counts-only)

**What we saw (2026-06-04)**

On Analytics → **AI Insights** with **13 responses**:

- Tab **does** call `POST /analytics/forms/:formId/ai-insights` (not offline demo).
- **AI Summary** and **Priority Focus** repeat the **same text** (13 responses, 0 completions, quality score 0/100).
- **Quick Stats**: 100% negative sentiment, top issue **100%** — may be mathematically correct for tiny samples but reads like placeholder severity; must be derived from **answer text**, not hardcoded templates.
- **Top Patterns** empty — correct until 25+ responses (frontend gate).

**What should happen**

Backend runs an insights job that:

1. Loads **all responses** for `formId` + `range` from the same table as `GET /forms/:formId/responses`.
2. Loads **published snapshot** (or builder snapshot) to map `screenId` → question labels, field types, and options.
3. Passes **question + answer pairs** (and completion status, duration, response-quality scores if stored) into the LLM or analytics pipeline.
4. Returns **distinct** copy for summary vs priority vs patterns — not one paragraph duplicated.
5. Returns `status: "insufficient_data"` when `responses < 10` in range (frontend already handles).
6. Supports async: `{ "status": "processing" }` then `{ "status": "ready", ... }` on poll (frontend polls every 2.5s).

**What the frontend does today**

- `AnalyticsPage.jsx` → `generateAiInsights(formId, { range })` on AI tab visit.
- `AnalyticsAiInsightsPanel.jsx` renders when `apiInsights.status === 'ready'`:
  - `summaryText` / `insight` → AI Summary
  - `priorityTitle`, `priorityBody`, `impactEstimate` → Priority Focus
  - `quickStats` → Quick Stats card (`sentiment`, `topIssueCategory`, `topIssuePercent`, `sevenDayTrend`)
  - `patterns[]` → Top Patterns (25+ responses)
  - `recommendedActions[]` → Recommended Actions
- **Still hardcoded on FE** (omit from API or send real values): NPS `78` if `npsScore` missing; trend `+5.2% vs last quarter`; confidence `High (89%)`.

**What backend must build**

**Endpoint:** `POST /analytics/forms/:formId/ai-insights`  
**Body:** `{ "range": "7d" | "30d" | "90d" | "all" }`

**Response when ready:**

```json
{
  "status": "ready",
  "formId": 123,
  "range": "all",
  "responseCount": 13,
  "summaryText": "2–4 sentences: themes from answer text, completion rate, quality — cite specifics.",
  "npsScore": null,
  "npsTrendPercent": null,
  "npsTrendLabel": null,
  "priorityTitle": "Fix abandonment before Q3",
  "priorityBody": "Different from summary: one actionable focus with evidence from responses.",
  "impactEstimate": "Republish with shorter Q3 could recover ~15% completions",
  "confidencePercent": 72,
  "quickStats": {
    "sentiment": { "positive": 0, "neutral": 0, "negative": 100 },
    "topIssueCategory": "Incomplete submissions",
    "topIssuePercent": 100,
    "sevenDayTrend": [
      { "day": "Mon", "count": 0 },
      { "day": "Tue", "count": 0 },
      { "day": "Wed", "count": 2 },
      { "day": "Thu", "count": 13 }
    ]
  },
  "patterns": [],
  "recommendedActions": [
    {
      "title": "Shorten the name field helper text",
      "description": "Based on 4 vague answers in Q3",
      "priority": "high",
      "actionType": "edit_form"
    }
  ]
}
```

**Prompt / job requirements (critical)**

| Input | Source |
|-------|--------|
| Answer text per screen | `responses[].answersByScreenId` |
| Question labels | Published `screens` for that `formId` |
| Completion | `responseType` or presence of end-screen submit |
| Quality scores | Stored evaluate results if you persist them |
| Date filter | Apply `range` to `submittedAt` |

**Do not:**

- Return the same string for `summaryText` and `priorityBody`.
- Return insights when zero responses in range — use `insufficient_data`.
- Fabricate NPS or sentiment without running classification on text (or return `null` and let FE hide).

**Processing / errors**

```json
{ "status": "processing", "jobId": "optional" }
{ "status": "insufficient_data", "responseCount": 3, "message": "Need at least 10 responses" }
{ "status": "error", "message": "Human-readable failure" }
```

Rate-limit per user/form (429). Log prompt version + response count, not raw PII in production logs unless policy allows.

**How frontend connects**

Wired — no new routes. Ship the payload shape above; frontend mappers live in `aiInsightsApiMappers.js`.

**Done when**

- Submit 10+ varied text answers on form A → AI tab mentions **actual themes** from those answers (not only “0 completions”).
- Summary and Priority Focus show **different** copy.
- Quick Stats 7-day chart matches real submission dates.
- With &lt; 10 responses, API returns `insufficient_data` and FE shows the empty state (not generic AI prose).

---

#### B.13 Form overlay Overview — dynamic analytics (Critical / Blocker)

**Priority:** **Critical / Blocker** — Analytics Accuracy

**Context**

The **Overview** tab for individual forms (`FormOverlayModal.jsx` — dashboard → form card) currently renders **static/hardcoded frontend placeholder data**. The API must return **dynamically calculated fields** that reflect real-time form data and variables configured in the overlay **Quick Settings** tab (notably `responseLimit` via `PATCH /forms/:id` / `AnalyticsSettingsPanel.jsx`).

**What we saw (2026-06-04 / 2026-06-05)**

Dashboard → click a form card → **Overview** tab:

- Purple insight banner always shows the **same demo text**, regardless of form or response count:
  > *“Sentiment positive, completion above benchmark — but Step 3 is losing 28% of respondents. Improve it to gain ~30 more completions.”*
- **Improve with AI** has **no click handler**.
- When `form.responses > 0`, KPIs show **hardcoded** values — **38%** completion, **1m 42s** avg time, **+5% / +4%** week deltas, **“On target”** on all three cards, **“2 March 2026”** live date, **“7 Days”** badge, **“Est. 12 more days”**.
- **Survey Target** shows `{responses} of 500 filled` and ring % — **500 is hardcoded in JSX** even though Quick Settings stores `responseLimit` on the form record.
- Only the response **count** and form **id** in the header come from the live form record.

**What should happen**

All Overview metrics are computed server-side for that `formId` and returned in one payload. Quick Settings **Response Limit** is the source of truth for target math. AI insight copy is generated from **real drop-off analytics** (B.11) via the NLP/AI service (B.12 pipeline), not a static template.

**What the frontend does today**

| UI | File | Current behavior |
|----|------|------------------|
| AI insight banner | `FormOverlayModal.jsx` (~L622–638) | Hardcoded paragraph |
| Improve with AI | same | `<button>` with no `onClick` |
| Responses KPI | same | `form.responses` real; **“On target”** and **“5% this week”** hardcoded |
| Completion / avg time | same | Static `38%`, `1m 42s`, trends when `responses > 0` |
| Survey target | same + `useFormOverlayMetrics.js` | Count real; **500** hardcoded in display strings; ring uses wrong denominator |
| Live Since / Days active | same | **“2 March 2026”**, **“7 Days”** hardcoded |
| Quick Settings limit | `FormOverlayModal.jsx` Quick Settings tab | Reads/writes `form.responseLimit` via `PATCH /forms/:id` — must match overview target |

**What backend must build**

**Endpoint (recommended):** `GET /analytics/forms/:formId/overview`  
**Auth:** User owns form  
**Alternative:** Extend `GET /analytics/forms/:formId/performance` with a top-level `overview` object (same shape below).

Frontend will add `API_ENDPOINTS.analytics.overview(formId)` when you confirm the path.

---

##### 1. Form metadata and timeframes

| Field | Type | Rule |
|-------|------|------|
| `formId` | string | Actual unique identifier (UUID or numeric id — match `GET /forms/:id`) |
| `publishedAt` | ISO 8601 | Exact timestamp the form went **live** (first publish or latest republish — document which) |
| `daysActive` | integer | `floor((now - publishedAt) / 86400000)` — replaces hardcoded **“7 Days”** |

Optional: `estDaysToTarget` — projected days to hit `responseLimit` at current daily response rate (null if rate is 0 or limit already met).

---

##### 2. Target calculations (Quick Settings → Overview)

Read **`responseLimit`** from the form record (same field Quick Settings writes via `PATCH /forms/:id`). Do not hardcode 500.

| Field | Type | Rule |
|-------|------|------|
| `responsesCount` | integer | Current total responses for this `formId` (consistent with `GET /forms/:id`.responses) |
| `responseLimit` | integer | From form settings (`responseLimit`); if unset, return `null` and FE shows “—” |
| `responsesPercentage` | integer | `responseLimit > 0 ? min(100, round(responsesCount / responseLimit * 100)) : 0` |
| `responsesNeeded` | integer | `max(0, responseLimit - responsesCount)` when `responseLimit > 0`, else `0` |

**Acceptance:** Updating Response Limit in Quick Settings → refetch overview → Survey Target fraction, ring %, and “N more responses needed” update immediately.

---

##### 3. Performance indicators (KPI row + “On target” labels)

Return KPI values **and** a status enum for each of Responses, Completion Rate, and Avg. Time:

| Status | Meaning (define per metric in backend docs) |
|--------|---------------------------------------------|
| `ON_TARGET` | Within acceptable band vs target/benchmark |
| `BELOW_TARGET` | Underperforming vs target/benchmark |
| `EXCEEDING_TARGET` | Above target (good for completion/responses; may differ for avg time) |

**Suggested response shape:**

```json
{
  "performance": {
    "responses": {
      "value": 13,
      "trendWeekPercent": 5,
      "status": "ON_TARGET"
    },
    "completionRate": {
      "value": 38,
      "trendWeekPercent": 4,
      "status": "ON_TARGET"
    },
    "avgDurationSeconds": {
      "value": 102,
      "trendLabel": "same",
      "status": "ON_TARGET"
    }
  }
}
```

**Backend must define baselines** (product decision — document in API README):

| Metric | Suggested baseline source |
|--------|---------------------------|
| Responses | Pace toward `responseLimit` given `daysActive` (e.g. on track if `responsesCount / daysActive >= responseLimit / expectedDays`) |
| Completion rate | Compare to workspace/form benchmark or historical average for this form |
| Avg. time | Compare to published form’s median duration or product default benchmark |

Week-over-week trends optional when &lt; 7 days of data — return `null` and FE hides sub-labels.

---

##### 4. Dynamic AI insights (NLP/AI-driven)

**Problem:** Insight banner text is entirely static.

**Requirement:** Parse **actual drop-off analytics** (`screenDropoff` from B.11) and generate insight copy via the same NLP/AI service used for B.12. Reference **real screen labels** (e.g. “Q3 · Your name is losing 34%”) — not generic “Step 3”.

Return **`aiInsight`** object:

```json
{
  "aiInsight": {
    "message": "Completion is 38% — Q3 (Your name) loses 34% of respondents. Shorten helper text to recover ~4 completions.",
    "actionableStep": {
      "action": "improve_screen",
      "screenId": 12,
      "screenLabel": "Your name",
      "dropPercent": 34,
      "estimatedGain": 4,
      "builderTab": "content"
    }
  }
}
```

| Field | Rule |
|-------|------|
| `message` | One actionable sentence; cites **real** metrics and **real** screen from drop-off data — never a fixed template |
| `actionableStep.action` | `improve_screen` \| `open_logic` \| `view_analytics` — what **Improve with AI** should do |
| `actionableStep.screenId` | Content screen to focus in builder (when `action === improve_screen`) |
| `actionableStep.builderTab` | Optional: `content` \| `logic` \| `design` |
| `actionableStep.estimatedGain` | Optional projected completion recovery |

Return `aiInsight: null` when insufficient data (&lt; 3 responses) or no meaningful drop-off signal. Frontend hides banner or shows empty state.

**Option B (fallback):** `POST /analytics/forms/:formId/ai-insights` with `{ "range": "all", "surface": "overview" }` returning `summaryText` + `recommendedActions[0]` mapped to `aiInsight` above.

---

##### Full example response

```json
{
  "formId": "f65ea751-72f2-4f9e-aee8-40bcddd1314e",
  "publishedAt": "2026-03-02T08:00:00.000Z",
  "daysActive": 7,
  "responsesCount": 13,
  "responseLimit": 500,
  "responsesPercentage": 3,
  "responsesNeeded": 487,
  "estDaysToTarget": 12,
  "performance": {
    "responses": { "value": 13, "trendWeekPercent": 5, "status": "ON_TARGET" },
    "completionRate": { "value": 38, "trendWeekPercent": 4, "status": "ON_TARGET" },
    "avgDurationSeconds": { "value": 102, "trendLabel": "same", "status": "ON_TARGET" }
  },
  "aiInsight": {
    "message": "Completion is 38% — Q3 (Your name) loses 34% of respondents. Shorten helper text to recover ~4 completions.",
    "actionableStep": {
      "action": "improve_screen",
      "screenId": 12,
      "screenLabel": "Your name",
      "dropPercent": 34,
      "estimatedGain": 4,
      "builderTab": "content"
    }
  }
}
```

---

**Improve with AI — expected product behavior (after FE wire)**

1. User clicks **Improve with AI** on form “abbu”.
2. Frontend reads `aiInsight.actionableStep` → opens builder for that `formId`, focuses `screenId`, selects tab per `builderTab` / `action`.
3. Optional future: scoped `POST /forms/:formId/logic/generate` — document if added.

**How frontend will connect**

Not wired yet. After you ship the endpoint, frontend will:

- `GET /analytics/forms/:formId/overview` on overlay open (`formId` from `uiSlice.formOverlay`)
- Replace all hardcoded KPI / target / live-since strings with API fields
- Map `performance.*.status` → **“On target”** / **“Below target”** / **“Exceeding target”** labels
- Wire **Improve with AI** → `navigateToFormBuilder(formId, actionableStep)`

**Done when (acceptance criteria)**

- **No hardcoded strings** remain on the frontend for these Overview cards after FE wires your payload.
- Changing **Response Limit** in Quick Settings → refetch → Survey Target fraction and percentage update.
- Form with known Q3 drop-off shows insight with **Q3’s real label** and **real drop %** — not “Step 3 · 28%” demo copy.
- **Improve with AI** opens builder on the screen from `actionableStep`.
- Two different forms show **different** insight text.
- Form with 0 responses: `aiInsight` is null; banner hidden or shows share CTA (product choice).

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

Recommended manual path (matches **QA after FE deploy**):

1. Sign in → dashboard → open form → **Back** → must land on `/dashboard`
2. Add questions, theme, logic (AI or manual)
3. **Publish** (republish if form was live before preview-parity fix)
4. Open `/f/:formId` in incognito, complete submission
5. Sign in → Analytics `?form=thatId` → Responses tab + performance count
6. Compare builder **Preview** vs incognito — visual parity
7. Share modal → Slack/Sheets OAuth (if enabled) → webhook test → submit again → verify delivery
8. `npm run audit:handoff` before tagging release

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
| Analytics | **`analyticsService` when API on**; empty states offline | Real aggregates + time series |
| AI logic | Local stub when no API; **`logicService` wired** when API set | `POST /forms/:id/logic/generate` |
| Response quality | **API + heuristics** on preview and live form (`useResponseQualityEvaluation`) | `POST /forms/:id/response-quality/evaluate` |
| Integrations / Share | **`integrationsService` + webhooks** when API on | Workspace OAuth + form PATCH + webhook queue |
| Profile | **`PATCH/DELETE /auth/me`**; Firebase password reset | Same |
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

Run before every FE release:

```bash
npm run build
npm run audit:handoff   # favicon/title + JSX sanity — must exit 0
```

See **QA after FE deploy** in the implementation log (2026-06-04) for the full manual checklist.

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
| GET | `/analytics/forms/:formId/overview` | Form overlay **Overview** tab — **B.13 (Critical)** |
| GET | `/analytics/forms/:formId/responses?range=` | Responses tab |
| GET | `/analytics/forms/:formId/compare?range=` | Compare tab |
| POST | `/analytics/forms/:formId/ai-insights` | AI Insights tab |

When API is off, analytics panels show **empty states** (demo charts and the “Sample data” badge were removed on `main`). When API is on but payloads are incomplete, Performance may show API `screenDropoff` with a **placeholder tooltip** (see **B.11**); AI Insights calls the real endpoint (see **B.12**).

**`GET /analytics/forms/:formId/performance` — minimum contract**

See **B.11** for full `screenDropoff` + funnel shape. Frontend today consumes: `responses`, `contentScreenCount`, `funnel`, `screenDropoff`, `avgDurationMs`, `completionRate`, `trendPct`, `trendUp`, daily series fields used by stats/funnel cards.

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

**Current state:** Rule-based heuristics in `responseQualityScoring.js` remain the offline fallback. When `VITE_API_BASE_URL` is set, both builder preview and live `/f/:formId` call `POST /forms/:formId/response-quality/evaluate` via `useResponseQualityEvaluation`.

**Config in snapshot** per screen: `longTextResponseQualityEnabled`, `longTextResponseQualityOptions`, `shortTextResponseQuality*`. Each options object now includes owner `customInstructions` plus nested criterion config objects (`length`, `specificity`, `relevance`, `completeness`).

**Options shape:**

```json
{
  "customInstructions": "",
  "minWords": 10,
  "sensitivity": "Low" | "Medium" | "High",
  "vagueWords": "good, fine, okay",
  "topicKeywords": "experience, product",
  "keywordThreshold": 1,
  "length": { "enabled": true, "minWords": 10 },
  "specificity": { "enabled": true, "sensitivity": "Medium", "vagueWords": "good, fine, okay" },
  "relevance": { "enabled": true, "keywords": "experience, product", "matchThreshold": 1 },
  "completeness": { "enabled": true, "detectTrailing": true, "requiredSentences": 1 },
  "criteria": {
    "length": { "enabled": true, "minWords": 10 },
    "specificity": { "enabled": true, "sensitivity": "Medium", "vagueWords": "good, fine, okay" },
    "relevance": { "enabled": true, "topicKeywords": "experience, product", "keywordThreshold": 1 },
    "completeness": { "enabled": true, "detectTrailing": true, "requiredSentences": 1 }
  }
}
```

If `customInstructions` is blank, backend should fall back to a **default evaluator prompt** rather than treating the field as required.

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
  "sessionId": "per-tab-session-id",
  "questionText": "What went wrong during onboarding?",
  "helperText": "Be specific — mention steps, screens, or errors.",
  "answerText": "user answer...",
  "conversationHistory": [],
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

**UI:** `AnalyticsAiInsightsPanel.jsx` — **wired to API** when `VITE_API_BASE_URL` is set; polls while `status === 'processing'`. Demo constants removed. Full contract and prompt rules: **B.12**.

**Modules backend should populate:**

| Module | Frontend file | Payload fields |
|--------|---------------|----------------|
| AI Summary + NPS | `AnalyticsAiInsightsPanel.jsx` | `summaryText`, `npsScore`, `npsTrendPercent`, `npsTrendLabel` |
| Priority Focus | same | `priorityTitle`, `priorityBody`, `impactEstimate`, `confidencePercent` |
| Top Patterns | `aiInsightsApiMappers.js` | `patterns[]` — `{ percent, label, tag, description, examples[] }` |
| Quick Stats | `QuickStatsCard.jsx` | `quickStats.sentiment`, `topIssueCategory`, `topIssuePercent`, `sevenDayTrend` |
| Recommended Actions | `aiInsightsApiMappers.js` | `recommendedActions[]` — `{ title, description, priority, actionType }` |
| Seven-day chart | `SevenDayTrendChart.jsx` | `quickStats.sevenDayTrend` |

**Gates (frontend-enforced):** min 10 responses for AI insights; min 25 for reliable Top Patterns.

**Request body:** `{ "range": "7d" | "30d" | "90d" | "all" }`

---

## Priority 3 — Workspaces, templates

| Area | Path | Notes |
|------|------|--------|
| Workspaces | `/workspaces` | id, label, color, count |
| Templates | `/templates` | match `TEMPLATE_CATALOG` shape in frontend |

---

## Priority 4 — Billing / profile

- **Pilot checkout:** `https://app.clearform.in/buy/pilot` → `POST /billing/checkout-sessions/pilot` → claim on signup (`claim-purchase`)
- **Profile billing tab:** `GET /billing/status` when `VITE_API_BASE_URL` is set (usage, receipt `pay_…`)
- **Demo toasts (expected until backend):** account deletion, password reset email — see ProfilePage, ProfileSecurityPanel

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
