import type {
  EvaluateQualityDto,
  NormalizedQualityOptions,
  QualityResult,
} from './ai.service.types';
import { pickCopy } from './doctrine/copy.registry';
import { containsProfanity } from './profanity-lists';
import {
  hasArtifactDetail,
  hasEvaluativeAnswerToken,
  hasExampleCue,
  hasMeasurableStats,
  hasPhraseStutter,
  isEvaluativeExperienceAnswer,
  isExperienceOrFeedbackQuestion,
  isProfessionalExperienceQuestion,
  isProjectOrFixQuestion,
  extractAnswerExcerpt,
  normalizeQuestionText,
} from './quality/question-signals.util';
import {
  deriveDefaultCriteriaForIntent,
  requiresFullName,
} from './question-intent/metric-interpreter';
import type { QuestionIntent } from './question-intent/question-intent.types';

type QualityCriterionId =
  | 'length'
  | 'specificity'
  | 'relevance'
  | 'completeness';

export type QualityViolationKind =
  | 'pure_gibberish'
  | 'profanity'
  | 'hostile_dismissive'
  | 'off_topic'
  | 'too_short'
  | 'low_value'
  | 'prompt_injection'
  | 'none';

/** Violation kinds passed to the LLM as a signal block in the user prompt. */
export const NUDGE_VIOLATION_KINDS: ReadonlySet<QualityViolationKind> = new Set(
  [
    'profanity',
    'hostile_dismissive',
    'off_topic',
    'low_value',
    'too_short',
    'prompt_injection',
  ],
);

/** Mandatory instant-red violations — never defer to the full quality LLM. */
export const HARD_VIOLATION_KINDS: ReadonlySet<QualityViolationKind> = new Set([
  'pure_gibberish',
  'profanity',
  'hostile_dismissive',
  'prompt_injection',
]);

/** Soft violations — full response-quality LLM handles these when configured. */
export const SOFT_NUDGE_VIOLATION_KINDS: ReadonlySet<QualityViolationKind> =
  new Set(['off_topic', 'low_value', 'too_short']);

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isNameIntentQuestion(questionText?: string): boolean {
  const q = (questionText ?? '').toLowerCase();
  return /\b(name|full name|first name|last name|your name)\b/.test(q);
}

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'and',
  'but',
  'if',
  'or',
  'because',
  'until',
  'while',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'am',
  'it',
  'its',
  'you',
  'your',
  'yours',
  'we',
  'our',
  'they',
  'their',
  'i',
  'me',
  'my',
  'he',
  'she',
  'him',
  'her',
  'us',
  'them',
]);

const FILLER_TOKENS = new Set([
  'nothing',
  'whatever',
  'idk',
  'dunno',
  'stuff',
  'things',
  'bro',
  'kinda',
  'like',
  'yeah',
  'yep',
  'nope',
  'nah',
  'meh',
  'lol',
  'haha',
  'um',
  'uh',
]);

const ASPIRATION_TOKENS = new Set([
  'goal',
  'goals',
  'life',
  'dream',
  'dreams',
  'career',
  'future',
  'aspiration',
  'aspirations',
  'ambition',
  'ambitions',
  'plan',
  'plans',
  'want',
  'hope',
  'hopes',
  'become',
  'engineer',
  'doctor',
  'teacher',
  'developer',
  'software',
  'job',
  'work',
  'profession',
]);

// Sentiment/evaluative words that are valid short feedback answers.
// "It was confusing" → confusing is here → answer is valid, just brief.
const EVALUATIVE_TOKENS = new Set([
  'confusing',
  'confused',
  'difficult',
  'hard',
  'easy',
  'unclear',
  'clear',
  'frustrating',
  'frustrated',
  'helpful',
  'useless',
  'good',
  'bad',
  'great',
  'poor',
  'slow',
  'fast',
  'broken',
  'complicated',
  'simple',
  'overwhelming',
  'intuitive',
  'smooth',
  'buggy',
  'weird',
  'fine',
  'okay',
  'terrible',
  'excellent',
  'disappointing',
  'amazing',
  'annoying',
  'boring',
  'engaging',
  'better',
  'worse',
  'perfect',
  'awful',
  'painful',
  'enjoyable',
  'stressful',
]);

