/**
 * Hard-coded profanity / abuse tokens for live response-quality classification.
 * Used for detection only — never echoed verbatim in user-facing nudge copy.
 */

/** English slurs and vulgar terms (word-boundary matched after normalization). */
export const ENGLISH_PROFANITY_TOKENS = [
  'fuck',
  'fucking',
  'fucker',
  'fuckface',
  'fuckhead',
  'fuckwit',
  'shit',
  'shitty',
  'shithead',
  'shithole',
  'asshole',
  'bastard',
  'bitch',
  'bitches',
  'bitching',
  'cunt',
  'dick',
  'dickhead',
  'motherfucker',
  'whore',
  'fuc',
  'fuk',
  'fuq',
  'asshole',
] as const;

/** Hindi / Hinglish transliterated abuse (common on Indian forms). */
export const HINDI_TRANSLITERATED_PROFANITY = [
  'madarchod',
  'madharchod',
  'maadarchod',
  'bhosdike',
  'bhosdi',
  'chutiya',
  'chutiye',
  'behenchod',
  'bhenchod',
  'harami',
  'haramkhor',
  'randi',
  'suar',
  'suyar',
  'kutta',
  'kutte',
  'kamina',
  'gaandu',
  'gandu',
  'lund',
  'chodu',
  'mc',
  'bc',
] as const;

/** Tokens that are profanity only as whole words — avoid substring false positives. */
export const SAFE_SUBSTRING_ALLOWLIST = new Set([
  'assassin',
  'assassination',
  'scunthorpe',
  'classic',
  'passion',
  'assume',
  'bass',
  'compass',
]);

function collapseObfuscation(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@*0-9]/g, (ch) => {
      if (ch === '@' || ch === '4') return 'a';
      if (ch === '0') return 'o';
      if (ch === '1') return 'i';
      if (ch === '3') return 'e';
      if (ch === '5') return 's';
      if (ch === '*') return '';
      return ch;
    })
    .replace(/(.)\1{2,}/g, '$1$1');
}

function tokenizeForProfanity(text: string): string[] {
  const collapsed = collapseObfuscation(text);
  return collapsed
    .split(/[\s,.;:!?'"()[\]{}]+/)
    .map((t) => t.replace(/[^a-z]/g, ''))
    .filter((t) => t.length >= 2);
}

function matchesTokenList(tokens: string[], list: readonly string[]): boolean {
  const set = new Set(list);
  for (const token of tokens) {
    if (SAFE_SUBSTRING_ALLOWLIST.has(token)) continue;
    if (set.has(token)) return true;
  }
  return false;
}

/** Spaced-letter obfuscation: "f u c k" */
function hasSpacedProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, '');
  return (
    /\bf\s+u\s+c\s+k\b/.test(normalized) ||
    /\bs\s+h\s+i\s+t\b/.test(normalized) ||
    /\ba\s+s\s+s\s+h\s+o\s+l\s+e\b/.test(normalized)
  );
}

const ENGLISH_PROFANITY_REGEX =
  /\b(f+u+c+k+|fu+c|shit(?:ty|head|hole)?|asshole|ass\s*hole|bastard|bitch(?:es|ing)?|dumbf[u*]ck|cunt|dick(?:head)?|motherfucker?|wh[o0]re|d[i1]ck)\b/i;

const HINDI_PROFANITY_REGEX =
  /\b(madarchod|madharchod|maadarchod|bhosdike|bhosdi|chutiya|chutiye|behenchod|bhenchod|harami|haramkhor|randi|suar|suyar|kutta|kutte|kamina|gaandu|gandu|lund|chodu)\b/i;

export function containsProfanity(text: string): boolean {
  if (!text?.trim()) return false;
  if (ENGLISH_PROFANITY_REGEX.test(text)) return true;
  if (HINDI_PROFANITY_REGEX.test(text)) return true;
  if (hasSpacedProfanity(text)) return true;
  const tokens = tokenizeForProfanity(text);
  if (matchesTokenList(tokens, ENGLISH_PROFANITY_TOKENS)) return true;
  if (matchesTokenList(tokens, HINDI_TRANSLITERATED_PROFANITY)) return true;
  return false;
}
