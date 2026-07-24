import { pickCopy, normalizeCopy } from '../../doctrine/copy.registry';
import type { QualityResult } from '../../ai.service.types';
import type {
  QualitySessionMemory,
  ScreenSessionMemory,
} from '../quality-session-memory.service';
import {
  isMetaGuidanceLeak,
  sanitizeRespondentCopy,
} from '../respondent-copy.util';
import { questionGroundedSuggestion } from './question-grounded-suggestion.util';

/** Token-set Jaccard similarity on normalized text. */
export function suggestionSimilarity(a: string, b: string): number {
  const tokens = (s: string) =>
    new Set(normalizeCopy(s).split(' ').filter(Boolean));
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection += 1;
  return intersection / (ta.size + tb.size - intersection);
}

const REPEAT_THRESHOLD = 0.8;

function aggregateShown(session?: QualitySessionMemory): {
  messages: string[];
  suggestions: string[];
} {
  if (!session) return { messages: [], suggestions: [] };
  const messages: string[] = [];
  const suggestions: string[] = [];
  for (const screen of Object.values(session.screens)) {
    messages.push(...(screen.shownMessages ?? []));
    suggestions.push(...(screen.shownSuggestions ?? []));
  }
  return { messages, suggestions };
}

function simplerMessageVariant(shown: string[], seed: string): string {
  const candidates = [
    pickCopy('amber.fallback', { seed, exclude: shown, poolSize: 4 }),
    'Try one short sentence with a specific detail from your experience.',
  ];
  for (const c of candidates) {
    if (!shown.some((s) => suggestionSimilarity(c, s) >= REPEAT_THRESHOLD)) {
      return c;
    }
  }
  return candidates[candidates.length - 1];
}

/**
 * Post-generation anti-repeat: drop suggestions ≥ 80% similar to ones this
 * respondent already saw on this screen; rotate repeated messages with doctrine
 * copy variants so the banner never goes blank.
 */
export function dedupeAgainstSession(
  result: QualityResult,
  screenMemory: ScreenSessionMemory | undefined,
  opts: {
    seed: string;
    poolSize: number;
    answerText?: string;
    questionText?: string;
    session?: QualitySessionMemory | null;
  },
): QualityResult {
  // The "is this a repeat" gate is scoped to THIS question only — comparing
  // against everything shown anywhere in the session was too broad and kept
  // forcing a fresh, reasonable LLM suggestion for question B to be discarded
  // just because it echoed phrasing already used on question A. Fallback
  // *variant selection* below still excludes form-wide copy so the canned
  // substitute text itself doesn't repeat across screens either.
  const formWide = aggregateShown(opts.session ?? undefined);
  const screenMessages = screenMemory?.shownMessages ?? [];
  const screenSuggestions = screenMemory?.shownSuggestions ?? [];
  const shownMessages = screenMessages;
  const shownSuggestions = screenSuggestions;
  const excludeMessages = [
    ...new Set([...screenMessages, ...formWide.messages]),
  ];
  const excludeSuggestions = [
    ...new Set([...screenSuggestions, ...formWide.suggestions]),
  ];

  if (!screenMemory && !opts.session) return result;

  let next = result;
  let changed = false;

  if (next.message && shownMessages.length) {
    const msg = sanitizeRespondentCopy(next.message);
    const repeated = shownMessages.some(
      (seen) => suggestionSimilarity(msg, seen) >= REPEAT_THRESHOLD,
    );
    if ((repeated || isMetaGuidanceLeak(msg)) && next.level === 'green') {
      changed = true;
      next = {
        ...next,
        message: pickCopy('green.default', {
          seed: opts.seed,
          exclude: excludeMessages,
          poolSize: opts.poolSize,
        }),
      };
    } else if (repeated || isMetaGuidanceLeak(msg)) {
      changed = true;
      next = {
        ...next,
        message: pickCopy('amber.fallback', {
          seed: opts.seed,
          exclude: excludeMessages,
          poolSize: opts.poolSize,
        }),
      };
      if (!next.suggestions?.length || repeated) {
        next.suggestions = [
          questionGroundedSuggestion(opts.questionText, opts.seed),
        ];
      }
    } else if (msg !== next.message) {
      changed = true;
      next = { ...next, message: msg };
    }
  }

  if (!shownSuggestions.length || !next.suggestions?.length) {
    return changed ? next : result;
  }

  const fresh = next.suggestions.filter(
    (s) =>
      !shownSuggestions.some(
        (seen) => suggestionSimilarity(s, seen) >= REPEAT_THRESHOLD,
      ),
  );
  if (fresh.length === next.suggestions.length) {
    return changed ? next : result;
  }

  if (fresh.length === 0 && next.level !== 'green') {
    return {
      ...next,
      suggestions: [questionGroundedSuggestion(opts.questionText, opts.seed)],
    };
  }
  return { ...next, suggestions: fresh };
}
