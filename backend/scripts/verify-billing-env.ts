/**
 * Verify billing env vars are set before production deploy.
 * Does not print secret values.
 *
 * Usage: bun run scripts/verify-billing-env.ts
 */
import 'dotenv/config';

const required = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'APP_URL',
  'DATABASE_URL',
] as const;

const warnings: string[] = [];
const errors: string[] = [];

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    errors.push(`${key} is missing or empty`);
  }
}

if (process.env.BILLING_ALLOW_PAYMENT_LINK_CONFIRM === 'true') {
  warnings.push(
    'BILLING_ALLOW_PAYMENT_LINK_CONFIRM=true — must be false in production',
  );
}

const appUrl = process.env.APP_URL?.replace(/\/$/, '');
if (appUrl && appUrl !== 'https://app.clearform.in') {
  warnings.push(`APP_URL is ${appUrl} (expected https://app.clearform.in for prod)`);
}

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
if (webhookSecret && webhookSecret.length < 16) {
  warnings.push('RAZORPAY_WEBHOOK_SECRET looks too short — confirm it matches Razorpay dashboard');
}

if (errors.length) {
  console.error('Billing env check FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('Billing env check OK (required vars present).');
if (warnings.length) {
  console.warn('Warnings:');
  for (const w of warnings) console.warn(`  - ${w}`);
}
console.log(
  'Confirm RAZORPAY_WEBHOOK_SECRET matches Razorpay → Developers → Webhooks → your webhook → Secret.',
);
