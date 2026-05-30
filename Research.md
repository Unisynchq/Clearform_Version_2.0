# Research — Findings & Decisions

## 1. Publish showed incomplete UI

**Cause:** Publish only toggled view; missing `status: 'live'`, `writePublishedForm`, `formId` on `FormPublishView`.

**Fix:** Unified `handlePublishForm` pipeline + `buildPublishSnapshot`.

---

## 2. Builder animations felt invisible

**Cause:** Sub-200ms transitions; panels opened same tick as content closed.

**Fix:** `builderMotion.js` tokens; `PANEL_SWITCH_DELAY_MS`; `BuilderRightPanelShell`.

---

## 3. Analytics content “popped” after loading

**Cause:** Skeleton unmounted instantly; no exit/enter crossfade.

**Fix:** `AnimatePresence mode="wait"` + `fadeUp` on `AnalyticsPage`; per-tab skeleton keys.

---

## 4. Search used fake data

**Cause:** `RECENT_SEARCHES` constant and non-functional action rows.

**Fix:** Redux forms filter; `searchRecentStorage`; wired navigate/edit/responses/copy.

---

## 5. Logic not saving

**Causes:**

1. When draft hydrated from snapshot without logic fields, localStorage load was **skipped**
2. Early save could write empty arrays before hydration finished
3. `logicModeManual` / card offsets not in snapshot

**Fix:**

- `logicMeta` in snapshot + localStorage
- Merge storage when snapshot logic empty
- Save only after `builderHydrated`
- Show canvas in AI mode if connections already exist

---

## 6. Dashboard felt too fast

**Cause:** `useHydrationFrame` completes in 2 frames (~32ms); grid `delay: index * 0.04` too short.

**Fix:**

- `useDashboardHydration` min 420ms
- Grid stagger `0.12 + index * 0.05`, duration 0.32s
- Slower dashboard route transition (0.4s)

---

## 7. Native select in configure panels

**Cause:** Legacy `<select>` markup in `FormBuilderRightPanels.jsx`.

**Fix:** Radix `@/components/ui/Select` (already used elsewhere in app patterns).

---

## 8. Backend integration strategy

**Decision:** Facade pattern — services check `isApiConfigured()` and fall back to localStorage so:

- Demo works offline
- Backend swaps one service at a time
- No big-bang rewrite

**Reference:** `BACKEND_HANDOFF.md`, `src/api/endpoints.js`.

---

## 9. Explicit non-goals

- Animated logic edge drawing (removed as distracting)
- Logic card enter animations on canvas cards

---

## 10. Auth + API client (May 2026)

**Decision:** Firebase ID tokens on the client; backend verifies via Firebase Admin.

- Client: `AuthContext.jsx` → `sessionStorage['clearform:auth-token']`
- HTTP: `src/api/client.js` uses **fetch** (not axios); attaches `Authorization: Bearer`
- Production API: `https://api.clearform.in/api/v1`

---

## Open questions for backend/product

1. Snapshot conflict resolution (multi-tab edit)
2. Public URL format (`/f/:id` vs subdomain) — prod app at `app.clearform.in`
3. Upload presigned URL flow
4. Analytics aggregation windows vs “All time” filter
5. Cloudflare cache rules for public render endpoint (Part C)
