/**
 * Runtime config — values come from Vite env (`VITE_*`).
 * Backend team: set these in `.env` / deployment secrets.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  appEnv: import.meta.env.MODE ?? 'development',
};

export const isApiConfigured = () => Boolean(env.apiBaseUrl?.trim());

/** Firebase is optional — local frontend dev uses email auth + localStorage instead. */
export const isFirebaseConfigured = () =>
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY?.trim());

/** Offline frontend dev: no backend URL and mock API/localStorage enabled. */
export const isLocalFrontendDev = () => env.useMockApi && !isApiConfigured();
