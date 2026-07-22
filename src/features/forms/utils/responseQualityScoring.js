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

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
  'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
  'until', 'while', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'am', 'it', 'its', 'you', 'your', 'yours', 'we', 'our', 'they',
  'their', 'i', 'me', 'my', 'he', 'she', 'him', 'her', 'us', 'them',
]);

const FILLER_TOKENS = new Set([
  'nothing', 'whatever', 'idk', 'dunno', 'stuff', 'things', 'bro', 'kinda',
  'like', 'yeah', 'yep', 'nope', 'nah', 'meh', 'lol', 'haha', 'um', 'uh',
]);

const ASPIRATION_TOKENS = new Set([
  'goal', 'goals', 'life', 'dream', 'dreams', 'career', 'future', 'aspiration',
  'aspirations', 'ambition', 'ambitions', 'plan', 'plans', 'want', 'hope', 'hopes',
  'become', 'engineer', 'doctor', 'teacher', 'developer', 'software', 'job', 'work',
  'profession',
]);

const CONCRETE_NOUNS =
  /\b(form|question|step|screen|field|page|because|when|feature|issue|problem|example|process|workflow|survey|feedback|response|answer|detail|reason|time|day|week|month|year|\d+)\b/i;

// Unconditional override patterns — these always return red regardless of other criteria.
const TOXIC_PATTERN =
  /\b(fuck(?:ing|er|face|head|wit)?|shit(?:ty|head|hole)?|asshole|ass\s*hole|bastard|bitch(?:es|ing)?|dumbf[u*]ck|cunt|dick(?:head)?|motherfucker?|wh[o0]re|d[i1]ck)\b/i;

const PROMPT_INJECTION_PATTERN =
  /\b(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|context|prompts?)|system\s*prompt|you\s+are\s+now\s+a|act\s+as\s+(a\s+)?different|jailbreak|forget\s+(all\s+)?previous|override\s+(your\s+)?instructions?|disregard\s+(all\s+)?previous)\b/i;

function isEmojiSpam(text) {
  const emojiMatches = text.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) ?? [];
  const wordTokens = text.trim().split(/\s+/).filter(Boolean);
  return emojiMatches.length >= 4 && emojiMatches.length / (wordTokens.length + emojiMatches.length) > 0.5;
}

function isRepetitiveSpam(text) {
  return /(.{10,})\1{2,}/.test(text);
}

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

const GREETING_NAME_PATTERN =
  /^(hey|hi|hello|yo|sup|hola|heya|hii+|helloo+|howdy|hiya|namaste)$/i;

function looksLikeGibberishName(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return true;
  if (hasKeyboardMashSegment(trimmed)) return true;
  const compact = trimmed.replace(/\s+/g, '');
  if (compact.length > 14 && !trimmed.includes(' ')) return true;
  if (compact.length >= 10) {
    const vowels = (compact.match(/[aeiou]/gi) ?? []).length;
    const ratio = vowels / compact.length;
    if (ratio < 0.12 || ratio > 0.75) return true;
  }
  return false;
}

function looksLikeValidName(text, question, helperText) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed || /\d/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) return false;
  const substantive = words.filter((w) => !/^(mr|mrs|ms|miss|dr|prof|sir|md|m\.d|phd|ph\.d)\.?$/i.test(w));
  const needFull = /\b(full name|official document|first and last|legal name|as it appears)\b/i.test(
    `${question ?? ''} ${helperText ?? ''}`,
  );
  if (needFull && substantive.length < 2) return false;
  if (words.some((w) => GREETING_NAME_PATTERN.test(w))) return false;
  if (words.length === 1) {
    const w = words[0];
    if (w.length < 4 || w.length > 12) return false;
    if (/^[a-z]+$/i.test(w) && w.length <= 5) return false;
  }
  return !looksLikeGibberishName(trimmed);
}

