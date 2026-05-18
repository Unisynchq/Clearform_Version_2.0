const DEFAULT_MS = 1400;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

export function shouldFailSessionAction() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('sessionAction') === 'fail';
}

export async function revokeSessionsRequest({ signal, forceFail } = {}) {
  await delay(DEFAULT_MS + Math.random() * 400, signal);
  if (forceFail ?? shouldFailSessionAction()) {
    throw new Error('Failed to revoke sessions');
  }
}
