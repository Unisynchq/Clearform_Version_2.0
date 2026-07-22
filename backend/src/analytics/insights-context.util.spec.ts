import {
  collectQuestionAnswers,
  sentimentFromAnswerText,
} from './insights-context.util';

const snapshot = {
  screens: [
    {
      id: 5,
      type: 'content',
      label: 'Long text',
      config: { longTextQuestion: 'What went wrong?' },
    },
  ],
};

describe('insights-context', () => {
  it('collects Q+A from response payloads', () => {
    const rows = collectQuestionAnswers(snapshot, [
      {
        answersByScreenId: {
          '5': { longTextDraft: 'The onboarding was confusing at step 3' },
        },
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].question).toBe('What went wrong?');
    expect(rows[0].answer).toContain('confusing');
  });

  it('returns null sentiment when no text answers', () => {
    expect(sentimentFromAnswerText([])).toBeNull();
  });

  it('classifies sentiment from answer keywords', () => {
    const sentiment = sentimentFromAnswerText([
      {
        screenId: '1',
        question: 'Q',
        answer: 'Terrible experience, very confusing',
        fieldType: 'long_text',
      },
      {
        screenId: '2',
        question: 'Q2',
        answer: 'Great product, love it',
        fieldType: 'long_text',
      },
    ]);
    expect(sentiment).not.toBeNull();
    expect(sentiment!.negative).toBeGreaterThan(0);
    expect(sentiment!.positive).toBeGreaterThan(0);
  });
});
