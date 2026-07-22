import {
  Controller,
  Post,
  Param,
  Body,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FormAiRateLimitService } from '../common/form-ai-rate-limit.service';
import { AiEntitlementsService } from '../billing/entitlements/ai-entitlements.service';
import { AiTierService } from './ai-tier.service';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  resolveHelperTextFromScreen,
  resolveQuestionTextFromScreen,
} from './snapshot-screen.util';
import {
  customInstructionsFromScreen,
  qualityOptionsFromScreen,
} from './quality/quality-snapshot.util';
import type { EvaluateQualityDto, GenerateLogicDto } from './ai.service.types';
import {
  ImproveInstructionsService,
  type ImproveInstructionsDto,
} from './quality/improve-instructions.service';
import { LlmGatewayService } from './llm-gateway.service';
import { aiServiceUnavailable } from './errors/ai-service-unavailable.error';
import { buildLogicSummary } from './quality/logic-summary.util';
import {
  resolveFormPurpose,
} from './quality/form-purpose.util';

/** Respondent-supplied session ids are opaque tokens — never trust free text. */
function sanitizeSessionId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  return /^[A-Za-z0-9-]{8,64}$/.test(raw) ? raw : undefined;
}

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function customInstructionsFromDtoOptions(
  dto: EvaluateQualityDto,
): string | undefined {
  const raw = dto.options?.customInstructions;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed.slice(0, 600) : undefined;
}

type ResolvedSnapshotQualityContext = {
  dto: EvaluateQualityDto;
  requestOwnerFields: boolean;
  questionText?: string;
  helperText?: string;
  nextScreenLabels?: string[];
  formTitle?: string;
  formPurpose?: string;
  options?: EvaluateQualityDto['options'];
  customInstructions?: string;
  logicSummary?: string;
};

/**
 * Public respondent traffic must never be able to relax owner-authored quality
 * rules from the request body. Owners in builder preview are allowed to test
 * unsaved question/helper/options before persisting them.
 */
export function resolveSnapshotQualityContext(
  input: ResolvedSnapshotQualityContext,
): EvaluateQualityDto {
  const {
    dto,
    requestOwnerFields,
    questionText,
    helperText,
    nextScreenLabels,
    formTitle,
    formPurpose,
    options,
    customInstructions,
    logicSummary,
  } = input;
  return {
    ...dto,
    questionText: requestOwnerFields
      ? dto.questionText || questionText
      : questionText || dto.questionText,
    helperText: requestOwnerFields
      ? dto.helperText || helperText
      : helperText || dto.helperText,
    nextScreenLabels: requestOwnerFields
      ? (dto.nextScreenLabels ?? nextScreenLabels)
      : nextScreenLabels?.length
        ? nextScreenLabels
        : dto.nextScreenLabels,
    formTitle: dto.formTitle ?? (formTitle || undefined),
    formPurpose: dto.formPurpose ?? (formPurpose || undefined),
    options: requestOwnerFields
      ? (dto.options ?? options)
      : (options ?? dto.options),
    customInstructions,
    logicSummary: requestOwnerFields
      ? (dto.logicSummary ?? logicSummary)
      : (logicSummary ?? dto.logicSummary),
  };
}

