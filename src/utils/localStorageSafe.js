const memoryStore = new Map();

/**
 * Safely reads a raw string or stored value from localStorage.
 */
export const getItem = (key) => {
  if (typeof window === 'undefined') return memoryStore.get(key) ?? null;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : (memoryStore.get(key) ?? null);
  } catch {
    return memoryStore.get(key) ?? null;
  }
};

/**
 * Safely writes a raw value to localStorage.
 */
export const setItem = (key, value) => {
  const strVal = String(value);
  memoryStore.set(key, strVal);
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, strVal);
  } catch {
    // Ignore quota or security restrictions
  }
};

/**
 * Safely removes a key from localStorage.
 */
export const removeKey = (key) => {
  memoryStore.delete(key);
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore security restrictions
  }
};

/**
 * Safely reads JSON from localStorage.
 */
export const readJson = (key, fallback) => {
  const raw = getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Safely writes JSON to localStorage.
 */
export const writeJson = (key, value) => {
  try {
    setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or security restrictions
  }
};
