const WEEKDAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

function defaultSevenDayTrend(total: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - i));
    const base = Math.floor(total / 7);
    const remainder = i === 6 ? total % 7 : 0;
    return {
      label: WEEKDAY_LABELS[day.getDay()],
      count: Math.max(0, base + remainder),
    };
  });
}

/** Rich AI insights payload (handoff B.12). */
export function buildInsightsReadyPayload(input: {
  summaryText: string;
  priorityTitle: string;
  priorityBody: string;
  total: number;
  completionRate: number;
  avgQuality: number;
  impactEstimate?: string;
  confidencePercent?: number | null;
  topIssueCategory?: string;
  topIssuePercent?: number;
  sentiment?: { positive: number; neutral: number; negative: number } | null;
  sevenDayTrend?: { label: string; count: number }[];
  patterns?: {
    percent: number;
    label: string;
    tag: string;
    description: string;
    examples: string[];
  }[];
  worstDrop?: {
    q: string;
    label: string;
    dropPercent: number;
    screenId?: string | number;
  } | null;
  qaRows?: { question: string; answer: string }[];
}) {
  const {
    summaryText,
    priorityTitle,
    priorityBody,
    total,
    completionRate,
    avgQuality,
  } = input;

  const npsScore =
    avgQuality > 0 ? Math.min(100, Math.round(avgQuality)) : null;
  const sevenDayTrend =
    input.sevenDayTrend?.length === 7
      ? input.sevenDayTrend
      : defaultSevenDayTrend(total);

  const topIssueCategory =
    input.topIssueCategory ??
    (completionRate < 50 ? 'Incomplete submissions' : 'Response quality');
  const topIssuePercent =
    input.topIssuePercent ??
    (completionRate < 50
      ? Math.max(0, 100 - completionRate)
      : Math.min(100, Math.round(avgQuality)));

  const patterns =
    input.patterns && input.patterns.length > 0
      ? input.patterns
      : total >= 25
        ? [
            {
              percent: completionRate,
              label: 'Completion rate',
              tag: completionRate < 50 ? 'risk' : 'neutral',
              description: `${completionRate}% of responses completed in this period.`,
              examples: [],
            },
          ]
        : [];

  const sentiment = input.sentiment ?? undefined;

  const recommendedActions = buildRecommendedActions({
    priorityTitle,
    priorityBody,
    completionRate,
    worstDrop: input.worstDrop,
    qaRows: input.qaRows,
  });

  return {
    status: 'ready' as const,
    insight: summaryText,
    summaryText,
    total,
    responseCount: total,
    completionRate,
    avgQuality,
    npsScore,
    npsTrendPercent: null,
    npsTrendLabel: null,
    priorityTitle,
    priorityBody,
    impactEstimate:
      input.impactEstimate ??
      (total >= 25
        ? 'High confidence — enough responses to act on themes'
        : 'Growing sample — share form for more data'),
    confidencePercent: input.confidencePercent ?? null,
    patterns,
    recommendedActions,
    priorityFocus: {
      title: priorityTitle,
      description: priorityBody,
      impact: completionRate < 50 ? 'high' : 'medium',
      effort: 'medium',
      screenId: input.worstDrop?.screenId ?? null,
      actionType: input.worstDrop ? 'improve_screen' : 'review_form',
    },
    topPatterns: patterns.slice(0, 3).map((p, i) => ({
      id: `pattern-${i}`,
      title: p.label,
      description: p.description,
      severity:
        p.tag === 'risk' ? 'high' : p.tag === 'neutral' ? 'medium' : 'low',
    })),
    quickStats: {
      topIssueCategory,
      topIssuePercent,
      ...(sentiment ? { sentiment } : {}),
      sevenDayTrend,
    },
  };
}

function buildRecommendedActions(input: {
  priorityTitle: string;
  priorityBody: string;
  completionRate: number;
  worstDrop?: {
    q: string;
    label: string;
    dropPercent: number;
  } | null;
  qaRows?: { question: string; answer: string }[];
}) {
  const actions: {
    title: string;
    description: string;
    priority: string;
    actionType: string;
  }[] = [];

  if (input.worstDrop && input.worstDrop.dropPercent >= 30) {
    actions.push({
      title: `Improve ${input.worstDrop.q}: ${input.worstDrop.label}`,
      description: `${input.worstDrop.dropPercent}% drop-off here. Shorten helper text, reduce required fields, or clarify wording on this screen.`,
      priority: 'high',
      actionType: 'improve_screen',
    });
  }

  actions.push({
    title: input.priorityTitle,
    description: input.priorityBody,
    priority: input.completionRate < 50 ? 'high' : 'medium',
    actionType: 'review_form',
  });

  const sample = input.qaRows?.[0];
  if (sample) {
    actions.push({
      title: `Read answers to "${sample.question.slice(0, 48)}${sample.question.length > 48 ? '…' : ''}"`,
      description: `Recent sample: "${sample.answer.slice(0, 100)}${sample.answer.length > 100 ? '…' : ''}" — open Responses for full context.`,
      priority: 'medium',
      actionType: 'view_responses',
    });
  } else {
    actions.push({
      title: 'Review recent responses',
      description:
        'Open the Responses tab to read verbatim feedback for this period.',
      priority: 'high',
      actionType: 'view_responses',
    });
  }

  return actions.slice(0, 3);
}
