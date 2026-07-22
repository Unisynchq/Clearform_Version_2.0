import {
  buildAnswersFromSnapshot,
  extractRespondentLabel,
  formatScreenAnswerValue,
} from './answer-format.util';

describe('answer-format.util', () => {
  const screens = [
    { id: 'intro-1', type: 'intro', label: 'Intro' },
    {
      id: 'q-name',
      type: 'content',
      label: 'Short text',
      config: { shortTextQuestion: 'Your name' },
    },
    { id: 'end-1', type: 'end', label: 'End' },
  ];

  const answersByScreenId = {
    'q-name': {
      shortTextDraft: 'Rahul Pandey',
      previewPicks: [],
      ratingValue: 0,
    },
  };

  it('formats short text answers for list APIs', () => {
    expect(
      formatScreenAnswerValue(screens[1], answersByScreenId['q-name']),
    ).toBe('Rahul Pandey');
  });

  it('builds per-question rows from snapshot + answersByScreenId', () => {
    const rows = buildAnswersFromSnapshot(screens, answersByScreenId);
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe('Rahul Pandey');
    expect(rows[0].label).toBe('Your name');
  });

  it('uses short text as respondent label when no contact screen', () => {
    expect(extractRespondentLabel(screens, answersByScreenId)).toBe(
      'Rahul Pandey',
    );
  });
});
