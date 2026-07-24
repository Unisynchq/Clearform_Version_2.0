import { pickCopy } from '../../doctrine/copy.registry';

/** Build a tip that only makes sense for this question (never event-style defaults). */
export function questionGroundedSuggestion(
  questionText: string | undefined,
  seed: string,
): string {
  const q = (questionText ?? '').trim();
  const lower = q.toLowerCase();
  if (
    /\b(error|stack|log|exception|traceback|crash|5\d\d|4\d\d)\b/.test(lower)
  ) {
    return 'Paste the full error text if you have it.';
  }
  if (/\b(bug|broken|issue|fail|repro|reproduce)\b/.test(lower)) {
    return 'Name the page and what you clicked.';
  }
  if (q.length >= 8) {
    const short = q.length > 48 ? `${q.slice(0, 45).trim()}…` : q;
    return (
      pickCopy('suggestion.off_topic', {
        seed,
        vars: { question: short },
      }) || `Answer "${short}" in one concrete sentence.`
    );
  }
  return (
    pickCopy('suggestion.default', { seed }) ||
    'Add one concrete detail this question asks for.'
  );
}
