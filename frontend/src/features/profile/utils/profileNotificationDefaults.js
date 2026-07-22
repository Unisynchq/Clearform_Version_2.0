export const DEFAULT_NOTIFICATION_PREFERENCES = {
  newResponseReceived: { email: true, push: true },
  responseQualityAlert: { email: true, push: false },
  responseSpikeDetected: { email: true, push: true },
  dropOffDetected: { email: false, push: false },
};

export const NOTIFICATION_EVENT_GROUPS = [
  {
    id: 'responses',
    label: 'Responses',
    events: [
      {
        id: 'newResponseReceived',
        title: 'New response received',
        description: 'Triggered every time a form submission comes in',
      },
      {
        id: 'responseQualityAlert',
        title: 'Response quality alert',
        description: 'Notified when a response scores below your quality threshold',
      },
      {
        id: 'responseSpikeDetected',
        title: 'Response spike detected',
        description: 'Unusual volume of submissions in a short window',
      },
      {
        id: 'dropOffDetected',
        title: 'Drop-off detected',
        description: 'When respondents abandon a form at a specific question',
      },
    ],
  },
];

export function cloneNotificationPreferences(prefs) {
  return Object.fromEntries(
    Object.entries(prefs).map(([key, channels]) => [
      key,
      { email: Boolean(channels.email), push: Boolean(channels.push) },
    ])
  );
}

export function notificationPreferencesEqual(a, b) {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const key of keys) {
    if (Boolean(a?.[key]?.email) !== Boolean(b?.[key]?.email)) return false;
    if (Boolean(a?.[key]?.push) !== Boolean(b?.[key]?.push)) return false;
  }
  return true;
}

export function mergeNotificationPreferences(saved) {
  const base = cloneNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  if (!saved || typeof saved !== 'object') return base;
  for (const [eventId, channels] of Object.entries(saved)) {
    if (!base[eventId] || !channels || typeof channels !== 'object') continue;
    base[eventId] = {
      email: Boolean(channels.email),
      push: Boolean(channels.push),
    };
  }
  return base;
}
