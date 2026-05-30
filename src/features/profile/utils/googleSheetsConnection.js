/** Demo OAuth error payload shown on connection failure. */
export function createGoogleSheetsOAuthError() {
  return {
    error: 'access_denied',
    state: `cf_googlesheets_oauth_${Date.now()}`,
  };
}

export function formatGoogleSheetsErrorReference({ error, state }) {
  return `error=${error} ·\nstate=${state}`;
}