@Controller('api/v1/forms')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly aiRateLimit: FormAiRateLimitService,
    private readonly aiTier: AiTierService,
    private readonly aiEntitlements: AiEntitlementsService,
    private readonly improveInstructionsService: ImproveInstructionsService,
    private readonly llm: LlmGatewayService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post(':formId/response-quality/evaluate')
  async evaluate(
    @Param('formId') formId: string,
    @Body() body: EvaluateQualityDto,
    @CurrentUser() user?: { id: string },
  ) {
    const { tier, ownerUserId } = await this.aiTier.resolveTierAndOwner(formId);
    const isOwnerPreview = Boolean(
      user?.id && ownerUserId && user.id === ownerUserId,
    );
    const isFreeOwnerPreview = isOwnerPreview && tier === 'free';
    if (isOwnerPreview) {
      await this.aiRateLimit.assertResponseQualityOwnerPreview(
        formId,
        user!.id,
      );
    } else {
      await this.aiRateLimit.assertResponseQualityAllowed(formId, tier);
    }

    if (!this.llm.isConfigured()) {
      throw aiServiceUnavailable(
        'llm_not_configured',
        'AI response coaching is temporarily unavailable.',
      );
    }

    if (!ownerUserId) {
      throw aiServiceUnavailable(
        'llm_not_configured',
        'AI response coaching is not available for this form.',
      );
    }

    await this.aiEntitlements.assertCreditsForAction(
      ownerUserId,
      'quality_evaluate',
    );

    const sessionId = sanitizeSessionId(body.sessionId);
    if (isOwnerPreview) {
      await this.aiEntitlements.assertQualityAiAccess(
        ownerUserId,
        formId,
        sessionId,
        'peek',
      );
    } else {
      await this.aiEntitlements.assertQualityAiAccess(
        ownerUserId,
        formId,
        sessionId,
        'resolve',
      );
    }

    const text = body.text ?? body.answerText ?? '';
    const enriched = await this.enrichWithSnapshotContext(
      formId,
      {
        ...body,
        text,
        // Public route: owner-authority context only ever comes from the
        // snapshot (set during enrichment), never from the request body.
        customInstructions: undefined,
        logicSummary: undefined,
      },
      isOwnerPreview,
    );
    const result = await this.aiService.evaluateQuality(
      enriched,
      formId,
      tier,
      { ownerUserId, preferBuilderSnapshot: isOwnerPreview },
    );
    if (result?.level && result.meta?.source === 'llm') {
      await this.aiEntitlements.debitCreditsForAction(
        ownerUserId,
        'quality_evaluate',
        formId,
      );
    }
    const meta: Record<string, unknown> = { ...result.meta };
    if (isFreeOwnerPreview) meta.previewTier = 'free';
    return Object.keys(meta).length ? { ...result, meta } : result;
  }

  @SkipThrottle()
  @Post(':formId/response-quality/improve-instructions')
  async improveInstructions(
    @Param('formId') formId: string,
    @Body() body: ImproveInstructionsDto,
    @CurrentUser() user?: { id: string },
  ) {
    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }
    await this.aiEntitlements.assertCreditsForAction(
      user.id,
      'improve_instructions',
    );
    const result = await this.improveInstructionsService.improveForOwner(
      formId,
      user.id,
      body,
    );
    // Only charge when the LLM produced the polish — contextual fallback is free.
    if (result.meta?.source === 'llm') {
      await this.aiEntitlements.debitCreditsForAction(
        user.id,
        'improve_instructions',
        formId,
      );
    }
    return result;
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':formId/logic/generate')
  async generateLogic(
    @Param('formId') formId: string,
    @Body() body: GenerateLogicDto,
  ) {
    const { tier, ownerUserId } = await this.aiTier.resolveTierAndOwner(formId);
    await this.aiRateLimit.assertLogicGenerateAllowed(formId, tier);
    if (!Array.isArray(body.screens) || body.screens.length === 0) {
      throw new UnprocessableEntityException(
        'No screens provided for logic generation',
      );
    }
    if (ownerUserId) {
      await this.aiEntitlements.assertCreditsForAction(
        ownerUserId,
        'logic_generate',
      );
      await this.aiEntitlements.checkAndConsumeLogicGeneration(ownerUserId);
    }
    const result = await this.aiService.generateFormLogic(
      formId,
      body,
      tier,
      ownerUserId ?? undefined,
    );
    // Only charge when the LLM actually produced the graph — heuristic/linear
    // fallback and redis_cache paths mean no billable LLM work was done.
    if (ownerUserId && result?.meta?.source === 'llm') {
      await this.aiEntitlements.debitCreditsForAction(
        ownerUserId,
        'logic_generate',
        formId,
      );
    }
    return result;
  }

  private async enrichWithSnapshotContext(
    formId: string,
    dto: EvaluateQualityDto,
    requestOwnerFields = false,
  ): Promise<EvaluateQualityDto> {
    try {
      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        select: { publishedSnapshot: true, builderSnapshot: true },
      });

      const snapshot = (
        requestOwnerFields
          ? form?.builderSnapshot ?? form?.publishedSnapshot
          : form?.publishedSnapshot ?? form?.builderSnapshot
      ) as Record<string, unknown> | null;
      if (!snapshot) return dto;

      const screens = (snapshot.screens as Record<string, unknown>[]) ?? [];
      const screenId =
        typeof dto.screenId === 'string' ? Number(dto.screenId) : dto.screenId;
      const screen = screens.find(
        (s) => s.id === screenId || textValue(s.id) === textValue(dto.screenId),
      );
      if (!screen) return dto;

      const questionText = resolveQuestionTextFromScreen(screen);
      const helperText = resolveHelperTextFromScreen(screen, dto.fieldId);
      const formTitle = textValue(snapshot.title, snapshot.name);
      const formPurpose = resolveFormPurpose(snapshot, formTitle);

      const connections =
        (snapshot.logicConnections as Record<string, unknown>[]) ?? [];
      const nextScreenIds = connections
        .filter((c) => textValue(c.from) === textValue(screenId))
        .map((c) => c.to);
      const nextScreenLabels = nextScreenIds
        .map((id) => {
          const next = screens.find((s) => textValue(s.id) === textValue(id));
          return next ? resolveQuestionTextFromScreen(next) : undefined;
        })
        .filter((label): label is string => !!label);

      const snapshotQuality = qualityOptionsFromScreen(screen, dto.fieldId);
      const logicSummary = buildLogicSummary(snapshot, screens, (s) =>
        resolveQuestionTextFromScreen(s),
      );
      const snapshotInstructions = customInstructionsFromScreen(
        screen,
        dto.fieldId,
      );
      const customInstructions = requestOwnerFields
        ? (customInstructionsFromDtoOptions(dto) ?? snapshotInstructions)
        : snapshotInstructions;

      return resolveSnapshotQualityContext({
        dto,
        requestOwnerFields,
        questionText,
        helperText,
        nextScreenLabels,
        formTitle: formTitle || undefined,
        formPurpose: formPurpose || undefined,
        options: snapshotQuality,
        // The evaluate route is public: never trust owner-authority fields
        // from the request body — always resolve them from the snapshot.
        customInstructions,
        logicSummary,
      });
    } catch {
      return dto;
    }
  }
}
