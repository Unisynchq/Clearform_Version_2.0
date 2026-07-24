import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiTierService } from '../ai-tier.service';
import { LlmGatewayService } from '../llm-gateway.service';
import { DoctrineRegistry } from '../doctrine/doctrine.registry';
import { FormContextService } from '../form-context.service';
import type { FormContext } from '../form-context.types';
import { QuestionIntentService } from '../question-intent/question-intent.service';
import type { QuestionIntent } from '../question-intent/question-intent.types';
import { buildDefaultOwnerPromptForQuestion } from './default-owner-quality-prompt';
import { buildLogicSummary } from './logic-summary.util';
import {
  contentWords,
  isSubstantiveGuidanceClause,
} from './guidance-clause.util';
import { aiServiceUnavailable } from '../errors/ai-service-unavailable.error';

const MAX_INSTRUCTIONS_LENGTH = 600;

export type ImproveInstructionsDto = {
  screenId?: string;
  fieldId?: string;
  questionText?: string;
  helperText?: string;
  draftInstructions?: string;
};

export type ImproveInstructionsResult = {
  customInstructions: string;
  meta: {
    source: 'llm' | 'contextual_fallback';
    model?: string;
    reason?: string;
  };
};

function readImproveDoctrine(
  registry: DoctrineRegistry,
  intent: QuestionIntent,
): string {
  return registry.getDoctrineSlim('improve-instructions', intent);
}

function buildImproveUserPrompt(
  doctrine: string,
  dto: ImproveInstructionsDto,
  context: FormContext,
  effectiveDraft: string,
  intent: QuestionIntent,
): string {
  const snapshot =
    context.snapshot && typeof context.snapshot === 'object'
      ? (context.snapshot as Record<string, unknown>)
      : null;
  const screens = (snapshot?.screens as Record<string, unknown>[]) ?? [];
  const logicSummary =
    snapshot && screens.length
      ? buildLogicSummary(snapshot, screens)
      : undefined;
  const formMap = context.allQuestions?.length
    ? context.allQuestions
        .map(
          (q) =>
            `- [${q.screenId}] ${q.label}${q.helperText ? ` (helper: ${q.helperText})` : ''}`,
        )
        .join('\n')
    : '';
  const screenCtx = context.screens[0];
  const questionText =
    dto.questionText?.trim() || screenCtx?.label || '(not provided)';
  const helperText = dto.helperText?.trim() || '(none)';

  return (
    `${doctrine ? `${doctrine}\n\n---\n\n` : ''}` +
    `[Form context]\n` +
    (context.title ? `formTitle: ${context.title}\n` : '') +
    (context.purpose ? `formPurpose: ${context.purpose}\n` : '') +
    (context.archetype && context.archetype !== 'generic'
      ? `archetype: ${context.archetype}\n`
      : '') +
    (formMap ? `\n[All questions in this form]\n${formMap}\n` : '') +
    (logicSummary ? `\n[Form logic]\n${logicSummary}\n` : '') +
    `\n[This question — owner is editing guidance for]\n` +
    `questionText: ${questionText}\n` +
    `helperText: ${helperText}\n` +
    `questionIntent: ${intent}\n` +
    // Only the owner's current draft is authoritative — a previously-saved
    // customInstructions value was deliberately dropped from this prompt.
    // Including it as extra "savedGuidance" context caused the model to
    // anchor on the old saved text and repeat it near-verbatim no matter
    // what the owner typed next, since the doctrine never says which of
    // the two inputs should win.
    `draftInstructions: ${effectiveDraft.slice(0, 800)}\n`
  );
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:'"()]/g, '')
    .trim();
}

/** True when two instruction strings are effectively unchanged for the owner. */
export function isSubstantiallySameInstructions(a: string, b: string): boolean {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const longer = left.length >= right.length ? left : right;
  const shorter = left.length < right.length ? left : right;
  return longer.includes(shorter) && shorter.length / longer.length > 0.88;
}

