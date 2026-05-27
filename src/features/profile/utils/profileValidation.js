import {
  getStoredAccountPassword,
  getUserAccountByEmail,
} from '@/features/auth/utils/userAccountsStorage';
import { readSecuritySettings } from '@/features/profile/utils/profileSettingsStorage';
import { readJson } from '@/utils/localStorageSafe';

const ACCOUNTS_KEY = 'clearform_user_accounts';

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function validateDisplayName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Display name is required';
  if (trimmed.length < 3) return 'Must be at least 3 characters';
  return null;
}

export function listRegisteredEmails() {
  const data = readJson(ACCOUNTS_KEY, {});
  if (!data || typeof data !== 'object') return [];
  return Object.values(data)
    .map((a) => a?.email?.trim().toLowerCase())
    .filter(Boolean);
}

export function validateProfileEmail(email, currentAuthEmail) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Email address is required';
  const authKey = currentAuthEmail?.trim().toLowerCase();
  const taken = listRegisteredEmails().some(
    (registered) => registered === trimmed && registered !== authKey
  );
  if (taken) return 'This email is already associated with another account';
  return null;
}

export function validatePhotoFile(file) {
  if (!file) return null;
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      fileName: file.name,
      title: `Upload Failed - ${file.name}`,
      detail: `File is ${sizeMb} MB and this format is not supported. Use JPG, PNG or GIF under 2 MB.`,
    };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      fileName: file.name,
      title: `Upload Failed - ${file.name}`,
      detail: `File is ${sizeMb} MB and this format is not supported. Use JPG, PNG or GIF under 2 MB.`,
    };
  }
  return null;
}

const collectLookupEmails = (authEmail, altEmails = []) =>
  [
    ...new Set(
      [authEmail, ...altEmails]
        .map((e) => e?.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

const getStoredPasswordForEmail = (key) => {
  const fromAccount = getStoredAccountPassword(key);
  if (fromAccount) return fromAccount;
  const fromSecurity = readSecuritySettings(key)?.password;
  return typeof fromSecurity === 'string' ? fromSecurity.trim() : null;
};

/** True when the account record has a saved password (used for sign-in checks). */
export function hasStoredAccountPassword(authEmail, altEmails = []) {
  return collectLookupEmails(authEmail, altEmails).some((key) =>
    Boolean(getUserAccountByEmail(key)?.password)
  );
}

/** True when any lookup key has a saved password in account or security settings. */
export function hasStoredPassword(authEmail, altEmails = []) {
  return collectLookupEmails(authEmail, altEmails).some((key) =>
    Boolean(getStoredPasswordForEmail(key))
  );
}

/**
 * Verify current password for the Security tab.
 * Checks account + security settings across auth and profile emails.
 * If nothing was ever stored, accepts any non-empty value (legacy demo accounts).
 */
export function verifyCurrentPassword(authEmail, value, altEmails = []) {
  const normalized = value?.trim();
  if (!normalized) return false;

  const keys = collectLookupEmails(authEmail, altEmails);
  const stored = keys.map(getStoredPasswordForEmail).filter(Boolean);

  if (stored.length === 0) return true;

  return stored.some((p) => p === normalized);
}
