/**
 * pauseSettingsStorage.js
 *
 * When the API is configured, the database is the authoritative source for
 * isPaused state.  All reads/writes here are no-ops in API mode so that
 * stale localStorage data can never override fresh database data.
 *
 * In offline/demo mode (no API), localStorage is still used as a fallback.
 */
import { isApiConfigured } from '@/config/env';
import { clearPublishedFormSessionCache } from '@/features/forms/utils/publishedFormSessionCache';

const STORAGE_KEY = 'clearform_pause_settings';

export function readStoredPauseSettings(formId) {
  // In API mode: always return null — DB is truth, not localStorage.
  if (isApiConfigured()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    const entry = all[String(formId)];
    if (!entry) return null;
    return {
      pauseSettings: entry.pauseSettings ?? entry,
      ownerEmail: entry.ownerEmail ?? '',
    };
  } catch {
    return null;
  }
}

export async function saveStoredPauseSettings(formId, settings) {
  // No-op in API mode.
  if (isApiConfigured()) return;
  if (typeof window === 'undefined' || !formId) return;
  if (settings?.pauseSettings?.confirmed) {
    clearPublishedFormSessionCache(formId);
  }
  const key = `clearform_pause_settings_${formId}`;
  localStorage.setItem(key, JSON.stringify(settings));
}

export function writeStoredPauseSettings(formId, settings, ownerEmail) {
  // No-op in API mode — database stores isPaused authoritatively.
  if (isApiConfigured()) return;
  try {
    if (settings?.pauseSettings?.confirmed) {
      clearPublishedFormSessionCache(formId);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (settings) {
      all[String(formId)] = { pauseSettings: settings, ownerEmail: ownerEmail ?? '' };
    } else {
      delete all[String(formId)];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage not available
  }
}
