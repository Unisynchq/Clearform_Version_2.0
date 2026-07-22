# Backend handoff completion (Clearform v2)

Maps `Clearform_Version_2.0/BACKEND_HANDOFF.md` to this API (`api/v1`).  
**Production auth:** Firebase ID token + `GET/PATCH/DELETE /auth/me`. Legacy email routes remain as aliases.

## Implemented (backend)

| Handoff section | Endpoints / behavior |
|-----------------|----------------------|
| A.2 formId scope | All analytics, responses, webhooks, AI scoped by `formId` |
| B.2 Responses | `POST/GET /forms/:id/responses`, export, paginated `{ items, total }` |
| B.3 Response quality | `POST /forms/:formId/response-quality/evaluate`, `GET .../response-quality` |
| B.3b Quality v2 | Evaluative language, form memory, unified orchestrator; see `docs/ai/backend-system-flow.md` |
| B.3c Cleo contextual nudges | Violation classifier (EN/HI profanity, hostile, filler); `CleoNudgeService` live nudges; `audienceLabel`; edge cases `docs/ai/edge-cases/response-quality-v1.md` |
| B.4 Publish snapshot | `PUT builder-snapshot`, `POST publish`, `GET published` (public) |
| B.5 Account | `GET/PATCH/DELETE /auth/me` — password reset via **Firebase** (no backend forgot-password) |
| B.6 Draft save | `PUT /forms/:id/builder-snapshot` → `{ saved, savedAt }`; `GET` returns `savedAt` |
| B.7 Logic AI | `POST /forms/:formId/logic/generate` (429 via throttler) |
| B.8 Analytics + webhooks | `GET /analytics/forms/:formId/*`, form/webhook routes |
| B.9 Integrations | Composio OAuth, workspace CRUD, `GET/PATCH /forms/:formId/integrations`, `sync-historical` |
| B.11 Drop-off river | Extended `screenDropoff` + fixed funnel math (`analytics-snapshot.util.ts`) |
| B.12 AI Insights | Real Q+A from responses + distinct summary/priority (`insights-generator.service.ts`) |
| B.13 Overview | `overview.aiInsight` on `GET /analytics/forms/:formId/performance` |
| Priority 1–3 | Forms, workspaces, templates, notifications, share-links |
| Priority 2.5 | AI insights queue, logic generate, response quality |
| Billing Pilot | `GET /billing/status` (features, aiTier), Razorpay checkout, claim-purchase |
| Profile avatar | `POST /auth/me/avatar`, `avatarUrl` on `GET/PATCH /auth/me` — see `docs/profile-avatar.md` |
| Sentry | `instrument.ts`, health `sentry` indicator, `GET /health/sentry-verify` |
| Gemini provider (2026-07-02) | `GeminiGatewayService` — Gemini-first for `GEMINI_TASKS` (default `fast`: quality eval + nudges + intent); fallback LiteLLM → OpenRouter → rules; per-call observability in `ai_call_logs`. Set `GEMINI_API_KEY` in env. See `docs/ai/backend-system-flow.md` |

## Auth path aliases (for `endpoints.js`)

| Frontend path | Backend route |
|---------------|---------------|
| `/auth/sign-in` | `POST /auth/sign-in` (alias of `login`) |
| `/auth/sign-up` | `POST /auth/sign-up` (alias of `register`) |
| `/auth/sign-out` | `POST /auth/sign-out` (alias of `logout`) |

## Frontend wired (B.13)

- `FormOverlayModal.jsx` fetches `GET /analytics/forms/:id/performance` → `overview` + `aiInsight`
- **Improve with AI** deep-links to builder via `focusScreenId` / `startBuilderTab`

## Not backend (frontend or ops)

- Builder Back → dashboard, demo removal, mock API off, public form POST wire-up
- Razorpay billing UI placeholder
- VPS: `SENTRY_DSN`, Upstash quota, Composio dashboard reconnect

## Verify after deploy

```bash
curl -sS https://api.clearform.in/api/v1/health
./scripts/verify-api-health.sh
```

See `docs/production-smoke-checklist.md`.
