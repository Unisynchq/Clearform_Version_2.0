const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** True when the form has an active, non-expired pause. */
export function isFormPaused(form) {
  const ps = form?.pauseSettings;
  if (!ps?.confirmed) return false;
  if (ps.pauseType === 'permanent' || ps.pauseType === 'indefinite' || !ps.endTimestamp) {
    return true;
  }
  return Date.now() < ps.endTimestamp;
}

/** Build Redux payload for a 24-hour pause (dashboard context menu). */
export function buildOneDayPausePayload(formId, now = Date.now()) {
  const endTimestamp = now + MS_PER_DAY;
  const endDate = new Date(endTimestamp);
  const endLabel = endDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });

  return {
    formId,
    endLabel,
    endTimestamp,
    pauseType: '24hrs',
    viewYear: endDate.getFullYear(),
    viewMonth: endDate.getMonth(),
    selDay: endDate.getDate(),
    hour: String(endDate.getHours() % 12 || 12).padStart(2, '0'),
    minute: String(endDate.getMinutes()).padStart(2, '0'),
    ampm: endDate.getHours() >= 12 ? 'PM' : 'AM',
  };
}

/** Pause until manually resumed (analytics danger zone). */
export function buildIndefinitePausePayload(formId) {
  return {
    formId,
    endLabel: 'Until resumed',
    endTimestamp: null,
    pauseType: 'indefinite',
    viewYear: null,
    viewMonth: null,
    selDay: null,
    hour: null,
    minute: null,
    ampm: null,
  };
}
