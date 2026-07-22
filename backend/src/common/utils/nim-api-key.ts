/** Documented .env.example placeholders — not real keys. */
const PLACEHOLDER_KEYS = new Set([
  'nvapi-...',
  'sk-NIM-...',
  'sk-NIM-8123456789012345678901234567890123456789',
]);

/**
 * True when NVIDIA_NIM_API_KEY is set to a real integrate.api.nvidia.com key.
 * Production keys use `nvapi-` or `sk-NIM-` prefixes (not the doc placeholders).
 */
export function isNimApiKeyConfigured(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const apiKey = raw.trim();
  if (apiKey.length < 20) return false;
  if (PLACEHOLDER_KEYS.has(apiKey)) return false;
  return apiKey.startsWith('nvapi-') || apiKey.startsWith('sk-NIM-');
}
