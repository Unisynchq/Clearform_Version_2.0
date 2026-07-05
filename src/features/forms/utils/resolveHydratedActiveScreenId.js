/**
 * Pick which builder screen stays active after hydration / snapshot apply.
 * Never snap back to intro while the user was editing a content question.
 */
export function resolveHydratedActiveScreenId(builtScreens, prevActive, { isRehydrate, preserveForced } = {}) {
  const built = builtScreens ?? [];
  const preserving = Boolean(isRehydrate || preserveForced);

  if (prevActive != null && built.some((s) => s.id === prevActive)) {
    return prevActive;
  }

  if (preserving && prevActive != null) {
    return prevActive;
  }

  const firstContent = built.find((s) => s.type === 'content');
  if (firstContent) return firstContent.id;

  return built[0]?.id ?? null;
}

/** True when local screens are ahead of a stored snapshot (skip stale re-hydrate). */
export function shouldSkipStaleSnapshotHydrate(localScreens, snapshotScreens) {
  const local = localScreens ?? [];
  const snap = snapshotScreens ?? [];
  if (local.length === 0) return false;
  if (snap.length === 0) return true;
  const localIds = local.map((s) => s.id).sort((a, b) => a - b).join(',');
  const snapIds = snap.map((s) => s.id).sort((a, b) => a - b).join(',');
  if (localIds === snapIds) return false;
  return local.length >= snap.length;
}
