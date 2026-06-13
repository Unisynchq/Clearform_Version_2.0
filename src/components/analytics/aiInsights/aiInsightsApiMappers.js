const PATTERN_TAG_STYLES = {
  UX: {
    pillLabel: 'User Experience',
    percentColor: '#1a6133',
    barColor: '#1a6133',
    tagBg: '#ede8fc',
    tagBorder: 'rgba(72,54,166,0.18)',
    tagColor: '#4836a6',
  },
  risk: {
    pillLabel: 'Risk',
    percentColor: '#b33030',
    barColor: '#b33030',
    tagBg: '#fef3e2',
    tagBorder: 'rgba(138,85,8,0.15)',
    tagColor: '#8a5508',
  },
  neutral: {
    pillLabel: 'Insight',
    percentColor: '#8a5508',
    barColor: '#8a5508',
    tagBg: '#ebf5ef',
    tagBorder: 'rgba(26,97,51,0.15)',
    tagColor: '#1a6133',
  },
  'Feature Request': {
    pillLabel: 'Feature Request',
    percentColor: '#b33030',
    barColor: '#b33030',
    tagBg: '#fef3e2',
    tagBorder: 'rgba(138,85,8,0.15)',
    tagColor: '#8a5508',
  },
  Performance: {
    pillLabel: 'Performance',
    percentColor: '#8a5508',
    barColor: '#8a5508',
    tagBg: '#ebf5ef',
    tagBorder: 'rgba(26,97,51,0.15)',
    tagColor: '#1a6133',
  },
};

function patternTagStyle(tag) {
  return PATTERN_TAG_STYLES[tag] ?? PATTERN_TAG_STYLES.neutral;
}

export function mapPatternsFromApi(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) return null;
  return patterns.map((p) => {
    const style = patternTagStyle(p.tag);
    return {
      percent: p.percent ?? 0,
      label: p.label ?? '',
      tag: p.tag ?? 'neutral',
      pillLabel: style.pillLabel,
      percentColor: style.percentColor,
      barColor: style.barColor,
      tagBg: style.tagBg,
      tagBorder: style.tagBorder,
      tagColor: style.tagColor,
      description: p.description ?? '',
      examples: Array.isArray(p.examples) ? p.examples : [],
    };
  });
}

function priorityTag(priority) {
  if (priority === 'high') {
    return { label: 'High Impact', bg: '#fbf0f0', border: 'rgba(179,48,48,0.15)', color: '#b33030' };
  }
  if (priority === 'medium') {
    return { label: 'Medium', bg: '#fef3e2', border: 'rgba(138,85,8,0.15)', color: '#8a5508' };
  }
  return { label: 'Quick win', bg: '#ebf5ef', border: 'rgba(26,97,51,0.15)', color: '#1a6133' };
}

export function mapRecommendedActionsFromApi(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const compact = actions.slice(0, 3).map((a, i) => ({
    index: String(i + 1).padStart(2, '0'),
    title: a.title ?? '',
    tags: [priorityTag(a.priority)],
    actionType: a.actionType ?? 'review_form',
  }));
  const expanded = actions.map((a, i) => ({
    index: String(i + 1).padStart(2, '0'),
    title: a.title ?? '',
    body: [a.description ?? ''],
    tags: [priorityTag(a.priority)],
    estImpact: a.priority === 'high' ? 'High impact' : 'Medium impact',
    usersAffected: '—',
    confidence: 'From live data',
    effortFilled: a.priority === 'high' ? 4 : 2,
    effortLabel: a.priority === 'high' ? 'Medium-High' : 'Medium',
    ctaHint: a.actionType === 'view_responses' ? 'Open responses' : 'Review form',
    actionType: a.actionType ?? 'review_form',
  }));
  return { compact, expanded };
}

export function mapQuickStatsSentimentFromApi(quickStats) {
  if (!quickStats?.sentiment) return null;
  const { positive = 0, neutral = 0, negative = 0 } = quickStats.sentiment;
  return {
    mode: 'segments',
    positive,
    neutral,
    negative,
  };
}
