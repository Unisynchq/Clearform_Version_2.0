/** Filter junk owner directives before improve-instructions or respondent copy. */

const GUIDANCE_STOPWORDS = new Set([
  'answer',
  'answers',
  'answered',
  'question',
  'questions',
  'context',
  'better',
  'good',
  'great',
  'proper',
  'nice',
  'quality',
  'with',
  'this',
  'that',
  'these',
  'those',
  'they',
  'them',
  'their',
  'your',
  'yours',
  'you',
  'please',
  'respond',
  'response',
  'responses',
  'respondent',
  'respondents',
  'write',
  'given',
  'giving',
  'give',
  'provide',
  'providing',
  'provided',
  'details',
  'detail',
  'detailed',
  'specific',
  'specifically',
  'want',
  'wants',
  'wanted',
  'need',
  'needs',
  'needed',
  'will',
  'would',
  'should',
  'must',
  'have',
  'about',
  'more',
  'some',
  'what',
  'when',
  'where',
  'which',
  'asked',
  'asks',
  'asking',
  'from',
  'then',
  'than',
  'also',
  'just',
  'like',
  'make',
  'made',
  'being',
  'been',
  'clear',
  'clearly',
  'issue',
  'issues',
  'thing',
  'things',
]);

/** Words that carry topic meaning — lowercased, ≥4 chars, stopwords removed. */
export function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !GUIDANCE_STOPWORDS.has(w));
}

/** True when the clause names something concrete a respondent can act on. */
export function isSubstantiveGuidanceClause(clause: string): boolean {
  if (clause.trim().length < 12) return false;
  return contentWords(clause).length > 0;
}
