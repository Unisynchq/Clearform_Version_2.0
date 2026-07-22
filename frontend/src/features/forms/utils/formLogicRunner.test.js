import { describe, it, expect } from 'vitest';
import { createFormLogicRunner } from './formLogicRunner';

describe('formLogicRunner', () => {
  const screens = [
    { id: 1, type: 'intro', label: 'Intro' },
    { id: 2, type: 'content', label: 'Single' },
    { id: 3, type: 'content', label: 'Short text' },
    { id: 4, type: 'end', label: 'End' },
  ];

  it('branches via if-edge rules using recorded answers', () => {
    const runner = createFormLogicRunner({
      screens,
      logicConnections: [{ from: 2, to: 3, kind: 'if' }],
      logicIfRulesByEdge: {
        '2-3': {
          rules: [
            {
              id: 'r1',
              thenScreenId: 3,
              conditions: [
                {
                  sourceScreenId: 2,
                  fieldId: 'multiple-choice',
                  operator: 'includes',
                  value: 'Yes',
                },
              ],
            },
          ],
          elseScreenId: 4,
        },
      },
    });

    runner.recordScreenAnswers(2, { previewPicks: ['Yes'] });
    expect(runner.getNextScreenId(2)).toBe(3);

    runner.recordScreenAnswers(2, { previewPicks: ['No'] });
    expect(runner.getNextScreenId(2)).toBe(4);
  });
});
