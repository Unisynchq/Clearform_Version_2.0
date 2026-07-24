import {
  classifyQualityViolation,
  isHostileDismissive,
  resolveViolationLevelHint,
} from '../ai/ai-quality-rules.util';
import { qualityLevelToScore } from '../ai/ai-quality.util';
import { containsProfanity } from '../ai/profanity-lists';
import {
  parseSnapshotScreens,
  questionLabel,
} from '../responses/answer-format.util';
import { normalizeAnswersFromPayload } from '../responses/response-payload.normalizer';

export type BestResponsesTierConfig = {
  limit: number;
  minCompositeScore: number;
  minPerAnswerScore: number;
  useLlmRank: boolean;
};

export const BEST_RESPONSES_BY_TIER: Record<
  'free' | 'pro',
  BestResponsesTierConfig
> = {
  free: {
    limit: 3,
    minCompositeScore: 88,
    minPerAnswerScore: 75,
    useLlmRank: true,
  },
  pro: {
    limit: 5,
    minCompositeScore: 85,
    minPerAnswerScore: 70,
    useLlmRank: true,
  },
};

const DISMISSIVE_PATTERN =
  /\b(don'?t\s+want\s+to\s+(make|correct)|won'?t\s+give|not\s+giving|fuc+k?\s*off|nothing\s+but\s+to\s+explore)\b/i;

const THIN_NEGATIVE_PATTERN =
  /\b(awful|aweful|not\s+(awesome|great|good)|really\s+confusing|fuc+k?\b)\b/i;

const CONSTRUCTIVE_PATTERN =
  /\b(because|management|expecting|should|would|improve|better|quiz|session|mentor|food|helpful|liked|enjoyed)\b/i;

export function normalizeQuestionKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function currentContentScreens(snapshot: unknown) {
  return parseSnapshotScreens(snapshot).filter(
    (s) => s.type === 'content' && s.id != null,
  );
}

export function currentQuestionKeys(snapshot: unknown): Set<string> {
  const keys = new Set<string>();
  for (const screen of currentContentScreens(snapshot)) {
    const key = normalizeQuestionKey(questionLabel(screen));
    if (key) keys.add(key);
  }
  return keys;
}

export function responseMatchesCurrentForm(
  payload: Record<string, unknown>,
  snapshot: unknown,
): boolean {
  const screens = currentContentScreens(snapshot);
  if (screens.length === 0) return true;

  const currentIds = new Set(screens.map((s) => String(s.id)));
  const currentQuestions = currentQuestionKeys(snapshot);

  const byScreen = payload.answersByScreenId;
  if (byScreen && typeof byScreen === 'object' && !Array.isArray(byScreen)) {
    const answerIds = Object.keys(byScreen);
    if (answerIds.length === 0) return false;
    const hasValidScreen = answerIds.some((id) => currentIds.has(String(id)));
    if (!hasValidScreen) return false;
  }

  if (Array.isArray(payload.answers) && payload.answers.length > 0) {
    const storedLabels = payload.answers
      .map((a) =>
        normalizeQuestionKey(String((a as { label?: string }).label ?? '')),
      )
      .filter(Boolean);
    if (storedLabels.length > 0 && currentQuestions.size > 0) {
      const matches = storedLabels.filter((label) =>
        [...currentQuestions].some(
          (current) =>
            current === label ||
            current.includes(label.slice(0, 24)) ||
            label.includes(current.slice(0, 24)),
        ),
      );
      if (matches.length / storedLabels.length < 0.5) {
        return false;
      }
    }
  }

  return true;
}

export function isDisqualifyingBestResponseAnswer(
  answerText: string,
  questionText: string,
  helperText = '',
): boolean {
  const text = answerText.trim();
  if (!text || text === '—') return true;
  if (containsProfanity(text)) return true;
  if (isHostileDismissive(text)) return true;
  if (DISMISSIVE_PATTERN.test(text)) return true;

  const violation = classifyQualityViolation(text, questionText, helperText);
  if (violation !== 'none') {
    const level = resolveViolationLevelHint(violation, text);
    if (level === 'red') return true;
    if (
      violation === 'profanity' ||
      violation === 'hostile_dismissive' ||
      violation === 'pure_gibberish'
    ) {
      return true;
    }
  }

  if (THIN_NEGATIVE_PATTERN.test(text) && !CONSTRUCTIVE_PATTERN.test(text)) {
    return true;
  }

  return false;
}

export function heuristicAnswerScore(
  answerText: string,
  questionText: string,
  helperText = '',
): number {
  if (isDisqualifyingBestResponseAnswer(answerText, questionText, helperText)) {
    return 0;
  }

  const text = answerText.trim();
  const violation = classifyQualityViolation(text, questionText, helperText);
  if (violation !== 'none') {
    const level = resolveViolationLevelHint(violation, text);
    if (level === 'red') return 0;
    return qualityLevelToScore('amber');
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 6) return qualityLevelToScore('amber');
  if (words >= 10 && !THIN_NEGATIVE_PATTERN.test(text)) {
    return qualityLevelToScore('green');
  }
  if (words >= 12 && CONSTRUCTIVE_PATTERN.test(text)) {
    return qualityLevelToScore('green');
  }
  return qualityLevelToScore('amber');
}

export type BuilderFilteredResponse = {
  id: string;
  qualityScore: number | null;
  submittedAt: Date;
  answers: Array<{ label?: string; value?: string }>;
  payload: unknown;
  builderScore: number;
};

export function filterResponsesForBestList(
  rows: Array<{
    id: string;
    qualityScore: number | null;
    submittedAt: Date;
    payload: unknown;
  }>,
  snapshot: unknown,
  tierConfig: BestResponsesTierConfig,
): BuilderFilteredResponse[] {
  const screens = currentContentScreens(snapshot);
  const screenHelpers = new Map<string, string>();
  for (const screen of screens) {
    const config = screen.config ?? {};
    const helper =
      typeof config.shortTextHelperText === 'string'
        ? config.shortTextHelperText
        : typeof config.longTextHelperText === 'string'
          ? config.longTextHelperText
          : '';
    screenHelpers.set(String(screen.id), helper);
  }

  const eligible: BuilderFilteredResponse[] = [];

  for (const row of rows) {
    const payload =
      row.payload &&
      typeof row.payload === 'object' &&
      !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {};

    if (!responseMatchesCurrentForm(payload, snapshot)) continue;

    const answers = normalizeAnswersFromPayload(payload, snapshot).filter(
      (a) => typeof a.value === 'string' && a.value.trim() && a.value !== '—',
    );
    if (answers.length === 0) continue;

    if (
      answers.some((a) =>
        isDisqualifyingBestResponseAnswer(
          a.value ?? '',
          a.label ?? '',
          screenHelpers.get(String(a.screenId ?? '')) ?? '',
        ),
      )
    ) {
      continue;
    }

    const perAnswerScores = answers.map((a) =>
      heuristicAnswerScore(
        a.value ?? '',
        a.label ?? '',
        screenHelpers.get(String(a.screenId ?? '')) ?? '',
      ),
    );

    if (perAnswerScores.some((s) => s < tierConfig.minPerAnswerScore)) continue;

    const builderScore = Math.round(
      perAnswerScores.reduce((sum, s) => sum + s, 0) / perAnswerScores.length,
    );

    if (builderScore < tierConfig.minCompositeScore) continue;

    eligible.push({
      ...row,
      answers,
      builderScore,
    });
  }

  return eligible.sort(
    (a, b) =>
      b.builderScore - a.builderScore ||
      b.submittedAt.getTime() - a.submittedAt.getTime(),
  );
}
