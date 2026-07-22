# Clearform backend — context

Last updated: 2026-06-27 (see `docs/ai/response-quality-memory.md` for Jul 2026 quality work)

## What this is

NestJS API for Clearform (form builder SaaS). Serves `https://api.clearform.in/api/v1`. The React app lives in `Clearform_Version_2.0/` (Vercel). Product handoff spec (read-only): `Clearform_Version_2.0/BACKEND_HANDOFF.md`.

**System flow doc:** `docs/ai/backend-system-flow.md` (AI, billing, caches, queues).

**Response quality session memory:** `docs/ai/response-quality-memory.md` (Jul 2026 — yellow/green feedback, Best Responses, Improve with AI).

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node 22, **Bun** package manager |
| Framework | NestJS 11, strict TypeScript |
| DB | Supabase PostgreSQL via Prisma 7 |
| Queue / cache | Redis (BullMQ + published-form cache) |
| Auth | Firebase ID token (`FirebaseAuthGuard`) |
| AI | LiteLLM proxy + OpenRouter fallback; tier routing via `AiTierService` |
| Avatars | Firebase Storage (`POST /auth/me/avatar`) |
| Email | Resend |
| Integrations | Composio (Sheets, Slack, Drive) |

## Key paths

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap (imports `instrument.ts` first) |
| `src/instrument.ts` | Sentry init |
| `src/config/validate-production-env.ts` | Production boot checks |
| `prisma/schema.prisma` | DB schema |
| `.env.example` | Env template |

Controllers use `@Controller('api/v1/...')` — **no** global API prefix. Frontend must set `VITE_API_BASE_URL=https://api.clearform.in/api/v1`.

## Production URLs

| Surface | URL |
|---------|-----|
| API | https://api.clearform.in/api/v1 |
| App | https://app.clearform.in |
| Public forms | `{PUBLIC_FORM_ORIGIN}/f/:formId` |

## Env summary (see `.env.example`)

**Boot-required (production):** `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, Firebase credentials, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`.

**Product:** `NVIDIA_NIM_API_KEY`, `RESEND_API_KEY`, `COMPOSIO_API_KEY`, `RAZORPAY_*`, `APP_URL`, `PUBLIC_FORM_ORIGIN`.

**Observability:** `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, optional `SENTRY_RELEASE` (else git sha → `clearform-api@<sha>`).

## Sentry (org / projects)

| Item | Value |
|------|--------|
| Organization | **clearform** — https://clearform.sentry.io |
| Region | https://us.sentry.io |
| Projects | **clearform-api** (NestJS), **clearform-web** (React — frontend repo) |

Copy DSN from Sentry → Project → Client Keys into VPS `.env` as `SENTRY_DSN` (do not commit).

### Alerts in Sentry UI

1. **Settings → Alerts → Create alert**
2. Add **Send a notification** → **Email** (and mobile if installed)
3. Suggested rules: new issue in `production` + `service:clearform-api`; regression; elevated 5xx on publish-related transactions

MCP in Cursor: `plugin-sentry-sentry` (e.g. `https://mcp.sentry.dev/mcp/clearform/clearform-api` when configured).

## Linear (planning)

Execution tracking lives in **Linear**, not in `plan.md`. Team: **Clearform** (`CLE`). Project: **Clearform Platform**. https://linear.app/clearform

## Local dev

```bash
cd Clearform-backend-main
bun install
bun run start:dev
curl -sS http://localhost:3000/api/v1/health
```
