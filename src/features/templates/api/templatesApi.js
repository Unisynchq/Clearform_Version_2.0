import { TEMPLATE_CATALOG } from '../data/templateCatalog';

const NETWORK_LATENCY_MS = 700;

/**
 * Loads the template catalog. Swap this implementation for a real API call
 * without changing page components — keep the return shape identical.
 */
export async function fetchTemplates({ signal } = {}) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, NETWORK_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  return TEMPLATE_CATALOG;
}
