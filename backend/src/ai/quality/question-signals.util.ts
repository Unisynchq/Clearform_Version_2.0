/** Shared question/answer signal helpers for response quality v2. */

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
  'super',
]);

const CONCRETE_NOUNS =
  /\b(form|question|step|screen|field|page|button|back|continue|because|when|feature|issue|problem|example|process|workflow|survey|feedback|response|answer|detail|reason|time|day|week|month|year|file|module|component|backend|frontend|api|database|server|endpoint|bug|error|fix|update|change|project|hackathon|main|config|deploy|test|code|\d+)\b/i;

const PROJECT_FIX_Q_PATTERN =
  /\b(correct|fix|change|update|specific thing|what to|make correct|in your project|hackathon|submit|artifact|module|file|bug|issue in)\b/i;

const ARTIFACT_DETAIL_PATTERN =
  /\b(\.[a-z]{2,4}\b|\/|\\|backend|frontend|main\.py|api|database|module|component|config|deploy|server|endpoint)\b/i;

const ACTION_VERB_PATTERN =
  /\b(change|fix|update|correct|broken|replace|refactor|implement|add|remove|improve|deploy|migrate|rewrite)\b/i;

const FEEDBACK_Q_PATTERN =
  /\b(improve|change|suggest|feedback|think|feel|experien|onboard|issue|problem|challenge|pain|better|different|wish|like|dislike|hate|love|rate|opinion|review|recommend|difficult|confus|frustrat|filling|survey|clearform)\b/i;

const FORM_META_EXPERIENCE_PATTERN =
  /\b(filling this form|using this form|this form|form builder|clearform|this survey|how is your|how was your|your experience)\b/i;

const BREVITY_HELPER_PATTERN =
  /\b(as much or as little|as little as|as much as you|optional|brief|short answer|few words)\b/i;

export function normalizeQuestionText(questionText?: string): string {
  return (questionText ?? '')
    .toLowerCase()
    .replace(/\bexperiance\b/g, 'experience')
    .replace(/\bexperien\b/g, 'experien');
}

/** Job-application / factual duration — not product or form-filling feedback. */
export function isProfessionalExperienceQuestion(questionText?: string): boolean {
  const q = normalizeQuestionText(questionText);
  if (!q.trim()) return false;
  if (/\b(how many|number of|years? of|months? of|yoe)\b/.test(q) && /\b(experience|exp)\b/.test(q)) {
    return true;
  }
  if (/\b(relevant|professional|work)\b.*\b(experience|exp)\b/.test(q)) return true;
  if (/\b(experience|exp)\b.*\b(in this category|in this field|in this role)\b/.test(q)) {
    return true;
  }
  return false;
}

export function isExperienceOrFeedbackQuestion(questionText?: string): boolean {
  const q = normalizeQuestionText(questionText);
  if (!q.trim()) return false;
  if (isProfessionalExperienceQuestion(questionText)) return false;
  if (FORM_META_EXPERIENCE_PATTERN.test(q)) return true;
  if (FEEDBACK_Q_PATTERN.test(q)) return true;
  return /\b(onboarding|describe your|how was|how did|how is|tell us about your)\b/.test(
    q,
  );
}

export function hasEvaluativeAnswerToken(text: string): boolean {
  const tokens = text
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);
  return tokens.some((t) => EVALUATIVE_TOKENS.has(t));
}

export function hasConcreteDetail(text: string): boolean {
  return CONCRETE_NOUNS.test(text) || ARTIFACT_DETAIL_PATTERN.test(text);
}

export function isProjectOrFixQuestion(questionText?: string): boolean {
  const q = normalizeQuestionText(questionText);
  if (!q.trim()) return false;
  return PROJECT_FIX_Q_PATTERN.test(q);
}

export function hasArtifactDetail(text: string): boolean {
  return ARTIFACT_DETAIL_PATTERN.test(text) || /\b[a-z0-9_-]+\.[a-z]{2,4}\b/i.test(text);
}

export function hasProjectActionDetail(text: string): boolean {
  return hasArtifactDetail(text) && ACTION_VERB_PATTERN.test(text);
}

export function helperAllowsBrevity(helperText?: string): boolean {
  const h = (helperText ?? '').toLowerCase();
  if (!h.trim()) return false;
  return BREVITY_HELPER_PATTERN.test(h);
}

const ANSWER_STOPWORDS = new Set([
  'what', 'how', 'your', 'the', 'with', 'this', 'that', 'was', 'were', 'are',
  'have', 'has', 'had', 'about', 'from', 'they', 'them', 'their', 'you', 'for',
]);

