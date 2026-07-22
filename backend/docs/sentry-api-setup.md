# Sentry — clearform-api (backend)

The Nest app ships `@sentry/nestjs` via Bun. Sentry logs are enabled in `src/instrument.ts` with `enableLogs: true` and `consoleLoggingIntegration({ levels: ['warn', 'error', 'log'] })`.

Sentry shows **Get Started** until the VPS has a DSN and at least one event or log is received.

## 0. Install / update SDK

```bash
bun add @sentry/nestjs
```

The minimum `@sentry/nestjs` version for logs is `9.41.0`; this app uses a newer SDK.

## 1. Copy DSN

1. Open https://clearform.sentry.io
2. Project **clearform-api** → Settings → **Client Keys (DSN)**
3. On VPS `/var/www/clearform-backend/.env`:

```bash
SENTRY_DSN=https://<key>@o<org>.ingest.us.sentry.io/<project>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
# Optional verify endpoint (see below)
SENTRY_VERIFY_KEY=<random-long-string>
```

4. Restart: `pm2 restart clearform-backend --update-env`

## 2. Confirm in health

```bash
curl -sS https://api.clearform.in/api/v1/health | jq .details.sentry
# expect: { "status": "up", "configured": true }
```

Startup also sends `clearform-api started` (info event).

## 3. Complete Sentry “Verify” wizard

```bash
curl -sS -H "x-sentry-verify-key: YOUR_SENTRY_VERIFY_KEY" \
  https://api.clearform.in/api/v1/health/sentry-verify
```

Returns `{ "ok": true, "sent": true, "eventId": "..." }`. The endpoint also sends a Sentry log:

```ts
Sentry.logger.info('User triggered test log', { action: 'test_log' });
```

Refresh Sentry Issues and Logs — the event/log should appear within ~30s.

## 4. Alerts → Linear

See `docs/sentry-alerts.md` (CLE-9).

## Local dev

Leave `SENTRY_DSN` empty to disable Sentry (no noise in local Issues).
