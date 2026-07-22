# Progress — Clearform v2

**Last updated:** 01 Jul 2026  
**Build:** `npm run build` — pass  
**Smoke:** `npm run test:smoke` — pass (prior runs)

---

## 01 Jul 2026 — Fix: builder jumps to Start screen on first save of a new form

**Problem:** Creating a form and clicking into the first question snapped the canvas back to the Start/intro screen. Only reproduced with the backend configured (`isApiConfigured()`).

**Root cause:** Editing a brand-new (un-saved) form triggers the auto-persist effect, which calls `ensureFormPersisted` → creates the draft and `navigate(..., { replace: true })` to the new form URL. That changes `activeFormId` (null → real id) and `location.key`, firing the reset effect that clears `builderActiveHydratedRef`. The follow-up re-hydration then reads the guard as `false`, treats it as a first hydration, and forces `activeScreenId` to `screens[0]` (intro) — even though `activeScreenIdRef` still held the question being edited.

**Fix (frontend only):**
- Added `preserveActiveScreenOnNextHydrateRef`, set to `true` immediately before the first-save self-navigation in `ensureFormPersisted`.
- `applyBuiltFormState` now keeps the current screen when either it's a normal re-hydrate **or** that forced flag is set (and `prevActive` still exists in the hydrated screens); the flag is consumed on read. Genuine first loads (where `prevActive` is null) still focus the intro as before.

---

## 01 Jul 2026 — Fix: newly added screen missing from Logic (duplicate screen ids)

**Problem:** After adding a screen, it wouldn't appear in the Logic view / the "Then go to" destination picker.

**Root cause:** `nextIdRef` (id generator for new content screens) starts at `100`, and `addContentScreen` assigned `nextIdRef.current += 1` → `101, 102…`. On hydration, `applyBuiltFormState` set `nextIdRef.current = built.nextId`, but the snapshot/API payload can omit `nextId` (older drafts) and falls back to `?? 100`. If that form already contained content screens with ids `≥ 101`, the next added screen got a **duplicate id**. Every id-keyed structure then collapses the pair — most visibly `reorderScreensFromLogicConnections`, which builds `new Map(screens.map(s => [s.id, s]))` (last-wins), so one of the same-id screens silently vanishes from the logic canvas/panel.

**Fix (frontend only):**
- `applyBuiltFormState`: `nextIdRef.current = Math.max(built.nextId ?? 0, maxExistingScreenId + 1, 100)` — the generator always stays above the largest existing screen id regardless of what the snapshot stored.
- `addContentScreen`: computes `newId = Math.max(nextIdRef.current + 1, maxExistingScreenId + 1)` as a second layer of defense so a new screen can never reuse a live id.

---

## 01 Jul 2026 — Logic canvas: momentum panning (rAF/inertia) + editable zoom

**Panning refactor (smoothness):** Drag-panning updated React state on every `pointermove`, so movement was rigid and re-rendered the board (and re-ran the port ResizeObserver measure effect) each frame.
- Decoupled pan from React state: pointer deltas now write a `panTargetRef`; a single `requestAnimationFrame` loop (`stepLogicPan`) lerps the current visual position toward the target (`follow` 0.4 while dragging) and applies it via `transform: translate3d(x,y,0) scale(z)` written **directly** to the board node (`logicBoardTransformRef`) — no per-frame React render
- Inertia: `pointermove` samples pointer velocity (capped ±60px/frame); on release the loop keeps advancing the target by the velocity with a 0.9 friction decay until it settles, then commits once to `setLogicCanvasPan` and stops the loop
- `logicCanvasPanRef` stays the live "current" position each frame, so zoom-focal math and connection-drop hit-testing remain correct. Zoom/fit/programmatic pans use an `immediate` snap path (focal-correct, cancels any inertia). rAF is cancelled on unmount
- The measure effect no longer re-runs on every pan tick (pan removed from the hot path), only after settle

