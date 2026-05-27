const pad2 = (n) => String(n).padStart(2, '0');

/** Parse HH:MM or HH:MM:SS (24h) to seconds since midnight; empty → null */
export function parseTimeToSeconds(value, { showSeconds = false } = {}) {
  const raw = (value ?? '').trim();
  if (!raw || /^no\s*limit$/i.test(raw)) return null;
  const parts = raw.split(':').map((p) => Number(p));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [h, m, s = 0] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  if (!showSeconds && parts.length > 2 && s !== 0) return h * 3600 + m * 60 + s;
  return h * 3600 + m * 60 + (showSeconds ? s : 0);
}

export function secondsToTimeInputValue(totalSeconds, showSeconds = false) {
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return showSeconds ? `${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(h)}:${pad2(m)}`;
}

export function to24Hour(hour12, period) {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function from24Hour(hour24) {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

export function selectionToSeconds({ hour, minute, second = 0, period, use12h }) {
  const h = use12h ? to24Hour(hour, period) : hour;
  return h * 3600 + minute * 60 + second;
}

export function isTimeWithinBounds(seconds, minTime, maxTime, opts) {
  const minS = parseTimeToSeconds(minTime, opts);
  const maxS = parseTimeToSeconds(maxTime, opts);
  if (minS != null && seconds < minS) return false;
  if (maxS != null && seconds > maxS) return false;
  return true;
}

export function clampSeconds(seconds, minTime, maxTime, opts) {
  const minS = parseTimeToSeconds(minTime, opts);
  const maxS = parseTimeToSeconds(maxTime, opts);
  let s = seconds;
  if (minS != null) s = Math.max(s, minS);
  if (maxS != null) s = Math.min(s, maxS);
  return s;
}

export function applySecondsToSelection(totalSeconds, { use12h, showSeconds }) {
  const h24 = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (use12h) {
    const { hour12, period } = from24Hour(h24);
    return { hour: hour12, minute: m, second: s, period };
  }
  return { hour: h24, minute: m, second: s, period: h24 >= 12 ? 'PM' : 'AM' };
}

/** Format stored limit for display in inputs */
export function formatLimitLabel(value, { showSeconds } = {}) {
  if (!value?.trim()) return '';
  const sec = parseTimeToSeconds(value, { showSeconds });
  if (sec == null) return value;
  return secondsToTimeInputValue(sec, showSeconds);
}
