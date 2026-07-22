import {
  buildAnswersFromSnapshot,
  parseSnapshotScreens,
  questionLabel,
} from '../responses/answer-format.util';

type ScreenLike = {
  id?: number | string;
  type?: string;
  label?: string;
  config?: Record<string, unknown>;
};

const POSITIVE_WORDS =
  /\b(great|good|excellent|love|helpful|easy|fast|clear|amazing|wonderful|perfect|thanks|thank)\b/i;
const NEGATIVE_WORDS =
  /\b(bad|poor|confusing|difficult|slow|broken|error|frustrat|hate|terrible|awful|unclear|bug|issue|problem)\b/i;

export type QuestionAnswerRow = {
  screenId: string;
  question: string;
  answer: string;
  fieldType: string;
};

export function fieldTypeFromScreen(screen: ScreenLike): string {
  const label = String(screen.label ?? 'text').trim();
  return label.toLowerCase().replace(/\s+/g, '_');
}

/** Collect verbatim Q+A pairs from stored response payloads (handoff B.12). */
export function collectQuestionAnswers(
  snapshot: unknown,
  payloads: unknown[],
): QuestionAnswerRow[] {
  const screens = parseSnapshotScreens(snapshot).filter(
    (s) => s.type === 'content' && s.id != null,
  );
  const rows: QuestionAnswerRow[] = [];

  for (const raw of payloads) {
    const payload =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const answers =
      (payload.answersByScreenId as Record<string, unknown> | undefined) ??
      (payload.data &&
      typeof payload.data === 'object' &&
      !Array.isArray(payload.data)
        ? ((payload.data as Record<string, unknown>).answersByScreenId as
            | Record<string, unknown>
            | undefined)
        : undefined) ??
      {};

    for (const pair of buildAnswersFromSnapshot(screens, answers)) {
      if (!pair.value || pair.value === '—') continue;
      const screen = screens.find((s) => String(s.id) === pair.screenId);
      rows.push({
        screenId: pair.screenId,
        question: pair.label,
        answer: pair.value,
        fieldType: screen ? fieldTypeFromScreen(screen) : 'text',
      });
    }
  }

  return rows;
}

/** Simple keyword sentiment over answer text (no fake 100% negative when unscored). */
export function sentimentFromAnswerText(rows: QuestionAnswerRow[]): {
  positive: number;
  neutral: number;
  negative: number;
} | null {
  if (rows.length === 0) return null;

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const row of rows) {
    const text = row.answer;
    const pos = POSITIVE_WORDS.test(text);
    const neg = NEGATIVE_WORDS.test(text);
    if (pos && !neg) positive += 1;
    else if (neg && !pos) negative += 1;
    else neutral += 1;
  }

  const total = positive + neutral + negative;
  if (total === 0) return null;

  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100),
  };
}

/** Compact excerpt for LLM prompt (cap token size per scale doctrine). */
export function formatQaExcerpt(
  rows: QuestionAnswerRow[],
  maxRows = 12,
  maxCharsPerAnswer = 120,
): string {
  const sample = rows.slice(0, maxRows);
  if (sample.length === 0) return '(no text answers yet)';
  return sample
    .map((r) => {
      const answer =
        r.answer.length > maxCharsPerAnswer
          ? `${r.answer.slice(0, maxCharsPerAnswer)}…`
          : r.answer;
      return `Q: ${r.question}\nA: ${answer}`;
    })
    .join('\n\n');
}

export function screenLabelsFromSnapshot(snapshot: unknown): string[] {
  return parseSnapshotScreens(snapshot)
    .filter((s) => s.type === 'content')
    .map((s) => questionLabel(s));
}
