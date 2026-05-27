export const RECOMMENDED_ACTIONS_COMPACT = [
  {
    index: '01',
    title: 'Prioritize mobile responsive design improvements',
    tags: [
      { label: 'High Impact', bg: '#fbf0f0', border: 'rgba(179,48,48,0.15)', color: '#b33030' },
      { label: 'Urgent', bg: '#fef3e2', border: 'rgba(138,85,8,0.15)', color: '#8a5508' },
    ],
  },
  {
    index: '02',
    title: 'Implement multi-language support for forms',
    tags: [{ label: 'High Impact', bg: '#fbf0f0', border: 'rgba(179,48,48,0.15)', color: '#b33030' }],
  },
  {
    index: '03',
    title: 'Add a placeholder to Q2 and make it optional',
    tags: [{ label: 'Quick win', bg: '#ebf5ef', border: 'rgba(26,97,51,0.15)', color: '#1a6133' }],
  },
];

export const RECOMMENDED_ACTIONS_EXPANDED = [
  {
    index: '01',
    title: 'Prioritize mobile responsive design improvements',
    body: [
      '67% of users flag mobile UX as a critical pain point. Improving responsive layouts across',
      'form views and the analytics dashboard will directly address the top-growing complaint',
      'category (+14% WoW).',
    ],
    tags: [
      { label: 'High Impact', bg: '#fdeaea', border: 'transparent', color: '#c94040' },
      { label: 'Urgent', bg: '#fdeaea', border: 'transparent', color: '#c94040' },
    ],
    estImpact: '+18% retention',
    usersAffected: '807 users',
    confidence: 'High (92%)',
    effortFilled: 3,
    effortLabel: 'Medium-High',
    ctaHint: 'Sprint ready',
  },
  {
    index: '02',
    title: 'Implement multi-language support for forms',
    body: [
      'Survey responses indicate 23% of users are operating in non-English locales. Adding',
      'Spanish, French, and German would unlock an estimated 280 additional monthly',
      'completions based on drop-off patterns.',
    ],
    tags: [{ label: 'High Impact', bg: '#fdeaea', border: 'transparent', color: '#c94040' }],
    estImpact: '+23% completion',
    usersAffected: '280+ users',
    confidence: 'Medium (76%)',
    effortFilled: 4,
    effortLabel: 'High',
    ctaHint: 'Needs scoping',
  },
  {
    index: '03',
    title: 'Add a placeholder to Q2 and make it optional',
    body: [
      'Q2 has an 18% abandonment spike. Adding helper text and removing the required',
      'constraint could recover 5–9 pts of completion rate with under 30 minutes of engineering',
      'effort.',
    ],
    tags: [{ label: 'Quick win', bg: '#e8f5ef', border: 'transparent', color: '#2d7a5a' }],
    estImpact: '+5–9pt completion',
    usersAffected: '~216 users',
    confidence: 'High (89%)',
    effortFilled: 1,
    effortLabel: 'Very Low',
    ctaHint: 'Ship today',
  },
];
