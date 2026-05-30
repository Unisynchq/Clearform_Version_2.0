# Progress — Clearform v2

**Last updated:** 30 May 2026  
**Build:** `npm run build` (CRITICAL: use NPM strictly, NOT Bun)  
**Smoke:** `npm run test:smoke` — pass (prior runs)

**Production runbook:** [`../clearform-backend/docs/PRODUCTION.md`](../clearform-backend/docs/PRODUCTION.md)

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
| Blank screen fix (formsSlice) | Done |
| Frontend routes (profile/analytics/templates/help) | Done |
| Vite watcher fix (iCloud node_modules 2) | Done |
| Backend connected (NestJS, Supabase, local Redis) | Done |
| Production docs + env templates (Part B) | Done |
| Production infra (Part A — DNS/Vercel/Firebase/VPS) | Manual — see PRODUCTION.md |
| Post-launch hardening (Part C) | Backlog in PRODUCTION.md |

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
- [x] `.env.example` (local + prod URL comments)
- [x] `BACKEND_HANDOFF.md`
- [x] `ASSIGNMENT_REPORT.md`

### Phase 8 — Backend connected + routing fixes (28 May 2026)

- [x] Fixed blank screen: `syncWorkspaceCounts` + `countNavForms` in `formsSlice.js`
- [x] Vite `server.watch.ignored` for `node_modules*`
- [x] Routes: `/dashboard/profile`, `/analytics`, `/templates`, `/help`
- [x] NestJS `localhost:3000/api/v1`; `VITE_USE_MOCK_API=false`

### Phase 9 — Production readiness (30 May 2026)

- [x] Planning docs synced with backend (`Goal.md`, `Plan.md`, `Research.md`, `context.md`)
- [x] `README.md` links to `clearform-backend/docs/PRODUCTION.md`
- [x] Prod URLs: `app.clearform.in` / `api.clearform.in`
- [ ] Part A manual: Cloudflare DNS, Vercel domain, Firebase authorized domains, VPS `.env`
- [ ] Part C: Cloudflare cache, Razorpay live, schema columns — see PRODUCTION.md

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
| 10 | Prod sign-in (after Part A) | Login on `app.clearform.in`, API calls without CORS errors |

---

## Automated tests

| Command | Status |
|---------|--------|
| `npm run build` | Run before deploy |
| `npm run test:smoke` | Pass (prior) |
| `npm run test:published` | Optional before submission |
| `npm run test:configure-live-update` | Optional |

---

## Deferred / Part C

- [ ] Cloudflare cache rules for public render
- [ ] Razorpay live keys + webhook URL
- [ ] Prisma `snapshot` / `dropOffFieldId` columns on live Supabase
- [ ] Firebase custom auth domain (`auth.clearform.in`)
- [ ] Logic edge draw animations (out of scope)

---

## Assignment readiness

See **`ASSIGNMENT_REPORT.md`**.

**Summary:** Frontend + backend integration complete for pilot. Production traffic requires Part A in `PRODUCTION.md`.

---

## Copy-paste handoff

```
Workspace: UniSync/Clearform_Version_2.0
Prod: app.clearform.in → api.clearform.in/api/v1
Dev: localhost:5173 → localhost:3000/api/v1
Runbook: clearform-backend/docs/PRODUCTION.md
Key: FormBuilderPage, formsSlice, src/api/client.js, buildPublishSnapshot
```

---

## Blockers

None for local/demo. **Part A** (DNS, secrets, domains) required before public production cutover.
