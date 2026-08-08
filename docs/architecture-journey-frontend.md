# Clearform Frontend — Architecture Journey

> Written for Rahul. What we built on `Clearform_Version_2.0` with AI assistance from prototype → production (May–Aug 2026), how it talks to the API, and how FE work pairs with backend CLE tickets.  
> Companion: `Clearform-backend-main/docs/architecture-journey-backend.md`  
> Local context: `context.md`, `BACKEND_HANDOFF.md` (contracts; some auth sections superseded by Supabase)

---

## 1. What the frontend is

**Clearform_Version_2.0** is the builder + analytics + billing UI at **https://app.clearform.in** (Vercel). Public respondent experiences also ship from this app (`/f/...`).

```text
Browser
  → Vercel (SPA, React 19 + Vite 8)
       → Supabase Auth (session)
       → api.clearform.in/api/v1 (Nest)
       → PostHog (product analytics)
       → Sentry clearform-web (errors)
```

Mock/demo mode (`VITE_USE_MOCK_API`) exists for local UI work; production uses the live API.

---

## 2. Timeline — commits that shaped the FE

| Phase | Theme | Example commit subjects |
|-------|-------|-------------------------|
| **Prototype** | Builder UX, local state | `Initial commit`, `Complete Clearform v2 builder UX, publish flow, and backend handoff` |
| **API wire-up** | Kill demo charts; real share/responses | `Wire production API…`, `Wire API mode, remove demo UI…`, `Integrate Firebase for authentication…` |
| **Auth cutover** | Firebase → Supabase | `fix(auth): migrate auth from Firebase to Supabase (hard cutover) (#23)`, OAuth popup / CLE-46 / password reset / PKCE recovery |
| **AI UX** | Doctrine-backed quality; no local fake grades | `Wire response-quality frontend to doctrine-backed API without local fallbacks`, coaching / Improve-with-AI fixes |
| **Billing UI** | Pilot, promo, Publish Pass, Starter | `feat(billing): pilot checkout…`, `Publish Passes widget + Starter/₹99…`, `remove Free tier UI` |
| **Analytics** | PostHog + reliability | `feat: AI tokens billing meter and live PostHog product analytics` |
| **Aug P0/P1** | CLE-95/96/97 | Receipt `planId`, analytics picker filters, Continue gating |

Linear (same week as backend Redis cutover):

