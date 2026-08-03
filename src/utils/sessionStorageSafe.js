const memoryStore = new Map();

/**
 * Safely reads a string from sessionStorage, returning in-memory fallback if restricted.
 * Prevents SecurityError: The operation is insecure in Incognito / sandboxed frames.
 */
export const getItem = (key) => {
  if (typeof window === 'undefined') return memoryStore.get(key) ?? null;
  try {
    const val = sessionStorage.getItem(key);
    return val !== null ? val : (memoryStore.get(key) ?? null);
  } catch {
    return memoryStore.get(key) ?? null;
  }
};

/**
 * Safely writes a key to sessionStorage and in-memory fallback.
 */
export const setItem = (key, value) => {
  const strVal = String(value);
  memoryStore.set(key, strVal);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, strVal);
  } catch {
    // Ignore quota or security restrictions
  }
};

/**
 * Safely removes a key from sessionStorage and in-memory fallback.
 */
export const removeItem = (key) => {
  memoryStore.delete(key);
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore security restrictions
  }
};

/**
 * Safely clears sessionStorage and in-memory fallback.
 */
export const clear = () => {
  memoryStore.clear();
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.clear();
  } catch {
    // Ignore security restrictions
  }
};
