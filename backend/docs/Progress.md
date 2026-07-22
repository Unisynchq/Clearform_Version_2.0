# Progress snapshot

Last updated: **2026-06-27** (billing features API, profile avatar, quality v2 docs)

**Live backlog:** Linear → team **Clearform** → project **Clearform Platform**.

---

## Production sign-off (2026-06-03)

**BACKEND_HANDOFF scope is live** in production except **Composio OAuth** (integrations UI wired; connect flow pending API keys + redirects).

| Area | Status |
|------|--------|
| Publish + share URLs | Done |
| Public `/f/:id` + POST responses | Done |
| Analytics (per-question columns) | Done |
| Webhooks (HMAC, test, `response.created`) | Done |
| FIX A / FIX B / B.2 | Done |
| Sentry SDK (`clearform-api`, `clearform-web`) | Done; 0 unresolved at audit |
| B.11–B.13 Analytics (drop-off, AI from answers, overview) | **Shipped** |
| Billing status + pilot features API | **Shipped** — FE Usage & Billing renders `features[]` |
| Profile avatar (Firebase Storage) | **Shipped in repo** — run migration + set `FIREBASE_STORAGE_BUCKET` on VPS |
| Response quality v2 (evaluative, memory, mash fix) | **Shipped** — `docs/ai/backend-system-flow.md` |
| Composio (Sheets / Slack / Drive) | **Pending VPS** → Linear **CLE-19** |

---

## Linear (updated via MCP)

| ID | Title | State |
|----|-------|-------|
| [CLE-19](https://linear.app/clearform/issue/CLE-19) | Composio production setup | Todo (due 2026-06-04) |
| [CLE-18](https://linear.app/clearform/issue/CLE-18) | Epic: Integrations | In Progress |
| [CLE-8](https://linear.app/clearform/issue/CLE-8) | FE POST responses | Done |
| [CLE-10](https://linear.app/clearform/issue/CLE-10) | FE FIX A | Done |
| [CLE-11](https://linear.app/clearform/issue/CLE-11) | FE FIX B | Done |
| [CLE-7](https://linear.app/clearform/issue/CLE-7) | E2E smoke | Done |
| [CLE-9](https://linear.app/clearform/issue/CLE-9) | Sentry alerts + Linear | Todo (dashboard config) |
| [CLE-6](https://linear.app/clearform/issue/CLE-6) | Production env | Todo (Composio → CLE-19) |
| [CLE-5](https://linear.app/clearform/issue/CLE-5) | Prisma migrate deploy | Todo |

---

## Tomorrow: Composio (CLE-19)

1. Composio dashboard: app + google_sheets, google_drive, slack
2. VPS: `COMPOSIO_API_KEY`, `INTEGRATION_PROVIDER=composio`
3. OAuth redirect URLs for `app.clearform.in` / API
4. Test Profile → Integrations + Share modal connect flows

---

## Future (Backlog)

CLE-12 … CLE-16 — demo removal, Redis/DB/AI tuning (see Linear).
