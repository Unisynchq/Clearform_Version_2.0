const DELETE_MS_MIN = 1600;
const DELETE_MS_MAX = 2400;

/** Demo: add ?deleteAccount=fail to the profile URL to force the error state. */
export function shouldSimulateDeleteFailure() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('deleteAccount') === 'fail';
}

export function requestAccountDeletion({ signal, forceFail } = {}) {
  const fail = forceFail ?? shouldSimulateDeleteFailure();
  const delay = DELETE_MS_MIN + Math.random() * (DELETE_MS_MAX - DELETE_MS_MIN);

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      if (fail) {
        reject(new Error('DELETE_FAILED'));
        return;
      }
      resolve();
    }, delay);

    signal?.addEventListener('abort', onAbort);
  });
}
