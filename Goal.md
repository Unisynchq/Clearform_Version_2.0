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

### 6. Backend readiness

- API client, endpoint map, service facades with localStorage fallback
- Documented contract in `BACKEND_HANDOFF.md`

---

## Success criteria

| Area | Done when |
|------|-----------|
| Publish | `status: 'live'` + snapshot → full `FormPublishView` |
| Logic persist | Connections/rules survive reload |
| Dashboard motion | ~400ms load + staggered content |
| Search | Filters real Redux forms; recent searches saved |
| Analytics | Loading + fade between states |
| Build | `npm run build` + `npm run test:smoke` pass |
| Backend handoff | `BACKEND_HANDOFF.md` + `src/api/*` |

---

## Assignment / submission goals

- Demonstrable end-to-end flow: dashboard → builder → publish → (optional) public form
- Written handoff for backend and reviewers (`ASSIGNMENT_REPORT.md`)
- Honest scope: prototype with local data, API-ready structure

---

## Out of scope (current phase)

- Production auth, billing, file CDN
- Real analytics aggregates from server
- Logic edge draw animations

---

## Manual verification

See `progress.md`.
