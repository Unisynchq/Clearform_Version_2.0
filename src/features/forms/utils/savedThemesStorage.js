import { readJson, writeJson } from '@/utils/localStorageSafe';

const SAVED_THEMES_KEY = 'clearform_saved_themes';

const readAll = () => {
  const data = readJson(SAVED_THEMES_KEY, {});
  return data && typeof data === 'object' ? data : {};
};

const accountKey = (email) => email?.trim().toLowerCase() ?? '';

/** All themes saved by this account (newest last). */
export const readSavedThemes = (email) => {
  const key = accountKey(email);
  if (!key) return [];
  const list = readAll()[key];
  return Array.isArray(list) ? list : [];
};

/** Append a theme for this account. Returns the updated list. */
export const saveTheme = (email, theme) => {
  const key = accountKey(email);
  if (!key) return readSavedThemes(email);
  const all = readAll();
  const list = Array.isArray(all[key]) ? all[key] : [];
  all[key] = [...list, theme];
  writeJson(SAVED_THEMES_KEY, all);
  return all[key];
};

/** Remove a saved theme by id for this account. Returns the updated list. */
export const deleteSavedTheme = (email, id) => {
  const key = accountKey(email);
  if (!key) return readSavedThemes(email);
  const all = readAll();
  const list = Array.isArray(all[key]) ? all[key] : [];
  all[key] = list.filter((t) => t.id !== id);
  writeJson(SAVED_THEMES_KEY, all);
  return all[key];
};