**Editable zoom:** the `100%` readout in the zoom control is now click-to-edit — type a percentage (Enter/blur commits, Esc cancels), clamped 25–250%, and re-zooms around the viewport centre via the same focal math as the +/- buttons (`applyLogicZoomPercent`).

---

## 01 Jul 2026 — Logic canvas: fix locked horizontal panning

**Problem:** In logic mode, dragging the canvas panned vertically fine but horizontal (X) movement was locked/jerky. Root cause was `clampLogicCanvasPan`: it clamped X with `minX = 0` and `maxX = usableWidth - scaledW`. Whenever the board was wider than the usable viewport (the normal case) `maxX` went negative, so `Math.min(maxX, Math.max(0, pan.x))` always collapsed to `maxX` — pinning X to a single value. Y was returned unclamped, hence it stayed free/smooth. The drag handler itself always applied identical delta math to both axes, so the fault was purely in the clamp.

**Fix (frontend only):**
- Rewrote `clampLogicCanvasPan` (`constants/logicCanvasViewport.js`) with a `bound(value, lo, hi)` helper that returns the value unchanged when `hi < lo` (never inverts the range / pins the pan). X and Y are each bounded to `[margin - scaledSize, viewportExtent - margin]` (margin capped at 140px / half the extent), leaving a generous overscroll range so 2D panning (left/right/up/down/diagonal) is fluid while keeping part of the board reachable
- Now also clamps Y (previously fully free) using the viewport height, added as new optional params; `applyLogicCanvasPan` passes `board.offsetHeight` + `vp.clientHeight`
- Wheel still maps to zoom (`deltaY`) as designed; drag remains the pan gesture

---

## 01 Jul 2026 — Logic canvas: draggable screens fix + dismissible AI banner

**Problem:** In logic mode the screen cards showed a grab cursor but could not actually be dragged — pointer capture was set on the card DOM node, but the board re-renders on every pointer move (offset state change), which can silently drop the capture so `pointermove` stopped reaching the card. The green "AI logic applied" banner had no way to be dismissed.

**Fix (frontend only):**
- Card drag now tracks on `window` `pointermove`/`pointerup`/`pointercancel` while `logicCardDraggingId` is set (via a `useEffect`), instead of relying on per-card React handlers + `setPointerCapture`. `onLogicCardPointerDown` just records the start point and sets the dragging id. Commit threshold lowered to 6px and the moved offset now calls `markFormTouched()` so repositioned cards persist via the snapshot's `logicMeta.logicCardOffsets`
- Removed the now-unused `onLogicCardPointerMove` / `onLogicCardPointerUp` and trimmed `cardDragHandlers` to just `onPointerDown`
- "AI logic applied" banner now has a close (×) button; dismissal is local state (`aiLogicBannerDismissed`) that auto-resets whenever a fresh AI generation succeeds, so a new run re-surfaces the notice

---

## 01 Jul 2026 — Start screen logo + heading/panel polish

**Problem:** Intro Configure "Appearance" collapsed whenever Essentials was opened (exclusive accordion); the Start-screen logo box was an empty black square only editable inside edit mode; the "Conditional Logic" section showed a useless "SHOW THIS BLOCK IF / add a question screen first" placeholder on screens with no prior answerable screens; the Heading panel's Text size + Alignment used bordered square buttons inconsistent with the segmented pills used by Heading level / Font weight.

**Fix (frontend only):**
- `toggleSection` (intro Configure panel only) is now non-exclusive and `sections.appearance` defaults open, so Appearance stays expanded
- Start-screen logo defaults to the bundled Clearform logo (`src/assets/Clearform logo.png`), rendered 1:1 edge-to-edge (`object-cover`, no `#18181a` box behind it). New forms and drafts without a saved logo fall back to this default
- Logo is clickable in the builder even outside edit mode (direct upload via `handleLogoUpload` → sets `logoImage`/`draftLogo` + `markFormTouched`); subtle affordance only: hover scrim + small pencil, plus a tiny bottom-right pencil badge. Preview/published stays read-only
- Conditional Logic accordion (Heading, Description, Image, Media, Captcha panels) is hidden entirely when `priorScreensForActive.length === 0`; `BlockVisibilityConditions` now returns `null` when it has no prior screens (removed the placeholder card)
- Heading Appearance Text size (S/M/L/XL) and Alignment (left/center/right) restyled as segmented pills matching Font weight

