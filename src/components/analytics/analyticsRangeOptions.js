export const ANALYTICS_RANGE_OPTIONS = [
  'All time',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This quarter',
  'Custom range…',
];

export const ANALYTICS_CUSTOM_RANGE_OPTION = 'Custom range…';

export function isAnalyticsCustomRangeLabel(label) {
  return (
    label !== ANALYTICS_CUSTOM_RANGE_OPTION &&
    !ANALYTICS_RANGE_OPTIONS.slice(0, -1).includes(label)
  );
}
