import {
  buildResponseCreatedPayload,
  webhookMatchesTrigger,
} from './webhook-payload.util';

describe('webhook-payload.util', () => {
  it('builds handoff-shaped response.created payload', () => {
    const p = buildResponseCreatedPayload({
      formId: 'f1',
      responseId: 'r1',
      submittedAt: '2026-05-31T10:15:00.000Z',
      formTitle: 'Survey',
      answers: { q1: 'yes' },
    });
    expect(p).toEqual({
      event: 'response.created',
      formId: 'f1',
      responseId: 'r1',
      submittedAt: '2026-05-31T10:15:00.000Z',
      formTitle: 'Survey',
      answers: { q1: 'yes' },
    });
  });

  it('empty triggers match all events', () => {
    expect(webhookMatchesTrigger([], 'response.created')).toBe(true);
    expect(webhookMatchesTrigger(undefined, 'form.published')).toBe(true);
  });

  it('non-empty triggers filter events', () => {
    expect(
      webhookMatchesTrigger(['response.created'], 'response.created'),
    ).toBe(true);
    expect(webhookMatchesTrigger(['response.created'], 'form.published')).toBe(
      false,
    );
  });
});