**Docs:** `BACKEND_HANDOFF.md` — 2026-07-01 entry; `intro.logo` now defaults to a bundled asset URL (persists), while user uploads remain `blob:` object URLs needing real hosting.

---

## 01 Jul 2026 — CTA panel cleanup + CTA image + contact defaults

**Problem:** CTA configure panel had a confusing dead “Label color +” and an unnecessary “Show icon” toggle; the CTA card’s top icon box was a fixed black square with no way to add a custom image; Contact’s Email field defaulted to required.

**Fix (frontend only):**
- Removed the redundant “Label color” block (TEXT COLOR already controls button label color) and the “Show icon” toggle from the CTA panel
- CTA card top icon box is now click-to-upload (builder) — shows uploaded image as a 1:1 rounded square (`object-cover`); falls back to the black icon box when empty
- New `ctaImage` state round-trips through `screenConfigSync` + `previewCanvasConfigsFromScreen`
- Contact fields all default to not-required (Email flipped to `required: false`)

**Docs:** `BACKEND_HANDOFF.md` — 2026-07-01 entry; `ctaImage` is a new optional snapshot field (blob URL like intro `logo`, needs real hosting backend-side).

---

## 30 Jun 2026 — Start screen & configure panel UX

**Problem:** Start button/accents were blue (`formAccentColor`); intro configure panel showed irrelevant Field Settings (Required/Hidden/Read-only); Essentials had Text Box and enabled Captcha; CTA color `+` swatches inconsistent; choice option labels not editable on canvas.

**Fix (frontend only):**
- `builderTheme.accentColor` decoupled from form brand dot — buttons/accents default `#18181a`
- Intro configure: Essentials + Appearance only (Field Settings hidden)
- Essentials: removed Text Box; Captcha disabled with “Soon”; larger tiles; neutral active highlight
- CTA configure panel shell aligned to `#f7f7f8`; BUTTON/TEXT color `+` swatch first (Design panel pattern)
- `CanvasOptionLabel` — inline edit Single/Multiple choice options on canvas

**Docs:** `BACKEND_HANDOFF.md` — 2026-06-30 start screen UX entry.

---

## 30 Jun 2026 — Design theme parity (preview + swatches + intro)

**Problem:** Custom design colors did not show in Preview (hardcoded `#f5f4f0` bg); `+` swatches were last and stayed white; intro welcome ignored text color.

**Fix (frontend only):**
- Preview/edit canvas uses `builderTheme.canvasBackground`
- Custom `+` swatch **first** in Background / Card Color / Text Color rows; fills with active custom color
- Intro + end screens use theme `textColor` / `accentColor` in builder and `FormRespondentView` (published)

**Docs:** `BACKEND_HANDOFF.md` — 2026-06-30 frontend implementation log entry.

**QA:** Design → custom colors → Preview → Publish → `/f/:id` incognito should match.

**Follow-up (same day):** Text Color no longer drives Save/Start button fill (`resolveButtonAccentColor`); custom swatches always show `+` on top of color fill.

---

## 30 Jun 2026 — Local frontend dev (no backend / no Firebase)

**Problem:** Blank screen on `npm run dev` — Firebase threw `auth/invalid-api-key` when env keys were missing.

**Fix (frontend only):**
- Skip Firebase init when `VITE_FIREBASE_API_KEY` is unset (`src/config/env.js`, `src/config/firebase.js`)
- Local email sign-up / sign-in via `localAuthService.js` + existing `userAccountsStorage` (no backend)
- Guard Firebase listeners in `main.jsx`, `FirebaseSessionBridge`, `authTokenRefresh`, `AuthRedirectHandler`
- Added `.env.local` template and **`FRONTEND_DEV.md`** — how to run offline and what to push

