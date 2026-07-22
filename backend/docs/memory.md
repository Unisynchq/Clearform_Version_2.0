# Memory — decisions and gotchas

Last updated: 2026-07-15 (AI action credits + free-tier reliability)

## PostHog product analytics (Jul 2026)

Live product analytics for Abbu / Harshit: signups, sign-ins, DAU, forms, pilot funnel.

- **Project:** [Clearform](https://us.posthog.com/project/417685/) (org Unideploy; MCP cannot create a 2nd project — renamed Default → Clearform)
- **Dashboard:** [Clearform Platform — Growth & Usage](https://us.posthog.com/project/417685/dashboard/1847795) (pinned / primary)
- **Board covers:** acquisition, activation funnels, WAU/MAU, retention, stickiness, lifecycle, monetization, device/geo, UX friction (rageclick/dead click), exceptions, web vitals — **PostHog-only** (no product code risk)
- **FE:** `posthog-js` + `@posthog/react` via `src/config/posthog.js`, `src/analytics/track.js`, wrapped in `main.jsx`
- **Env (Vercel + local):** `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST=https://us.i.posthog.com` — never commit the real token
- **Events:** `user_signed_up`, `user_signed_in`, `form_created`, `pilot_checkout_started`, `pilot_activated`, `promo_redeemed`, `billing_viewed` (+ autocapture `$pageview`)
- **Team plan counts (API):** `GET /billing/platform-stats` + `PLATFORM_STATS_EMAILS` (fail-closed)

## AI action credits (Jul 2026)

Customer-facing unit: **AI credit** = one priced product action (not LLM tokens).

- Limits: Free `100` / calendar month; Pilot `2_000` / pilot period (`plans.ts` → `ai.aiCreditsLimit`)
- Price list: `src/config/ai-credits.config.ts` (evaluate 1, improve 2, logic 5, insights 3, …)
- Assert before / debit after **successful** action at controller boundaries (`AiEntitlementsService`)
- Failed AI = **0 credits**; nested LLM retries inside one action do not multiply
- Ledger: `ai_credit_ledger`; wallet: `ai_usage.aiCreditsUsed`
- Provider tokens stay in `ai_call_logs` for margin (`LlmGatewayService` no longer debits wallet)
- Surface: `GET /billing/status` → `aiCredits` (+ deprecated `aiTokens` alias)
- Free insights: `insightsAccess: true`; quality session trial cap removed (wallet-only)
- After deploy: `npx prisma migrate deploy`, restart API, redeploy FE so Billing shows AI credits meter

## AI token wallet (superseded Jul 2026)

Replaced by action credits. Historical: Free 150k / Pilot 2M LLM tokens; debit-on-failure inflated Balances.

## Response quality AI (Jul 2026)

Handoff for live answer feedback (amber/green/red), Improve with AI, and Best Responses:

**→ [`docs/ai/response-quality-memory.md`](./ai/response-quality-memory.md)**

Quick reminders:

- Pipeline stages unchanged: `cache → context → intent → violation → rules → llm → finalize`.
- Behavior changes: edit **doctrine** (`src/ai/doctrine/tasks/response-quality.md`) and **generic** guards (`answer-context.util.ts`, `near-complete.util.ts`) — **not** hardcoded strings from founder test screenshots.
- Latest backend SHAs: `e400ffc` (generic context), `c88f7f0`; frontend: `3fd51cd`.
- Best Responses cache prefix: `analytics:best:v3:` — bump when filter changes.
- After deploy: Sentry resolve + Linear close with `clearform-api@<sha>`.

## Production verification checklist (CLE-19 / CLE-5)

On VPS `/var/www/clearform-backend` after merge:

1. `COMPOSIO_API_KEY`, `INTEGRATION_PROVIDER=composio`, `DATABASE_URL`, `REDIS_URL`, Firebase admin creds in `.env`
2. `npx prisma migrate deploy` (CLE-5)
3. `pm2 restart clearform-backend --update-env`
4. Composio dashboard: `google_sheets`, `google_drive`, `slack`; callback `https://api.clearform.in/api/v1/integrations/callback`
5. Smoke: `curl -H "Authorization: Bearer <firebase_id_token>" https://api.clearform.in/api/v1/auth/me` → 200 with `user.id` matching DB (legacy email users may differ from Firebase uid)
6. Sentry `clearform-api`: resolve `auth/me` 404/500 after deploy
7. Vercel: `VITE_API_BASE_URL=https://api.clearform.in/api/v1`, `VITE_USE_MOCK_API=false`, redeploy frontend

## Auth

Firebase-first. `POST /auth/register` and `/auth/login` are legacy only. Password reset is Firebase client SDK only. `DELETE /api/v1/auth/me` deletes Firebase user + DB cascade.

Microsoft: FE uses `signInWithRedirect` + `AuthRedirectHandler` + `FirebaseSessionBridge` (hydrates Redux when `auth.currentUser` exists but `getRedirectResult()` is null). Authorized domains must include `app.clearform.in`.

## API prefix

`VITE_API_BASE_URL` must include `/api/v1` (e.g. `https://api.clearform.in/api/v1`).

## Public URLs

`PUBLIC_FORM_ORIGIN` — no trailing slash. Used for share/respond links (`https://app.clearform.in` in prod). Local: `http://localhost:5173`.

## Prisma on VPS

Use **`npx prisma migrate deploy`** in production (not `migrate dev`). Pending handoff migration: Notification table + `Subscription.appliedStepsCount` drift — run once after deploy.


## GitHub Actions deploy (self-hosted runner on VPS)

Workflow: `.github/workflows/deploy.yml` — runs on the **VPS itself** (`runs-on: [self-hosted, clearform-vps]`), same steps as `scripts/deploy-vps.sh`, **no SSH from GitHub cloud** (avoids `port 22: Connection timed out`).

**One-time setup** (from Mac, SSH already works):

1. GitHub → **CoderRahul01/Clearform-backend-main** → Settings → Actions → Runners → **New self-hosted runner** → copy the registration **token** (expires in ~1 hour).
2. Run:

```bash
GITHUB_RUNNER_TOKEN=<paste-token> \
VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps \
./scripts/setup-github-runner-on-vps.sh
```

3. Confirm runner shows **Idle** in GitHub → Actions → Runners.

After that, every **push to `main`** deploys automatically. Optional migrate: **Actions → Deploy Backend to VPS → Run workflow** → enable **run_migrate**.

**Manual deploy** (same as before):

```bash
VPS_HOST=147.93.96.250 VPS_USER=root VPS_SSH_KEY_PATH=~/.ssh/github_actions_vps ./scripts/deploy-vps.sh
RUN_MIGRATE=1 VPS_HOST=... ./scripts/deploy-vps.sh   # when schema changed
```

GitHub secrets `VPS_HOST` / `VPS_SSH_KEY` are **not used** by the current workflow (runner runs locally). Keep them only if you switch back to cloud SSH deploy.

### Manual deploy fallback (`/var/www/clearform-backend`)

```bash
cd /var/www/clearform-backend
git checkout -- . 2>/dev/null || true
git pull origin main
bun install
bunx prisma generate
# when schema changed:
npx prisma migrate deploy
bun run build
test -f dist/src/main.js
pm2 restart clearform-backend --update-env || pm2 start ecosystem.config.cjs
pm2 save
curl -sS https://api.clearform.in/api/v1/health
```

## VPS layout (single app)

Keep only **`/var/www/clearform-backend`**. Remove old clones:

| Path | Action |
|------|--------|
| `/root/Clear-form--Landing-page-frontend` | Delete |
| `/root/UniSync-Backend-website` | Delete |
| `/var/www/UniSync-Backend-website` | Delete |
| `/var/www/clearform` | Delete (frontend is on Vercel) |
| `/var/www/html` | Clear to minimal stub (nginx default) |
| `/var/www/clearform-backend` | **Keep** |

```bash
cd /var/www/clearform-backend && git pull origin main
DRY_RUN=1 bash scripts/vps-keep-clearform-only.sh   # preview
CONFIRM=YES bash scripts/vps-keep-clearform-only.sh # delete + cleanup
```

**Full disk (~96GB used)?** Check `du -sh /root/.pm2` — PM2 logs often dominate. See `docs/vps-disk-and-redis.md` (wipe `/root/.pm2/logs`, install `pm2-logrotate`, fix Upstash 500k command limit).

## Production deploy checklist (VPS)

```bash
git pull origin main
bun install && rm -f package-lock.json && bun run build
npx prisma migrate deploy && npx prisma generate
pm2 restart clearform-backend --update-env
curl -sS https://api.clearform.in/api/v1/health
```

Deploy via GitHub Actions runs the same steps (including `rm -f package-lock.json` after `bun install` on VPS).

1. `bun run build` passes before push.
2. `.env` (required when `NODE_ENV=production`): `DATABASE_URL`, `REDIS_URL`, JWT secrets, `CORS_ORIGIN`, `PUBLIC_FORM_ORIGIN`, `APP_URL`, Firebase creds.
3. Recommended: `SENTRY_DSN`, `COMPOSIO_API_KEY`, `RESEND_API_KEY`, `NVIDIA_NIM_API_KEY`.
4. `BILLING_ALLOW_PAYMENT_LINK_CONFIRM=false` in production.
5. Vercel: `VITE_API_BASE_URL=https://api.clearform.in/api/v1`, `VITE_USE_MOCK_API=false`, redeploy.

## Redis cache keys (CLE-13)

| Key | TTL | Purpose |
|-----|-----|---------|
| `form:render:{formId}` | 1800s | Published snapshot JSON for `GET /published` |
| `analytics:insights:{formId}:{range}` | 24h | AI insights job result |
| `ratelimit:ai-insights:{formId}` | 1h window | Per-form AI insights throttle |
| `ratelimit:response-quality:{formId}` | 60s window | Public quality evaluate throttle |

Evict `form:render:*` on publish and form settings change. If Upstash is full, trim old `analytics:insights:*` keys first.

Public forms: `Cache-Control: public, max-age=300` on `GET /forms/:id/published` and `/render`; `X-Snapshot-Version` = snapshot `savedAt`.

## Handoff API notes

- `POST /forms/:id/responses` accepts handoff body (`answersByScreenId`, `metadata`, `submittedAt`) or `{ data: {...} }`.
- `GET /forms/:id/responses?page=1` returns `{ items, total, page, pageSize }`.
- `GET /forms/:formId/integrations` lists workspace connections for that form (B.8 alias).
- Integrations OAuth remains `POST /workspaces/:wid/integrations/:provider/connect`.
- Sheets backfill: `POST /workspaces/:wid/integrations/:connectionId/sync-historical` body `{ formId }`.
- Share modal (FE): Slack/Sheets/Embed/Email wired to connect + `PATCH` metadata; see `composio-production.md`.

## Sentry (production)

| Variable | Notes |
|----------|--------|
| `SENTRY_DSN` | Project **clearform-api** → Client Keys. Empty = disabled locally. |
| `SENTRY_ENVIRONMENT` | e.g. `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` prod; `1.0` only briefly when debugging |
| `SENTRY_RELEASE` | Optional; default `clearform-api@<git-sha>` in `instrument.ts` |

`beforeSend` sets tag `service=clearform-api`. Releases: `clearform-api@<sha>` / `clearform-web@<sha>`.

**Alerts:** Sentry → Alerts → email/mobile. **Linear:** Settings → Integrations → Linear → alert action “Create Linear issue”; map P0/P1 labels.

## Sentry ↔ Linear (5 steps)

1. Sentry → Settings → Integrations → **Linear** → Install.
2. Connect workspace; team **Clearform**.
3. Alert rule (new issue in `production`) → **Create Linear issue**.
4. Linear labels **P0** / **P1** for severity mapping.
5. After fix: resolve in Sentry; close Linear with release `clearform-api@<sha>`.

## Webhooks (in-house, n8n/Make-ready)

- CRUD: `GET/POST/PATCH/DELETE /api/v1/forms/:formId/webhooks`, test: `POST .../webhooks/:wid/test`.
- Events: `response.created` (every submit), `form.published` (on publish). Empty `triggers` = all events; else JSON array of event names.
- Outbound headers: `Content-Type: application/json`, `X-Clearform-Event`, optional `X-Clearform-Signature` (HMAC-SHA256 hex of body when `secret` set).
- Retries: BullMQ 3 attempts, exponential backoff. `lastDeliveredAt`, `lastError`, last 5 rows in `WebhookDelivery` on list API.
- Run migration `20260603120000_webhook_hardening` on VPS before deploy.

**`response.created` payload (handoff contract):**

```json
{
  "event": "response.created",
  "formId": "uuid",
  "responseId": "uuid",
  "submittedAt": "ISO-8601",
  "formTitle": "string",
  "answers": { }
}
```

**Local smoke:** Create webhook → `POST .../test` with n8n webhook URL → publish form → incognito submit → verify n8n received full payload.

## Production verification (CLE-19 / CLE-5 — run on VPS; agent cannot SSH)

Checklist before declaring Composio + auth stable in prod:

1. **`.env` on VPS** (`/var/www/clearform-backend`): `COMPOSIO_API_KEY`, `INTEGRATION_PROVIDER=composio`, `DATABASE_URL`, `REDIS_URL`, Firebase admin JSON path, `SENTRY_DSN` (optional).
2. **`npx prisma migrate deploy`** (CLE-5) — no pending migrations.
3. **`pm2 restart clearform-backend --update-env`**
4. **Composio dashboard**: enable `google_sheets`, `google_drive`, `slack`; redirect URLs include `https://api.clearform.in/api/v1/integrations/callback` and `https://app.clearform.in`.
5. **Smoke** — `curl -H "Authorization: Bearer <firebase_id_token>" https://api.clearform.in/api/v1/auth/me` → `200` with `user.id` matching Prisma (not raw Firebase uid for legacy email accounts).
6. **Sentry** (`clearform-api`): search `auth/me` and `integrations` 5xx in last 24h; resolve after fix ships.
7. **Vercel** (`app.clearform.in`): `VITE_API_BASE_URL=https://api.clearform.in/api/v1`, `VITE_USE_MOCK_API=false`; redeploy frontend after backend deploy.

**Code enablers for CLE-19 (2026-06-04):** `FirebaseAuthGuard` sets `request.user.id` from `findOrCreateFromFirebase` DB id; integrations connect requires workspace + Bearer; optional `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_API_TOKEN` purge on republish.

## Email and integrations

- Email: **Resend** (`RESEND_API_KEY`), not SMTP. Domain **app.clearform.in** must be **Verified** in Resend (Cloudflare DNS) before prod mail sends.
- Composio (Linear **CLE-19**) — on VPS `/var/www/clearform-backend/.env`:
  1. `COMPOSIO_API_KEY=<from Composio dashboard>`
  2. `INTEGRATION_PROVIDER=composio`
  3. Composio dashboard: create **auth configs** (Composio-managed OAuth) for toolkits `googlesheets`, `slack`, `googledrive` — v2 `initiateConnection` is **retired (410)**; API uses `@composio/core` `connectedAccounts.link` (v3). Optional overrides: `COMPOSIO_AUTH_CONFIG_GOOGLE_SHEETS`, `COMPOSIO_AUTH_CONFIG_SLACK`, `COMPOSIO_AUTH_CONFIG_GOOGLE_DRIVE` (`ac_...` ids).
  4. Redirect URLs: `https://app.clearform.in` and API callback `https://api.clearform.in/api/v1/integrations/callback`
  5. `pm2 restart clearform-backend --update-env` after deploy/env changes
  6. Test: Profile → Integrations → Connect provider (expect JSON `{ redirectUrl }`, not nginx 502)
- OAuth routes: `POST /api/v1/workspaces/:wid/integrations/:provider/connect`, callback `GET /api/v1/integrations/callback`.
- Google Sheets metadata on connection: `{ "spreadsheetId": "...", "sheetRange": "Sheet1!A1" }`. Slack: `{ "slackChannel": "#general" }`.
- Dispatch failures are reported to Sentry when `SENTRY_DSN` is set.

## AI

NVIDIA NIM with linear/rule fallback if key missing. Response-quality evaluate enriches from snapshot server-side.

**Response quality / Best Responses handoff:** [`docs/ai/response-quality-memory.md`](./ai/response-quality-memory.md) — pipeline, commits, files to edit, testing checklist, anti-patterns (Jul 2026).

## Preview vs published

Backend stores full snapshot unchanged. Missing branding/animation on `/f/:id` is **frontend** (`FormRespondentView.jsx`) — handoff FIX A.

## Redis cache keys (CLE-13)

| Key pattern | TTL | Eviction |
|-------------|-----|----------|
| `form:render:{formId}` | 30 min (`1800s`) | `DEL` on publish, unpublish, archive, update, delete |
| `analytics:insights:{formId}:{range}` | 24 h | expires; safe to delete keys older than 7d if Upstash is full |
| `ratelimit:ai-insights:{formId}` | 1 h window | per-form POST ai-insights cap |
| `ratelimit:response-quality:{formId}` | 60 s window | per-form public evaluate cap |

Public `GET /forms/:id/published` and `/render` send `Cache-Control: public, max-age=300, s-maxage=300` plus `ETag` and `X-Clearform-Saved-At` from `publishedAt` (Cloudflare-friendly; purge edge cache on republish if needed).

Constants: `src/common/redis-cache-keys.ts`.

## bun vs npm

Backend: `bun`. Frontend repo: `npm` only.