// Feedback/improvement question signals — when the question uses these words,
// a short evaluative answer is semantically connected even without word overlap.
const FEEDBACK_Q_PATTERN =
  /\b(improve|change|suggest|feedback|think|feel|experience|onboard|issue|problem|challenge|pain|better|different|wish|like|dislike|hate|love|rate|opinion|review|recommend|difficult|confus|frustrat)\b/i;

const CONCRETE_NOUNS =
  /\b(form|question|step|screen|field|page|because|when|feature|issue|problem|example|process|workflow|survey|feedback|response|answer|detail|reason|time|day|week|month|year|\d+)\b/i;

const HOSTILE_DISMISSIVE_PATTERN =
  /\b(who\s+are\s+you\s+to\s+ask|none\s+of\s+your\s+business|not\s+your\s+business|why\s+should\s+i\s+tell|don'?t\s+care|won'?t\s+answer|not\s+giving|get\s+out\s+of\s+here|fuck\s+off|fuck\s+you|go\s+away|leave\s+me\s+alone|stop\s+asking|stay\s+out\s+of\s+my\s+way|stay\s+away\s+from\s+(me|my)|back\s+off|mind\s+your\s+own\s+business|shut\s+up|duffer|you\s+(idiot|fool|moron|dumbo)|(stupid|dumb|useless)\s+(form|question|survey|app))\b/i;

const PROMPT_INJECTION_PATTERN =
  /\b(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|context|prompts?)|system\s*prompt|you\s+are\s+now\s+a|act\s+as\s+(a\s+)?different|jailbreak|forget\s+(all\s+)?previous|override\s+(your\s+)?instructions?|disregard\s+(all\s+)?previous)\b/i;

/** Sequences of color words with no topical content — classic off-topic noise. */
const COLOR_LIST_PATTERN =
  /^(?:\b(?:red|blue|green|yellow|orange|purple|pink|white|black|gray|grey|violet|indigo)\b[\s,]*){3,}$/i;

function isEmojiSpam(text: string): boolean {
  const emojiMatches =
    text.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu) ?? [];
  const wordTokens = text.trim().split(/\s+/).filter(Boolean);
  return (
    emojiMatches.length >= 4 &&
    emojiMatches.length / (wordTokens.length + emojiMatches.length) > 0.5
  );
}

function isRepetitiveSpam(text: string): boolean {
  if (/(.{10,})\1{2,}/.test(text)) return true;
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (/(.{5,})\1{2,}/i.test(collapsed)) return true;
  return false;
}

function normalizeStem(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return w;
  return w.replace(/(ing|ed|es|s)$/, '');
}

function extractContentWords(questionText?: string): string[] {
  const q = normalizeQuestionText(questionText);
  return q
    .split(/\s+/)
    .map((t) => normalizeStem(t))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function tokenVowelRatio(token: string): number {
  const letters = token.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length === 0) return 1;
  const vowels = (letters.match(/[aeiou]/g) ?? []).length;
  return vowels / letters.length;
}

export function isMashToken(token: string): boolean {
  // Paths and filenames (src/main.py, api/routes.ts) must not be treated as mash.
  if (/^[a-z0-9][a-z0-9_\-./]*\.[a-z]{2,5}$/i.test(token)) return false;
  if (/^[a-z0-9][a-z0-9_\-]*\/[a-z0-9_./-]+$/i.test(token)) return false;

  // Real all-alpha tokens with 2+ vowels are English words, not mash (e.g. "synthetic").
  if (/^[a-z]+$/i.test(token) && (token.match(/[aeiou]/gi) ?? []).length >= 2) {
    return false;
  }

  const clean = token.replace(/[^a-zA-Z0-9;|]/g, '');
  if (!clean) return false;

  const alpha = clean.replace(/[^a-zA-Z]/g, '');
  // 4+ consecutive consonants AND low vowel ratio → mash (e.g. "nfkndnfdsn").
  // Real English words like "instructions" or "workspace" still have vowel ratios ≥ 0.25.
  if (
    alpha.length >= 8 &&
    /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(alpha) &&
    tokenVowelRatio(alpha) < 0.25
  ) {
    return true;
  }
  if (alpha.length >= 12 && tokenVowelRatio(alpha) < 0.15) {
    return true;
  }
  if (/[a-z]{3,}[;|][a-z0-9]{3,}/i.test(clean)) return true;
  if (/[a-z]{4,}\d{2,}/i.test(clean)) return true;
  if (/[;|]/.test(clean) && alpha.length >= 6) return true;

  return false;
}

