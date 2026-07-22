import {
  filterResponsesForBestList,
  heuristicAnswerScore,
  responseMatchesCurrentForm,
  BEST_RESPONSES_BY_TIER,
} from './best-responses-filter.util';

const outreachSnapshot = {
  screens: [
    { id: 1, type: 'intro', label: 'Welcome' },
    {
      id: 2,
      type: 'content',
      label: 'Short text',
      config: { shortTextQuestion: 'What is your goal in life' },
    },
    {
      id: 3,
      type: 'content',
      label: 'Long text',
      config: {
        longTextQuestion: 'How is your experience with filling this form',
      },
    },
    { id: 4, type: 'end', label: 'Thanks' },
  ],
};

describe('best-responses-filter', () => {
  it('rejects stale payload.answers from an old form version (hackathon)', () => {
    const payload = {
      answers: [
        {
          label: 'What specific thing you want to make correct in your project',
          value: 'Devrel goals',
        },
        {
          label: 'How is your experience participating in this hackathon',
          value: 'Loved it',
        },
      ],
      answersByScreenId: {
        '2': { shortTextDraft: 'Devrel goals' },
        '3': { longTextDraft: 'Loved it' },
      },
    };
    expect(responseMatchesCurrentForm(payload, outreachSnapshot)).toBe(false);
  });

  it('accepts responses whose labels match the current snapshot', () => {
    const payload = {
      answersByScreenId: {
        '2': { shortTextDraft: 'I want to become a software engineer' },
        '3': { longTextDraft: 'It is going nice' },
      },
    };
    expect(responseMatchesCurrentForm(payload, outreachSnapshot)).toBe(true);
  });

  it('scores gibberish answers low and excludes from best list', () => {
    const score = heuristicAnswerScore(
      'nothing and nothing and whatever and which where i am',
      'What is your goal in life',
    );
    expect(score).toBeLessThan(BEST_RESPONSES_BY_TIER.pro.minCompositeScore);

    const filtered = filterResponsesForBestList(
      [
        {
          id: 'bad',
          qualityScore: 100,
          submittedAt: new Date(),
          payload: {
            answersByScreenId: {
              '2': {
                shortTextDraft: 'nothing and nothing and whatever and which where i am',
              },
              '3': { longTextDraft: 'nth' },
            },
          },
        },
        {
          id: 'good',
          qualityScore: 88,
          submittedAt: new Date(),
          payload: {
            answersByScreenId: {
              '2': {
                shortTextDraft:
                  'I want to become a software engineer because I love building products',
              },
              '3': {
                longTextDraft:
                  'It is going nice — the questions are clear and not too long',
              },
            },
          },
        },
      ],
      outreachSnapshot,
      BEST_RESPONSES_BY_TIER.pro,
    );

    expect(filtered.map((r) => r.id)).toEqual(['good']);
    expect(filtered[0].builderScore).toBeGreaterThanOrEqual(75);
  });

  it('excludes profanity and dismissive answers from best list', () => {
    expect(
      heuristicAnswerScore(
        'Nothing but to explore different stuffs. fuc off',
        'What is your goal in life',
      ),
    ).toBe(0);
    expect(
      heuristicAnswerScore(
        "I dont want to make anything correct here in my project",
        'What specific thing you want to make correct',
      ),
    ).toBe(0);

    const filtered = filterResponsesForBestList(
      [
        {
          id: 'bad',
          qualityScore: 88,
          submittedAt: new Date(),
          payload: {
            answersByScreenId: {
              '2': { shortTextDraft: 'fuc off nothing' },
              '3': { longTextDraft: 'aweful and not great' },
            },
          },
        },
      ],
      outreachSnapshot,
      BEST_RESPONSES_BY_TIER.pro,
    );
    expect(filtered).toHaveLength(0);
  });
});
