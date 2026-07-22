# Landing → platform billing handoff

**Audience:** clearform.in (marketing) team  
**Owner:** Platform team maintains checkout and account linking.

## What to change

Replace the Razorpay Payment Link on the **$34.99 pilot** button with:

```
https://app.clearform.in/?plan=pilot
```

Users **create an account first**, then land on **Profile → Billing** where Razorpay Checkout opens.

For returning users who already have an account:

```
https://app.clearform.in/signin?returnTo=%2Fdashboard%2Fprofile%3Ftab%3Dbilling%26upgrade%3Dpilot
```

Optional analytics:

```
https://app.clearform.in/?plan=pilot&utm_source=landing&utm_campaign=pilot
```

## What you do **not** need

- Razorpay API keys on clearform.in
- Razorpay Checkout script on clearform.in
- Webhook configuration on clearform.in
- Payment Link redirect configuration

## User journey

1. User clicks pilot CTA on clearform.in
2. User signs up or signs in on app.clearform.in
3. User is taken to **Profile → Billing**
4. Razorpay Checkout opens for $34.99 USD
5. After payment, pilot plan (90 days, 300 responses) appears on the billing tab

## Support

If billing does not activate, ask the user to sign in with the **same email used at checkout** and share their Razorpay receipt ID (`pay_…`) with support@clearform.in.

## Rollback

Temporarily revert the button to the old Payment Link URL if needed. Platform checkout and legacy Payment Link webhooks can run in parallel during migration.
