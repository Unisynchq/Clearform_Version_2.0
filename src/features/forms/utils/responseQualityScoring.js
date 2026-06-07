/** Dummy response-quality evaluation (no AI) for form preview. */

export const RESPONSE_QUALITY_MESSAGES = {
  length:
    'Your answer is too short to be useful. Try describing what specifically happened — even one sentence of detail makes a big difference.',
  specificity:
    'Your answer uses vague language. Replace words like "good" or "fine" with specific details about what happened and why it mattered.',
  relevance:
    'Your answer seems off-topic. Focus on the question and mention what happened in your own experience.',
  completeness:
    'Your answer looks incomplete. Finish your thought with a complete sentence so we can fully understand your feedback.',
};

export const RESPONSE_QUALITY_PASS_MESSAGE =
  'Your answer looks strong. It meets your active scoring criteria — clear, relevant, and detailed enough to review.';

const DEFAULT_VAGUE_WORDS = ['good', 'nice', 'okay', 'fine', 'great', 'bad'];
const DEFAULT_TOPIC_KEYWORDS = ['experience', 'product', 'feedback', 'service', 'team'];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text) {
  const parts = text.trim().split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length || (text.trim() ? 1 : 0);
}

/** True when the answer ends mid-thought (not merely missing a final period). */
function looksTrailingIncomplete(text) {
  const t = text.trim();
  if (!t || /[.!?]$/.test(t)) return false;
  return (
    /\b(that|which|and|but|or|because|if|when|while|as|so|to|with|for|of|in)\s*$/i.test(t) ||
    /(\.\.\.|…|--)$/.test(t) ||
    /,\s*$/.test(t)
  );
}

function hasVagueLanguage(text, vagueWordsStr) {
  const list = (vagueWordsStr || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const words = list.length ? list : DEFAULT_VAGUE_WORDS;
  const lower = text.toLowerCase();
  return words.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, 'i').test(lower));
}

function isIdentityStyleQuestion(question) {
  return /\b(name|email|e-mail|phone|mobile|contact|full name|first name|last name)\b/i.test(
    String(question ?? ''),
  );
}

function looksLikeShortIdentityAnswer(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 80) return false;
  const words = wordCount(trimmed);
  return words >= 1 && words <= 5;
}

function hasTopicKeywords(text, keywordsStr, threshold) {
  const list = (keywordsStr || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const keywords = list.length ? list : DEFAULT_TOPIC_KEYWORDS;
  const lower = text.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k)).length;
  return hits >= (threshold ?? 1);
}

function isDefinitelyGibberish(text) {
  const noSpace = text.toLowerCase().replace(/\s+/g, '');
  if (!noSpace || noSpace.length < 2) return true;
  if (/(.)\1{3,}/.test(noSpace)) return true;
  if (noSpace.length >= 6) {
    const pair = noSpace.slice(0, 2);
    if (pair.repeat(Math.ceil(noSpace.length / 2)).slice(0, noSpace.length) === noSpace) return true;
  }
  const letters = noSpace.replace(/[^a-z]/g, '');
  if (letters.length >= 5 && (letters.match(/[aeiou]/g) ?? []).length / letters.length < 0.10) return true;
  return false;
}

function hasMinimumRealContent(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.filter((t) => /[aeiou]/i.test(t) && t.length >= 2).length >= 3;
}

function evaluateLength(text, opts) {
  const min = Math.max(1, Number(opts.minWords) || 10);
  if (wordCount(text) >= min) return true;
  return isSubstantiveAnswer(text);
}

function evaluateSpecificity(text, opts) {
  const words = wordCount(text);
  const sensitivity = opts.sensitivity || 'Medium';
  const minWords = sensitivity === 'Low' ? 25 : sensitivity === 'High' ? 8 : 12;
  if (words >= minWords && !hasVagueLanguage(text, opts.vagueWords)) return true;
  if (words < minWords && hasVagueLanguage(text, opts.vagueWords)) return false;
  if (hasVagueLanguage(text, opts.vagueWords) && words < minWords * 2) return false;
  return true;
}

function evaluateRelevance(text, opts, context = {}) {
  if (context.fieldKind === 'shortText' && isIdentityStyleQuestion(context.question)) {
    return looksLikeShortIdentityAnswer(text);
  }
  const keywords = (opts.keywords || '').trim();
  if (!keywords) return wordCount(text) >= 3;
  return hasTopicKeywords(text, keywords, opts.matchThreshold ?? 1);
}

function isSubstantiveAnswer(text) {
  const trimmed = text.trim();
  const words = wordCount(trimmed);
  return words >= 8 && trimmed.length >= 35 && !looksTrailingIncomplete(trimmed);
}

function evaluateCompleteness(text, opts) {
  const trimmed = text.trim();
  if (opts.detectTrailing && looksTrailingIncomplete(trimmed)) return false;

  const required = Math.max(1, Number(opts.requiredSentences) || 1);
  const count = sentenceCount(text);
  if (count >= required) return true;

  // A single clear, complete sentence satisfies completeness in preview
  return isSubstantiveAnswer(text);
}

const EVALUATORS = {
  length: evaluateLength,
  specificity: evaluateSpecificity,
  relevance: evaluateRelevance,
  completeness: evaluateCompleteness,
};

export function getActiveCriteria(options = {}) {
  return Object.keys(EVALUATORS).filter((id) => options[id]?.enabled);
}

/**
 * @returns {null | { level: 'green'|'amber'|'red', failCount: number, message: string|null, failedIds: string[] }}
 */
export function evaluateResponseQuality(
  text,
  { enabled, options, fieldKind, question } = {},
) {
  if (!enabled || !options) return null;

  const active = getActiveCriteria(options);
  if (active.length === 0) return null;

  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;

  if (isDefinitelyGibberish(trimmed)) {
    return { level: 'red', failCount: 2, message: "This doesn't look like a real answer. Please write a genuine response.", failedIds: ['relevance', 'completeness'] };
  }
  if (!hasMinimumRealContent(trimmed)) {
    return { level: 'red', failCount: 2, message: 'Your answer is too short. Please provide a meaningful response.', failedIds: ['length', 'completeness'] };
  }

  const evalContext = { fieldKind, question };
  const failedIds = active.filter((id) => {
    const fn = EVALUATORS[id];
    if (id === 'relevance') return !fn(trimmed, options[id], evalContext);
    return !fn(trimmed, options[id]);
  });
  const failCount = failedIds.length;

  if (failCount === 0) {
    return {
      level: 'green',
      failCount: 0,
      message: RESPONSE_QUALITY_PASS_MESSAGE,
      failedIds: [],
    };
  }

  const level = failCount >= 2 ? 'red' : 'amber';
  const primaryId = failedIds[0];
  return {
    level,
    failCount,
    message: RESPONSE_QUALITY_MESSAGES[primaryId] ?? null,
    failedIds,
  };
}
