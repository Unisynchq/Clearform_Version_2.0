import { describe, it, expect } from 'vitest';
import {
  buildResponseFromPreview,
  extractRespondentLabel,
  mapApiResponseForDisplay,
  responseToTableRow,
  filterResponsesByRange,
  sortResponsesByNewest,
} from './formResponseBuilder';

describe('formResponseBuilder', () => {
  const screens = [
    { id: 1, type: 'intro', label: 'Intro' },
    {
      id: 2,
      type: 'content',
      label: 'Contact',
      config: { contactQuestion: 'Your email' },
    },
    {
      id: 3,
      type: 'content',
      label: 'Short text',
      config: { shortTextQuestion: 'Role' },
    },
    { id: 4, type: 'end', label: 'End' },
  ];

  it('extractRespondentLabel shows em dash when no contact data', () => {
    expect(
      extractRespondentLabel(screens, {
        3: { shortTextDraft: 'Rahul Pandey' },
      }),
    ).toBe('—');
  });

  it('extractRespondentLabel prefers contact email over other fields', () => {
    expect(
      extractRespondentLabel(screens, {
        2: { previewFields: { 'c.em': 'test@example.com', 'c.fn': 'Ada' } },
      }),
    ).toBe('test@example.com');
  });

  it('mapApiResponseForDisplay recomputes contact from answersByScreenId', () => {
    const draft = { screens };
    const item = {
      formId: 42,
      contact: 'Stale feedback text',
      answersByScreenId: {
        2: { previewFields: { 'c.em': 'fresh@example.com' } },
        3: { shortTextDraft: 'Designer' },
      },
    };
    const mapped = mapApiResponseForDisplay(item, draft);
    expect(mapped.contact).toBe('fresh@example.com');
  });

  it('buildResponseFromPreview captures contact and answers', () => {
    const response = buildResponseFromPreview({
      formId: 42,
      screens,
      snapsByScreenId: {
        2: { previewFields: { 'c.em': 'test@example.com', 'c.fn': 'Ada' } },
        3: { shortTextDraft: 'Designer' },
      },
    });

    expect(response.formId).toBe(42);
    expect(response.contact).toBe('test@example.com');
    expect(response.answers).toHaveLength(2);
    expect(response.answers[1].value).toBe('Designer');
  });

  it('responseToTableRow maps stored response to table cells', () => {
    const row = responseToTableRow({
      contact: 'a@b.co',
      submittedAt: '2025-12-20T20:14:00.000Z',
      status: 'completed',
      answers: [{ value: 'Yes' }],
    });
    expect(row[0]).toBe('a@b.co');
    expect(row[1]).toBe('—');
    expect(row[2]).toBe('Completed');
    expect(row[3]).toBe('Yes');
  });

  it('responseToTableRow shows duration in response time column', () => {
    const row = responseToTableRow({
      contact: 'a@b.co',
      durationMs: 135_000,
      status: 'completed',
      answers: [],
    });
    expect(row[1]).toBe('2m 15s');
  });

  it('sortResponsesByNewest orders by submittedAt descending', () => {
    const sorted = sortResponsesByNewest([
      { submittedAt: '2026-06-01T10:00:00.000Z' },
      { submittedAt: '2026-06-04T13:17:00.000Z' },
      { submittedAt: '2026-06-03T04:28:00.000Z' },
    ]);
    expect(sorted.map((r) => r.submittedAt)).toEqual([
      '2026-06-04T13:17:00.000Z',
      '2026-06-03T04:28:00.000Z',
      '2026-06-01T10:00:00.000Z',
    ]);
  });

  it('filterResponsesByRange respects last 7 days', () => {
    const now = new Date();
    const recent = {
      submittedAt: now.toISOString(),
    };
    const old = {
      submittedAt: new Date(now.getTime() - 10 * 86_400_000).toISOString(),
    };
    const filtered = filterResponsesByRange([recent, old], 'Last 7 days');
    expect(filtered).toHaveLength(1);
  });
});
