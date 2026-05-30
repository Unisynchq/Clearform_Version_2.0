const isUsablePublishedSnapshot = (snapshot) =>
  snapshot && typeof snapshot === 'object' && Array.isArray(snapshot.screens) && snapshot.screens.length > 0;

/** Normalize GET /forms/:id/published — raw snapshot or wrapped form record. */
export function normalizePublishedFormResponse(data) {
  if (!data || typeof data !== 'object') return null;
  if (isUsablePublishedSnapshot(data)) return data;
  if (isUsablePublishedSnapshot(data.publishedSnapshot)) return data.publishedSnapshot;
  if (isUsablePublishedSnapshot(data.builderSnapshot)) return data.builderSnapshot;
  return null;
}

export function isPublishedFormLive(data) {
  if (!data || typeof data !== 'object') return true;
  const status = String(data.status ?? '').toLowerCase();
  if (!status) return true;
  return status === 'live';
}
