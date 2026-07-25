const STORAGE_KEY = 'clearform_pause_settings';

export function readStoredPauseSettings(formId) {
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

export function writeStoredPauseSettings(formId, settings, ownerEmail) {
  try {
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
