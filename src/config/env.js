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
