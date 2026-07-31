/**
 * Runtime config - values come from Vite env (`VITE_*`).
 * Backend team: set these in `.env` / deployment secrets.
 */
const getApiBaseUrl = () => {
  let rawUrl = import.meta.env.VITE_API_BASE_URL ?? '';
  if (rawUrl && !rawUrl.includes('/api/v1')) {
    rawUrl = rawUrl.replace(/\/$/, '') + '/api/v1';
  }
  return rawUrl;
};

export const env = {
  apiBaseUrl: getApiBaseUrl(),
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  appEnv: import.meta.env.MODE ?? 'development',
};

export const isApiConfigured = () => Boolean(env.apiBaseUrl?.trim());

/** Offline frontend dev: no backend URL and mock API/localStorage enabled. */
export const isLocalFrontendDev = () => env.useMockApi && !isApiConfigured();