function looksLikeShortIdentityAnswer(text, question, helperText) {
  return looksLikeValidName(text, question, helperText);
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

function normalizeStem(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return w;
  return w.replace(/(ing|ed|es|s)$/, '');
}

function extractContentWords(questionText) {
  const q = String(questionText ?? '').toLowerCase();
  return q
    .split(/\s+/)
    .map((t) => normalizeStem(t))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function tokenVowelRatio(token) {
  const letters = token.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length === 0) return 1;
  const vowels = (letters.match(/[aeiou]/g) ?? []).length;
  return vowels / letters.length;
}

function isMashToken(token) {
  const clean = token.replace(/[^a-zA-Z0-9;|]/g, '');
  if (!clean) return false;

  const alpha = clean.replace(/[^a-zA-Z]/g, '');
  if (alpha.length >= 8 && /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(alpha)) return true;
  if (alpha.length >= 12 && tokenVowelRatio(alpha) < 0.15) return true;
  if (/[a-z]{3,}[;|][a-z0-9]{3,}/i.test(clean)) return true;
  if (/[a-z]{4,}\d{2,}/i.test(clean)) return true;
  if (/[;|]/.test(clean) && alpha.length >= 6) return true;

  return false;
}

export function hasKeyboardMashSegment(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.some((t) => isMashToken(t));
}

function mashCharMass(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  let mashChars = 0;
  let totalChars = 0;
  for (const t of tokens) {
    totalChars += t.length;
    if (isMashToken(t)) mashChars += t.length;
  }
  return totalChars > 0 ? mashChars / totalChars : 0;
}

export function lacksSemanticConnection(text, questionText) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (hasKeyboardMashSegment(trimmed)) return true;

  const q = String(questionText ?? '').toLowerCase();
  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const fillerCount = tokens.filter((t) => FILLER_TOKENS.has(t)).length;
  if (fillerCount / tokens.length > 0.4 && tokens.length < 12) return true;

  const questionWords = extractContentWords(questionText);
  const answerStems = tokens.map((t) => normalizeStem(t)).filter((t) => t.length >= 3);
  const overlap = questionWords.filter((qw) =>
    answerStems.some((as) => as.includes(qw) || qw.includes(as)),
  ).length;

  const isAspirationQ = /\b(goal|life|dream|career|future|aspir|ambition|plan)\b/.test(q);
  if (isAspirationQ) {
    const hasAspiration = tokens.some((t) => ASPIRATION_TOKENS.has(t));
    if (!hasAspiration && overlap === 0) return true;
  }

  if (questionWords.length >= 2 && overlap === 0 && tokens.length < 8) {
    return true;
  }

  return false;
}

function isLowValueVerbose(text, questionText) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const q = String(questionText ?? '').toLowerCase();
  const detailIntent =
    /\b(detail|describe|experience|experiance|explain|specific|why|how|tell us|form|filling|feedback)\b/.test(q);
  const experienceIntent = /\b(experience|form|filling|how is|how was)\b/.test(q);
  const wc = wordCount(trimmed);
  const vagueOnly =
    /^(it'?s?\s+(good|fine|great|awesome|ok|okay)|really\s+(good|great|love)|going\s+awesome)/i.test(
      trimmed,
    ) && !CONCRETE_NOUNS.test(trimmed);
  const informalPraise =
    /\b(fun|bro|kinda|like it|not much|it'?s good|pretty good)\b/i.test(trimmed) &&
    !CONCRETE_NOUNS.test(trimmed);
  if (detailIntent && wc < 15 && vagueOnly) return true;
  if (wc >= 8 && wc < 30 && vagueOnly) return true;
  if (experienceIntent && informalPraise) return true;
  if (/\bnot much\b/i.test(trimmed) && /\b(good|fine|great|ok|okay)\b/i.test(trimmed)) {
    return true;
  }
  if (/\b(don'?t|dont)\s+wanna|get out of here|not giving|won'?t answer/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function runMandatoryQualityOverrides(text, questionText) {
  if (TOXIC_PATTERN.test(text)) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response to the question.",
      failedIds: ['relevance', 'completeness'],
    };
  }

  if (PROMPT_INJECTION_PATTERN.test(text)) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response to the question.",
      failedIds: ['relevance', 'completeness'],
    };
  }

  if (isEmojiSpam(text)) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response to the question.",
      failedIds: ['relevance', 'completeness'],
    };
  }

  if (isRepetitiveSpam(text)) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response to the question.",
      failedIds: ['relevance', 'completeness'],
    };
  }

  if (hasKeyboardMashSegment(text) || mashCharMass(text) > 0.25) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response.",
      failedIds: ['relevance', 'completeness'],
    };
  }

  if (isLowValueVerbose(text, questionText)) {
    return {
      level: 'amber',
      failCount: 1,
      message: RESPONSE_QUALITY_MESSAGES.specificity,
      failedIds: ['specificity'],
    };
  }

  if (lacksSemanticConnection(text, questionText)) {
    return {
      level: 'red',
      failCount: 1,
      message: 'Your answer does not seem connected to the question. Please address what was asked.',
      failedIds: ['relevance'],
    };
  }

  return null;
}