function extractScoringClause(template: string): string {
  const match = template.match(/green when[\s\S]*/i);
  if (match) return match[0].trim();
  return (
    'Green when on-topic with useful detail; amber when thin but on-topic; ' +
    'red for gibberish, repetition, or off-topic.'
  );
}

function distillOwnerIntent(draft: string): string {
  let intent = draft.trim().replace(/\s+/g, ' ');
  intent = intent
    .replace(/^i\s+want\s+(responses?( to this question)? that\s+)?/i, '')
    .replace(/^i\s+would\s+prefer\s+/i, '')
    .replace(/^i\s+prefer\s+/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  return (
    intent ||
    draft
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.!?]+$/, '')
  );
}

/**
 * The generic fallback template's green clause — question-agnostic by
 * construction, so an LLM echoing it has produced boilerplate. Narrower
 * fragments like "amber when thin" appear in legitimate grounded directives
 * (the doctrine's own examples use them) and must not be flagged alone.
 */
const CANNED_GENERIC_GREEN =
  /green when (they('re| are) )?on-?topic with useful detail/i;

/** Empty phrases banned by tasks/improve-instructions.md rules 6 and 11. */
const BANNED_FLUFF_PATTERNS = [
  /\bconcrete details? and relevant information\b/i,
  /\bmore substance and clarity\b/i,
  /\bspecific,? relevant detail\b/i,
  /\brelevant information\b/i,
] as const;

/** Any Green/Amber/Red scoring clause — grounded or not. */
const SCORING_LANGUAGE_PATTERNS = [
  /green when\b/i,
  /amber when\b/i,
  /red (for|when)\b/i,
] as const;

/**
 * True when LLM output is generic boilerplate — text that would read the same
 * on a different question (tasks/improve-instructions.md rule 11). Conservative:
 * only template echoes and question-agnostic scoring clauses are flagged.
 */
export function isBoilerplateInstructions(
  text: string,
  questionText?: string,
  helperText?: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (CANNED_GENERIC_GREEN.test(trimmed)) return true;
  if (BANNED_FLUFF_PATTERNS.some((p) => p.test(trimmed))) return true;

  // Scoring language that never touches the question's own topic words.
  if (SCORING_LANGUAGE_PATTERNS.some((p) => p.test(trimmed))) {
    const questionWords = new Set(
      contentWords(`${questionText ?? ''} ${helperText ?? ''}`),
    );
    if (questionWords.size >= 2) {
      const sharesTopic = contentWords(trimmed).some((w) =>
        questionWords.has(w),
      );
      const quotesQuestion = questionText
        ? trimmed
            .toLowerCase()
            .includes(questionText.trim().toLowerCase().slice(0, 40))
        : false;
      if (!sharesTopic && !quotesQuestion) return true;
    }
  }
  return false;
}

/**
 * Question-aware polish when the LLM is unavailable or returns unusable output.
 * Always weaves owner intent with green/amber/red scoring tied to the question.
 */
export function contextualImproveInstructions(
  draft: string,
  questionText?: string,
  helperText?: string,
  intent?: QuestionIntent,
): string {
  const template = buildDefaultOwnerPromptForQuestion(
    questionText,
    helperText,
    intent,
  );
  const normalized = draft.trim().replace(/\s+/g, ' ');
  const qLower = (questionText ?? '').toLowerCase();
  const isErrorAsk = /\b(error|stack|log|exception|message|crash|5\d\d)\b/.test(
    qLower,
  );

  // Owner drafts that ignore an error/log question must not overwrite the
  // question-derived template with unrelated taste/product preferences.
  if (isErrorAsk) {
    const draftLooksOffTopic =
      /\b(taste|sweet|looks?|apple|fruit|liked most|favorite)\b/i.test(
        normalized,
      ) &&
      !/\b(error|stack|log|exception|crash|5\d\d|4\d\d)\b/i.test(normalized);
    if (!normalized || draftLooksOffTopic) {
      return (
        `For "${(questionText ?? 'this question').trim().slice(0, 90)}": ` +
        `require the exact error text, or if none a plain explanation plus which page/step failed. ` +
        `Green when they paste a real error or name error code with context. ` +
        `Amber when they only say something broke. Red for gibberish, refusal, or off-topic. ` +
        `Never ask for favorites or unrelated opinions.`
      ).slice(0, MAX_INSTRUCTIONS_LENGTH);
    }
  }

  if (!normalized) return template;

  const question = (questionText ?? 'this question').trim().slice(0, 90);
  const ownerIntent = distillOwnerIntent(normalized);
  if (!isSubstantiveGuidanceClause(ownerIntent)) return template;
  const scoring = extractScoringClause(template);
  const merged = `For "${question}": ${ownerIntent}. ${scoring.charAt(0).toUpperCase()}${scoring.slice(1)}`;

  let result = merged.slice(0, MAX_INSTRUCTIONS_LENGTH);
  if (isSubstantiallySameInstructions(result, normalized)) {
    result =
      `${merged} Quote their exact words when nudging; never repeat what they already wrote.`.slice(
        0,
        MAX_INSTRUCTIONS_LENGTH,
      );
  }
  return result;
}

function parseImproveJson(content: string): string | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const match = candidate.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as { customInstructions?: string };
      if (typeof parsed.customInstructions === 'string') {
        const text = parsed.customInstructions.trim();
        return text ? text.slice(0, MAX_INSTRUCTIONS_LENGTH) : null;
      }
    } catch {
      // fall through to plain-text parse
    }
  }
  // A candidate that looks like it was trying to be JSON (starts with `{` or
  // names the "customInstructions" key) but didn't parse above is truncated
  // or malformed output — never surface that raw JSON debris as if it were
  // the polished instructions text.
  if (/^\{/.test(candidate) || /customInstructions/i.test(candidate)) {
    return null;
  }
  const plain = candidate.replace(/^["']|["']$/g, '').trim();
  if (plain.length >= 20 && plain.length <= MAX_INSTRUCTIONS_LENGTH) {
    return plain;
  }
  return null;
}

@Injectable()
export class ImproveInstructionsService {
  private readonly logger = new Logger(ImproveInstructionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmGatewayService,
    private readonly aiTier: AiTierService,
    private readonly doctrine: DoctrineRegistry,
    private readonly formContext: FormContextService,
    private readonly questionIntent: QuestionIntentService,
  ) {}

  async improveForOwner(
    formId: string,
    userId: string,
    dto: ImproveInstructionsDto,
  ): Promise<ImproveInstructionsResult> {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      select: { id: true },
    });
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const draft = (dto.draftInstructions ?? '').trim();
    const tier = await this.aiTier.resolveTierForFormOwner(formId);
    const context = await this.formContext.buildForQualityOnly(
      formId,
      dto.screenId,
      { preferBuilderSnapshot: true },
    );
    // Empty answer text keeps classify() heuristic-only (no LLM latency) and
    // shares the live pipeline's Redis intent cache for this screen.
    const intent = await this.questionIntent.classify(
      {
        screenId: dto.screenId ?? 'anon',
        fieldId: dto.fieldId ?? 'anon',
        questionText: dto.questionText,
        helperText: dto.helperText,
        text: '',
      },
      context,
      tier,
    );
    const effectiveDraft =
      draft ||
      buildDefaultOwnerPromptForQuestion(
        dto.questionText,
        dto.helperText,
        intent,
      );

    const doctrine = readImproveDoctrine(this.doctrine, intent);
    const userPrompt = buildImproveUserPrompt(
      doctrine,
      dto,
      context,
      effectiveDraft,
      intent,
    );

    if (!this.llm.isConfigured()) {
      throw aiServiceUnavailable(
        'llm_not_configured',
        'AI instruction improvement is temporarily unavailable.',
      );
    }

    const systemMessage = {
      role: 'system' as const,
      content:
        'You polish form-owner guidance for response-quality evaluation. ' +
        'Use the Green/Amber/Red signal doctrine in the user message. ' +
        'Ground every criterion in THIS questionText and formPurpose — never invent "liked most" or event criteria unless the question asks. ' +
        'Return JSON only: {"customInstructions":"..."}',
    };
    const timeoutMs = tier === 'pro' ? 12_000 : 10_000;
    // Per-attempt timeout stays tight; the wider deadline lets slow free
    // models retry and still land inside the FE 30s cap.
    const deadlineMs = tier === 'pro' ? 20_000 : 22_000;
    const startedAt = Date.now();
    let fallbackReason: string | undefined;

    try {
      const content = await this.llm.completion({
        task: 'fast',
        tier,
        formId,
        ownerUserId: userId,
        messages: [systemMessage, { role: 'user', content: userPrompt }],
        maxTokens: tier === 'pro' ? 500 : 400,
        temperature: 0.35,
        jsonMode: true,
        timeoutMs,
        deadlineMs,
        maxFallbackModels: 2,
      });
      let improved = parseImproveJson(content ?? '');
      if (
        improved &&
        isBoilerplateInstructions(improved, dto.questionText, dto.helperText)
      ) {
        fallbackReason = 'llm_boilerplate';
        // One corrective retry, only while there is real budget left.
        if (Date.now() - startedAt < 14_000) {
          const retryContent = await this.llm.completion({
            task: 'fast',
            tier,
            formId,
            ownerUserId: userId,
            messages: [
              systemMessage,
              {
                role: 'user',
                content:
                  `${userPrompt}\n[Corrective retry]\n` +
                  `Your previous output was generic boilerplate: "${improved}". ` +
                  'Rewrite it grounded in this exact questionText and formPurpose — ' +
                  'name something only this question implies. Return JSON only.',
              },
            ],
            maxTokens: tier === 'pro' ? 500 : 400,
            temperature: 0.35,
            jsonMode: true,
            timeoutMs,
            deadlineMs: Math.max(4_000, deadlineMs - (Date.now() - startedAt)),
            maxFallbackModels: 1,
          });
          const retried = parseImproveJson(retryContent ?? '');
          if (
            retried &&
            !isBoilerplateInstructions(
              retried,
              dto.questionText,
              dto.helperText,
            )
          ) {
            improved = retried;
            fallbackReason = undefined;
          } else {
            improved = null;
          }
        } else {
          improved = null;
        }
      }
      if (
        improved &&
        !isSubstantiallySameInstructions(improved, effectiveDraft)
      ) {
        return {
          customInstructions: improved,
          meta: { source: 'llm', model: 'gateway' },
        };
      }
      if (improved) {
        this.logger.warn(
          'Improve instructions LLM returned text too similar to draft',
        );
      } else if (content) {
        this.logger.warn(
          fallbackReason === 'llm_boilerplate'
            ? 'Improve instructions LLM returned boilerplate output twice'
            : 'Improve instructions LLM returned unparseable content',
        );
      }
    } catch (err) {
      this.logger.warn(
        `Improve instructions LLM failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Never fail-closed for free/pro — question-aware polish always works offline.
    const fallback = contextualImproveInstructions(
      effectiveDraft,
      dto.questionText,
      dto.helperText,
      intent,
    );
    return {
      customInstructions: fallback,
      meta: {
        source: 'contextual_fallback',
        ...(fallbackReason ? { reason: fallbackReason } : {}),
      },
    };
  }

  async assertOwner(formId: string, userId: string | undefined): Promise<void> {
    if (!userId) throw new ForbiddenException('Authentication required');
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      select: { id: true },
    });
    if (!form) throw new NotFoundException('Form not found');
  }
}
