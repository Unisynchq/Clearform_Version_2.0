export const DEFAULT_ALERT_SETTINGS = {
  completion: { enabled: true, thresholdPct: 50 },
  milestone: { enabled: true, value: 500 },
  sentiment: { enabled: true, thresholdPct: 1 },
};

export const DEFAULT_LIFECYCLE_MODE = 'No limit';

export function mergeAlertSettings(alertSettings) {
  const src = alertSettings ?? {};
  return {
    completion: { ...DEFAULT_ALERT_SETTINGS.completion, ...src.completion },
    milestone: { ...DEFAULT_ALERT_SETTINGS.milestone, ...src.milestone },
    sentiment: { ...DEFAULT_ALERT_SETTINGS.sentiment, ...src.sentiment },
  };
}
