# Backend edge cases (handoff + production)

Companion to [`BACKEND_HANDOFF.md`](../../Clearform_Version_2.0/BACKEND_HANDOFF.md) and [`memory.md`](memory.md).

## Auth

- SPA uses Firebase ID tokens; `GET /auth/me` requires `Authorization: Bearer <token>`.
- Microsoft sign-in uses `signInWithRedirect` (not popup). FE must hydrate Redux when `auth.currentUser` exists but `getRedirectResult()` is null.
- `VITE_API_BASE_URL` must include `/api/v1`.

## Form delete

- `DELETE /forms/:id`: first call → `TRASH`; second call when already `TRASH` → hard delete (cascade responses, webhooks, settings).
- Hard delete also clears `Notification` rows with matching `formId`.
- `ENOSPC` returns 400 with disk cleanup hint (not opaque 500).
- FE must call API before removing from Redux/localStorage when API is configured.

## Analytics / AI insights

- `POST /analytics/forms/:formId/ai-insights` returns `status: processing` then poll until `ready` (FE polls every 2.5s).
- On queue/Redis failure: `status: error` with `message` — FE shows Retry, not infinite loading.
- Ready payload includes `patterns`, `recommendedActions`, `quickStats`.
- FE gates: 10+ responses for AI tab; 25+ for reliable Top Patterns.

## Integrations (Composio)

- Connections are per **workspace** (`IntegrationConnection`), dispatched on `response.created` when `COMPOSIO_API_KEY` and `INTEGRATION_PROVIDER=composio` are set.
- OAuth callback finalizes `composioEntityId`; store `metadata` (spreadsheetId, slackChannel) via PATCH.

## Public forms

- Never serve unpublished draft on `/f/:id`; use `GET /forms/:id/published` only.
- Response POST must include snapshot-aligned `answersByScreenId` for analytics columns.

## Ops

- Production: `npx prisma migrate deploy` (see Linear CLE-5).
- Composio: Linear CLE-19 checklist in `memory.md`.
