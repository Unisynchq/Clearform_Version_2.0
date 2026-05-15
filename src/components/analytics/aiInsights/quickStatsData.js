const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Figma 2241:19527 — bar heights as % of 46.279px chart row */
export const FIGMA_19527_HEIGHT_PCT = [30, 48, 55, 38, 72, 88, 100];

function hashFormId(formId) {
  const s = String(formId ?? 'default');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h + s.charCodeAt(i) * (i + 1)) % 100000;
  }
  return h;
}

/** Figma 2241:19527 — Mon–Thu muted, Fri–Sun accent green at 60% */
function barStyle(index) {
  if (index >= 4) return { color: '#1a6133', opacity: 0.6, isAccent: true };
  if (index === 1 || index === 2) return { color: '#c5d9cc', opacity: 1, isAccent: false };
  return { color: '#efecea', opacity: 1, isAccent: false };
}

/**
 * Spread form.responses across the last 7 days (deterministic per form).
 * With no responses, uses the static Figma 19527 silhouette.
 */
export function buildSevenDayTrend(form) {
  const total = Math.max(0, form?.responses ?? 0);
  const seed = hashFormId(form?.id);

  if (total === 0) {
    return DAY_LABELS.map((label, index) => ({
      label,
      responses: 0,
      height: FIGMA_19527_HEIGHT_PCT[index],
      ...barStyle(index),
    }));
  }

  const weights = DAY_LABELS.map((_, i) => {
    const noise = 0.45 + ((seed >> (i * 3)) & 0xff) / 255;
    const recentBoost = i >= 4 ? 1.15 + (i - 4) * 0.2 : 1;
    return noise * recentBoost;
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const days = DAY_LABELS.map((label, i) => ({
    label,
    responses: Math.floor((weights[i] / weightSum) * total),
    index: i,
  }));

  let remainder = total - days.reduce((sum, d) => sum + d.responses, 0);
  let idx = 6;
  while (remainder !== 0) {
    const step = remainder > 0 ? 1 : -1;
    if (days[idx].responses + step >= 0) {
      days[idx].responses += step;
      remainder -= step;
    }
    idx = idx === 0 ? 6 : idx - 1;
  }

  const peak = Math.max(...days.map((d) => d.responses), 1);

  return days.map((day) => {
    const scaled =
      day.responses === 0
        ? Math.round(FIGMA_19527_HEIGHT_PCT[day.index] * 0.3)
        : Math.round((day.responses / peak) * 100);
    const height = Math.max(12, Math.min(100, scaled));
    return {
      label: day.label,
      responses: day.responses,
      height,
      ...barStyle(day.index),
    };
  });
}

/** Figma 2241:19429 / 19478 / 19527 / 19576 sentiment variations */
export function quickStatsSentimentVariant(form) {
  const v = hashFormId(form?.id) % 4;
  if (v === 0) {
    return {
      key: 'balanced',
      positive: 68,
      neutral: 22,
      negative: 10,
      mode: 'segments',
      footnote: null,
    };
  }
  if (v === 1) {
    return {
      key: 'neutral100',
      positive: 0,
      neutral: 100,
      negative: 0,
      mode: 'single',
      singleColor: '#e8a830',
      accentLabel: 'neutral',
      footnote: 'Responses appear predominantly factual with limited sentiment signals.',
    };
  }
  if (v === 2) {
    return {
      key: 'negative100',
      positive: 0,
      neutral: 0,
      negative: 100,
      mode: 'single',
      singleColor: '#ec7063',
      accentLabel: 'negative',
      footnote: 'Responses appear predominantly factual with limited sentiment signals.',
    };
  }
  return {
    key: 'positive100',
    positive: 100,
    neutral: 0,
    negative: 0,
    mode: 'single',
    singleColor: '#abebab',
    accentLabel: 'positive',
    footnote: 'Responses appear predominantly factual with limited sentiment signals.',
  };
}