| ID | FE change |
|----|-----------|
| [CLE-95](https://linear.app/clearform/issue/CLE-95) | Receipt uses real `planId` (needs BE precedence fix too) |
| [CLE-96](https://linear.app/clearform/issue/CLE-96) | `selectAnalyticsPickerForms` — exclude archived/trash; workspace parity |
| [CLE-97](https://linear.app/clearform/issue/CLE-97) | Continue disabled while quality loading or `red` |
| [CLE-72](https://linear.app/clearform/issue/CLE-72) | Quality column in responses table — **still Todo** |
| CLE-46 / CLE-65 | OAuth land + React sign-in errors — Done |

---

## 3. HLD — Frontend architecture

```text
AppRoutes
  ├─ Public: /signin, /signup, /f/:slug (respondent)
  ├─ Authed shell: dashboard, builder, analytics, profile/billing
  └─ *: NotFoundPage → redirect dashboard

State
  ├─ Redux Toolkit (forms, UI filters, builder)
  ├─ Supabase session (auth)
  └─ Server truth via API (forms, responses, billing status)

Cross-cutting
  ├─ Sentry React SDK (preview excluded from prod stream)
  └─ PostHog (funnels: signup, form_created, pilot_activated, …)
```

**Hosting:** Vercel SPA rewrites to `index.html`. Env: `VITE_API_BASE_URL`, `VITE_SUPABASE_*`, Sentry/PostHog keys. `.env` / `.env.*` gitignored; only `.env.example` committed.

---

## 4. LLD — Notable modules

| Area | Paths | Notes |
|------|-------|-------|
| Forms list / filters | `src/store/slices/formsSlice.js` | Dashboard filters vs analytics picker (CLE-96) |
| Builder Continue | `src/features/forms/formBuilder/BuilderContentCard.jsx` | `continueDisabled` from quality state (CLE-97) |
| Billing receipt | `profileBillingInvoice.js`, `ProfileBillingPanel.jsx` | Honest `planId` (CLE-95) |
| Auth | Supabase client + OAuth popup handoff | Hard cutover Jul 2026 |
| Analytics page | `src/pages/AnalyticsPage.jsx` | Uses filtered form selector |
| 404 | `src/pages/NotFoundPage.jsx` | Soft message + `<Navigate to="/dashboard" />` |

### CLE-96 selector (intent)

Analytics used to list **all** forms in Redux (including archived/trash / other workspaces). Dashboard already filtered. `selectAnalyticsPickerForms` aligns the picker with dashboard visibility rules so counts match what builders expect.

### CLE-97 Continue gating (intent)

Live RYG quality already existed; Continue stayed clickable during loading and on **red**. FE now disables Continue when evaluation is in flight or level is `red` (preview + live paths that pass `previewStepNav`).

---

## 5. Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19, Vite 8, Tailwind 4, Motion, Radix |
| State | Redux Toolkit |
| Auth | `@supabase/supabase-js` |
| API | `fetch` wrappers → Nest `/api/v1` |
| Errors | `@sentry/react` (`clearform-web`) |
| Product analytics | PostHog |
| Deploy | Vercel |

---

## 6. What we removed on the FE — and why

| Removed | Why |
|---------|-----|
| Demo / mock analytics as default prod path | Misleading founder/customer screenshots |
| Firebase Auth client | Supabase cutover |
| Local quality fallbacks as primary | Server doctrine is source of truth |
| Open “Free tier” marketing UI | Paid-only / locked unpaid product direction |
| Treating preview deploys as production in Sentry | Noise (`fix(sentry): keep preview deploys out…`) |

---

## 7. How FE + BE decisions couple

| Product need | FE | BE |
|--------------|----|----|
| Correct plan on Billing | Show `planId` / meters from API | CLE-95 preserve Pro over Starter |
| Cheap jobs / no Redis tax | No change | CLE-94 SQS, omit Redis |
| Honest Continue | CLE-97 disable | Quality evaluate API |
| Form picker parity | CLE-96 selector | Same forms list payload |
| Quality column | CLE-72 (open) | Persist/return quality fields |

**Rule:** Improve Clearform **in these two repos**. Do not invent a third app for “infra experiments.” Architecture evolves here; VPS/AWS only hold config + queues.

---

## 8. Performance & UX improvements (FE-visible)

- Auth: OAuth no longer traps users on `/signin` (CLE-46); password reset PKCE recovery.
- AI: coaching/Improve grounded in doctrine; less “fake green.”
- Billing: meters and receipts reflect API truth (after CLE-95 BE deploy).
- Analytics: picker no longer inflated by trash/archive.
- Continue: no advance into red / mid-analysis.
- Sentry: fewer preview-noise issues.

Backend SQS cutover does **not** change FE APIs; it stabilizes side effects (webhooks, quality, insights) without Upstash outages.

---

## 9. Observability (FE)

| Tool | Project / use |
|------|----------------|
| Sentry | `clearform-web`; release `clearform-web@<sha>` |
| PostHog | Clearform project; growth dashboard |
| Linear | CLE tickets for FE defects |
| Vercel | Deploy previews; promote main → production |

---

## 10. What to learn as you own the FE + contracts

1. Redux selectors vs page-local filters (CLE-96 pattern).
2. Supabase Auth session races (don’t fire API before session ready).
3. Entitlement-aware UI — never trust client-only locks.
4. Sentry release hygiene on Vercel.
5. Contract testing against `BACKEND_HANDOFF.md` + real `/api/v1` shapes.
6. Pair with backend on CLE-72 (quality column end-to-end).

---

## 11. Deploy checklist (FE)

1. Merge to `main` → Vercel production.
2. Confirm `VITE_API_BASE_URL=https://api.clearform.in/api/v1`.
3. Smoke: sign-in, open analytics picker, builder Continue on red/loading, download receipt.
4. Comment Linear CLE-95/96/97 with Vercel deployment URL + sha after verify.

---

## 12. NotFoundPage note

`src/pages/NotFoundPage.jsx` is the SPA catch-all: short “Page not found” copy, then client navigate to `/dashboard`. No Redis/API dependency. Leave as-is unless product wants a sticky 404 without auto-redirect.

---

*Last updated: Aug 2026 — CLE-95/96/97 FE cutover alongside backend SQS.*
