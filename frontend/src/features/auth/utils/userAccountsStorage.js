import { writeSecuritySettings } from '@/features/profile/utils/profileSettingsStorage';
import { readJson, writeJson } from '@/utils/localStorageSafe';

const ACCOUNTS_KEY = 'clearform_user_accounts';

const readAccountsMap = () => {
  const data = readJson(ACCOUNTS_KEY, {});
  return data && typeof data === 'object' ? data : {};
};

/** Persist account profile (keyed by email) for returning sign-in. */
export const upsertUserAccount = ({
  email,
  firstName = '',
  lastName = '',
  password,
}) => {
  const key = email?.trim().toLowerCase();
  if (!key) return;
  const accounts = readAccountsMap();
  const existing = accounts[key] ?? {};
  accounts[key] = {
    ...existing,
    email: email.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    ...(password !== undefined ? { password } : {}),
    updatedAt: Date.now(),
  };
  writeJson(ACCOUNTS_KEY, accounts);
};

const normalizePassword = (value) => (typeof value === 'string' ? value.trim() : '');

/** Update stored password after a successful change on the Security tab. */
export const updateAccountPassword = (email, password, { altEmails = [] } = {}) => {
  const trimmed = normalizePassword(password);
  if (!trimmed) return;

  const keys = new Set(
    [email, ...altEmails].map((e) => e?.trim().toLowerCase()).filter(Boolean)
  );

  for (const key of keys) {
    const account = readAccountsMap()[key];
    upsertUserAccount({
      email: account?.email ?? email ?? key,
      firstName: account?.firstName ?? '',
      lastName: account?.lastName ?? '',
      password: trimmed,
    });
  }
};

/**
 * Read stored password for an account key (trimmed), if any.
 */
export const getStoredAccountPassword = (email) => {
  const stored = getUserAccountByEmail(email)?.password;
  return stored ? normalizePassword(stored) : null;
};

/** Save password to account record and security settings (all lookup keys). */
export const persistAccountPassword = (email, password, { altEmails = [] } = {}) => {
  const trimmed = normalizePassword(password);
  if (!trimmed) return;

  updateAccountPassword(email, trimmed, { altEmails });

  const keys = new Set(
    [email, ...altEmails].map((e) => e?.trim().toLowerCase()).filter(Boolean)
  );
  for (const key of keys) {
    writeSecuritySettings(key, { password: trimmed });
  }
};

export const getUserAccountByEmail = (email) => {
  const key = email?.trim().toLowerCase();
  if (!key) return null;
  return readAccountsMap()[key] ?? null;
};
