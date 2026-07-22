# North-star goals

Last updated: 2026-06-03 (from `BACKEND_HANDOFF.md`)

## Product

- Owners build forms in the SPA; **published snapshot** at `GET /forms/:id/published` is the single source of truth for respondents.
- Every submission is scoped to **`formId`**: responses, analytics, webhooks, integrations, AI.
- Auth is **Firebase-first**: SPA sends `Authorization: Bearer <firebase-id-token>`; backend provisions users on first verified request.

## Backend responsibilities

1. **Store and serve** full builder/published JSON without loss (theme, logic, response-quality config).
2. **Accept public submissions** (`POST /forms/:id/responses`) with validation, queues, webhooks, notifications, Composio dispatch.
3. **Scoped analytics and AI** per form (`/analytics/forms/:formId/*`, logic generate, response-quality evaluate).
4. **Integrations** per workspace (Composio OAuth + dispatch on new response).
5. **Operational reliability**: health checks, production env validation, observability (Sentry), safe migrations (`prisma migrate deploy` on VPS).

## Success criteria (handoff “done”)

- Respondent completes `/f/:formId` → row exists for that `formId` → dashboard/analytics counts match.
- Published public UI matches builder preview (**frontend render parity** — backend snapshot already correct).
- Settings: delete account, profile patch, integrations connect/test — real APIs, no demo toasts.
- With API URL set, no misleading demo/sample analytics in production UI (**frontend removes mocks** as endpoints are verified).

## Out of scope here

Frontend routing bugs, OAuth redirect UX, builder autosave debounce, and demo-data removal are tracked in Linear with FE owners.
