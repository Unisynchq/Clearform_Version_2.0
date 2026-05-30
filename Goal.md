# Goals — Clearform v2

## Product goals (frontend)

### 1. Form builder — complete authoring loop

Users can create forms (content, design, logic, settings), preview, and publish with a **full success screen** (link, QR, share).

### 2. Logic — trustworthy canvas

- Ports and edges align visually
- If/Else only on answerable question types
- Manual and AI modes; setup **persists** across reload and tab switches

### 3. Dashboard — polished first impression

- Skeleton loading (not instant pop-in)
- Staggered entrance when opening **All forms**
- Real global search (no hardcoded fake forms)

### 4. Analytics — credible loading UX

- Skeleton on all tabs
- Fade transition skeleton → content (no hard pop)

### 5. Configure panels — product-quality controls

- Custom dropdowns (Radix `Select`), not native `<select>`

### 6. Backend integration (achieved)

- Live API via `src/api/client.js` + service facades
- Firebase auth (ID token in sessionStorage)
- Documented contract in `BACKEND_HANDOFF.md`
- Production deploy: https://app.clearform.in → https://api.clearform.in/api/v1

---

## Success criteria

| Area | Done when |
|------|-----------|
| Publish | `status: 'live'` + snapshot → full `FormPublishView` |
| Logic persist | Connections/rules survive reload |
| Dashboard motion | ~400ms load + staggered content |
| Search | Filters real Redux/API forms; recent searches saved |
| Analytics | Loading + fade between states |
| Build | `npm run build` + `npm run test:smoke` pass |
| Auth + API | Firebase login + Bearer token on API calls |
| Production | Vercel app + VPS API per `docs/PRODUCTION.md` |

---

## Assignment / submission goals

- Demonstrable end-to-end flow: dashboard → builder → publish → public form
- Written handoff for reviewers (`ASSIGNMENT_REPORT.md`)
- Co-maintained with `clearform-backend` (same UniSync workspace)

---

## Out of scope (current phase)

- Logic edge draw animations
- Full Composio integrations (backend Phase 2)
- Custom Firebase auth domain branding (Part C)

---

## Manual verification

See `progress.md`.
