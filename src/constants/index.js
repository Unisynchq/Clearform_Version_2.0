/** Maximum forms selectable for side-by-side analytics comparison */
export const MAX_COMPARE_FORMS = 2;

export const FILTER_TABS = [
  { id: 'all', label: 'All forms' },
  { id: 'live', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
];

export const WORKSPACES = [
  { id: 'all', label: 'All workspaces', color: null, count: null },
  { id: 'product', label: 'Product', color: '#3b82f6' },
  { id: 'hr', label: 'HR', color: '#22c55e' },
  { id: 'marketing', label: 'Marketing', color: '#f59e0b' },
];

/** @deprecated Use Redux `selectNavWorkspaces` — counts are derived from live forms. */
export const NAV_WORKSPACES = [
  { id: 'product', label: 'Product', color: '#3b82f6' },
  { id: 'hr', label: 'HR', color: '#22c55e' },
  { id: 'marketing', label: 'Marketing', color: '#f59e0b' },
];

// Dynamic timestamps for paused mock forms (computed at module load time)
const _pausedShortEnd  = Date.now() + (6 * 60 + 32) * 60000;      // 6h 32m  → shows "Xh Ym"
const _pausedLongEnd   = Date.now() + (13 * 24 + 8) * 3600000;    // 13d 8h   → shows "Xd Yh"

export const FORMS_DATA = [
  // ── State 1: Live + has responses (normal overview) ──────────────────
  {
    id: 1,
    title: 'NPS Survey Q1 2026',
    status: 'live',
    responses: 500,
    responseLimit: 500,
    timeAgo: '2d ago',
    workspace: 'product',
    gradientFrom: '#ebf2fb',
    gradientTo: '#b5d4f4',
    overlayColor: 'rgba(29,95,173,',
    iconGradient: 'linear-gradient(140deg, #ebf2fb 0%, #b5d4f4 100%)',
  },
  {
    id: 2,
    title: 'Onboarding Feedback',
    status: 'live',
    responses: 91,
    timeAgo: '5d ago',
    workspace: 'hr',
    gradientFrom: '#ebf5ee',
    gradientTo: '#9fe1cb',
    overlayColor: 'rgba(46,125,82,',
    iconGradient: 'linear-gradient(140deg, #ebf5ee 0%, #9fe1cb 100%)',
  },

  // ── State 2: Draft ───────────────────────────────────────────────────
  {
    id: 3,
    title: 'Bug Report Template',
    status: 'draft',
    responses: 0,
    timeAgo: '7h ago',
    workspace: 'product',
    gradientFrom: '#fef4e6',
    gradientTo: '#fac775',
    overlayColor: 'rgba(160,96,10,',
    iconGradient: 'linear-gradient(140deg, #fef4e6 0%, #fac775 100%)',
  },
  {
    id: 5,
    title: 'Product Feedback Survey',
    status: 'draft',
    responses: 0,
    timeAgo: '1m ago',
    workspace: 'product',
    gradientFrom: '#e8f6f5',
    gradientTo: '#6fd0ca',
    overlayColor: 'rgba(26,122,114,',
    iconGradient: 'linear-gradient(140deg, #e8f6f5 0%, #6fd0ca 100%)',
  },

  // ── State 3: Live + 0 responses (rocket / share CTA) ─────────────────
  {
    id: 8,
    title: 'Customer Onboarding Flow',
    status: 'live',
    responses: 0,
    timeAgo: '30m ago',
    workspace: 'hr',
    gradientFrom: '#fff1f2',
    gradientTo: '#fda4af',
    overlayColor: 'rgba(190,18,60,',
    iconGradient: 'linear-gradient(140deg, #fff1f2 0%, #fda4af 100%)',
  },

  // ── State 4: Live + responses (normal) ───────────────────────────────
  {
    id: 6,
    title: 'Marketing CSAT Q1',
    status: 'live',
    responses: 34,
    timeAgo: '3d ago',
    workspace: 'marketing',
    gradientFrom: '#fdf1ed',
    gradientTo: '#f5a58a',
    overlayColor: 'rgba(212,82,42,',
    iconGradient: 'linear-gradient(140deg, #fdf1ed 0%, #f5a58a 100%)',
  },

  // ── State 5: Paused — short countdown (shows "Xh Ym") ────────────────
  {
    id: 9,
    title: 'Weekly Team Pulse',
    status: 'live',
    responses: 56,
    timeAgo: '6h ago',
    workspace: 'hr',
    gradientFrom: '#fefce8',
    gradientTo: '#fde047',
    overlayColor: 'rgba(161,98,7,',
    iconGradient: 'linear-gradient(140deg, #fefce8 0%, #fde047 100%)',
    pauseSettings: {
      confirmed: true,
      endLabel: 'Resuming soon',
      endTimestamp: _pausedShortEnd,
      pauseType: 'custom',
      viewYear: new Date(_pausedShortEnd).getFullYear(),
      viewMonth: new Date(_pausedShortEnd).getMonth(),
      selDay: new Date(_pausedShortEnd).getDate(),
      hour: String(new Date(_pausedShortEnd).getHours() % 12 || 12).padStart(2, '0'),
      minute: String(new Date(_pausedShortEnd).getMinutes()).padStart(2, '0'),
      ampm: new Date(_pausedShortEnd).getHours() >= 12 ? 'PM' : 'AM',
    },
  },

  // ── State 6: Paused — long countdown (shows "Xd Yh") ─────────────────
  {
    id: 10,
    title: 'Retention Survey 2026',
    status: 'live',
    responses: 312,
    timeAgo: '1w ago',
    workspace: 'marketing',
    gradientFrom: '#f0f9ff',
    gradientTo: '#7dd3fc',
    overlayColor: 'rgba(2,132,199,',
    iconGradient: 'linear-gradient(140deg, #f0f9ff 0%, #7dd3fc 100%)',
    pauseSettings: {
      confirmed: true,
      endLabel: 'Resuming in 2 weeks',
      endTimestamp: _pausedLongEnd,
      pauseType: 'custom',
      viewYear: new Date(_pausedLongEnd).getFullYear(),
      viewMonth: new Date(_pausedLongEnd).getMonth(),
      selDay: new Date(_pausedLongEnd).getDate(),
      hour: String(new Date(_pausedLongEnd).getHours() % 12 || 12).padStart(2, '0'),
      minute: String(new Date(_pausedLongEnd).getMinutes()).padStart(2, '0'),
      ampm: new Date(_pausedLongEnd).getHours() >= 12 ? 'PM' : 'AM',
    },
  },

  // ── State 7: Archived ─────────────────────────────────────────────────
  {
    id: 4,
    title: 'Exit Interview — HR',
    status: 'archived',
    responses: 17,
    timeAgo: '2w ago',
    workspace: 'hr',
    gradientFrom: '#f0ebfb',
    gradientTo: '#c4adee',
    overlayColor: 'rgba(91,63,175,',
    iconGradient: 'linear-gradient(140deg, #f0ebfb 0%, #c4adee 100%)',
  },
  {
    id: 11,
    title: 'Q4 Brand Awareness',
    status: 'archived',
    responses: 143,
    timeAgo: '3w ago',
    workspace: 'marketing',
    gradientFrom: '#f0fdf4',
    gradientTo: '#86efac',
    overlayColor: 'rgba(22,163,74,',
    iconGradient: 'linear-gradient(140deg, #f0fdf4 0%, #86efac 100%)',
  },

  // ── State 8: Near response limit (85% full — amber warning block) ────
  {
    id: 13,
    title: 'Onboarding Feedback',
    status: 'live',
    responses: 425,
    responseLimit: 500,
    daysActive: 18,
    startedDate: 'Apr 10',
    timeAgo: '5d ago',
    workspace: 'product',
    gradientFrom: '#fefce8',
    gradientTo: '#fde047',
    overlayColor: 'rgba(161,98,7,',
    iconGradient: 'linear-gradient(140deg, #fefce8 0%, #fde047 100%)',
  },

  // ── State 9: Response limit reached (celebration block) ─────────────
  {
    id: 12,
    title: 'Support Satisfaction Q1',
    status: 'live',
    responses: 476,
    responseLimit: 500,
    daysActive: 18,
    startedDate: 'Apr 10',
    completedDate: 'Apr 28',
    timeAgo: '4d ago',
    workspace: 'product',
    gradientFrom: '#f0fdf4',
    gradientTo: '#86efac',
    overlayColor: 'rgba(22,163,74,',
    iconGradient: 'linear-gradient(140deg, #f0fdf4 0%, #86efac 100%)',
  },

  // ── State 9: Live + 1k+ responses (k-format test) ────────────────────
  {
    id: 7,
    title: 'Annual Customer Satisfaction',
    status: 'live',
    responses: 1284,
    timeAgo: '1d ago',
    workspace: 'marketing',
    gradientFrom: '#f0ebfb',
    gradientTo: '#a78bfa',
    overlayColor: 'rgba(109,40,217,',
    iconGradient: 'linear-gradient(140deg, #f0ebfb 0%, #a78bfa 100%)',
  },

];

export const formatResponseCount = (count) => {
  if (count >= 1000) {
    const val = Math.floor(count / 100) / 10;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}k`;
  }
  return String(count);
};
