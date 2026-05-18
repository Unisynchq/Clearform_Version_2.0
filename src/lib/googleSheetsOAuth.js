/** OAuth state prefix issued when starting Google Sheets connect */
export const GOOGLE_SHEETS_OAUTH_STATE_PREFIX = 'cf_googlesheets_oauth_';

const OAUTH_PARAM_KEYS = ['error', 'error_description', 'state'];

/**
 * Build a stable error payload from URL search params (OAuth redirect callback).
 * Returns null when this is not a Google Sheets OAuth error callback.
 */
export function parseGoogleSheetsOAuthCallback(searchParams) {
  if (!searchParams) return null;

  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const hasSheetsState = state?.startsWith(GOOGLE_SHEETS_OAUTH_STATE_PREFIX);
  const sheetsFlag = searchParams.get('google_sheets');

  if (!error && sheetsFlag !== 'error') return null;
  if (state && !hasSheetsState && sheetsFlag !== 'error') return null;

  const details = {};
  for (const key of OAUTH_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (value) details[key] = value;
  }

  if (error) details.error = error;
  if (state) details.state = state;

  return Object.keys(details).length ? details : null;
}

/** Remove OAuth callback params from the URL while preserving other query keys (e.g. tab). */
export function googleSheetsOAuthParamsToClear(searchParams) {
  const keys = [...OAUTH_PARAM_KEYS, 'google_sheets'];
  return keys.filter((key) => searchParams.has(key));
}

/**
 * Format error details for the monospace reference block.
 * Accepts OAuth callback fields or any key/value map from the API.
 */
export function formatGoogleSheetsErrorReference(errorDetails) {
  if (!errorDetails || typeof errorDetails !== 'object') return null;

  const seen = new Set();
  const parts = [];

  const push = (key, value) => {
    if (value == null || value === '' || seen.has(key)) return;
    seen.add(key);
    parts.push(`${key}=${value}`);
  };

  push('error', errorDetails.error);
  push('error_description', errorDetails.error_description);
  push('state', errorDetails.state);

  Object.entries(errorDetails).forEach(([key, value]) => {
    if (OAUTH_PARAM_KEYS.includes(key)) return;
    if (typeof value === 'string' || typeof value === 'number') push(key, String(value));
  });

  return parts.length ? parts.join(' · ') : null;
}

export function createGoogleSheetsOAuthState() {
  return `${GOOGLE_SHEETS_OAUTH_STATE_PREFIX}${Date.now()}`;
}
