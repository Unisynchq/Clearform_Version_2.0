import { FormResponse, ResponseStatus } from '@prisma/client';
import {
  buildAnswersFromSnapshot,
  extractRespondentLabel,
  parseSnapshotScreens,
} from './answer-format.util';

type AnswerRow = {
  screenId?: number | string;
  label?: string;
  value?: string;
};

type NormalizableResponse = Pick<
  FormResponse,
  | 'id'
  | 'formId'
  | 'payload'
  | 'status'
  | 'qualityScore'
  | 'completedAt'
  | 'createdAt'
>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function extractContact(
  payload: Record<string, unknown>,
  answers: AnswerRow[],
): string {
  if (typeof payload.contact === 'string' && payload.contact.trim()) {
    return payload.contact.trim();
  }
  for (const answer of answers) {
    const label = (answer.label ?? '').toLowerCase();
    if (label.includes('email') || label.includes('contact')) {
      const v = String(answer.value ?? '').trim();
      if (v && v !== '—') return v;
    }
  }
  return '—';
}

function mapResponseStatus(
  status: ResponseStatus,
  payload: Record<string, unknown>,
): 'completed' | 'partial' {
  if (status === ResponseStatus.PROCESSED) return 'completed';
  if (payload.completed === true || payload.status === 'completed') {
    return 'completed';
  }
  if (status === ResponseStatus.FAILED) return 'partial';
  // Public submissions queue as PENDING until quality runs — treat as completed for display.
  if (status === ResponseStatus.PENDING) return 'completed';
  return 'partial';
}

export function normalizeAnswersFromPayload(
  payload: Record<string, unknown>,
  snapshot?: unknown,
): AnswerRow[] {
  const byScreen = payload.answersByScreenId;
  if (byScreen && typeof byScreen === 'object' && !Array.isArray(byScreen)) {
    const screens = parseSnapshotScreens(snapshot);
    if (screens.length > 0) {
      return buildAnswersFromSnapshot(
        screens,
        byScreen as Record<string, unknown>,
      );
    }
    return Object.entries(byScreen as Record<string, unknown>).map(
      ([screenId, blob]) => ({
        screenId,
        label: String(screenId),
        value: typeof blob === 'string' ? blob : JSON.stringify(blob ?? {}),
      }),
    );
  }

  if (Array.isArray(payload.answers)) {
    const rows = payload.answers
      .filter((a) => a && typeof a === 'object')
      .map((a) => {
        const row = a as AnswerRow;
        return {
          screenId: row.screenId,
          label: row.label ?? '',
          value: row.value ?? '',
        };
      });
    const hasRawJson = rows.some(
      (r) =>
        typeof r.value === 'string' &&
        r.value.startsWith('{') &&
        r.value.includes('shortTextDraft'),
    );
    if (!hasRawJson && rows.length > 0) return rows;
  }

  return [];
}

export function normalizeFormResponse(
  response: NormalizableResponse,
  snapshot?: unknown,
) {
  const payload = asRecord(response.payload);
  const screens = parseSnapshotScreens(snapshot);
  const byScreen = payload.answersByScreenId;
  const answers = normalizeAnswersFromPayload(payload, snapshot);

  let contact = extractContact(payload, answers);
  if (
    contact === '—' &&
    byScreen &&
    typeof byScreen === 'object' &&
    screens.length > 0
  ) {
    contact = extractRespondentLabel(
      screens,
      byScreen as Record<string, unknown>,
    );
  }

  return {
    id: response.id,
    formId: response.formId,
    submittedAt: (response.completedAt ?? response.createdAt).toISOString(),
    status: mapResponseStatus(response.status, payload),
    contact,
    answers,
    answerCount: answers.length,
    qualityScore: response.qualityScore,
    ...(byScreen && typeof byScreen === 'object'
      ? { answersByScreenId: byScreen }
      : {}),
  };
}

export function normalizeOwnerResponse(
  response: NormalizableResponse & Pick<FormResponse, 'durationMs'>,
  snapshot?: unknown,
) {
  const normalized = normalizeFormResponse(response, snapshot);
  return {
    ...normalized,
    durationMs: response.durationMs,
    backendStatus: response.status,
  };
}

export function summarizePayload(
  payload: unknown,
  snapshot?: unknown,
): {
  contact: string;
  answerCount: number;
} {
  const record = asRecord(payload);
  const answers = normalizeAnswersFromPayload(record, snapshot);
  let contact = extractContact(record, answers);
  const byScreen = record.answersByScreenId;
  const screens = parseSnapshotScreens(snapshot);
  if (
    contact === '—' &&
    byScreen &&
    typeof byScreen === 'object' &&
    screens.length > 0
  ) {
    contact = extractRespondentLabel(
      screens,
      byScreen as Record<string, unknown>,
    );
  }
  return {
    contact,
    answerCount: answers.length,
  };
}