function isDefinitelyGibberish(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return true;
  if (hasKeyboardMashSegment(trimmed) || mashCharMass(trimmed) > 0.25) return true;

  const noSpace = trimmed.toLowerCase().replace(/\s+/g, '');
  if (/(.)\1{3,}/.test(noSpace)) return true;
  if (noSpace.length >= 6) {
    const pair = noSpace.slice(0, 2);
    if (pair.repeat(Math.ceil(noSpace.length / 2)).slice(0, noSpace.length) === noSpace) return true;
  }
  const letters = noSpace.replace(/[^a-z]/g, '');
  if (letters.length >= 5 && (letters.match(/[aeiou]/g) ?? []).length / letters.length < 0.10) {
    return true;
  }
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
  if (words < 5) return false;
  return words >= minWords || isSubstantiveAnswer(text);
}

function evaluateRelevance(text, opts, context = {}) {
  if (context.fieldKind === 'shortText' && isIdentityStyleQuestion(context.question)) {
    return looksLikeShortIdentityAnswer(text, context.question, context.helperText);
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
  { enabled, options, fieldKind, question, helperText } = {},
) {
  if (!enabled || !options) return null;

  const active = getActiveCriteria(options);
  if (active.length === 0) return null;

  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;

  if (isDefinitelyGibberish(trimmed)) {
    return {
      level: 'red',
      failCount: 2,
      message: "This doesn't look like a real answer. Please write a genuine response.",
      failedIds: ['relevance', 'completeness'],
    };
  }
  if (
    !hasMinimumRealContent(trimmed) &&
    !(isIdentityStyleQuestion(question) &&
      looksLikeShortIdentityAnswer(trimmed, question, helperText))
  ) {
    return {
      level: 'red',
      failCount: 2,
      message: 'Your answer is too short. Please provide a meaningful response.',
      failedIds: ['length', 'completeness'],
    };
  }

  const mandatory = runMandatoryQualityOverrides(trimmed, question);
  if (mandatory) return mandatory;

  // Question context first: name/identity questions bypass all criteria checks.
  // A valid short name is always green regardless of which criteria are enabled.
  if (
    isIdentityStyleQuestion(question) &&
    looksLikeShortIdentityAnswer(trimmed, question, helperText)
  ) {
    return {
      level: 'green',
      failCount: 0,
      message: RESPONSE_QUALITY_PASS_MESSAGE,
      failedIds: [],
    };
  }

  const evalContext = { fieldKind, question, helperText };
  const failedIds = active.filter((id) => {
    const fn = EVALUATORS[id];
    if (id === 'relevance') return !fn(trimmed, options[id], evalContext);
    return !fn(trimmed, options[id]);
  });
  const failCount = failedIds.length;

  if (failCount === 0) {
    const preGreen = runMandatoryQualityOverrides(trimmed, question);
    if (preGreen) return preGreen;
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
