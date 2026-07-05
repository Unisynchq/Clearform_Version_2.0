import { describe, it, expect } from 'vitest';
import {
  buildLogicAnswersFromScreen,
  evaluateCondition,
  evaluateRule,
  getSafeVisibilityAutoSkipTarget,
  resolveNextScreenId,
  logicEdgeKey,
} from './logicEngine';

describe('logicEngine choice operators', () => {
  const singleScreen = { id: 2, type: 'content', label: 'Single' };
  const multipleScreen = { id: 3, type: 'content', label: 'Multiple' };

  it('maps Single preview picks to multiple-choice answer', () => {
    const answers = buildLogicAnswersFromScreen(singleScreen, {
      previewPicks: ['Manager'],
    });
    expect(answers['multiple-choice']).toBe('Manager');
  });

  it('maps Multiple preview picks to comma-joined multiple-choice answer', () => {
    const answers = buildLogicAnswersFromScreen(multipleScreen, {
      previewPicks: ['Calls', 'WhatsApp'],
    });
    expect(answers['multiple-choice']).toBe('Calls, WhatsApp');
  });

  it('includes matches one option in Multiple selection', () => {
    expect(
      evaluateCondition('Calls, WhatsApp', {
        fieldId: 'multiple-choice',
        operator: 'includes',
        value: 'Calls',
      })
    ).toBe(true);
  });

  it('eq on Multiple compares full joined string', () => {
    expect(
      evaluateCondition('Calls, WhatsApp', {
        fieldId: 'multiple-choice',
        operator: 'eq',
        value: 'Calls',
      })
    ).toBe(false);
    expect(
      evaluateCondition('Calls, WhatsApp', {
        fieldId: 'multiple-choice',
        operator: 'eq',
        value: 'Calls, WhatsApp',
      })
    ).toBe(true);
  });

  it('includes with empty value never matches', () => {
    expect(
      evaluateCondition('Manager', {
        fieldId: 'multiple-choice',
        operator: 'includes',
        value: '',
      })
    ).toBe(false);
  });
});

describe('logicEngine multi-rule OR on one if-edge', () => {
  const screens = [
    { id: 1, type: 'content', label: 'Single' },
    { id: 2, type: 'content', label: 'Short text' },
    { id: 99, type: 'end', label: 'End' },
  ];

  it('first matching rule on an if-edge wins (OR)', () => {
    const from = 1;
    const to = 2;
    const key = logicEdgeKey(from, to);
    const logicIfRulesByEdge = {
      [key]: {
        rules: [
          {
            id: 'r1',
            thenScreenId: to,
            conditions: [
              {
                sourceScreenId: from,
                fieldId: 'multiple-choice',
                operator: 'eq',
                value: 'no-match',
              },
            ],
          },
          {
            id: 'r2',
            thenScreenId: to,
            conditions: [
              {
                sourceScreenId: from,
                fieldId: 'multiple-choice',
                operator: 'includes',
                value: 'Yes',
              },
            ],
          },
        ],
        elseScreenId: 99,
      },
    };
    const logicConnections = [{ from, to, kind: 'if' }];
    const answersByScreenId = {
      [from]: { 'multiple-choice': 'Yes' },
    };

    expect(
      evaluateRule(logicIfRulesByEdge[key].rules[0], answersByScreenId, { fromScreenId: from })
    ).toBe(false);
    expect(
      evaluateRule(logicIfRulesByEdge[key].rules[1], answersByScreenId, { fromScreenId: from })
    ).toBe(true);

    expect(
      resolveNextScreenId({
        fromScreenId: from,
        screens,
        logicIfRulesByEdge,
        logicConnections,
        answersByScreenId,
      })
    ).toBe(to);
  });
});

describe('getSafeVisibilityAutoSkipTarget', () => {
  const screens = [
    { id: 1, type: 'intro' },
    { id: 2, type: 'content' },
    { id: 3, type: 'content' },
  ];

  it('blocks auto-skip back to intro', () => {
    expect(getSafeVisibilityAutoSkipTarget(screens, 3, 1)).toBeNull();
  });

  it('allows forward auto-skip', () => {
    expect(getSafeVisibilityAutoSkipTarget(screens, 2, 3)).toBe(3);
  });
});
