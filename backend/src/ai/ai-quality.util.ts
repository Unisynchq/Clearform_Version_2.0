import type { FormContext } from './form-context.types';
import { pickCopy } from './doctrine/copy.registry';
import type { EvaluateQualityDto, NormalizedQualityOptions, QualityResult } from './ai.service.types';
import type { QualityViolationKind } from './ai-quality-rules.util';
import {
  normalizeQualityOptions,
  resolveEffectiveQualityOptions,
} from './ai-quality-rules.util';
import { interpretMetricsForIntent } from './question-intent/metric-interpreter';
import type { QuestionIntent } from './question-intent/question-intent.types';
import {
  buildDefaultOwnerPromptForQuestion,
  deriveFacetsFromHelper,
} from './quality/default-owner-quality-prompt';
import { isPerfectionTip } from './quality/respondent-copy.util';
import {
  isMetaFollowUpLeak,
  sanitizeRespondentCopy,
} from './quality/respondent-copy.util';

export { buildDefaultOwnerPromptForQuestion, deriveFacetsFromHelper } from './quality/default-owner-quality-prompt';

export { normalizeQualityOptions } from './ai-quality-rules.util';
export type { NormalizedQualityOptions } from './ai.service.types';

export function qualityLevelToScore(level: QualityResult['level']): number {
  if (level === 'green') return 88;
  if (level === 'amber') return 58;
  return 28;
}

/** Sanitize LLM output and cap suggestion count — no TypeScript rewrites of coaching copy. */
export function finalizeQualityResult(
  result: QualityResult,
  dto: EvaluateQualityDto,
  _context: FormContext | null,
  tier: 'free' | 'pro' = 'free',
  intent: QuestionIntent = 'generic',
): QualityResult {
  const effectiveOptions = resolveEffectiveQualityOptions(dto, intent);
  const parsed = { ...result };
  if (/not configured/i.test(parsed.message ?? '')) {
    parsed.level = 'amber';
    parsed.message = pickCopy('amber.not_configured', {
      seed: `${dto.questionText ?? ''}:${dto.text ?? dto.answerText ?? ''}`,
    });
    parsed.failedIds = parsed.failedIds?.length ? parsed.failedIds : ['completeness'];
    parsed.followUpQuestion = null;
  }
  // Gemini (and others) often mark amber/red correctly but omit failedIds.
  // Soft-fill so grounding does not fail-closed as "coaching stopped".
  if (
    (parsed.level === 'amber' || parsed.level === 'red') &&
    (!Array.isArray(parsed.failedIds) || parsed.failedIds.length === 0)
  ) {
    parsed.failedIds = ['relevance'];
  }
  if (parsed.level === 'green') {
    parsed.failedIds = [];
  }
  const minWords = normalizeQualityOptions(effectiveOptions).minWords;
  if (!parsed.suggestions?.length && parsed.failedIds.length > 0) {
    parsed.suggestions = buildSuggestionsFromContext(
      parsed.failedIds,
      dto,
      minWords,
      intent,
    );
  }
  if (parsed.level === 'green') {
    const tips = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s) => typeof s === 'string' && s.trim())
      : [];
    parsed.suggestions =
      tips.length === 1 && isPerfectionTip(tips[0]) ? [tips[0].trim()] : [];
    parsed.followUpQuestion = null;
  }
  if (tier === 'pro' && parsed.suggestions && parsed.suggestions.length > 1) {
    parsed.suggestions = parsed.suggestions.slice(0, 2);
  } else if (parsed.suggestions?.length) {
    parsed.suggestions = parsed.suggestions.slice(0, 1);
  }
  parsed.message = sanitizeRespondentCopy(parsed.message ?? '');
  if (parsed.suggestions?.length) {
    parsed.suggestions = parsed.suggestions.map((s) => sanitizeRespondentCopy(s));
  }
  if (
    parsed.followUpQuestion &&
    isMetaFollowUpLeak(parsed.followUpQuestion)
  ) {
    parsed.followUpQuestion = null;
  }
  return parsed;
}

export function buildSuggestionsFromContext(
  failedIds: string[],
  dto: EvaluateQualityDto,
  minWords: number,
  intent: QuestionIntent = 'generic',
): string[] {
  const suggestions: string[] = [];
  const q = dto.questionText ?? 'this question';

  if (failedIds.includes('specificity')) {
    suggestions.push(
      intent === 'achievement'
        ? 'Name the project or outcome and your specific role.'
        : 'Replace vague words with concrete details about what happened.',
    );
  }
  if (failedIds.includes('length')) {
    if (intent !== 'identity' && intent !== 'factual_short' && intent !== 'yes_no') {
      suggestions.push(
        `Add at least ${minWords} words that directly answer: "${q.slice(0, 80)}".`,
      );
    }
  }
  if (failedIds.includes('relevance')) {
    suggestions.push(
      intent === 'identity'
        ? 'Enter your real name — not a greeting or random text.'
        : 'Tie your answer to what the question is asking — stay on topic.',
    );
  }
  if (failedIds.includes('completeness')) {
    suggestions.push(
      intent === 'identity'
        ? 'Use your full name (first and last) if the question asks for it.'
        : 'Finish your thought in a complete sentence.',
    );
  }

  return suggestions.slice(0, 2);
}