/**
 * Per-token keyboard mash detection — catches mixed answers like "need to be fnkjewdb...".
 */
export function hasKeyboardMashSegment(text: string): boolean {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.some((t) => isMashToken(t));
}

function mashCharMass(text: string): number {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  let mashChars = 0;
  let totalChars = 0;
  for (const t of tokens) {
    totalChars += t.length;
    if (isMashToken(t)) mashChars += t.length;
  }
  return totalChars > 0 ? mashChars / totalChars : 0;
}

/**
 * Doctrine O-2: answer must connect semantically to the question (heuristic, no LLM).
 */
export function lacksSemanticConnection(
  text: string,
  questionText?: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (hasKeyboardMashSegment(trimmed)) return true;

  const q = normalizeQuestionText(questionText);
  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const fillerCount = tokens.filter((t) => FILLER_TOKENS.has(t)).length;
  if (fillerCount / tokens.length > 0.4 && tokens.length < 12) return true;

  const questionWords = extractContentWords(questionText);
  const answerStems = tokens
    .map((t) => normalizeStem(t))
    .filter((t) => t.length >= 3);
  const overlap = questionWords.filter((qw) =>
    answerStems.some((as) => as.includes(qw) || qw.includes(as)),
  ).length;

  const isAspirationQ =
    /\b(goal|life|dream|career|future|aspir|ambition|plan)\b/.test(q);
  if (isAspirationQ) {
    const hasAspiration = tokens.some((t) => ASPIRATION_TOKENS.has(t));
    if (!hasAspiration && overlap === 0) return true;
  }

  // Short evaluative answers to feedback/improvement questions are semantically connected
  // even with zero word overlap. "It was confusing" → "What could we improve?" is valid.
  // Only flag as disconnected if there are no evaluative signals.
  const isFeedbackQ = isExperienceOrFeedbackQuestion(questionText);
  const hasEvaluative = hasEvaluativeAnswerToken(trimmed);
  if (isFeedbackQ && hasEvaluative) return false;

  const isProjectQ = isProjectOrFixQuestion(questionText);
  if (isProjectQ && hasArtifactDetail(trimmed)) return false;

  if (questionWords.length >= 2 && overlap === 0 && tokens.length < 8) {
    if (isFeedbackQ) return false;
    return true;
  }

  return false;
}

