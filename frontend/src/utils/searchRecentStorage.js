const STORAGE_KEY = 'clearform:global-search-recent';
const MAX_RECENT = 6;

export function readRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === 'string' && item.trim()).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(term) {
  const trimmed = term?.trim();
  if (!trimmed || typeof window === 'undefined') return readRecentSearches();
  const next = [trimmed, ...readRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_RECENT
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}