**How to run locally:** `npm run dev` → sign up on `/` with any email + password → dashboard uses localStorage.

**Push rule:** Only frontend files in this repo (`src/`, `public/`, config, docs). No backend. Log changes here before push.

---

## Status overview

| Workstream | Status |
|------------|--------|
| Logic canvas + If/Else catalog | Done |
| Publish full UI | Done |
| Builder animations (tuned slower) | Done |
| Analytics loading + fade transition | Done |
| Global search (real data) | Done |
| Logic persistence (manual + meta) | Done |
| Configure Radix selects | Done |
| Dashboard slower entrance | Done |
| Backend API scaffolding | Done |
| Docs + assignment report | Done |

---

## Completed (detailed)

### Builder

- [x] Port alignment, If/Else catalog
- [x] Publish snapshot + live status + publish view props
- [x] `builderMotion.js`, `BuilderRightPanelShell`, panel refactor
- [x] Text Color swatch order (`#3d3d3d` before `#198eea`)

### Logic persistence

- [x] `logicMeta` in `buildPublishSnapshot`
- [x] localStorage merge when draft logic empty
- [x] Canvas visible in AI mode when logic exists

### Dashboard & search

- [x] `useDashboardHydration` (420ms min skeleton)
- [x] `dashboardMotion.js` stagger + route enter
- [x] SearchPalette: real forms, recent searches, actions
- [x] Search dropdown slower animation

### Analytics

- [x] Skeleton all tabs
- [x] Fade skeleton → content

### Backend-ready

- [x] `src/api/client.js`, `endpoints.js`, services
- [x] `.env.example`
- [x] `BACKEND_HANDOFF.md`
- [x] `ASSIGNMENT_REPORT.md`

---

## Manual QA checklist

| # | Check | Expected |
|---|--------|----------|
| 1 | Click **All forms** in sidebar | Brief skeleton, then staggered heading/filters/grid |
| 2 | Global search (⌘K) | Shows your forms; recent searches are real |
| 3 | Search → Edit form | Opens builder for that form |
| 4 | Builder Logic manual | Add connections; reload → still there |
| 5 | Switch Manual ↔ AI | Manual logic still visible when connections exist |
| 6 | Publish (≥1 question) | Full publish UI |
| 7 | Analytics tabs | Skeleton then fade to content |
| 8 | Configure short text validation | Custom dropdown, not OS default |
| 9 | Design → Text Color | Dark swatch before blue |

---

## Automated tests

| Command | Status |
|---------|--------|
| `npm run build` | Pass |
| `npm run test:smoke` | Pass |
| `npm run test:published` | Run before submission if needed |
| `npm run test:configure-live-update` | Optional |

---

## Deferred / backend-dependent

- [ ] Live API for forms, responses, analytics
- [ ] Real auth (JWT/session)
- [ ] File upload to storage
- [ ] Production deploy + env config
- [ ] Logic edge draw animations (out of scope)

---

## Assignment readiness

See **`ASSIGNMENT_REPORT.md`**.

**Summary:** Good to go for frontend assignment / demo. Not production-ready until backend Phase 1 in `BACKEND_HANDOFF.md` is complete.

---

## Copy-paste handoff

```
Workspace: Final work 2
Frontend prototype complete. Build + smoke pass.
Backend: set VITE_API_BASE_URL, see BACKEND_HANDOFF.md
Key: FormBuilderPage, AllFormsPage, SearchPalette, builderMotion,
dashboardMotion, buildPublishSnapshot, src/api/*
Docs: context.md, Goal.md, Plan.md, Research.md, progress.md,
ASSIGNMENT_REPORT.md, BACKEND_HANDOFF.md
```

---

## Blockers

None for frontend demo. **Backend** required for production data sync.