export function isHostileDismissive(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (HOSTILE_DISMISSIVE_PATTERN.test(trimmed)) return true;
  if (/\b(don'?t|dont)\s+wanna|not\s+giving|won'?t\s+answer/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Detect filler-heavy answers: circular phrases, noise tokens, low semantic density.
 */
export function isFillerHeavy(text: string, questionText?: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const tokens = trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);
  if (tokens.length === 0) return false;

  const fillerCount = tokens.filter(
    (t) => FILLER_TOKENS.has(t) || t === 'nth',
  ).length;
  if (fillerCount >= 2 && fillerCount / tokens.length >= 0.25) return true;
  if (
    /\bnth\b/i.test(trimmed) &&
    /\b(whatever|nothing|else)\b/i.test(trimmed)
  ) {
    return true;
  }

  if (
    /\bgoal\s+is\s+goal\b/i.test(trimmed) ||
    /\bfine\s+is\s+life\b/i.test(trimmed)
  ) {
    return true;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const unique = new Set(
      words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')),
    );
    if (unique.size <= Math.ceil(words.length * 0.45)) {
      const q = (questionText ?? '').toLowerCase();
      if (/\b(goal|life|describe|detail|experience)\b/.test(q)) return true;
    }
  }

  if (
    /\b(astronaut|engineer|doctor)\b/i.test(trimmed) &&
    (/\bnth\b/i.test(trimmed) || /\bwhatever\b/i.test(trimmed))
  ) {
    return true;
  }

  return false;
}

function isPureGibberishViolation(text: string): boolean {
  if (isDefinitelyGibberish(text)) return true;
  if (isEmojiSpam(text)) return true;
  if (isRepetitiveSpam(text)) return true;
  if (hasKeyboardMashSegment(text) || mashCharMass(text) > 0.25) return true;
  return false;
}

/**
 * Classify answer violations in priority order. Order fixes profanity-before-too-short bugs.
 */
export function classifyQualityViolation(
  text: string,
  questionText?: string,
  helperText?: string,
): QualityViolationKind {
  const trimmed = text.trim();
  if (!trimmed) return 'too_short';

  if (containsProfanity(trimmed)) return 'profanity';
  if (isHostileDismissive(trimmed)) return 'hostile_dismissive';
  if (PROMPT_INJECTION_PATTERN.test(trimmed)) return 'prompt_injection';
  if (isPureGibberishViolation(trimmed)) return 'pure_gibberish';
  if (COLOR_LIST_PATTERN.test(trimmed)) return 'off_topic';

  if (
    trimmed.length >= 40 &&
    !hasMinimumRealContent(trimmed) &&
    !isExemptFromMinimumContent(trimmed, questionText, helperText)
  ) {
    return 'pure_gibberish';
  }

  if (
    !hasMinimumRealContent(trimmed) &&
    !isExemptFromMinimumContent(trimmed, questionText, helperText)
  ) {
    return 'too_short';
  }

  if (hasPhraseStutter(trimmed)) {
    return 'low_value';
  }

  if (
    isFillerHeavy(trimmed, questionText) ||
    isLowValueVerbose(trimmed, questionText)
  ) {
    return 'low_value';
  }

  if (isEvaluativeExperienceAnswer(trimmed, questionText, helperText)) {
    return 'none';
  }

  if (lacksSemanticConnection(trimmed, questionText)) {
    // Short answers that look like incomplete sentences (mid-typing, no terminal punctuation)
    // are more likely partial attempts than genuine off-topic responses.
    // Downgrade to too_short (amber) so respondents get a softer nudge.
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const endsWithPunctuation = /[.!?]$/.test(trimmed);
    if (wordCount <= 6 && !endsWithPunctuation) return 'too_short';
    return 'off_topic';
  }

  return 'none';
}

export function violationKindToLevel(
  kind: QualityViolationKind,
): QualityResult['level'] {
  switch (kind) {
    case 'low_value':
      return 'amber';
    case 'none':
      return 'green';
    default:
      return 'red';
  }
}

/**
 * Text-aware level hint. A too_short verdict on an answer that still contains
 * real words is a mid-typing fragment (downgraded from off_topic in
 * classifyQualityViolation) — nudge AMBER, not hard red. too_short on
 * empty/noise input (no real words) stays RED per doctrine O-3.
 */
export function resolveViolationLevelHint(
  kind: QualityViolationKind,
  text: string,
): QualityResult['level'] {
  if (kind === 'too_short' && hasMinimumRealContent(text.trim())) {
    return 'amber';
  }
  if (kind === 'low_value' && hasPhraseStutter(text.trim())) {
    return 'red';
  }
  return violationKindToLevel(kind);
}

export function violationKindToFailedIds(kind: QualityViolationKind): string[] {
  switch (kind) {
    case 'profanity':
    case 'hostile_dismissive':
      return ['relevance', 'completeness'];
    case 'off_topic':
    case 'prompt_injection':
      return ['relevance', 'completeness'];
    case 'too_short':
      return ['length', 'completeness'];
    case 'low_value':
      return ['specificity'];
    case 'pure_gibberish':
      return ['relevance', 'completeness'];
    default:
      return [];
  }
}

/** Static RED for pure gibberish only — no LLM. */
export function buildGibberishResult(opts?: {
  seed?: string;
  repeat?: boolean;
}): QualityResult {
  const key = opts?.repeat
    ? 'violation.pure_gibberish.repeat'
    : 'violation.pure_gibberish';
  return {
    level: 'red',
    message: pickCopy(key, { seed: opts?.seed ?? key }),
    failedIds: ['relevance', 'completeness'],
    suggestions: [
      pickCopy('suggestion.gibberish', { seed: opts?.seed ?? key }),
    ],
  };
}

export function isDefinitelyGibberish(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return true;

  if (hasKeyboardMashSegment(trimmed) || mashCharMass(trimmed) > 0.25) {
    return true;
  }

  const noSpace = trimmed.toLowerCase().replace(/\s+/g, '');

  // Single char repeated 4+ times: "aaaa", "dddd"
  if (/(.)\1{3,}/.test(noSpace)) return true;

  // Alternating 2-char pattern repeating 3+ times: "dfdfdf", "ababab", "nfnfnf"
  if (noSpace.length >= 6) {
    const pair = noSpace.slice(0, 2);
    const expected = pair
      .repeat(Math.ceil(noSpace.length / 2))
      .slice(0, noSpace.length);
    if (noSpace === expected) return true;
  }

  // <10% vowels across 5+ letter string → almost certainly keyboard mashing
  const lettersOnly = noSpace.replace(/[^a-z]/g, '');
  if (lettersOnly.length >= 5) {
    const vowels = (lettersOnly.match(/[aeiou]/g) ?? []).length;
    if (vowels / lettersOnly.length < 0.1) return true;
  }

  return false;
}

/**
 * Returns true when the answer has at least 3 tokens that contain a vowel.
 * Words without any vowel (e.g. "nth", "mth", "df") are noise, not real content.
 */
export function hasMinimumRealContent(text: string): boolean {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const realWords = tokens.filter((t) => /[aeiou]/i.test(t) && t.length >= 2);
  return realWords.length >= 3;
}

export function isExemptFromMinimumContent(
  text: string,
  questionText?: string,
  helperText?: string,
): boolean {
  if (
    isNameIntentQuestion(questionText) &&
    looksLikeValidName(text, questionText, helperText)
  ) {
    return true;
  }
  return isEvaluativeExperienceAnswer(text, questionText, helperText);
}

const GREETING_NAME_PATTERN =
  /^(hey|hi|hello|yo|sup|hola|heya|hii+|helloo+|howdy|hiya|namaste)$/i;

/** Titles / honorifics that precede a name — not counted toward first+last. */
const NAME_HONORIFIC = /^(mr|mrs|ms|miss|dr|prof|sir|md|m\.d|phd|ph\.d)\.?$/i;

function nameTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** Name parts after stripping honorifics (for full-name checks). */
function substantiveNameWords(text: string): string[] {
  return nameTokens(text).filter((w) => !NAME_HONORIFIC.test(w));
}

function looksLikeValidName(
  text: string,
  questionText?: string,
  helperText?: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return false;
  if (/\d/.test(trimmed)) return false;
  const words = nameTokens(trimmed);
  if (words.length > 5) return false;
  if (!words.every((w) => /^[\p{L}'.\-]+$/u.test(w))) return false;

  const substantive = substantiveNameWords(trimmed);
  const needFull = requiresFullName(questionText, helperText);
  if (needFull && substantive.length < 2) return false;

  if (words.length === 1) {
    const w = words[0];
    if (GREETING_NAME_PATTERN.test(w)) return false;
    if (w.length < 4) return false;
    if (w.length > 12) return false;
    if (/^[a-z]+$/i.test(w) && w.length <= 5) return false;
  }

  for (const w of words) {
    if (w.length < 2) return false;
    if (GREETING_NAME_PATTERN.test(w)) return false;
  }

  return true;
}

export function resolveEffectiveQualityOptions(
  dto: EvaluateQualityDto,
  intent: QuestionIntent,
): EvaluateQualityDto['options'] {
  const normalized = normalizeQualityOptions(dto.options);
  let options =
    normalized.criteria.length > 0
      ? dto.options
      : deriveDefaultCriteriaForIntent(intent, dto);

  if (
    intent === 'experience_narrative' &&
    helperAllowsBrevity(dto.helperText)
  ) {
    const base = { ...(options ?? {}) };
    const lengthBlock = readCriteriaBlock(base, 'length');
    if (lengthBlock?.enabled !== false) {
      base.length = { ...(lengthBlock ?? {}), enabled: false };
    }
    options = base;
  }

  return options;
}

function helperAllowsBrevity(helperText?: string): boolean {
  const h = (helperText ?? '').toLowerCase();
  return /\b(as much or as little|as little as|as much as you|optional|brief|short answer|few words)\b/i.test(
    h,
  );
}

function readCriteriaBlock(
  raw: EvaluateQualityDto['options'],
  id: QualityCriterionId,
): Record<string, unknown> | undefined {
  const top = raw?.[id];
  if (top && typeof top === 'object' && !Array.isArray(top)) {
    return top;
  }
  const nested = raw?.criteria;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const block = (nested as Record<string, unknown>)[id];
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      return block as Record<string, unknown>;
    }
  }
  return undefined;
}

export function normalizeQualityOptions(
  raw: EvaluateQualityDto['options'],
): NormalizedQualityOptions {
  const nestedIds: QualityCriterionId[] = [
    'length',
    'specificity',
    'relevance',
    'completeness',
  ];
  const enabledFromNested = nestedIds.filter((id) => {
    const block = readCriteriaBlock(raw, id);
    return block?.enabled === true;
  });

  const criteria =
    enabledFromNested.length > 0
      ? enabledFromNested
      : Array.isArray(raw?.criteria)
        ? raw.criteria.filter((c): c is QualityCriterionId =>
            nestedIds.includes(c as QualityCriterionId),
          )
        : [];

  const lengthOpts = readCriteriaBlock(raw, 'length') ?? {};
  const specificityOpts = readCriteriaBlock(raw, 'specificity') ?? {};
  const relevanceOpts = readCriteriaBlock(raw, 'relevance') ?? {};
  const completenessOpts = readCriteriaBlock(raw, 'completeness') ?? {};

  return {
    minWords: Number(lengthOpts.minWords ?? raw?.minWords ?? 10),
    sensitivity: (specificityOpts.sensitivity ??
      raw?.sensitivity ??
      'Medium') as 'Low' | 'Medium' | 'High',
    vagueWords:
      String(specificityOpts.vagueWords ?? raw?.vagueWords ?? '').trim() ||
      undefined,
    topicKeywords:
      String(
        relevanceOpts.keywords ??
          relevanceOpts.topicKeywords ??
          raw?.topicKeywords ??
          '',
      ).trim() || undefined,
    keywordThreshold: Number(
      relevanceOpts.matchThreshold ??
        relevanceOpts.keywordThreshold ??
        raw?.keywordThreshold ??
        1,
    ),
    criteria,
    completeness: {
      detectTrailing: completenessOpts.detectTrailing !== false,
      requiredSentences: Math.max(
        1,
        Number(completenessOpts.requiredSentences) || 1,
      ),
    },
  };
}

/** Detect vague praise, refusal, or filler on detail-oriented questions. */
export function isLowValueVerbose(
  text: string,
  questionText?: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const q = (questionText ?? '').toLowerCase();
  const detailIntent =
    /\b(detail|describe|experience|experiance|explain|specific|why|how|tell us|form|filling|feedback)\b/.test(
      q,
    );
  const experienceIntent = /\b(experience|form|filling|how is|how was)\b/.test(
    q,
  );
  const wc = wordCount(trimmed);
  const vagueOnly =
    /^(it'?s?\s+(good|fine|great|awesome|ok|okay)|really\s+(good|great|love)|going\s+awesome)/i.test(
      trimmed,
    ) && !CONCRETE_NOUNS.test(trimmed);
  const informalPraise =
    /\b(fun|bro|kinda|like it|not much|it'?s good|pretty good)\b/i.test(
      trimmed,
    ) && !CONCRETE_NOUNS.test(trimmed);
  if (detailIntent && wc < 15 && vagueOnly) return true;
  if (wc >= 8 && wc < 30 && vagueOnly) return true;
  if (experienceIntent && informalPraise) return true;
  if (
    /\bnot much\b/i.test(trimmed) &&
    /\b(good|fine|great|ok|okay)\b/i.test(trimmed)
  ) {
    return true;
  }
  if (
    /\b(don'?t|dont)\s+wanna|get out of here|not giving|won'?t answer|will\s+not\s+give|won'?t\s+give|not\s+give\s+that/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (
    /\b(don'?t|dont)\s+want\s+to\s+(write|give|answer|share)\b/i.test(
      trimmed,
    ) &&
    /\b(honest|synthetic|real)\s+answer/i.test(trimmed)
  ) {
    return true;
  }
  // Asking the form back instead of answering ("what should I write then?")
  // or a bare "I don't know" with no substance is a non-answer.
  if (
    /\bwhat\s+should\s+(i|we)?\s*(write|say|answer|put|type)\b/i.test(trimmed)
  ) {
    return true;
  }
  if (
    /(^|\b)(i\s+)?(don'?t|dont)\s+know\b/i.test(trimmed) &&
    !CONCRETE_NOUNS.test(trimmed) &&
    wc < 15
  ) {
    return true;
  }
  return false;
}
