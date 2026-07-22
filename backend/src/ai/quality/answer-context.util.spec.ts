import {
  answerHasSubstance,
  answerNamesWhatLiked,
  extractAnswerExcerpt,
  inferMissingQuestionAspect,
} from './question-signals.util';

describe('answer-context (generic)', () => {
  it('picks a substantive clause, not random prefix words', () => {
    const answer =
      '. that my ai should get the context before giving response in my project.';
    const excerpt = extractAnswerExcerpt(answer);
    expect(excerpt.split(/\s+/).length).toBeGreaterThanOrEqual(4);
    expect(excerpt.toLowerCase()).toContain('context');
  });

  it('detects multi-clause substantive answers', () => {
    const answer =
      'My experiance was good but I have one objection regarding cooked food, the thing i like is the management.';
    expect(answerHasSubstance(answer)).toBe(true);
    expect(answerNamesWhatLiked(answer)).toBe(true);
  });

  it('infers missing question part generically', () => {
    const q =
      'How is your experiance with participating in this hackathon , what you like the most?';
    const thin = 'It was good.';
    expect(inferMissingQuestionAspect(q, thin)).toBeTruthy();

    const full =
      'My experiance with the hackathon was good and the thing i like is the management.';
    expect(inferMissingQuestionAspect(q, full)).toBeNull();
  });
});
