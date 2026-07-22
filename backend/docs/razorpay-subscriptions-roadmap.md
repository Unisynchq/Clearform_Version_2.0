# Razorpay Subscriptions roadmap (recurring / autopay)

This doc explains how to move from the **one-time pilot** ($34.99 / 90 days via Orders API) to **managed recurring billing** in Razorpay — without Payment Links.

## TL;DR recommendation

| Product | Razorpay product | Why |
|---------|------------------|-----|
| **Pilot ($34.99 / 90 days)** | **Order** (one-time) — *current implementation* | Fixed upfront price, fixed term, no autopay needed |
| **Pro / Starter (monthly/yearly)** | **Subscription + Plan** | Autopay, renewals, retries, cancel/pause in Razorpay |
| **Payment Links** | Avoid for production platform | No redirect control, weak auth linking, not ideal for logged-in upgrades |

Payment Links are fine for quick manual invoices; they are **not** the right backbone for a SaaS where users are logged in and you need webhooks + entitlements tied to `userId`.

## How Razorpay Subscriptions work

1. **Create a Plan** in Dashboard (or API) — e.g. `plan_pro_monthly_usd` at $29/month, interval `monthly`, currency `USD`
2. **Create a Subscription** for a customer when they click Upgrade in Profile → Billing
3. Razorpay opens Checkout for the **first charge + mandate/card authorization**
4. Razorpay **automatically charges** on each billing cycle
5. Your API receives webhooks and updates `Subscription` in Postgres

Clearform backend already has:

- `POST /billing/create-subscription` → `razorpay.subscriptions.create`
- Webhook handler for `subscription.activated` / status mapping
- `RAZORPAY_PLAN_ID_PILOT_35` env placeholder for a Razorpay Plan id

## Step-by-step: create a Razorpay Plan (Dashboard)

1. [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Subscriptions** → **Plans** → **Create Plan**
2. Fill in:
   - **Name:** Clearform Pro Monthly (example)
   - **Amount:** your price in **USD** (smallest unit in API; Dashboard usually accepts dollars)
   - **Billing interval:** Monthly or Yearly
   - **Currency:** USD (requires international payments enabled on your account)
3. Save and copy **Plan ID** → `plan_xxxxxxxx`
4. Add to VPS `.env`:

   ```
   RAZORPAY_PLAN_ID_PRO_MONTHLY=plan_xxx
   ```

Repeat for yearly if needed.

## Step-by-step: wire platform checkout (after pilot)

1. **Profile → Billing → Upgrade** calls `POST /billing/create-subscription` (already exists) with `plan_id` from env
2. API returns Razorpay `subscription.id` + `short_url` or opens Checkout with `subscription_id`
3. Frontend opens Razorpay Checkout (same pattern as pilot Orders flow)
4. Webhooks update entitlements:

   | Event | Clearform action |
   |-------|------------------|
   | `subscription.authenticated` | Store `razorpaySubId`, status TRIAL/AUTHENTICATED |
   | `subscription.activated` | Set `Subscription.status = ACTIVE` |
   | `subscription.charged` | Extend `periodEnd`, reset `responsesUsed` if monthly |
   | `subscription.cancelled` | Set CANCELLED, downgrade at period end |
   | `subscription.halted` | Set PAST_DUE, notify user |

5. **Do not use Payment Links** for this — use Subscription API + hosted Checkout modal (same as pilot).

## Pilot: one-time vs subscription?

The current pilot is **intentionally one-time**:

- $34.99 upfront
- 90-day access window
- No auto-renew at end of pilot

That maps to **Orders API**, not a Subscription Plan.

If you later want **pilot → auto-convert to Pro**, options:

1. **Subscription with trial/upfront** — Plan with 90-day trial + monthly charge after (Razorpay supports trial periods on plans)
2. **Two-step** — Order for pilot now; email CTA to start Pro subscription before expiry (simpler, current approach)

For autopay on pilot itself (charge $34.99 every 90 days), create a Plan with `interval: monthly` × custom logic or quarterly plan — but that is usually worse UX than pilot (one-time) → Pro (recurring).

## Webhook setup (same endpoint)

**URL:**

```
https://api.clearform.in/api/v1/billing/webhook
```

**Secret:** Dashboard generates it → `RAZORPAY_WEBHOOK_SECRET` on VPS.

**Enable these 8 events** (covers one-time pilot + subscriptions):

1. `payment.captured`
2. `payment.failed`
3. `order.paid`
4. `payment_link.paid` (legacy only; remove later)
5. `subscription.authenticated`
6. `subscription.activated`
7. `subscription.charged`
8. `subscription.cancelled`

### What the secret does

Razorpay sends `X-Razorpay-Signature: <hmac>`. Your server recomputes HMAC-SHA256(`RAZORPAY_WEBHOOK_SECRET`, raw body) and compares. This proves the event came from Razorpay, not an attacker.

### Permissions / access

Use a Razorpay account with:

- **Payment Gateway** live keys (`rzp_live_…`)
- **Webhooks** configured on the same account as those keys
- **International payments** enabled if charging USD

No special “45 permissions” — webhook access is account-level. API keys need standard payment + subscription scopes (default on full-access keys).

## Testing before go-live

1. Razorpay **Test Mode** keys in staging `.env`
2. Dashboard → Webhooks → **Send test webhook** for `payment.captured` and `subscription.activated`
3. Confirm API returns `200` and logs show `received: true`
4. Run billing E2E in `production-smoke-checklist.md`

## Implementation order (suggested)

1. ✅ Pilot one-time via Orders + auth-first billing (shipped)
2. Create Razorpay Plans for Pro Monthly / Pro Yearly in Dashboard
3. Replace `BillingChoosePlanModal` Payment Link redirect with `create-subscription` + Checkout
4. Extend webhook handler for `subscription.charged` (period renewal + usage reset)
5. Profile UI: show next billing date, cancel subscription, payment method from Razorpay Customer Portal (optional)

## References

- [Razorpay Subscriptions docs](https://razorpay.com/docs/payments/subscriptions/)
- [Subscription webhook events](https://razorpay.com/docs/webhooks/subscriptions/)
- [Payment webhook events](https://razorpay.com/docs/webhooks/payments/)
- Clearform: `src/billing/webhooks/razorpay-webhook.handler.ts`