export function parseQualityJson(content: string): QualityResult | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as QualityResult & { followUpQuestion?: string | null };
    if (!['green', 'amber', 'red'].includes(parsed.level)) return null;
    const failedIds = Array.isArray(parsed.failedIds) ? parsed.failedIds : [];
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s) => typeof s === 'string').slice(0, 2)
      : undefined;
    const followUpQuestion =
      parsed.level !== 'green' && typeof parsed.followUpQuestion === 'string' && parsed.followUpQuestion.trim()
        ? parsed.followUpQuestion.trim()
        : null;
    return {
      level: parsed.level,
      message: parsed.message ?? 'Please improve your answer.',
      failedIds,
      suggestions,
      followUpQuestion,
    };
  } catch {
    return null;
  }
}

export type ViolationContextInput = {
  violationKind: QualityViolationKind;
  levelHint: QualityResult['level'];
  failedIds: string[];
  repeatViolation?: boolean;
};

/** Pre-LLM violation signal — doctrine in system prompt decides the coaching copy. */
export function buildViolationContextBlock(ctx: ViolationContextInput): string {
  if (ctx.violationKind === 'none') return '';
  return (
    `\n\n[DETECTED SIGNAL — apply signals/red.md and tasks/response-quality-nudges.md]\n` +
    `violationKind: ${ctx.violationKind}\n` +
    `levelHint: ${ctx.levelHint}\n` +
    `failedIds: ${ctx.failedIds.join(', ')}\n` +
    (ctx.repeatViolation ? `repeatInSession: true\n` : '') +
    `Write contextual coaching for this answer. Return JSON only.`
  );
}

export function buildDefaultOwnerInstructions(
  dto: EvaluateQualityDto,
  intent: QuestionIntent = 'generic',
): string {
  return buildDefaultOwnerPromptForQuestion(dto.questionText, dto.helperText);
}

function buildOwnerInstructionsBlock(
  dto: EvaluateQualityDto,
  context: FormContext | null,
  intent: QuestionIntent,
): string {
  const custom = dto.customInstructions?.trim();
  const base =
    custom || buildDefaultOwnerInstructions(dto, intent);
  const purpose = (dto.formPurpose ?? context?.purpose ?? '').trim();
  const helper = (dto.helperText ?? '').trim();
  const parts = [base];
  if (purpose) {
    parts.push(
      `\n[Why this form exists — every answer should be useful for this]\n${purpose}`,
    );
  }
  if (helper) {
    parts.push(
      `\n[Helper text shown to the respondent — honor over generic length rules]\n${helper}`,
    );
  }
  return parts.join('\n');
}

function formatConversationHistory(
  history: EvaluateQualityDto['conversationHistory'],
): string {
  if (!history?.length) return '';
  const lines: string[] = [];
  const identityNames: string[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const q = history[i];
    const a = history[i + 1];
    if (q?.role === 'ai' && q.content?.trim()) {
      const qText = q.content.trim();
      lines.push(`Prior question: ${qText}`);
      if (/\b(name|full name|first name|last name|your name)\b/i.test(qText)) {
        const ans = a?.content?.trim();
        if (ans && ans.length >= 2 && ans.length <= 80) {
          identityNames.push(ans);
        }
      }
    }
    if (a?.role === 'user' && a.content?.trim()) {
      lines.push(`Their answer: ${a.content.trim().slice(0, 400)}`);
    }
  }
  const historyBlock = lines.length
    ? `\n[Prior answers on this form — do not re-ask what they already gave]\n${lines.join('\n')}\n`
    : '';
  const nameBlock =
    identityNames.length > 0
      ? `\n[Do not address the respondent by these names or usernames in coaching — use "you" only]\n${identityNames.map((n) => `- ${n}`).join('\n')}\n`
      : '';
  return historyBlock + nameBlock;
}

