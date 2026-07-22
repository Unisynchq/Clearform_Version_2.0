import {
  isParaphraseOnlyGreen,
  isRedundantTopicCoaching,
  isRespondentNameSalutation,
  sanitizeRespondentCopy,
} from './respondent-copy.util';

describe('respondent-copy.util', () => {
  it('detects name salutations', () => {
    expect(
      isRespondentNameSalutation(
        'Rahul P, you mentioned exploring other product ideas.',
      ),
    ).toBe(true);
    expect(isRespondentNameSalutation('You mentioned exploring ideas.')).toBe(
      false,
    );
  });

  it('strips name salutations in sanitize', () => {
    expect(
      sanitizeRespondentCopy(
        'Rahul P, you mentioned exploring other product ideas.',
      ),
    ).toBe('you mentioned exploring other product ideas.');
  });

  it('flags paraphrase-only green copy', () => {
    expect(
      isParaphraseOnlyGreen(
        'Suggesting IoT-driven ideas for a dashboard is a great specific topic for our research.',
        'Specifically, saying I would like IoT-driven ideas which we can use in a simple dashboard',
      ),
    ).toBe(true);
    expect(
      isParaphraseOnlyGreen(
        'IoT on a dashboard fits what we are studying — that is enough to continue.',
        'IoT-driven ideas for a simple dashboard',
      ),
    ).toBe(false);
  });

  it('flags redundant topic coaching', () => {
    expect(
      isRedundantTopicCoaching(
        'Rahul P, you mentioned exploring other product ideas. What specific product ideas or market topics do you think we should focus on?',
        'I think you guys have to explore some other product ideas that will be good for you.',
        'Any topics we should explore further?',
      ),
    ).toBe(true);
  });
});
