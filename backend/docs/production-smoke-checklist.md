# Production smoke checklist

Run after VPS + Vercel deploy. Assumes `scripts/verify-api-health.sh` returns 200.

## Infra

- [ ] `curl https://api.clearform.in/api/v1/health` → 200
- [ ] `pm2 status clearform-backend` → online
- [ ] `npx prisma migrate deploy` completed (CLE-5)
- [ ] Upstash Redis within quota (or Pro enabled)
- [ ] Cloudflare cache rules per `cloudflare-production.md`

## Auth

- [ ] Email sign-in → dashboard loads forms
- [ ] Microsoft sign-in (production domain)
- [ ] `GET /auth/me` → 200, `user.id` is DB id

## Forms & analytics

- [ ] Create / publish form → public `/f/:slug` matches builder
- [ ] Submit test response → appears in Analytics → Responses
- [ ] Performance tab: funnel, daily charts, drop-off river column count matches content screens (not fixed 22 when API returns `screenDropoff`)
- [ ] Delete form → succeeds (no 500)

## Share & integrations (CLE-19)

- [ ] Share modal → Sheets → Connect → save spreadsheet ID
- [ ] Submit response → new row in sheet (headers + per-question columns)
- [ ] Share modal → “Sync existing” backfills prior responses
- [ ] Share modal → Slack → connect → save channel → test response posts
- [ ] Share modal → Embed → copy iframe code
- [ ] Share modal → Email opens mailto with link

## Env (Vercel)

- `VITE_API_BASE_URL=https://api.clearform.in/api/v1`
- `VITE_USE_MOCK_API=false`

## Env (VPS)

- `INTEGRATION_PROVIDER=composio`
- `COMPOSIO_API_KEY`
- Composio callback: `https://api.clearform.in/api/v1/integrations/callback`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `BILLING_ALLOW_PAYMENT_LINK_CONFIRM=false`
- `APP_URL=https://app.clearform.in`

## Billing (pilot checkout E2E)

- [ ] Open `https://app.clearform.in/?plan=pilot` → sign up / sign in
- [ ] Redirect to Profile → Billing; Razorpay Checkout opens ($34.99 USD)
- [ ] `POST /api/v1/billing/checkout-sessions/pilot` → 200 (authenticated)
- [ ] Pay → redirect to `/dashboard/profile?tab=billing&razorpay_payment_id=pay_…`
- [ ] Profile → Billing: **Clearform Pilot**, 0/300 responses, receipt `pay_…`
- [ ] Submit 1 form response → usage 1/300
- [ ] Razorpay webhook log: `payment.captured` → 200 on `/api/v1/billing/webhook`

See `docs/billing-setup.md` and `docs/landing-billing-handoff.md`.

