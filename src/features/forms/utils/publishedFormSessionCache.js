const cacheKey = (formId) => `clearform:published:${formId}`;

/** @returns {{ savedAt: number, snapshot: object } | null} */
export function readPublishedFormSessionCache(formId) {
  if (typeof window === 'undefined' || formId == null) return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(formId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.snapshot?.screens?.length) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function writePublishedFormSessionCache(formId, snapshot) {
  if (typeof window === 'undefined' || formId == null || !snapshot) return;
  const savedAt = snapshot.savedAt ?? Date.now();
  sessionStorage.setItem(
    cacheKey(formId),
    JSON.stringify({ savedAt, snapshot: { ...snapshot, savedAt } }),
  );
}

export function clearPublishedFormSessionCache(formId) {
  if (typeof window === 'undefined' || formId == null) return;
  sessionStorage.removeItem(cacheKey(formId));
}
