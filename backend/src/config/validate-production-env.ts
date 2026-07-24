/**
 * Fail fast when required env vars are missing.
 * In production additional checks run.
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

/**
 * Throws on startup if JWT secrets are missing — these are required
 * in ALL environments because the JwtStrategy initialises eagerly.
 */
function checkJwtSecrets(): void {
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (!process.env[key]?.trim()) {
      const msg = [
        `${key} is not set.`,
        'Generate one with:',
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
        'and add it to your .env file.',
      ].join(' ');
      console.error(`[startup] ${msg}`);
      process.exit(1);
    }
  }
}

export function validateProductionEnv(): void {
  // JWT secrets are always required — the JwtStrategy is eagerly initialised
  checkJwtSecrets();

  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing: string[] = [];

  for (const key of REQUIRED_STRING_VARS) {
    if (!process.env[key]?.trim()) {
      missing.push(key);
    }
  }

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
