# Razorpay billing setup (auth-first platform checkout)

Production pilot checkout: **sign up → Profile → Billing → Razorpay Checkout**. The marketing site (`clearform.in`) links to signup with a pilot intent — no Razorpay keys on the landing repo.

## Landing team (clearform.in)

Change the **Start pilot for $34.99** button `href` to:

```
https://app.clearform.in/?plan=pilot
```

Returning users can use:

```
https://app.clearform.in/signin?returnTo=%2Fdashboard%2Fprofile%3Ftab%3Dbilling%26upgrade%3Dpilot
```

Optional UTM: `?utm_source=landing&utm_campaign=pilot`

See also: [`landing-billing-handoff.md`](landing-billing-handoff.md)

## Checkout flow (auth-first)

1. User clicks pilot CTA on clearform.in → `app.clearform.in/?plan=pilot`
2. User signs up or signs in (Google, Microsoft, or email)
3. App redirects to **Profile → Billing** (`/dashboard/profile?tab=billing&upgrade=pilot`)
4. Razorpay Checkout opens automatically ($34.99 USD, `pilot_35`)
5. After payment → redirect to Profile → Billing with `razorpay_payment_id`
6. App claims purchase (`POST /billing/claim-purchase`) and shows pilot plan + receipt

Legacy `/buy/pilot` redirects into the same auth-first billing flow.

## Webhook (api.clearform.in)

### Where to create it

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **Account & Settings → Webhooks** (or **Settings → Webhooks**)
3. Click **+ Add New Webhook**

### Webhook URL

```
https://api.clearform.in/api/v1/billing/webhook
```

### What the secret does

Razorpay signs each POST with `X-Razorpay-Signature` (HMAC-SHA256 of the **raw** JSON body using your webhook secret). The API verifies this in `RazorpayWebhookHandler` before processing. If verification fails, the event is rejected — this prevents forged payment notifications.

Copy the generated secret into VPS `.env` as `RAZORPAY_WEBHOOK_SECRET`.

### Events to enable (8 recommended)

| Event | Why you need it |
|-------|-----------------|
| `payment.captured` | Pilot one-time Orders checkout — upserts `PilotPurchase` |
| `payment.failed` | Log/support when checkout fails |
| `order.paid` | Backup signal when order + payment complete together |
| `payment_link.paid` | Legacy Payment Link until landing fully migrates |
| `subscription.authenticated` | Customer completed mandate/card auth for subscription |
| `subscription.activated` | Subscription is live — set `Subscription` ACTIVE |
| `subscription.charged` | Recurring charge succeeded — extend period / invoice |
| `subscription.cancelled` | User cancelled autopay — downgrade entitlements |

Do **not** enable all 40+ events. Add `subscription.halted` or `subscription.paused` later if you need dunning handling.

### After creating the webhook

- Ensure Cloudflare **bypasses cache** for `POST /api/v1/billing/*`
- `main.ts` uses `rawBody: true` — required for signature verification
- Test from Razorpay Dashboard → Webhook → **Send test webhook** → expect HTTP 200

## API environment variables

| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Orders API, payment verification, webhooks |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC verification on webhook POST |
| `RAZORPAY_PLAN_ID_PILOT_35` | Razorpay **Plan** id for future recurring pilot/pro tiers |
| `RAZORPAY_PAYMENT_LINK_ID_PILOT` | Legacy Payment Link until landing migrates |
| `PILOT_DURATION_DAYS` | Pilot period length (default `90`) |
| `APP_URL` | Checkout callback base (default `https://app.clearform.in`) |
| `BILLING_ALLOW_PAYMENT_LINK_CONFIRM` | `false` in production |

Platform Vercel (`app.clearform.in`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.clearform.in/api/v1` |
| `VITE_USE_MOCK_API` | `false` |

## Razorpay Subscriptions vs one-time pilot

See [`razorpay-subscriptions-roadmap.md`](razorpay-subscriptions-roadmap.md) for recurring/autopay setup after the pilot launch.

## Pilot-only scope

Pro monthly/yearly tiers are **not enabled**. `POST /billing/create-subscription` returns 501. Re-enable per `docs/razorpay-subscriptions-roadmap.md` when Plans exist in Razorpay Dashboard.

## Edge cases handled

| Scenario | Behavior |
|----------|----------|
| User pays while logged in | Order `notes.userId` set; webhook auto-claims to that account |
| User returns from Razorpay redirect | `captureAndClaimPendingPurchase` on Profile → Billing (idempotent per `pay_` id) |
| Payment email ≠ account email | Claim rejected with support message (legacy Payment Link flow) |
| Same payment claimed twice | Idempotent — returns existing subscription |
| Payment claimed by another user | `400` — payment already linked |
| Pilot period expires | `GET /billing/status` → `EXPIRED`; AI tier → `free`; limits → free tier |
| Webhook arrives before redirect | Webhook upserts `PilotPurchase`; claim on redirect still works |
| Webhook arrives after redirect | Claim verifies via Razorpay API if row missing |
| Free user response counting | First response creates free-tier `Subscription` row for metering |

## Deploy checklist

```bash
cd /var/www/clearform-backend && git pull && bun install
npx prisma migrate deploy
pm2 restart clearform-backend --update-env
```

Redeploy platform on Vercel with `VITE_API_BASE_URL` set.

## Legacy Payment Link deprecation

After landing switches to `/?plan=pilot`:

1. Keep `payment_link.paid` on the webhook for in-flight legacy payments
2. Cancel Payment Link `plink_Svut5N9dVQgBDU` when unused
3. Remove `RAZORPAY_PAYMENT_LINK_ID_PILOT` when safe

## Manual activation (support)

```bash
bun run billing:activate-user user@example.com
```