export function buildEvalPromptFromContext(
  dto: EvaluateQualityDto,
  normalized: NormalizedQualityOptions,
  context: FormContext | null,
  memoryContext?: string,
  intent: QuestionIntent = 'generic',
  intentDoctrine?: string,
): string {
  const text = dto.text ?? dto.answerText ?? '';
  const { criteria, minWords } = normalized;
  const metricRubric = interpretMetricsForIntent(
    intent,
    normalized.criteria,
    intentDoctrine,
  );
  const ownerInstructions = buildOwnerInstructionsBlock(dto, context, intent);
  const facets =
    dto.facetsRequested?.length
      ? dto.facetsRequested
      : deriveFacetsFromHelper(dto.helperText, dto.questionText);
  const answerCharCount = dto.answerCharCount ?? text.length;
  const maxChars = dto.maxChars;
  const formMap =
    context?.allQuestions?.length
      ? context.allQuestions
          .map(
            (q) =>
              `- [${q.screenId}] ${q.label}${q.helperText ? ` (helper: ${q.helperText})` : ''}`,
          )
          .join('\n')
      : '';

  const resolvedTitle = dto.formTitle ?? context?.title;
  const resolvedPurpose = dto.formPurpose ?? context?.purpose;
  const resolvedArchetype = context?.archetype && context.archetype !== 'generic' ? context.archetype : null;

  return (
    `[FORM OWNER'S INSTRUCTIONS — HIGHEST AUTHORITY]\n` +
    `${ownerInstructions}\n` +
    `These instructions override the numeric criteria and defaults below whenever they conflict. ` +
    `Exception: profanity, hostility, gibberish, and personal-data-abuse checks always apply.\n` +
    `Judge adequacy against these instructions: list the facets they ask for, and when the ` +
    `answer covers only some of them, return amber with a suggestion naming the missing ` +
    `facets in plain language — never generic "too brief" copy and never quote these ` +
    `instructions back to the respondent.\n\n` +
    `[Form intent — highest priority context]\n` +
    (resolvedTitle ? `formTitle: ${resolvedTitle}\n` : '') +
    (resolvedPurpose ? `formPurpose: ${resolvedPurpose}\n` : '') +
    (resolvedArchetype ? `archetype: ${resolvedArchetype}\n` : '') +
    (context?.audienceLabel
      ? `audienceLabel: ${context.audienceLabel}\n`
      : '') +
    (formMap ? `\n[Form map — all questions in this form]\n${formMap}\n` : '') +
    (dto.logicSummary
      ? `\n[Form logic — how screens branch]\n${dto.logicSummary}\n`
      : '') +
    (dto.nextScreenLabels?.length
      ? `upcomingQuestions: ${dto.nextScreenLabels.slice(0, 3).join(', ')}\n`
      : '') +
    `\n[This question — being evaluated now]\n` +
    `questionText: ${dto.questionText ?? '(not provided)'}\n` +
    `helperText: ${dto.helperText ?? '(none)'}\n` +
    (context?.currentScreenId != null
      ? `currentScreenId: ${context.currentScreenId}\n`
      : '') +
    `\n[Metric interpretation for this question type]\n` +
    `${metricRubric}\n` +
    `\n[Default criteria — apply only where the owner's instructions and the question itself don't say otherwise]\n` +
    `criteria: ${
      criteria.length
        ? criteria.join(', ')
        : `use ${intent} intent defaults (never tell the respondent checks are "not configured")`
    }\n` +
    `minWords: ${minWords}\n` +
    (normalized.vagueWords ? `vagueWords: ${normalized.vagueWords}\n` : '') +
    (normalized.topicKeywords
      ? `topicKeywords: ${normalized.topicKeywords}\n`
      : '') +
    (dto.informationRequirements?.length
      ? `informationRequirements: ${dto.informationRequirements.join(', ')}\n`
      : '') +
    (memoryContext
      ? `\n[Form memory — learned patterns for this form]\n${memoryContext}\n`
      : '') +
    (dto.conversationHistory?.length
      ? formatConversationHistory(dto.conversationHistory)
      : '') +
    (facets.length
      ? `\n[Facets a complete answer should cover]\n${facets.map((f) => `- ${f}`).join('\n')}\n` +
        `If at least 2 of ${facets.length} facets are present, return green with failedIds [] and ` +
        `one suggestions[] item naming the missing facet (perfection tip only).\n`
      : '') +
    (maxChars != null && maxChars > 0
      ? `\n[Character limit]\nmaxChars: ${maxChars}\nanswerCharCount: ${answerCharCount}\n` +
        `When answerCharCount/maxChars >= 0.85 and the answer is substantive, do not ask for more length — ` +
        `use green-with-tip if 2/3 facets are met.\n`
      : '') +
    `\n[Read before you score]\n` +
    `Read the ENTIRE answerText below before choosing level or writing copy. ` +
    `Identify what the respondent already stated. If the question has two parts (comma / "and"), ` +
    `check each part — never use generic "anchor to one real thing" when they already named ` +
    `venue, food, files, routes, or other concrete details. ` +
    `Only mark amber when you can name which part of the question is still unanswered — ` +
    `never say "add more detail" when the answer already has multiple ideas (separate sentences or clauses). ` +
    `Quote a meaningful phrase from their answer, not random prefix words.\n` +
    `\n[Respondent's current answer]\n` +
    `answerText: ${text}`
  );
}
