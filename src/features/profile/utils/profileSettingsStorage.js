import { readJson, writeJson } from '@/utils/localStorageSafe';

const PROFILE_SETTINGS_KEY = 'clearform_profile_settings';

const readAll = () => {
  const data = readJson(PROFILE_SETTINGS_KEY, {});
  return data && typeof data === 'object' ? data : {};
};

const accountKey = (email) => email?.trim().toLowerCase() ?? '';

export const readProfileSettings = (email) => {
  const key = accountKey(email);
  if (!key) return null;
  return readAll()[key] ?? null;
};

export const writeProfileSettings = (email, settings) => {
  const key = accountKey(email);
  if (!key) return;
  const all = readAll();
  all[key] = {
    ...all[key],
    ...settings,
    updatedAt: Date.now(),
  };
  writeJson(PROFILE_SETTINGS_KEY, all);
};

export const clearProfileSettings = (email) => {
  const key = accountKey(email);
  if (!key) return;
  const all = readAll();
  delete all[key];
  writeJson(PROFILE_SETTINGS_KEY, all);
};

export const readSecuritySettings = (email) => readProfileSettings(email)?.security ?? null;

export const writeSecuritySettings = (email, securityPatch) => {
  const existing = readProfileSettings(email) ?? {};
  writeProfileSettings(email, {
    ...existing,
    security: { ...existing.security, ...securityPatch },
  });
};

export const readNotificationSettings = (email) =>
  readProfileSettings(email)?.notifications ?? null;

export const writeNotificationSettings = (email, notifications) => {
  const existing = readProfileSettings(email) ?? {};
  writeProfileSettings(email, { ...existing, notifications });
};

export const readIntegrationSettings = (email) =>
  readProfileSettings(email)?.integrations ?? null;

export const writeIntegrationSettings = (email, integrations) => {
  const existing = readProfileSettings(email) ?? {};
  writeProfileSettings(email, { ...existing, integrations });
};
