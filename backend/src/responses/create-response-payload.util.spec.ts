import { normalizeCreateResponseBody } from './create-response-payload.util';

describe('normalizeCreateResponseBody', () => {
  it('accepts handoff top-level answersByScreenId shape', () => {
    const { payload, submittedAt } = normalizeCreateResponseBody({
      submittedAt: '2026-05-31T10:15:00.000Z',
      answersByScreenId: { '12': { shortTextDraft: 'hello' } },
      metadata: { durationMs: 120000 },
    });
    expect(submittedAt).toBe('2026-05-31T10:15:00.000Z');
    expect(payload.answersByScreenId).toEqual({
      '12': { shortTextDraft: 'hello' },
    });
    expect(payload.metadata).toEqual({ durationMs: 120000 });
  });

  it('accepts wrapped data shape', () => {
    const { payload } = normalizeCreateResponseBody({
      data: {
        submittedAt: '2026-06-01T00:00:00.000Z',
        answers: [{ screenId: 1, label: 'Q', value: 'A' }],
      },
    });
    expect(payload.answers).toHaveLength(1);
  });
});