/** Meaningful phrase from the answer — first substantive sentence or clause, not random prefix words. */
export function extractAnswerExcerpt(text: string, maxWords = 6): string {
  const cleaned = text
    .trim()
    .replace(/^[^\w]+/, '')
    .replace(/^you (said|mentioned)\s+/i, '');
  if (!cleaned) return '';

  const skipFillers = (words: string[]) => {
    const fillers = new Set(['that', 'so', 'well', 'and', 'but', 'a', 'the']);
    let start = 0;
    while (start < words.length - 4 && fillers.has(words[start].toLowerCase())) {
      start += 1;
    }
    return words.slice(start);
  };

  const sentences = cleaned.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const words = skipFillers(sentence.split(/\s+/).filter(Boolean));
    if (words.length >= 4) {
      return words.slice(0, maxWords).join(' ');
    }
  }

  const commaClause = cleaned.split(',')[0]?.trim() ?? '';
  const clauseWords = skipFillers(commaClause.split(/\s+/).filter(Boolean));
  if (clauseWords.length >= 4) {
    return clauseWords.slice(0, maxWords).join(' ');
  }

  const words = skipFillers(cleaned.split(/\s+/).filter(Boolean));
  return words.slice(0, maxWords).join(' ');
}

/** Answer has enough content that generic "add more detail" is inappropriate. */
export function answerHasSubstance(text: string): boolean {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 14) return true;
  const clauses = trimmed.split(/[,;]/).filter((c) => c.trim().split(/\s+/).length >= 5);
  if (clauses.length >= 2) return true;
  return false;
}

function questionParts(questionText: string): string[] {
  return questionText
    .split(/[,?]|\s+\band\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length >= 10);
}

function partKeywords(part: string): string[] {
  return part
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !ANSWER_STOPWORDS.has(w));
}

/** True when enough question keywords appear in the answer (generic overlap). */
export function answerRelatesToQuestionPart(answer: string, questionPart: string): boolean {
  const keywords = partKeywords(questionPart);
  if (keywords.length === 0) return true;
  const lower = answer.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k));
  return hits.length >= Math.max(1, Math.ceil(keywords.length * 0.2));
}

/**
 * For multi-part questions, return the first question segment not reflected in the answer.
 * Returns null when all parts appear covered or the question is single-part.
 */
export function inferMissingQuestionAspect(
  questionText: string,
  answer: string,
): string | null {
  const parts = questionParts(questionText);
  if (parts.length < 2) return null;
  for (const part of parts) {
    if (!answerRelatesToQuestionPart(answer, part)) {
      return part.replace(/\*+$/, '').trim().slice(0, 72);
    }
  }
  return null;
}

export function questionAsksLikedMost(questionText?: string): boolean {
  return /\b(what you like|liked most|like the most|favorite|best part)\b/i.test(
    questionText ?? '',
  );
}

/** Generic: answer expresses liking/enjoyment (no domain word lists). */
export function answerNamesWhatLiked(text: string): boolean {
  return /\b(like|liked|enjoy|favorite|best part|love)\w*/i.test(text);
}

export function isEvaluativeExperienceAnswer(
  text: string,
  questionText?: string,
  helperText?: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!isExperienceOrFeedbackQuestion(questionText)) return false;
  if (!hasEvaluativeAnswerToken(trimmed)) return false;
  if (helperAllowsBrevity(helperText)) return true;
  return trimmed.split(/\s+/).filter(Boolean).length <= 12;
}

const EXAMPLE_CUE_PATTERN =
  /\b(for example|for instance|such as|one example|example would|specific example|specific issue|due to|because|power issues?|issue with|issue where|could not|couldn't|objection|regarding|complaint|problem with)\b/i;

const MEASURABLE_STATS_PATTERN =
  /\b\d+\s*(%|percent|students|users|people|wpm|ms|sec|seconds|minutes|hours|days|weeks|months|years)\b|\b\d{2,}\+?\b/i;

/** Answer already contains an example or causal detail — do not ask for "one concrete example". */
export function hasExampleCue(text: string): boolean {
  return EXAMPLE_CUE_PATTERN.test(text);
}

/** Answer includes numbers tied to outcomes (stats, counts, metrics). */
export function hasMeasurableStats(text: string): boolean {
  return MEASURABLE_STATS_PATTERN.test(text);
}

/**
 * Detect phrase stutter loops (e.g. "working with working with working").
 * Scans the full answer and the tail so stutter at the end of long text still flags.
 */
export function hasPhraseStutter(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (detectPhraseStutterInSegment(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 12) {
    const tail = words.slice(-16).join(' ');
    if (detectPhraseStutterInSegment(tail)) return true;
  }
  return false;
}

function detectPhraseStutterInSegment(text: string): boolean {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);
  if (words.length < 5) return false;

  // Alternating stutter: "working with working with working"
  const joined = words.join(' ');
  if (
    /\b(\w{3,})\s+(?:with|on|in|and|or)\s+\1\s+(?:with|on|in|and|or)\s+\1\b/.test(
      joined,
    )
  ) {
    return true;
  }

  for (let n = 2; n <= 4; n++) {
    for (let i = 0; i <= words.length - n * 3; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      let reps = 1;
      let pos = i + n;
      while (
        pos + n <= words.length &&
        words.slice(pos, pos + n).join(' ') === phrase
      ) {
        reps += 1;
        pos += n;
      }
      if (reps >= 3) return true;
    }
  }

  const tallies = new Map<string, number>();
  for (const w of words) {
    if (w.length < 3) continue;
    tallies.set(w, (tallies.get(w) ?? 0) + 1);
  }
  const maxRepeat = Math.max(0, ...tallies.values());
  if (maxRepeat >= 3 && new Set(words).size / words.length < 0.65) {
    return true;
  }

  return false;
}
