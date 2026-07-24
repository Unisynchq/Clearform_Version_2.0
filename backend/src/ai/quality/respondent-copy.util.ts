import { normalizeCopy } from '../doctrine/copy.registry';

/** Respondent-facing copy hygiene — never expose builder/meta language. */

const OWNER_LEAK_PATTERN =
  /\b(the\s+)?(form\s+)?owner(\s+also|\s+wants|\s+needs)?\b/gi;

const META_GUIDANCE_LEAK =
  /\b(not generic|add more['"]|guidance_unverified|name what.?s still missing for this question)\b/i;

const INTERNAL_DENYLIST = [
  'form owner',
  'owner also wants',
  'owner wants',
  'owner needs',
];

const GENERIC_PERFECTION_DENYLIST = [
  'add more detail',
  'add more specific',
  'be more specific',
  'one concrete example',
  'provide more details',
];

const META_FOLLOWUP_LEAK =
  /\b(directly inform your understanding|inform your understanding or actions|how did your .+ inform|in what ways? has your experience shaped)\b/i;

const NAME_SALUTATION_LEAK = /^[A-Z][a-z]+(?:\s+[A-Z]\.?)?,\s+/;

const PARAPHRASE_GREEN_LEAK =
  /\b(great|good|nice)\s+(specific\s+)?(topic|idea|suggestion|direction)\b/i;

/** Leading "FirstName," or "First Last," from prior identity answers. */
export function isRespondentNameSalutation(message?: string): boolean {
  const m = (message ?? '').trim();
  if (!m) return false;
  return NAME_SALUTATION_LEAK.test(m);
}

/** Green copy that only restates their topic without coaching value. */
export function isParaphraseOnlyGreen(
  message: string,
  answerText: string,
): boolean {
  const msg = normalizeCopy(message);
  const ans = normalizeCopy(answerText);
  if (!msg || !ans || msg.length < 20) return false;
  if (PARAPHRASE_GREEN_LEAK.test(message)) return true;
  const msgTokens = msg.split(' ').filter((w) => w.length > 3);
  if (msgTokens.length < 4) return false;
  const ansSet = new Set(ans.split(' ').filter((w) => w.length > 3));
  let overlap = 0;
  for (const t of msgTokens) if (ansSet.has(t)) overlap += 1;
  const ratio = overlap / msgTokens.length;
  const addsCoaching =
    /\b(exactly|enough to continue|fits what|easy to act|answers this|no need to add)\b/i.test(
      message,
    );
  return ratio >= 0.55 && !addsCoaching;
}

/** Amber asks for topics/ideas already present in the answer. */
export function isRedundantTopicCoaching(
  message: string,
  answerText: string,
  questionText?: string,
): boolean {
  const q = (questionText ?? '').toLowerCase();
  if (!/\b(topic|explore|ideas?|further|anything else)\b/.test(q)) return false;
  const combined = `${message} ${answerText ?? ''}`.toLowerCase();
  if (/you mentioned/i.test(message) && combined.length > 0) {
    const ans = normalizeCopy(answerText);
    const msgCore = normalizeCopy(message.replace(/you mentioned/gi, ''));
    const ansTokens = ans.split(' ').filter((w) => w.length > 4);
    const hits = ansTokens.filter((w) => msgCore.includes(w));
    if (hits.length >= 2) return true;
  }
  if (
    /\bwhat specific\b/i.test(message) &&
    /\b(product|idea|topic|market|iot|dashboard)\b/i.test(answerText)
  ) {
    return true;
  }
  return false;
}

/** Academic/meta follow-ups that ignore form purpose — reject in grounding. */
export function isMetaFollowUpLeak(text?: string): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  return META_FOLLOWUP_LEAK.test(t);
}

/** Green-with-tip suggestions must be specific — not generic "add more detail". */
export function isPerfectionTip(suggestion: string): boolean {
  const s = suggestion.toLowerCase();
  if (GENERIC_PERFECTION_DENYLIST.some((p) => s.includes(p))) return false;
  return /\b(add|include|mention|name|expand|describe|share|perfect|complete|missing|impact|outcome|contribution|example|stat|number)\b/i.test(
    suggestion,
  );
}

export function isMetaGuidanceLeak(message?: string): boolean {
  const m = message ?? '';
  if (META_GUIDANCE_LEAK.test(m)) return true;
  return INTERNAL_DENYLIST.some((p) => m.toLowerCase().includes(p));
}

/** Strip builder-facing terms; rewrite common owner-leak patterns. */
export function sanitizeRespondentCopy(text: string): string {
  let out = text.trim();
  if (!out) return out;

  out = out.replace(NAME_SALUTATION_LEAK, '');
  out = out.replace(
    /\b(the\s+)?(form\s+)?owner\s+also\s+wants\s+to\s+know\b/gi,
    'The question also asks',
  );
  out = out.replace(
    /\b(the\s+)?(form\s+)?owner\s+(wants|needs)\s+(to\s+)?know\b/gi,
    'Also share',
  );
  out = out.replace(OWNER_LEAK_PATTERN, 'This question');
  out = out.replace(/\bform owner\b/gi, 'who reads this');
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}

/** Strip coaching prefixes so we never quote our own prior message as the excerpt. */
export function stripCoachingPrefix(text: string): string {
  return text
    .trim()
    .replace(/^[^\w]+/, '')
    .replace(/^you (said|mentioned)\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function isAlreadyAnswerAnchored(
  message: string,
  answer: string,
): boolean {
  const msg = message.trim();
  if (!msg) return false;
  if (!/^you (said|mentioned)\b/i.test(msg)) return false;
  const quoted = [...msg.matchAll(/"([^"]{2,60})"/g)].map((m) => m[1]);
  if (quoted.length === 0) return false;
  return quoted.some((q) => messageGroundedInAnswer(`"${q}"`, answer));
}

/** Quoted spans and file paths in feedback must appear in the answer. */
export function messageGroundedInAnswer(
  message: string,
  answer: string,
): boolean {
  const msg = message.toLowerCase();
  const ans = answer.toLowerCase();
  if (!ans.trim()) return true;

  const quoted = [...message.matchAll(/"([^"]{3,80})"/g)].map((m) =>
    m[1].toLowerCase(),
  );
  for (const q of quoted) {
    const words = q.split(/\s+/).filter((w) => w.length >= 3);
    if (words.length === 0) continue;
    const hits = words.filter((w) => ans.includes(w));
    if (hits.length / words.length < 0.5) return false;
  }

  const paths = [
    ...msg.matchAll(/\b[\w./-]+\.(py|ts|js|tsx|jsx|go|rb)\b/g),
  ].map((m) => m[0]);
  for (const path of paths) {
    const base = path.split('/').pop() ?? path;
    if (!ans.includes(path) && !ans.includes(base)) return false;
  }

  return true;
}
