/**
 * Fail fast when NODE_ENV=production and required secrets are missing.
 * Dev/local starts are unchanged.
 */
const REQUIRED_STRING_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
  'PUBLIC_FORM_ORIGIN',
  'APP_URL',
] as const;

function hasFirebaseCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_CREDENTIALS_JSON?.trim() ||
    process.env.FIREBASE_CREDENTIALS_PATH?.trim(),
  );
}

function validateFirebaseCredentialsFormat(): void {
  const json = process.env.FIREBASE_CREDENTIALS_JSON?.trim();
  if (json) {
    try {
      JSON.parse(json);
    } catch {
      throw new Error('FIREBASE_CREDENTIALS_JSON is not valid JSON');
    }
  }
}

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing: string[] = [];

  for (const key of REQUIRED_STRING_VARS) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

  // if (!hasFirebaseCredentials()) {
  //   missing.push('FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH');
  // } else {
  //   validateFirebaseCredentialsFormat();
  // }

  if (missing.length > 0) {
    const message = `Production startup aborted — missing or empty: ${missing.join(', ')}`;
    console.error(message);
    process.exit(1);
  }

  const optionalWarnings: Array<[string, string]> = [
    ['RESEND_API_KEY', 'transactional email notifications are disabled'],
    [
      'COMPOSIO_API_KEY',
      'Google Sheets / Slack / Drive integrations will be silently skipped on every response submission',
    ],
    [
      'CLOUDFLARE_ZONE_ID',
      'Cloudflare cache purge on republish is disabled — stale forms may be served from edge until TTL expires',
    ],
    [
      'GEMINI_API_KEY',
      'pro/pilot/promo-trial AI (quality nudges, insights, logic, Cleo) will fail — Gemini not configured',
    ],
    [
      'OPENROUTER_API_KEY',
      'free-tier AI (quality nudges, insights, logic, Cleo) will fail — OpenRouter not configured',
    ],
    ['SENTRY_DSN', 'runtime errors will not appear in Sentry'],
  ];

  for (const [key, hint] of optionalWarnings) {
    if (!process.env[key]?.trim()) {
      console.warn(`[startup] ${key} not set — ${hint}`);
    }
  }
}
