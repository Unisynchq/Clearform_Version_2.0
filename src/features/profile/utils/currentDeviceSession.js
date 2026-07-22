import { readJson, writeJson } from '@/utils/localStorageSafe';

const DEVICE_SESSION_ID_KEY = 'clearform_device_session_id';

/** Stable id for this browser profile (localStorage). */
export function getOrCreateDeviceSessionId() {
  let id = readJson(DEVICE_SESSION_ID_KEY, null);
  if (!id || typeof id !== 'string') {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    writeJson(DEVICE_SESSION_ID_KEY, id);
  }
  return id;
}

function parseBrowser(ua) {
  if (/Edg\//.test(ua)) {
    const version = ua.match(/Edg\/(\d+)/)?.[1];
    return version ? `Edge ${version}` : 'Edge';
  }
  if (/OPR\//.test(ua) || /Opera/.test(ua)) {
    const version = ua.match(/(?:OPR|Opera)\/(\d+)/)?.[1];
    return version ? `Opera ${version}` : 'Opera';
  }
  if (/Firefox\//.test(ua)) {
    const version = ua.match(/Firefox\/(\d+)/)?.[1];
    return version ? `Firefox ${version}` : 'Firefox';
  }
  if (/Chrome\//.test(ua) && !/Chromium|Edg|OPR/.test(ua)) {
    const version = ua.match(/Chrome\/(\d+)/)?.[1];
    return version ? `Chrome ${version}` : 'Chrome';
  }
  if (/Version\//.test(ua) && /Safari\//.test(ua)) {
    const version = ua.match(/Version\/(\d+)/)?.[1];
    return version ? `Safari ${version}` : 'Safari';
  }
  return 'Unknown browser';
}

function parseDevice(ua) {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    const model = ua.match(/;\s*([^;)]+)\s*Build\//)?.[1]?.trim();
    return model || 'Android device';
  }
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Unknown device';
}

/** Current UTC offset for the device, formatted like "GMT+5:30". */
function getGmtOffsetLabel() {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
}

/**
 * Location label derived from the device's real IANA timezone.
 * We intentionally do NOT use navigator.language for the region — the browser
 * locale (e.g. en-US) does not track the timezone, which produced mismatches
 * like "Calcutta, United States". City + UTC offset always stays consistent.
 */
function getSessionLocationLabel() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return 'Unknown location';
    const city = tz.split('/').pop()?.replace(/_/g, ' ');
    const offset = getGmtOffsetLabel();
    if (city) return `${city} · ${offset}`;
    return `${tz} · ${offset}`;
  } catch {
    return 'Unknown location';
  }
}

/** Session row for the browser running this app. */
export function buildCurrentDeviceSession() {
  if (typeof navigator === 'undefined') {
    return {
      id: 'current',
      device: 'This device',
      location: 'Unknown location',
      lastActive: 'Active now',
      isCurrent: true,
      isUnknown: false,
    };
  }

  const ua = navigator.userAgent;
  const deviceName = parseDevice(ua);
  const browserName = parseBrowser(ua);

  return {
    id: getOrCreateDeviceSessionId(),
    device: `${deviceName} · ${browserName}`,
    location: getSessionLocationLabel(),
    lastActive: 'Active now',
    isCurrent: true,
    isUnknown: false,
  };
}

/** Default list: only the real current device (no demo sessions). */
export function getDefaultSessions() {
  return [buildCurrentDeviceSession()];
}

/** Merge persisted sessions with a fresh current-device row. */
export function mergeSessionsWithCurrentDevice(savedSessions) {
  const current = buildCurrentDeviceSession();
  const others = (Array.isArray(savedSessions) ? savedSessions : []).filter(
    (s) => !s?.isCurrent && s?.id !== current.id
  );
  return [current, ...others];
}
