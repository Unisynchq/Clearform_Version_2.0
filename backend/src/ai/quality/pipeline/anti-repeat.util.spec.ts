import { dedupeAgainstSession, suggestionSimilarity } from './anti-repeat.util';
import type { QualityResult } from '../../ai.service.types';
import type { ScreenSessionMemory } from '../quality-session-memory.service';

const screen = (shownSuggestions: string[]): ScreenSessionMemory => ({
  verdicts: [],
  shownSuggestions,
  shownMessages: [],
  violations: {},
});

const amber = (suggestions: string[]): QualityResult => ({
  level: 'amber',
  message: 'msg',
  failedIds: ['specificity'],
  suggestions,
});

describe('suggestionSimilarity', () => {
  it('is 1 for identical text regardless of case/punctuation', () => {
    expect(suggestionSimilarity('Name the step!', 'name the step')).toBe(1);
  });

  it('is low for unrelated suggestions', () => {
    expect(
      suggestionSimilarity(
        'Name the step that was confusing.',
        'Share one honest goal in plain language.',
      ),
    ).toBeLessThan(0.3);
  });
});

describe('dedupeAgainstSession', () => {
  it('passes through with no session history', () => {
    const result = amber(['Name the step that was confusing.']);
    expect(
      dedupeAgainstSession(result, undefined, { seed: 'x', poolSize: 2 }),
    ).toBe(result);
  });

  it('drops a suggestion nearly identical to one already shown', () => {
    const result = amber([
      'Name the step that was confusing.',
      'Which feature did you use most?',
    ]);
    const deduped = dedupeAgainstSession(
      result,
      screen(['Name the step that was confusing']),
      { seed: 'x', poolSize: 2 },
    );
    expect(deduped.suggestions).toEqual(['Which feature did you use most?']);
  });

  it('replaces with an unseen copy variant when everything was already shown', () => {
    const shown = ['Name the step that was confusing.'];
    const result = amber(shown);
    const deduped = dedupeAgainstSession(result, screen(shown), {
      seed: 'x',
      poolSize: 2,
    });
    expect(deduped.suggestions).toHaveLength(1);
    expect(deduped.suggestions![0]).not.toBe(shown[0]);
  });

  it('leaves green results without suggestions untouched', () => {
    const result: QualityResult = {
      level: 'green',
      message: 'nice',
      failedIds: [],
      suggestions: [],
    };
    expect(
      dedupeAgainstSession(result, screen(['anything']), {
        seed: 'x',
        poolSize: 2,
      }),
    ).toBe(result);
  });

  it('rotates a repeated amber message to doctrine copy', () => {
    const prior =
      'You said "good experience" — what led to that, and what did you like most?';
    const result: QualityResult = {
      level: 'amber',
      message: prior,
      failedIds: ['specificity'],
      suggestions: ['Name one thing you liked most.'],
    };
    const deduped = dedupeAgainstSession(
      result,
      { ...screen([]), shownMessages: [prior], shownSuggestions: [] },
      {
        seed: 'x',
        poolSize: 2,
        answerText:
          'My experiance was good but I have one objection regarding cooked food',
        questionText: 'How is your experience, what you like the most?',
      },
    );
    expect(deduped.message).not.toBe(prior);
    expect(deduped.message.length).toBeGreaterThan(10);
  });

  it('green verdict with a repeated message never rotates into amber asks (prod bug)', () => {
    // Live screenshot: green dots with "Anchor this to one real thing" —
    // the amber.fallback pool leaked onto a passing answer.
    const prior = 'Nice — this is clear and easy to act on.';
    const result: QualityResult = {
      level: 'green',
      message: prior,
      failedIds: [],
      suggestions: [],
    };
    const deduped = dedupeAgainstSession(
      result,
      { ...screen([]), shownMessages: [prior], shownSuggestions: [] },
      {
        seed: 'x',
        poolSize: 4,
        answerText:
          'I like the quiz between the hackathon and the easy food access.',
        questionText: 'How is your experience with this hackathon?',
      },
    );
    expect(deduped.level).toBe('green');
    expect(deduped.message).not.toBe(prior);
    expect(deduped.message).not.toMatch(
      /anchor this to one real thing|which step, screen|name it|expand on|add /i,
    );
    expect(deduped.suggestions ?? []).toHaveLength(0);
  });
});
